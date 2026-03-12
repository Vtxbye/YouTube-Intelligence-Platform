import os
import json
import re
from pathlib import Path
from datetime import datetime, timedelta, UTC
from dotenv import load_dotenv, find_dotenv
from googleapiclient.discovery import build
from transcript import get_transcript

load_dotenv(find_dotenv())
API_KEY = os.getenv("YT_DATA_API_KEY")

CHANNEL_HANDLES = [
  "@theanatomylab",
  # "@RenaissancePeriodization",
  # "@drekberg",
  # "@DrTraceyMarks",
  # "@HealthyGamerGG",
  # "@Psych2go",
  # "@TherapyinaNutshell",
]

WITHIN_MONTHS = 6
MIN_VIEWS = 5000

youtube = build("youtube", "v3", developerKey=API_KEY)

def handle_to_channel_id(handle):
  query = handle[1:] if handle.startswith("@") else handle

  response = youtube.search().list(
    part="snippet",
    q=query,
    type="channel",
    maxResults=1
  ).execute()

  items = response.get("items", [])
  if not items:
    return None

  return items[0]["snippet"]["channelId"]

def get_uploads_playlist_id(channel_id):
  response = youtube.channels().list(
    part="snippet,contentDetails",
    id=channel_id
  ).execute()

  items = response.get("items", [])
  if not items:
    return None

  snippet = items[0]["snippet"]
  uploads = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

  return uploads, snippet["title"]

def get_recent_videos_from_playlist(playlist_id, published_after):
  videos = []
  next_page = None

  while True:
    response = youtube.playlistItems().list(
      part="snippet,contentDetails",
      playlistId=playlist_id,
      maxResults=50,
      pageToken=next_page
    ).execute()

    for item in response.get("items", []):
      published = item["contentDetails"]["videoPublishedAt"]
      if published >= published_after:
        videos.append({
          "video_id": item["contentDetails"]["videoId"],
          "title": item["snippet"]["title"],
          "published_at": published,
          "channel_name": item["snippet"]["channelTitle"]
        })

    next_page = response.get("nextPageToken")
    if not next_page:
      break

  return videos

def duration_converter(duration_iso_8601):
  if not duration_iso_8601:
    return None

  pattern = re.compile(
    r'PT'
    r'(?:(\d+)H)?'
    r'(?:(\d+)M)?'
    r'(?:(\d+)S)?'
  )

  match = pattern.match(duration_iso_8601)
  if not match:
    return None

  hours = int(match.group(1)) if match.group(1) else 0
  minutes = int(match.group(2)) if match.group(2) else 0
  seconds = int(match.group(3)) if match.group(3) else 0

  return hours * 3600 + minutes * 60 + seconds

def get_video_stats(video_id):
  response = youtube.videos().list(
    part="statistics,contentDetails",
    id=video_id
  ).execute()

  items = response.get("items", [])
  if not items:
    return None

  stats = items[0]["statistics"]
  details = items[0]["contentDetails"]

  views = int(stats.get("viewCount", 0))
  duration = details.get("duration") 
  seconds = duration_converter(duration)

  return {
    "views": views,
    "duration_seconds": seconds
  }

def get_data():
  CHANNEL_IDS = []
  for handle in CHANNEL_HANDLES:
    cid = handle_to_channel_id(handle)
    if cid is not None:
      CHANNEL_IDS.append(cid)

  today = datetime.now(UTC)
  cutoff_date = today - timedelta(days=WITHIN_MONTHS * 30)
  cutoff_iso = cutoff_date.isoformat("T").replace("+00:00", "Z")

  all_results = []

  for channel_id in CHANNEL_IDS:
    playlist_info = get_uploads_playlist_id(channel_id)
    if not playlist_info:
      continue

    playlist_id, _ = playlist_info
    videos = get_recent_videos_from_playlist(playlist_id, cutoff_iso)

    for v in videos:
      stats = get_video_stats(v["video_id"])
      if stats is None or stats["views"] < MIN_VIEWS:
        continue

      v["views"] = stats["views"]
      v["duration_seconds"] = stats["duration_seconds"]
      v["video_url"] = f"https://www.youtube.com/watch?v={v['video_id']}"
      v["transcript"] = get_transcript(v["video_url"])
      v["matched_keywords"] = None
      all_results.append(v)

  return all_results

def print_results(results):
  script_dir = Path(__file__).resolve().parent
  output_dir = script_dir.parent / "data"
  output_dir.mkdir(exist_ok=True)
  output_file = output_dir / "recent_videos.json"

  with open(output_file, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=4)

  print(f"\nSaved {len(results)} videos to {output_file}")

if __name__ == "__main__":
  print_results(get_data())