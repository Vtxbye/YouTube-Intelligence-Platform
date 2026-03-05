import os
import json
from pathlib import Path
from datetime import datetime, timedelta, UTC
from dotenv import load_dotenv, find_dotenv
from googleapiclient.discovery import build

load_dotenv(find_dotenv())
API_KEY = os.getenv("YT_DATA_API_KEY")

CHANNEL_HANDLES = [
    "@theanatomylab",
    "@RenaissancePeriodization",
    "@drekberg",
    "@DrTraceyMarks",
    "@HealthyGamerGG",
    "@Psych2go",
    "@TherapyinaNutshell",
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
    """Fetch uploads playlist + channel name."""
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
    """Fetch recent videos from uploads playlist."""
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
                    "title": item["snippet"]["title"],
                    "videoId": item["contentDetails"]["videoId"],
                    "publishedAt": published,
                    "channelName": item["snippet"]["channelTitle"]
                })

        next_page = response.get("nextPageToken")
        if not next_page:
            break

    return videos

def get_video_stats(video_id):
    """Fetch view count for a video."""
    response = youtube.videos().list(
        part="statistics",
        id=video_id
    ).execute()

    items = response.get("items", [])
    if not items:
        return None

    stats = items[0]["statistics"]
    return int(stats.get("viewCount", 0))

def main():
    CHANNEL_IDS = []
    for handle in CHANNEL_HANDLES:
        cid = handle_to_channel_id(handle)
        if cid is not None:
            CHANNEL_IDS.append(cid)

    today = datetime.now(UTC)
    cutoff_date = today - timedelta(days=WITHIN_MONTHS * 30)
    cutoff_iso = cutoff_date.isoformat("T") + "Z"

    all_results = []

    for channel_id in CHANNEL_IDS:
        playlist_info = get_uploads_playlist_id(channel_id)
        if not playlist_info:
            continue

        playlist_id, channel_name = playlist_info
        videos = get_recent_videos_from_playlist(playlist_id, cutoff_iso)

        for v in videos:
            views = get_video_stats(v["videoId"])
            if views is None or views < MIN_VIEWS:
                continue

            v["views"] = views
            v["url"] = f"https://www.youtube.com/watch?v={v['videoId']}"
            v["channelName"] = channel_name
            all_results.append(v)

    script_dir = Path(__file__).resolve().parent
    output_dir = script_dir.parent / "data"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / "recent_videos.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=4)

    print(f"\nSaved {len(all_results)} videos to {output_file}")

if __name__ == "__main__":
    main()