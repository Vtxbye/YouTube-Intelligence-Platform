import requests
import os
from transcript import get_transcript
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
API_URL = os.getenv("API_URL")

def update_transcripts():
  if API_URL is not None:
    response = requests.get(f"{API_URL}/videos")
    videos = response.json()

    for video in videos:
      if video.get("transcript"):
        continue

      url = video["video_url"]
      print(f"Fetching transcript for {url}")

      transcript = get_transcript(url)
      if not transcript:
        print(f"Skipping {url} — no transcript available")
        continue

      update_url = f"{API_URL}/videos/{video['video_id']}/transcript"
      payload = {"transcript": transcript}

      r = requests.patch(update_url, json=payload)
      if r.status_code == 200:
        print(f"Updated transcript for video {video['video_id']}")
      else:
        print(f"Error: Failed to update video {video['video_id']} - {r.text}")
  else:
    print("Error: Missing API URL")

if __name__ == "__main__":
  update_transcripts()
