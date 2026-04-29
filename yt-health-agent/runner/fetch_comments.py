#!/usr/bin/env python3

import os, csv, json, time, re

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

DAILY_LIMIT = int(os.getenv("COMMENTS_DAILY_LIMIT", "100"))
FETCH_DELAY = float(os.getenv("COMMENTS_FETCH_DELAY", "1.0"))
SAVE_EVERY  = int(os.getenv("COMMENTS_SAVE_EVERY", "50"))
MAX_COMMENTS = int(os.getenv("COMMENTS_MAX_PER_VIDEO", "10"))


# ---------- JSON helpers ----------
def load_json(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_json(path: str, data: dict):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


# ---------- comment fetching ----------
def fetch_comments(y, video_id: str) -> list | str:
    """
    Fetch top MAX_COMMENTS comments for a video using the YouTube Data API.
    Returns a list of comment dicts, or an error string if unavailable.
    """
    try:
        resp = y.commentThreads().list(
            part="snippet",
            videoId=video_id,
            order="relevance",
            maxResults=MAX_COMMENTS,
            textFormat="plainText",
        ).execute()
    except HttpError as e:
        reason = ""
        try:
            body = json.loads(e.content)
            reason = body["error"]["errors"][0].get("reason", "")
        except Exception:
            pass
        if reason == "commentsDisabled":
            return "Comments disabled"
        if e.resp.status in (403, 404):
            return "Comments unavailable"
        raise

    comments = []
    for item in resp.get("items", []):
        top = item.get("snippet", {}).get("topLevelComment", {}).get("snippet", {})
        comments.append({
            "author":       top.get("authorDisplayName", ""),
            "text":         top.get("textDisplay", ""),
            "likes":        top.get("likeCount", 0),
            "published_at": top.get("publishedAt", ""),
        })
    return comments if comments else "No comments found"


def redact(msg):
    return re.sub(r'([?&])key=[^&\s"]+', r'\1key=REDACTED', str(msg))


# ---------- main ----------
def main():
    api_key = os.getenv("YT_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("Missing YT_API_KEY")

    out_csv      = os.getenv("OUT_CSV",           "/data/results.csv").strip()
    comments_file = os.getenv("COMMENTS_FILE",    "/data/comments.json").strip()
    status_file   = os.getenv("COMMENT_STATUS_FILE", "/data/comment_status.json").strip()

    if not os.path.exists(out_csv):
        raise SystemExit(f"CSV not found: {out_csv}")

    with open(out_csv, "r", newline="", encoding="utf-8") as f:
        all_rows = list(csv.DictReader(f))

    comments = load_json(comments_file)
    status   = load_json(status_file)

    already_handled = set(comments) | set(status)

    to_process = [
        row["video_id"] for row in all_rows
        if (row.get("video_id") or "").strip()
        and row["video_id"] not in already_handled
    ][:DAILY_LIMIT]

    total = len(to_process)
    if total == 0:
        print("[done] All videos already handled")
        return

    print(f"[info] Processing {total} videos (limit={DAILY_LIMIT}, delay={FETCH_DELAY}s)\n")

    y = build("youtube", "v3", developerKey=api_key)

    success = 0
    failed  = 0

    for n, vid in enumerate(to_process, 1):
        print(f"Processing {n}/{total}: {vid}...", end=" ", flush=True)

        try:
            result = fetch_comments(y, vid)
        except HttpError as e:
            print(f"API error: {redact(e)}")
            status[vid] = "API error"
            failed += 1
            continue

        if isinstance(result, list):
            comments[vid] = result
            success += 1
            print(f"done ({len(result)} comments)")
        else:
            status[vid] = result
            failed += 1
            print(f"failed: {result}")

        if n % SAVE_EVERY == 0:
            save_json(comments_file, comments)
            save_json(status_file, status)
            print(f"[checkpoint] Saved progress at {n}/{total}")

        if n < total:
            time.sleep(FETCH_DELAY)

    save_json(comments_file, comments)
    save_json(status_file, status)
    print(f"\n[summary] Total: {total} | Success: {success} | Failed: {failed}")


if __name__ == "__main__":
    main()
