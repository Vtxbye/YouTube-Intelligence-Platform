import requests
import os
import json
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

def update_single_transcript(args):
  session, video, transcript_map = args
  vid = video["video_id"]

  if video.get("transcript"):
    return

  if vid not in transcript_map:
    print(f"No transcript for {vid}, skipping")
    return

  payload = {"transcript": transcript_map[vid]}
  r = session.patch(f"{API_URL}/videos/{vid}/transcript", json=payload)

  if r.status_code == 200:
    print(f"Updated transcript for {vid}")
  else:
    print(f"Error updating {vid}: {r.text}")

def update_transcripts():
  if not API_URL:
    print("Missing API URL")
    return

  script_dir = Path(__file__).resolve().parent
  data_file = script_dir.parents[1] / "yt-health-agent" / "data" / "transcripts.json"

  with open(data_file, "r", encoding="utf-8") as f:
    transcript_map = json.load(f)

  session = requests.Session()
  r = session.get(f"{API_URL}/videos")
  videos = r.json()

  items = [(session, v, transcript_map) for v in videos]
  parallel_map(update_single_transcript, items, max_workers=3)

if __name__ == "__main__":
  update_transcripts()