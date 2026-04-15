import csv
import os
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
API_URL = os.getenv("NEXT_PUBLIC_API_URL")

def parallel_map(func, items, max_workers=3):
  with ThreadPoolExecutor(max_workers=max_workers) as ex:
    futures = {ex.submit(func, item): item for item in items}
    for f in as_completed(futures):
      try:
        f.result()
      except Exception as e:
        print(f"Error: {e}")

def upload_single_video(args):
  session, v = args
  payload = {
    "title": v["title"],
    "video_id": v["video_id"],
    "published_at": v["published_at"],
    "channel_name": v["channel"],
    "views": int(v["views"] or 0),
    "video_url": v["url"],
    "duration_seconds": int(v["duration_seconds"] or 0),
    "matched_keywords": v["matched_keywords"],
    "transcript": None
  }

  r = session.post(f"{API_URL}/videos", json=payload)
  data = r.json()
  if data.get("status") == "inserted":
    print(f"Uploaded: {v['title']}")
  else:
    print(f"Skipped duplicate: {v['title']}")

def upload_videos():
  session = requests.Session()

  script_dir = Path(__file__).resolve().parent
  data_file = script_dir.parents[1] / "yt-health-agent" / "data" / "results.csv"

  with open(data_file, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    videos = list(reader)
  items = [(session, v) for v in videos]
  parallel_map(upload_single_video, items, max_workers=3)

if __name__ == "__main__":
  upload_videos()