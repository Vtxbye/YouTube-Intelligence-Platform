#!/usr/bin/env python3
"""
Sentiment analysis for transcripts and comments via Ollama.

Reads transcripts.json and comments.json produced by the earlier stages,
writes sentiment.json keyed by video_id. Incremental — already-processed
video_ids are skipped on subsequent runs.
"""

import csv
import json
import os
import random
import re
import time
from typing import List
from urllib import error, request as urllib_request

OLLAMA_URL        = os.getenv("OLLAMA_URL", "http://ollama:11434").strip()
OLLAMA_MODEL      = os.getenv("OLLAMA_MODEL", "llama3.1:8b").strip()
OUT_CSV           = os.getenv("OUT_CSV",           "/data/results.csv").strip()
TRANSCRIPTS_FILE  = os.getenv("TRANSCRIPTS_FILE",  "/data/transcripts.json").strip()
COMMENTS_FILE     = os.getenv("COMMENTS_FILE",     "/data/comments.json").strip()
SENTIMENT_FILE    = os.getenv("SENTIMENT_FILE",    "/data/sentiment.json").strip()
SENTIMENT_STATUS  = os.getenv("SENTIMENT_STATUS_FILE", "/data/sentiment_status.json").strip()

DAILY_LIMIT       = int(os.getenv("SENTIMENT_DAILY_LIMIT", "100"))
SAVE_EVERY        = int(os.getenv("SENTIMENT_SAVE_EVERY", "5"))
OLLAMA_TIMEOUT    = int(os.getenv("OLLAMA_TIMEOUT", "180"))
OLLAMA_RETRIES    = 3
OLLAMA_TEMP       = 0.1

# Sentinels written by fetch_transcripts.py when a transcript is unavailable
_NO_TRANSCRIPT_SENTINELS = {"No transcript available", "Video unavailable"}
_VALID_LABELS = ("Positive", "Negative", "Neutral")


# ── JSON helpers ──────────────────────────────────────────────────────────────
def load_json(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_json(path: str, data: dict) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


# ── Ollama call ───────────────────────────────────────────────────────────────
def call_ollama_json(prompt: str) -> dict:
    """POST to Ollama /api/generate and parse a JSON object from the response.

    Local models often wrap JSON in code fences or add preamble — we strip both.
    Returns {} on any failure.
    """
    payload = {
        "model":  OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": OLLAMA_TEMP},
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib_request.Request(
        url=OLLAMA_URL.rstrip("/") + "/api/generate",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    last_err = None
    for attempt in range(1, OLLAMA_RETRIES + 1):
        raw = ""
        try:
            with urllib_request.urlopen(req, timeout=OLLAMA_TIMEOUT) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            raw = (body.get("response") or "").strip()

            # Strip markdown fences the model sometimes emits despite format=json
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw.strip()).strip()
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                raw = match.group(0)

            return json.loads(raw)

        except json.JSONDecodeError as e:
            print(f"    [ollama] JSON parse error (attempt {attempt}/{OLLAMA_RETRIES}): {e}")
            print(f"    [ollama] raw snippet: {raw[:200]}")
            last_err = e
            if attempt < OLLAMA_RETRIES:
                time.sleep(1.0)
        except error.HTTPError as e:
            msg = e.read().decode("utf-8", errors="replace")
            print(f"    [ollama] HTTP {e.code}: {msg[:200]}")
            return {}
        except error.URLError as e:
            print(f"    [ollama] Cannot reach Ollama at {OLLAMA_URL}: {e}")
            return {}
        except TimeoutError:
            print(f"    [ollama] Timed out after {OLLAMA_TIMEOUT}s (attempt {attempt}/{OLLAMA_RETRIES})")
            last_err = "timeout"
            if attempt < OLLAMA_RETRIES:
                time.sleep(1.0)

    print(f"    [ollama] Giving up after {OLLAMA_RETRIES} attempt(s): {last_err}")
    return {}


def _normalize_label(raw) -> str:
    if not isinstance(raw, str):
        return "Neutral"
    label = raw.strip().capitalize()
    return label if label in _VALID_LABELS else "Neutral"


def _coerce_score(raw) -> float:
    try:
        v = float(raw)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, v))


# ── transcript sentiment ──────────────────────────────────────────────────────
TRANSCRIPT_PROMPT = """You are a sentiment analysis expert. Analyze the sentiment of the YouTube transcript below.

Return ONLY a raw JSON object — no explanation, no markdown, no code fences.

Use EXACTLY this shape (do not add or rename any keys):
{{
  "label": "Positive",
  "score": 0.85,
  "summary": "One or two sentences describing the overall tone.",
  "highlightTokens": [
    {{"token": "example word", "polarity": "positive"}},
    {{"token": "another phrase", "polarity": "negative"}}
  ]
}}

Rules:
- label must be exactly one of: "Positive", "Negative", "Neutral"
- score is a float 0.0–1.0 representing sentiment intensity (not direction).
  A strongly negative transcript still scores high (e.g. 0.9).
- highlightTokens: 8–15 words or short phrases from the transcript that most
  clearly signal its overall tone. Each token must appear verbatim (or very
  close) in the transcript. polarity must be "positive", "negative", or "neutral".
- summary: plain English, 1–2 sentences max.

Video Title: {title}
Channel: {channel}

TRANSCRIPT:
{transcript}
"""


