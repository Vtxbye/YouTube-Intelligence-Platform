import os
import json
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
API_URL = os.getenv("NEXT_PUBLIC_API_URL")

def parallel_map(func, items, max_workers=4):
  with ThreadPoolExecutor(max_workers=max_workers) as ex:
    futures = {ex.submit(func, item): item for item in items}
    for f in as_completed(futures):
      try:
        f.result()
      except Exception as e:
        print(f"Error: {e}")

def upload_single_transcript_sentiment(args):
  session, video_id, t, existing_ids = args

  if video_id not in existing_ids:
    return

  payload = {
    "sentiment_label": t.get("label"),
    "sentiment_score": t.get("score"),
    "summary": t.get("summary"),
    "highlightTokens": t.get("highlightTokens", [])
  }

  try:
    r = session.patch(f"{API_URL}/videos/{video_id}/sentiment", json=payload, timeout=10)
  except Exception as e:
    print(f"Network error: {e}")
    return

  if r.status_code == 200:
    print(f"Transcript sentiment updated: {video_id}")
  else:
    print(f"Error {video_id}: {r.text}")

def lookup_comment_id(session, video_id, author, text):
  payload = {
    "video_id": video_id,
    "author": author,
    "text": text
  }
  r = session.post(f"{API_URL}/comments/lookup", json=payload)
  data = r.json()
  return data.get("comment_id")

def upload_single_comment_sentiment(args):
  session, video_id, c = args

  comment_id = lookup_comment_id(session, video_id, c["author"], c["text"])
  if not comment_id:
    return

  payload = {
    "sentiment_label": c.get("label"),
    "sentiment_score": c.get("score"),
    "highlightTokens": c.get("highlightTokens", [])
  }

  try:
    r = session.patch(f"{API_URL}/comments/{comment_id}/sentiment", json=payload, timeout=10)
  except Exception as e:
    print(f"Network error: {e}")
    return

  if r.status_code == 200:
    print(f"Comment sentiment updated: {comment_id}")
  else:
    print(f"Error {comment_id}: {r.text}")

def upload_sentiments():
  script_dir = Path(__file__).resolve().parent
  data_file = script_dir.parents[1] / "yt-health-agent" / "data" / "sentiment.json"

  with open(data_file, "r", encoding="utf-8") as f:
    sentiment_map = json.load(f)

  session = requests.Session()

  r = session.get(f"{API_URL}/videos/ids")
  existing_ids = {row["video_id"] for row in r.json()}

  transcript_items = []
  comment_items = []

  for video_id, data in sentiment_map.items():
    if "transcript" in data:
      transcript_items.append((session, video_id, data["transcript"], existing_ids))

    if "comments" in data:
      for bucket in ["positive", "negative", "neutral"]:
        for c in data["comments"].get(bucket, []):
          comment_items.append((session, video_id, c))

  print(f"Uploading {len(transcript_items)} transcript sentiments...")
  parallel_map(upload_single_transcript_sentiment, transcript_items)

  print(f"Uploading {len(comment_items)} comment sentiments...")
  parallel_map(upload_single_comment_sentiment, comment_items)

if __name__ == "__main__":
  upload_sentiments()