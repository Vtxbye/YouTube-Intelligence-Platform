#!/usr/bin/env python3

import csv
import json
import os
import re
import time
from dataclasses import dataclass
from typing import List
from urllib import error, request as urllib_request

import google.generativeai as genai

# ── env ────────────────────────────────────────────────────────────────────────
GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "").strip()
OLLAMA_URL        = os.getenv("OLLAMA_URL", "http://ollama:11434").strip()
OLLAMA_MODEL      = os.getenv("OLLAMA_MODEL", "llama3.1:8b").strip()
OUT_CSV           = os.getenv("OUT_CSV", "/data/results.csv").strip()
TRANSCRIPTS_FILE  = os.getenv("TRANSCRIPTS_FILE", "/data/transcripts.json").strip()
CLAIMS_CSV        = os.getenv("CLAIMS_CSV", "/data/claims.csv").strip()
CLAIM_STATUS_FILE = os.getenv("CLAIM_STATUS_FILE", "/data/claim_status.json").strip()
NARRATIVES_CSV    = os.getenv("NARRATIVES_CSV", "/data/generated_narratives_and_claims_formatted.csv").strip()
CLAIM_DAILY_LIMIT = int(os.getenv("CLAIM_DAILY_LIMIT", "50"))

GEMINI_MODEL        = "gemini-2.5-flash"
GEMINI_RETRIES      = 3
GEMINI_RATE_MAX_WAIT = 300  # seconds — delays longer than this indicate daily quota exhaustion
BATCH_SIZE          = 50
OLLAMA_TIMEOUT      = 360
OLLAMA_RETRIES      = 3


class QuotaExhausted(Exception):
    """Raised when the Gemini daily free-tier quota is exhausted."""

CLAIMS_FIELDS     = ["video_id", "url", "title", "channel", "claim_number", "claim", "narrative"]
NARRATIVES_FIELDS = ["narrative_group", "narrative", "video_id", "claim_number", "claim"]

# Sentinel values written by fetch_transcripts.py when a transcript is unavailable
_NO_TRANSCRIPT_SENTINELS = {"No transcript available", "Video unavailable"}


# ── helpers ────────────────────────────────────────────────────────────────────

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


def load_claims_csv(path: str) -> List[dict]:
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def append_claims_csv(path: str, rows: List[dict]) -> None:
    write_header = not os.path.exists(path) or os.path.getsize(path) == 0
    with open(path, "a", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CLAIMS_FIELDS, extrasaction="ignore")
        if write_header:
            w.writeheader()
        w.writerows(rows)


# ── Step 3: Gemini claim extraction ───────────────────────────────────────────

def extract_claims_gemini(video: dict) -> List[dict]:
    """Call Gemini to extract claims from a video transcript.

    Returns a list of {"claim": ..., "narrative": ...} dicts.
    Returns [] on any error so the caller can mark the video accordingly.
    """
    transcript = video["transcript"]
    if len(transcript) > 8000:
        chunk = 2500
        mid = len(transcript) // 2 - chunk // 2
        text = (
            transcript[:chunk]
            + "\n…\n"
            + transcript[mid : mid + chunk]
            + "\n…\n"
            + transcript[-chunk:]
        )
    else:
        text = transcript

    prompt = f"""You are an expert content analyst.

Video Title: {video['title']}
Channel: {video['channel']}

Task:
1. Extract AS MANY specific, substantive claims as possible from this transcript.
   Focus on actionable, opinionated, or evidence-referenced claims — not vague filler.
2. For each claim identify its "Narrative Leaning" (stance/framing, e.g. Evidence-Based,
   Contrarian View, Practical Advice, Cautionary, Motivational, Data-Driven, etc.)
3. Extract a minimum of 10 claims; aim for 15–20 if the content supports it.
4. Claims must be self-contained and understandable without watching the video.

Return ONLY valid JSON — no markdown fences:
{{"claims": [{{"claim": "...", "narrative": "..."}}]}}

TRANSCRIPT:
{text}
"""

    for attempt in range(1, GEMINI_RETRIES + 1):
        try:
            model = genai.GenerativeModel(GEMINI_MODEL)
            response = model.generate_content(prompt)
            clean = response.text.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```(?:json)?", "", clean).rstrip("` \n")
            parsed = json.loads(clean)
            claims = parsed.get("claims", [])
            if not claims:
                print(f"    [Gemini] Empty claim list — preview: {response.text[:200]}")
            return claims
        except json.JSONDecodeError as e:
            print(f"    [Gemini] JSON parse error: {e}")
            return []
        except Exception as e:
            err = str(e)
            is_rate_limit = "429" in err or "quota" in err.lower() or "rate" in err.lower()
            if not is_rate_limit:
                print(f"    [Gemini] Error: {e}")
                return []

            # Daily quota exhaustion — PerDay quota_id in the error body
            if "PerDay" in err or "GenerateRequestsPerDay" in err:
                raise QuotaExhausted("Daily free-tier quota exhausted") from e

            # Parse suggested retry delay from the error body
            m = re.search(r"seconds:\s*(\d+)", err)
            wait = int(m.group(1)) if m else 60

            # Treat very long waits as daily exhaustion too
            if wait > GEMINI_RATE_MAX_WAIT:
                raise QuotaExhausted(
                    f"Retry delay {wait}s exceeds threshold — treating as daily quota exhausted"
                ) from e

            if attempt < GEMINI_RETRIES:
                print(f"    [Gemini] Rate limit hit — waiting {wait}s (attempt {attempt}/{GEMINI_RETRIES}) …")
                time.sleep(wait)
            else:
                raise QuotaExhausted(
                    f"Rate limit persists after {GEMINI_RETRIES} retries"
                ) from e

    return []


