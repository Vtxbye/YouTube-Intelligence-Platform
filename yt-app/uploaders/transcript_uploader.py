import requests
import os
import json
from pathlib import Path
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
API_URL = os.getenv("NEXT_PUBLIC_API_URL")

def update_transcripts():
  if API_URL is None:
    print("Error: Missing API URL")
    return
  
  script_dir = Path(__file__).resolve().parent
  data_file = script_dir.parents[1] / "yt-health-agent" / "data" / "transcripts.json"

  try:
    with open(data_file, "r", encoding="utf-8") as f:
      transcript_map = json.load(f)
  except FileNotFoundError:
    print(f"Error: Could not find {data_file}")
    return

  response = requests.get(f"{API_URL}/videos")
  videos = response.json()

  for video in videos:
    video_id = str(video["video_id"])

    if video.get("transcript"):
      continue

    if video_id not in transcript_map:
      print(f"No transcript found for video {video_id}, skipping")
      continue

    transcript_text = transcript_map[video_id]
    print(f"Updating transcript for video {video_id}")

    update_url = f"{API_URL}/videos/{video_id}/transcript"
    payload = {"transcript": transcript_text}

    r = requests.patch(update_url, json=payload)
    if r.status_code == 200:
      print(f"Updated transcript for video {video_id}")
    else:
      print(f"Error updating video {video_id}: {r.text}")


if __name__ == "__main__":
  update_transcripts()
