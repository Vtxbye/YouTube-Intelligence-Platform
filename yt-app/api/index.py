from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .database import execute

app = FastAPI()

class VideoDataBase(BaseModel):
  title: Optional[str] = None
  video_id: Optional[str] = None
  published_at: Optional[datetime] = None
  channel_name: Optional[str] = None
  views: Optional[int] = None
  video_url: Optional[str] = None
  duration_seconds: Optional[int] = None
  matched_keywords: Optional[str] = None
  transcript: Optional[str] = None

class VideoDataResponse(VideoDataBase):
  id: int

@app.get("/api/healthchecker")
def healthchecker():
  return {"status": "success", "message": "Integrated FastAPI Framework with Next.js"}

@app.get("/api/db-check")
def db_check():
  try:
    execute("SELECT 1;", fetch_all=True)
    return {"status": "success", "message": "Connected to PostgreSQL"}
  except Exception as e:
    return {"status": "error", "message": f"Database connection failed: {str(e)}"}

@app.get("/videos", response_model=list[VideoDataResponse])
def get_all_videos():
  query = "SELECT * FROM video_data;"
  rows = execute(query, fetch_all=True)
  return rows
  
@app.post("/videos", response_model=VideoDataResponse)
def create_video(video: VideoDataBase):
  query = """
    INSERT INTO video_data (
      title, video_id, published_at, channel_name,
      views, video_url, duration_seconds, matched_keywords, transcript
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING *;
  """

  params = (
    video.title,
    video.video_id,
    video.published_at,
    video.channel_name,
    video.views,
    video.video_url,
    video.duration_seconds,
    video.matched_keywords,
    video.transcript,
  )

  row = execute(query, params, fetch_one=True)
  return row

@app.patch("/videos/{video_id}/transcript")
def update_transcript(video_id: int, data: dict):
  transcript = data.get("transcript")

  query = """
    UPDATE video_data
    SET transcript = %s
    WHERE video_id = %s
    RETURNING *;
  """

  row = execute(query, (transcript, video_id), fetch_one=True)
  if not row:
    raise HTTPException(status_code=404, detail="Video not found")

  return row