def extract_step(video_rows: List[dict], transcripts: dict, claim_status: dict) -> int:
    """Extract claims for new videos; append to CLAIMS_CSV.

    Returns the number of videos successfully processed.
    """
    if not GEMINI_API_KEY:
        print("[extract] GEMINI_API_KEY not set — skipping claim extraction")
        return 0

    genai.configure(api_key=GEMINI_API_KEY)

    meta = {row["video_id"]: row for row in video_rows if row.get("video_id")}

    to_process = [
        vid
        for vid in transcripts
        if vid in meta and vid not in claim_status
    ][:CLAIM_DAILY_LIMIT]

    if not to_process:
        print("[extract] No new videos to process")
        return 0

    print(f"[extract] Processing {len(to_process)} new video(s) with Gemini (limit={CLAIM_DAILY_LIMIT})")

    # Determine the next global claim number from existing claims
    existing = load_claims_csv(CLAIMS_CSV)
    next_claim_number = max((int(r.get("claim_number") or 0) for r in existing), default=0) + 1

    processed = 0
    for idx, vid in enumerate(to_process, 1):
        row = meta[vid]
        transcript = transcripts[vid]

        if transcript in _NO_TRANSCRIPT_SENTINELS:
            claim_status[vid] = "no_transcript"
            save_json(CLAIM_STATUS_FILE, claim_status)
            continue

        print(f"  [{idx}/{len(to_process)}] {row.get('title', vid)[:70]}")

        video = {
            "video_id": vid,
            "url": row.get("url", f"https://www.youtube.com/watch?v={vid}"),
            "title": row.get("title", ""),
            "channel": row.get("channel", ""),
            "transcript": transcript,
        }

        try:
            claims = extract_claims_gemini(video)
        except QuotaExhausted as e:
            print(f"  [extract] Quota exhausted: {e} — stopping for today")
            save_json(CLAIM_STATUS_FILE, claim_status)
            break

        if not claims:
            claim_status[vid] = "no_claims"
            save_json(CLAIM_STATUS_FILE, claim_status)
            continue

        new_rows = []
        for c in claims:
            if c.get("claim", "").strip():
                new_rows.append({
                    "video_id": vid,
                    "url": video["url"],
                    "title": video["title"],
                    "channel": video["channel"],
                    "claim_number": next_claim_number,
                    "claim": c.get("claim", "").strip(),
                    "narrative": c.get("narrative", "").strip(),
                })
                next_claim_number += 1

        append_claims_csv(CLAIMS_CSV, new_rows)
        claim_status[vid] = "done"
        save_json(CLAIM_STATUS_FILE, claim_status)
        print(f"    → {len(new_rows)} claims extracted")
        processed += 1

    return processed


# ── Step 4: Ollama narrative grouping ─────────────────────────────────────────

@dataclass
class ClaimRecord:
    video_id: str
    claim: str


