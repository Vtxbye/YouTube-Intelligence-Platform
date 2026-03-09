import json
import os
import requests
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
API_URL = os.getenv("API_URL")

def get_existing_videos():
  if API_URL is not None:
    response = requests.get(API_URL)
    if response.status_code != 200:
      print("Failed to fetch existing videos:", response.text)
      return set()

    data = response.json()
    return {video["video_id"] for video in data if video.get("video_id")}
  else:
    print("Error: Missing API_URL")

def upload_videos():
    script_dir = Path(__file__).resolve().parent
    data_file = script_dir.parent / "data" / "recent_videos.json"

    with open(data_file, "r", encoding="utf-8") as f:
      videos = json.load(f)
    existing_ids = get_existing_videos()

    for v in videos:
        vid = v.get("video_id")

        if vid in existing_ids:
          print(f"Skipping duplicate: {vid} ({v['title']})")
          continue

        payload = {
          "title": v.get("title"),
          "video_id": v.get("video_id"),
          "published_at": v.get("published_at"),
          "channel_name": v.get("channel_name"),
          "views": v.get("views"),
          "video_url": v.get("video_url"),
          "duration_seconds": v.get("duration_seconds"),
          "matched_keywords": v.get("matched_keywords"),
          "transcript": v.get("transcript"),
        }

        if API_URL is not None:
          response = requests.post(API_URL, json=payload)

          if response.status_code == 200:
            print(f"Uploaded: {v['title']}")
          else:
            print(f"Error: {v['title']} — {response.text}")
        else:
          print("Error: Missing API_URL")

if __name__ == "__main__":
  upload_videos()