def analyze_transcript(transcript: str, title: str, channel: str) -> dict:
    # Trim long transcripts — llama3.1:8b has a smallish context window on CPU
    if len(transcript) > 6000:
        chunk = 2000
        mid = len(transcript) // 2 - chunk // 2
        text = (
            transcript[:chunk]
            + "\n[...middle of transcript...]\n"
            + transcript[mid : mid + chunk]
            + "\n[...]\n"
            + transcript[-chunk:]
        )
    else:
        text = transcript

    prompt = TRANSCRIPT_PROMPT.format(title=title, channel=channel, transcript=text)
    result = call_ollama_json(prompt)
    if not result or "label" not in result:
        return {"label": "Neutral", "score": 0.0, "summary": "Analysis failed.", "highlightTokens": []}

    tokens = result.get("highlightTokens") or []
    if not isinstance(tokens, list):
        tokens = []

    return {
        "label":           _normalize_label(result.get("label")),
        "score":           _coerce_score(result.get("score")),
        "summary":         str(result.get("summary") or "").strip(),
        "highlightTokens": tokens,
    }


# ── comment sentiment ─────────────────────────────────────────────────────────
COMMENT_PROMPT = """You are a sentiment analysis expert. Analyze the sentiment of the comment below.

Return ONLY a raw JSON object — no explanation, no markdown, no code fences.

Use EXACTLY this shape:
{{
  "label": "Positive",
  "score": 0.82,
  "highlightTokens": [
    {{"token": "example word", "polarity": "positive"}}
  ]
}}

Rules:
- label must be exactly one of: "Positive", "Negative", "Neutral"
- score is a float 0.0–1.0 (intensity, not direction)
- highlightTokens: 2–5 tokens from the comment that signal its sentiment most clearly.
  Each token must appear verbatim in the comment. polarity must be "positive", "negative", or "neutral".

COMMENT:
{comment}
"""


def analyze_comment(comment: dict) -> dict:
    text = (comment.get("text") or "").strip()
    if not text:
        return {**comment, "label": "Neutral", "score": 0.0, "highlightTokens": []}

    result = call_ollama_json(COMMENT_PROMPT.format(comment=text))
    tokens = (result.get("highlightTokens") or []) if isinstance(result, dict) else []
    if not isinstance(tokens, list):
        tokens = []

    return {
        **comment,
        "label":           _normalize_label(result.get("label") if result else None),
        "score":           _coerce_score(result.get("score") if result else 0.0),
        "highlightTokens": tokens,
    }


def analyze_comments(comments: List[dict]) -> List[dict]:
    out = []
    for i, c in enumerate(comments, 1):
        res = analyze_comment(c)
        out.append(res)
        print(f"      comment {i}/{len(comments)} → {res['label']} ({res['score']:.2f})")
        if i < len(comments):
            time.sleep(random.uniform(0.3, 0.8))
    return out


# ── main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    transcripts = load_json(TRANSCRIPTS_FILE)
    comments    = load_json(COMMENTS_FILE)
    sentiment   = load_json(SENTIMENT_FILE)
    status      = load_json(SENTIMENT_STATUS)

    meta = {}
    if os.path.exists(OUT_CSV):
        with open(OUT_CSV, "r", newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                vid = (row.get("video_id") or "").strip()
                if vid:
                    meta[vid] = row

    if not transcripts and not comments:
        print("[sentiment] No transcripts or comments to process — skipping")
        return

    # Candidate video_ids: anything we have either transcript or comments for,
    # that hasn't been finished or marked failed on a prior run.
    candidates = (set(transcripts) | set(comments)) - set(sentiment) - set(status)
    to_process = sorted(candidates)[:DAILY_LIMIT]

    total = len(to_process)
    if total == 0:
        print("[sentiment] All videos already handled")
        return

    print(f"[sentiment] Processing {total} video(s) (limit={DAILY_LIMIT})")

    success = 0
    skipped = 0

    for n, vid in enumerate(to_process, 1):
        print(f"\n[{n}/{total}] {vid}")

        transcript = transcripts.get(vid)
        video_comments = comments.get(vid) or []

        has_transcript = bool(transcript) and transcript not in _NO_TRANSCRIPT_SENTINELS
        has_comments = isinstance(video_comments, list) and len(video_comments) > 0

        if not has_transcript and not has_comments:
            status[vid] = "no_data"
            skipped += 1
            print("  skipped: no transcript and no comments")
            continue

        record = {"transcript": None, "comments": None}

        if has_transcript:
            print("  analyzing transcript …")
            row = meta.get(vid, {})
            record["transcript"] = analyze_transcript(
                transcript, row.get("title", ""), row.get("channel", "")
            )
            ts = record["transcript"]
            print(f"    → {ts['label']} ({ts['score']:.2f}) | {len(ts['highlightTokens'])} tokens")
        else:
            record["transcript"] = {
                "label": "Neutral", "score": 0.0,
                "summary": "No transcript available.", "highlightTokens": [],
            }

        if has_comments:
            print(f"  analyzing {len(video_comments)} comment(s) …")
            analyzed = analyze_comments(video_comments)
            positive = [c for c in analyzed if c["label"] == "Positive"]
            negative = [c for c in analyzed if c["label"] == "Negative"]
            neutral  = [c for c in analyzed if c["label"] == "Neutral"]
            record["comments"] = {
                "positive": positive,
                "negative": negative,
                "neutral":  neutral,
                "all":      analyzed,
            }
            print(f"    → {len(positive)}+ / {len(negative)}- / {len(neutral)}~")
        else:
            record["comments"] = {"positive": [], "negative": [], "neutral": [], "all": []}

        sentiment[vid] = record
        success += 1

        if n % SAVE_EVERY == 0:
            save_json(SENTIMENT_FILE, sentiment)
            save_json(SENTIMENT_STATUS, status)
            print(f"  [checkpoint] saved at {n}/{total}")

    save_json(SENTIMENT_FILE, sentiment)
    save_json(SENTIMENT_STATUS, status)
    print(f"\n[summary] processed={success} skipped={skipped} total_attempted={total}")


if __name__ == "__main__":
    main()