def _chunks(items: List[ClaimRecord], size: int) -> List[List[ClaimRecord]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def _clean_narrative(text: str) -> str:
    cleaned = " ".join(text.split())
    cleaned = re.sub(
        r"^\s*(here is\s+)?(the\s+)?broad\s+narrative\s+statement"
        r"\s*(that\s+captures\s+the\s+shared\s+theme\s+across\s+the\s+claims)?\s*:?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    return cleaned.strip(' \t\n\r"\'')


def _request_narrative_ollama(batch: List[ClaimRecord]) -> str:
    prompt_lines = [
        "Create one broad narrative statement that captures the shared theme across the claims below.",
        "Rules:",
        "1) Output exactly one sentence.",
        "2) Keep it broad and neutral.",
        "3) Do not list examples or bullet points.",
        "4) Maximum 35 words.",
        "",
        "Claims:",
    ]
    for i, rec in enumerate(batch, 1):
        prompt_lines.append(f"{i}. {rec.claim}")

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": "\n".join(prompt_lines),
        "stream": False,
        "options": {"temperature": 0.2},
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib_request.Request(
        url=OLLAMA_URL.rstrip("/") + "/api/generate",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib_request.urlopen(req, timeout=OLLAMA_TIMEOUT) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Ollama HTTP {e.code}: {msg}") from e
    except error.URLError as e:
        raise RuntimeError(f"Cannot reach Ollama at {OLLAMA_URL}: {e}") from e
    except TimeoutError as e:
        raise RuntimeError(f"Ollama timed out after {OLLAMA_TIMEOUT}s") from e

    narrative = _clean_narrative((body.get("response") or "").strip())
    if not narrative:
        raise RuntimeError("Ollama returned an empty narrative.")
    return narrative


def narrative_step(all_claim_rows: List[dict]) -> None:
    """Regenerate NARRATIVES_CSV from all accumulated claims using Ollama."""
    records = [
        ClaimRecord(
            video_id=row["video_id"],
            claim=row["claim"],
        )
        for row in all_claim_rows
        if (row.get("claim") or "").strip()
    ]

    if not records:
        print("[narrative] No claims found — skipping narrative generation")
        return

    batches = _chunks(records, BATCH_SIZE)
    print(f"[narrative] {len(records)} claims → {len(batches)} batch(es) of ≤{BATCH_SIZE}")

    output_rows = []
    global_claim_counter = 1

    for gi, batch in enumerate(batches, 1):
        print(f"  Generating narrative for batch {gi}/{len(batches)} ({len(batch)} claims) …")
        narrative = None
        last_err = None

        for attempt in range(1, OLLAMA_RETRIES + 1):
            try:
                narrative = _request_narrative_ollama(batch)
                break
            except RuntimeError as e:
                last_err = e
                if attempt < OLLAMA_RETRIES:
                    print(f"    Attempt {attempt} failed: {e} — retrying in 1s …")
                    time.sleep(1.0)

        if narrative is None:
            print(f"  [ERROR] Narrative generation failed for batch {gi}: {last_err}")
            narrative = "[NARRATIVE GENERATION FAILED]"

        # Narrative header row
        output_rows.append({
            "narrative_group": gi,
            "narrative": narrative,
            "video_id": "",
            "claim_number": "",
            "claim": "",
        })

        # Claim rows — numbered globally across all batches
        for rec in batch:
            output_rows.append({
                "narrative_group": "",
                "narrative": "",
                "video_id": rec.video_id,
                "claim_number": global_claim_counter,
                "claim": rec.claim,
            })
            global_claim_counter += 1

        print(f"    → {narrative[:80]}")

    tmp = NARRATIVES_CSV + ".tmp"
    with open(tmp, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=NARRATIVES_FIELDS)
        w.writeheader()
        w.writerows(output_rows)
    os.replace(tmp, NARRATIVES_CSV)

    print(f"[narrative] Written {len(batches)} narrative group(s) → {NARRATIVES_CSV}")


# ── main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    if not os.path.exists(OUT_CSV):
        print(f"[extract] {OUT_CSV} not found — skipping")
        return

    if not os.path.exists(TRANSCRIPTS_FILE):
        print(f"[extract] {TRANSCRIPTS_FILE} not found — skipping")
        return

    with open(OUT_CSV, "r", newline="", encoding="utf-8") as f:
        video_rows = list(csv.DictReader(f))

    transcripts  = load_json(TRANSCRIPTS_FILE)
    claim_status = load_json(CLAIM_STATUS_FILE)

    # Step 3 — extract claims for new videos via Gemini
    newly_processed = extract_step(video_rows, transcripts, claim_status)

    # Step 4 — regenerate narratives from all accumulated claims via Ollama
    all_claim_rows = load_claims_csv(CLAIMS_CSV)
    narrative_step(all_claim_rows)


if __name__ == "__main__":
    main()
