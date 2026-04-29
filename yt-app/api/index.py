import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import find_dotenv, load_dotenv
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .auth import configure_firebase_auth
from .database import execute
from .firebase_identity import router as firebase_auth_router

app = FastAPI()
load_dotenv(find_dotenv())
FRONTEND_URL = os.getenv("FRONTEND_URL") or ""

configure_firebase_auth(app)

app.add_middleware(
  CORSMiddleware,
  allow_origins=[FRONTEND_URL],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(firebase_auth_router)

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

class Comment(BaseModel):
  video_id: str
  comment_text: str
  author: str
  likes: int
  published_at: datetime
  sentiment_label: Optional[str] = None
  sentiment_score: Optional[float] = None

class CommentRead(Comment):
  comment_id: int
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
@app.get("/")
def landing():
  return {"status": "success", "message": "API Root"}

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
def get_videos(limit: int = 50, offset: int = 0, all: bool = False):

  if all:
    sql = "SELECT * FROM video_data;"
    return execute(sql, fetch_all=True)

  sql = """
    SELECT *
    FROM video_data
    ORDER BY published_at DESC
    LIMIT %s OFFSET %s;
  """
  return execute(sql, (limit, offset), fetch_all=True)

@app.get("/videos/ids")
def get_video_ids():
  sql = "SELECT video_id FROM video_data;"
  return execute(sql, fetch_all=True)

@app.post("/videos")
def create_video(video: VideoData):
  query = """
    INSERT INTO video_data (
      video_id, title, published_at, channel_name,
      views, video_url, duration_seconds, matched_keywords, transcript
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (video_id) DO NOTHING
    RETURNING video_id;
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

  if row:
    return {"status": "inserted"}
  else:
    return {"status": "skipped"}
  
@app.get("/videos/transcript-status")
def get_transcript_status():
  sql = "SELECT video_id, transcript IS NOT NULL AS has_transcript FROM video_data;"
  row = execute(sql, fetch_all=True)
  return row

@app.patch("/videos/{video_id}/transcript")
def update_transcript(video_id: str, data: dict):
  transcript = data.get("transcript")

  query = """
    UPDATE video_data
    SET transcript = %s
    WHERE video_id = %s
    RETURNING video_id;
  """

  row = execute(query, (transcript, video_id), fetch_one=True)
  if row:
    return {"status": "updated"}

  return {"status": "skipped"}

@app.get("/videos/{video_id}/claims/ids")
def get_video_claim_ids(video_id: str):
  sql = """
    SELECT claim_id, claim_text
    FROM claims
    WHERE video_id = %s
    ORDER BY created_at DESC;
  """
  return execute(sql, (video_id,), fetch_all=True)

@app.get("/videos/{video_id}/claims")
def get_video_claims(video_id: str):

    sql = """
        SELECT *
        FROM claims
        WHERE video_id = %s
        ORDER BY created_at DESC;
    """

    return execute(sql, (video_id,), fetch_all=True)

@app.get("/videos-claims")
def get_videos_claims():
    sql = """
        SELECT
            v.video_id,
            v.title AS video_title,
            v.published_at AS video_published_at,
            v.channel_name,
            v.views,
            v.video_url,
            c.claim_id,
            c.claim_text
        FROM claims c
        JOIN video_data v
            ON c.video_id = v.video_id
        ORDER BY v.published_at DESC
    """
    return execute(sql, fetch_all=True)

@app.get("/claims/{claim_id}")
def get_claim(claim_id: int):

    sql = """
        SELECT *
        FROM claims
        WHERE claim_id = %s;
    """

    return execute(sql, (claim_id,), fetch_one=True)

@app.get("/comments", response_model=list[CommentRead])
def get_comments(video_id: str | None = None, limit: int = 50, offset: int = 0):

  if video_id is not None:
    sql = """
      SELECT *
      FROM comments
      WHERE video_id = %s
      ORDER BY created_at DESC
      LIMIT %s OFFSET %s;
    """

    return execute(sql, (video_id, limit, offset), fetch_all=True)

  sql = """
    SELECT *
    FROM comments
    ORDER BY created_at DESC
    LIMIT %s OFFSET %s;
  """

  return execute(sql, (limit, offset), fetch_all=True)

@app.get("/videos/{video_id}/comments", response_model=list[CommentRead])
def get_video_comments(video_id: str, limit: int = 50, offset: int = 0):
  sql = """
    SELECT *
    FROM comments
    WHERE video_id = %s
    ORDER BY created_at DESC
    LIMIT %s OFFSET %s;
  """

  return execute(sql, (video_id, limit, offset), fetch_all=True)

@app.get("/comments/{comment_id}", response_model=CommentRead)
def get_comment(comment_id: int):
  sql = """
    SELECT *
    FROM comments
    WHERE comment_id = %s;
  """

  row = execute(sql, (comment_id,), fetch_one=True)

  if not row:
    raise HTTPException(status_code=404, detail="Comment not found")

  return row

@app.post("/comments")
def create_comment(payload: Comment):
  sql = """
    INSERT INTO comments (
      video_id,
      comment_text,
      author,
      likes,
      published_at,
      sentiment_label,
      sentiment_score
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (video_id, author, comment_text) DO NOTHING
    RETURNING comment_id;
  """

  params = (
    payload.video_id,
    payload.comment_text,
    payload.author,
    payload.likes,
    payload.published_at,
    payload.sentiment_label,
    payload.sentiment_score
  )

  row = execute(sql, params, fetch_one=True)
  if row:
    return {"status": "inserted"}
  else:
    return {"status": "skipped"}

@app.post("/comments/lookup")
def lookup_comment(payload: dict):
  sql = """
    SELECT comment_id
    FROM comments
    WHERE video_id = %s
      AND author = %s
      AND comment_text = %s;
  """

  row = execute(sql, (payload["video_id"], payload["author"], payload["text"]), fetch_one=True)
  return row or {}

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

@app.get("/narratives/{narrative_id}/claims/ids")
def get_narrative_claim_ids(narrative_id: int):
  sql = """
    SELECT claim_id
    FROM narrative_claims
    WHERE narrative_id = %s;
  """
  return execute(sql, (narrative_id,), fetch_all=True)

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


@app.get("/narrative/{narrative_id}/claims-videos")
def get_narrative_claim_video(narrative_id: int):
  sql = """
    SELECT *
    FROM narrative_claim_video_view
    WHERE narrative_id = %s
  """
  return execute(sql, (narrative_id,), fetch_all=True)

@app.get("/narratives-trends")
def get_narrative_trends():
    sql = """
        SELECT
            narrative_id,
            narrative_text,
            claim_date,
            claims_on_date,
            claims_7d_avg
        FROM narrative_trends_view
        ORDER BY narrative_id, claim_date;
    """
    return execute(sql, fetch_all=True)

@app.patch("/videos/{video_id}/sentiment")
def update_video_sentiment(video_id: str, data: dict):
  sentiment_label = data.get("sentiment_label")
  sentiment_score = data.get("sentiment_score")
  summary = data.get("summary")
  highlight_tokens = data.get("highlightTokens")

  query = """
    UPDATE video_data
    SET sentiment_label = %s,
        sentiment_score = %s,
        sentiment_summary = %s,
        sentiment_highlight_tokens = %s
    WHERE video_id = %s
    RETURNING video_id;
  """

  row = execute(
    query,
    (
      sentiment_label,
      sentiment_score,
      summary,
      json.dumps(highlight_tokens) if highlight_tokens else None,
      video_id
    ),
    fetch_one=True
  )

  if row:
    return {"status": "updated"}
  return {"status": "skipped"}

@app.patch("/comments/{comment_id}/sentiment")
def update_comment_sentiment(comment_id: int, data: dict):
  sentiment_label = data.get("sentiment_label")
  sentiment_score = data.get("sentiment_score")
  highlight_tokens = data.get("highlightTokens")

  query = """
    UPDATE comments
    SET sentiment_label = %s,
        sentiment_score = %s,
        sentiment_highlight_tokens = %s
    WHERE comment_id = %s
    RETURNING comment_id;
  """

  row = execute(
    query,
    (
      sentiment_label,
      sentiment_score,
      json.dumps(highlight_tokens) if highlight_tokens else None,
      comment_id
    ),
    fetch_one=True
  )

  if row:
    return {"status": "updated"}
  return {"status": "skipped"}

@app.get("/videos/sentiment")
def get_videos_sentiment(limit: int = 20, offset: int = 0):
    sql = """
      SELECT
        video_id,
        title,
        channel_name,
        published_at,
        video_url,
        sentiment_label,
        sentiment_score
      FROM video_data
      WHERE sentiment_label IS NOT NULL
      ORDER BY published_at DESC
      LIMIT %s OFFSET %s;
    """

    videos = execute(sql, (limit, offset), fetch_all=True)
    return videos

@app.get("/videos/{video_id}/sentiment")
def get_video_detail(video_id: str, comment_limit: int = 50):
    sql_video = """
      SELECT
        video_id,
        title,
        channel_name,
        published_at,
        video_url,
        transcript,
        sentiment_label,
        sentiment_score,
        sentiment_summary,
        sentiment_highlight_tokens
      FROM video_data
      WHERE video_id = %s
        AND sentiment_label IS NOT NULL;
    """

    video = execute(sql_video, (video_id,), fetch_one=True)

    if not video:
        return {"error": "No sentiment data for this video"}

    sql_comments = """
      SELECT
        comment_id,
        author,
        comment_text,
        sentiment_label,
        sentiment_score,
        sentiment_highlight_tokens
      FROM comments
      WHERE video_id = %s
        AND sentiment_label IS NOT NULL
      ORDER BY published_at DESC
      LIMIT %s;
    """

    video["comments"] = execute(sql_comments, (video_id, comment_limit), fetch_all=True)
    return video
