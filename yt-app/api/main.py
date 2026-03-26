from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import execute

app = FastAPI(title="YouTube Narrative API")


# -------------------------------
# REQUEST MODELS
# -------------------------------

class VideoCreate(BaseModel):
    video_id: str
    channel_name: Optional[str]
    title: Optional[str]
    published_at: Optional[datetime]
    view_count: Optional[int]
    domain: Optional[str]


class ClaimCreate(BaseModel):
    video_id: str
    claim_text: str
    confidence_score: Optional[float]  # 0..1


class NarrativeCreate(BaseModel):
    title: str
    description: Optional[str]
    domain: Optional[str]


class VideoDataCreate(BaseModel):
    title: Optional[str] = None
    video_id: Optional[str] = None
    published_at: Optional[datetime] = None
    channel_name: Optional[str] = None
    views: Optional[int] = None
    video_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    matched_keywords: Optional[str] = None
    transcript: Optional[str] = None


class VideoDataResponse(VideoDataCreate):
    id: int


# -------------------------------
# INSERT FUNCTIONS
# -------------------------------

def insert_video(payload: VideoCreate):
    sql = """
        INSERT INTO videos (
            video_id,
            channel_name,
            title,
            published_at,
            view_count,
            domain,
            created_at
        )
        VALUES (%s,%s,%s,%s,%s,%s,NOW())
        ON CONFLICT (video_id) DO NOTHING;
    """

    execute(sql, (
        payload.video_id,
        payload.channel_name,
        payload.title,
        payload.published_at,
        payload.view_count,
        payload.domain
    ))


def insert_claim(video_id: str, claim_text: str, confidence_score: Optional[int]):

    sql = """
        INSERT INTO claims (
            video_id,
            claim_text,
            confidence_score,
            created_at
        )
        VALUES (%s,%s,%s,NOW())
        RETURNING claim_id;
    """

    row = execute(sql, (video_id, claim_text, confidence_score), fetch_one=True)
    return row["claim_id"]


def insert_narrative(payload: NarrativeCreate):

    sql = """
        INSERT INTO narratives (
            title,
            description,
            domain,
            claim_count,
            first_detected_at
        )
        VALUES (%s,%s,%s,0,NOW())
        RETURNING narrative_id;
    """

    row = execute(sql, (
        payload.title,
        payload.description,
        payload.domain
    ), fetch_one=True)

    return row["narrative_id"]


def link_narrative_claim(narrative_id: int, claim_id: int):

    sql = """
        INSERT INTO narrative_claims (
            narrative_id,
            claim_id,
            added_at
        )
        VALUES (%s,%s,NOW())
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


def insert_video_data(payload: VideoDataCreate):
    sql = """
        INSERT INTO video_data (
            title, video_id, published_at, channel_name,
            views, video_url, duration_seconds, matched_keywords, transcript
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *;
    """
    row = execute(sql, (
        payload.title,
        payload.video_id,
        payload.published_at,
        payload.channel_name,
        payload.views,
        payload.video_url,
        payload.duration_seconds,
        payload.matched_keywords,
        payload.transcript,
    ), fetch_one=True)
    return row


# -------------------------------
# ROUTES
# -------------------------------

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


@app.post("/videos")
def create_video(payload: VideoCreate):

    insert_video(payload)

    return {
        "status": "video_created",
        "video_id": payload.video_id
    }


@app.post("/claims")
def create_claim(payload: ClaimCreate):

    claim_id = insert_claim(
        payload.video_id,
        payload.claim_text,
        payload.confidence_score
    )

    return {"claim_id": claim_id}


@app.post("/narratives")
def create_narrative(payload: NarrativeCreate):

    narrative_id = insert_narrative(payload)

    return {"narrative_id": narrative_id}


@app.post("/narratives/{narrative_id}/claims/{claim_id}")
def attach_claim(narrative_id: int, claim_id: int):

    link_narrative_claim(narrative_id, claim_id)

    increment_narrative_count(narrative_id)

    return {"status": "linked"}


# -------------------------------
# GET ENDPOINTS
# -------------------------------

@app.get("/videos")
def get_videos(limit: int = 50, offset: int = 0):

    sql = """
        SELECT *
        FROM videos
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s;
    """

    return execute(sql, (limit, offset), fetch_all=True)


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


@app.get("/video-data", response_model=list[VideoDataResponse])
def get_all_video_data():
    query = "SELECT * FROM video_data;"
    rows = execute(query, fetch_all=True)
    return rows or []


@app.post("/video-data", response_model=VideoDataResponse)
def create_video_data(video: VideoDataCreate):
    row = insert_video_data(video)
    return row


@app.patch("/video-data/{video_id}/transcript")
def update_video_data_transcript(video_id: str, data: dict):
    transcript = data.get("transcript")
    sql = """
        UPDATE video_data
        SET transcript = %s
        WHERE video_id = %s
        RETURNING *;
    """
    row = execute(sql, (transcript, video_id), fetch_one=True)
    if not row:
        raise HTTPException(status_code=404, detail="Video not found")
    return row
