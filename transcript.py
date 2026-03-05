from youtube_transcript_api import YouTubeTranscriptApi
import re

def getTranscript(yt_url: str) -> str:
  match = re.search(r"(\?v=)([a-zA-Z0-9_\-]{11})", yt_url)
  if not match:
    raise ValueError("Invalid YouTube URL: Could not extract video ID") 
  video_id = match.group(2)

  yt_api = YouTubeTranscriptApi()
  fetched_transcript = yt_api.fetch(video_id)

  full_text = "" 
  for snippet in fetched_transcript: 
    full_text += snippet.text + " " 
  cleaned_text = re.sub(r'[\r\n]+', ' ', full_text).strip()

  return cleaned_text

def getTranscriptList(yt_urls: list[str]) -> dict:
  all_transcripts = {}
  for url in yt_urls:
    try:
      transcript = getTranscript(url)
      all_transcripts[url] = transcript 
    except Exception as e:
      all_transcripts[url] = f"Error: {str(e)}"
  
  return all_transcripts