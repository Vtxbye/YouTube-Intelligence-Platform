import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import find_dotenv, load_dotenv
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .database import execute

app = FastAPI()
load_dotenv(find_dotenv())
FRONTEND_URL = os.getenv("FRONTEND_URL") or ""

app.add_middleware(
  CORSMiddleware,
  allow_origins=[FRONTEND_URL],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Models
class VideoData(BaseModel):
  title: Optional[str] = None
  video_id: str
  published_at: Optional[datetime] = None
  channel_name: Optional[str] = None
  views: Optional[int] = None
  video_url: Optional[str] = None
  duration_seconds: Optional[int] = None
  matched_keywords: Optional[str] = None
  transcript: Optional[str] = None

class Claim(BaseModel):
  video_id: str
  claim_text: str

class ClaimRead(Claim):
  claim_id: int
  created_at: datetime

class Narrative(BaseModel):
  narrative_text: str
  domain: Optional[str] = None

class NarrativeRead(Narrative):
  narrative_id: int
  claim_count: int
  first_detected_at: datetime

class NarrativeClaim(BaseModel):
  narrative_id: int
  claim_id: int

class NarrativeClaimRead(NarrativeClaim):
  added_at: datetime

# Helper functions
def link_narrative_claim(narrative_id: int, claim_id: int):
  sql = """
    INSERT INTO narrative_claims (
      narrative_id,
      claim_id,
      added_at
    )
    VALUES (%s, %s, NOW())
    ON CONFLICT DO NOTHING;
  """

  execute(sql, (narrative_id, claim_id))

def increment_narrative_count(narrative_id: int):
  sql = """
    UPDATE narratives
    SET claim_count = claim_count + 1
    WHERE narrative_id = %s;
  """

  execute(sql, (narrative_id,))

# Check Endpoints
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

# Endpoints
@app.get("/videos", response_model=list[VideoData])
def get_videos(limit: int | None = None, offset: int | None = None):

  if limit is None and offset is None:
    sql = "SELECT * FROM video_data;"
    return execute(sql, fetch_all=True)

  sql = """
    SELECT *
    FROM video_data
    ORDER BY published_at DESC
    LIMIT %s OFFSET %s;
  """
  return execute(sql, (limit, offset), fetch_all=True)
  
@app.post("/videos", response_model=VideoData)
def create_video(video: VideoData):
  query = """
    INSERT INTO video_data (
      video_id, title, published_at, channel_name,
      views, video_url, duration_seconds, matched_keywords, transcript
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING *;
  """

  params = (
    video.video_id,
    video.title,
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

@app.patch("/videos/{video_id}/transcript", response_model=VideoData)
def update_transcript(video_id: str, data: dict):
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

@app.get("/videos/{video_id}/claims")
def get_video_claims(video_id: str):

    sql = """
        SELECT *
        FROM claims
        WHERE video_id = %s
        ORDER BY created_at DESC;
    """

    return execute(sql, (video_id,), fetch_all=True)

@app.get("/claims/{claim_id}")
def get_claim(claim_id: int):

    sql = """
        SELECT *
        FROM claims
        WHERE claim_id = %s;
    """

    return execute(sql, (claim_id,), fetch_one=True)

@app.post("/claims", response_model=ClaimRead)
def create_claim(payload: Claim):
  sql = """
    INSERT INTO claims (
      video_id,
      claim_text,
      created_at
    )
    VALUES (%s, %s, NOW())
    RETURNING claim_id, video_id, claim_text, created_at;
  """

  params = (payload.video_id, payload.claim_text)

  row = execute(sql, params, fetch_one=True)
  return row

@app.get("/narratives")
def get_narratives(domain: Optional[str] = None, limit: int = 50, offset: int = 0):

    if domain:
        sql = """
            SELECT *
            FROM narratives
            WHERE domain = %s
            ORDER BY claim_count DESC
            LIMIT %s OFFSET %s;
        """

        return execute(sql, (domain, limit, offset), fetch_all=True)

    sql = """
        SELECT *
        FROM narratives
        ORDER BY claim_count DESC
        LIMIT %s OFFSET %s;
    """

    return execute(sql, (limit, offset), fetch_all=True)


@app.get("/narratives/{narrative_id}")
def get_narrative(narrative_id: int):

    sql = """
        SELECT *
        FROM narratives
        WHERE narrative_id = %s;
    """

    return execute(sql, (narrative_id,), fetch_one=True)


@app.get("/narratives/{narrative_id}/claims")
def get_narrative_claims(narrative_id: int):

    sql = """
        SELECT c.*
        FROM claims c
        JOIN narrative_claims nc
        ON c.claim_id = nc.claim_id
        WHERE nc.narrative_id = %s
        ORDER BY c.created_at DESC;
    """

    return execute(sql, (narrative_id,), fetch_all=True)

@app.post("/narratives", response_model=NarrativeRead)
def create_narrative(payload: Narrative):
  sql = """
    INSERT INTO narratives (
      narrative_text,
      domain,
      claim_count,
      first_detected_at
    )
    VALUES (%s, %s, 0, NOW())
    RETURNING narrative_id, narrative_text, domain, claim_count, first_detected_at;
  """

  params = (payload.narrative_text, payload.domain)

  row = execute(sql, params, fetch_one=True)
  return row

@app.post("/narratives/{narrative_id}/claims/{claim_id}")
def attach_claim(narrative_id: int, claim_id: int):
  link_narrative_claim(narrative_id, claim_id)
  increment_narrative_count(narrative_id)
  return {"status": "linked"}