import os
import json
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


def upload_single_comment(args):
  session, video_id, comment, existing_ids = args

  if video_id not in existing_ids:
    print(f"Skipping comment for missing video {video_id}")
    return

  if "text" not in comment or "author" not in comment:
    print(f"Skipping comment for missing author or text {video_id}")
    return

  payload = {
    "video_id": video_id,
    "comment_text": comment["text"],
    "author": comment["author"],
    "likes": comment.get("likes", 0),
    "published_at": comment.get("published_at"),
    "sentiment_label": None,
    "sentiment_score": None,
  }

  try:
    r = session.post(f"{API_URL}/comments", json=payload, timeout=10)
  except Exception as e:
    print(f"Network error uploading comment: {e}")
    return

  if r.status_code != 200:
    print(f"Error uploading comment: {r.text}")
    return

  status = r.json().get("status")
  if status == "inserted":
    print(f"Inserted comment from {comment['author'][:20]}")
  else:
    print(f"Skipped duplicate from {comment['author'][:20]}")

def upload_comments():
  script_dir = Path(__file__).resolve().parent
  data_file = script_dir.parents[1] / "yt-health-agent" / "data" / "comments.json"

  with open(data_file, "r", encoding="utf-8") as f:
    comments_map = json.load(f)

  session = requests.Session()
  r = session.get(f"{API_URL}/videos/ids")
  existing_ids = {row["video_id"] for row in r.json()}

  items = []
  for video_id, comments in comments_map.items():
    for c in comments:
      items.append((session, video_id, c, existing_ids))

  print(f"Uploading {len(items)} comments...")
  parallel_map(upload_single_comment, items, max_workers=3)


if __name__ == "__main__":
  upload_comments()