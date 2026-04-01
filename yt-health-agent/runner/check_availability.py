#!/usr/bin/env python3
"""
check_availability.py — removes deleted/private/unavailable videos from results.csv

Reads all video IDs from the CSV, checks them against the YouTube API in
batches of 50, and removes any rows whose videos are no longer available.
"""
import os, csv, re
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

FIELDS = ["video_id","title","channel","published_at","duration_seconds","views","url","matched_keywords"]

def redact(msg):
    return re.sub(r'([?&])key=[^&\s"]+', r'\1key=REDACTED', str(msg))

def chunks(lst, n):
    for i in range(0, len(lst), n): yield lst[i:i+n]

def main():
    api_key = os.getenv("YT_API_KEY", "").strip()
    if not api_key: raise SystemExit("Missing YT_API_KEY")

    out_csv = os.getenv("OUT_CSV", "/data/results.csv").strip()
    if not os.path.exists(out_csv):
        raise SystemExit(f"CSV not found: {out_csv}")

    with open(out_csv, "r", newline="", encoding="utf-8") as f:
        all_rows = list(csv.DictReader(f))

    all_ids = [row["video_id"] for row in all_rows if (row.get("video_id") or "").strip()]
    print(f"[health] Checking {len(all_ids)} videos...")

    y = build("youtube", "v3", developerKey=api_key)

    available = set()
    for batch in chunks(all_ids, 50):
        resp = y.videos().list(part="status", id=",".join(batch)).execute()
        for item in resp.get("items", []):
            available.add(item["id"])

    removed_ids = {vid for vid in all_ids if vid not in available}

    if not removed_ids:
        print(f"[health] All {len(all_ids)} videos still available")
        return

    kept = [row for row in all_rows if (row.get("video_id") or "").strip() not in removed_ids]
    tmp = out_csv + ".tmp"
    with open(tmp, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, extrasaction="ignore")
        w.writeheader()
        w.writerows(kept)
    os.replace(tmp, out_csv)

    print(f"[health] Removed {len(removed_ids)} unavailable video(s): {', '.join(removed_ids)}")

if __name__ == "__main__":
    try:
        main()
    except HttpError as e:
        raise SystemExit(f"YouTube API error: {redact(e)}")
