import csv
import os
import requests
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
API_URL = os.getenv("API_URL")

def get_existing_videos():
  if API_URL is not None:
    r = requests.get(f"{API_URL}/videos")
    if r.status_code != 200:
      print("Failed to fetch existing videos:", r.text)
      return set()
    
    data = r.json()
    return {v.get("video_id") for v in data if v.get("video_id")}
  return set()

def upload_videos():
  script_dir = Path(__file__).resolve().parent
  data_file = script_dir.parent / "yt-health-agent" / "data" / "results.csv"

  with open(data_file, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    videos = list(reader)
  existing_ids = get_existing_videos()

  for v in videos:
    vid = v.get("video_id") or ""
    if vid in existing_ids:
      print(f"Skipping duplicate: {vid} ({v.get('title')})")
      continue

    payload = {
      "title": v.get("title"),
      "video_id": vid,
      "published_at": v.get("published_at"),
      "channel_name": v.get("channel"),
      "views": int(v.get("views") or 0),
      "video_url": v.get("url"),
      "duration_seconds": int(v.get("duration_seconds") or 0),
      "matched_keywords": v.get("matched_keywords"),
      "transcript": None
    }

    if API_URL is not None:
      r = requests.post(f"{API_URL}/videos", json = payload)
      if r.status_code == 200:
        print(f"Uploaded: {v.get('title')}")
      else:
        print(f"Error: {v.get('title')} — {r.text}")
    else:
      print("Error: Missing API_URL")

if __name__ == "__main__":
  upload_videos()