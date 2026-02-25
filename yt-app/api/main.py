from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

import psycopg2
from psycopg2.extras import RealDictCursor

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound

app = FastAPI(title="YouTube Narrative Ingestion API")

# database connection
# needs to be updated to use the correct database credentials
# postgres credentials should be stored in environment variables
def get_db():
    return psycopg2.connect(
        host="localhost",
        port="5432",
        dbname="your_db",
        user="your_user",
        password="your_password",
        cursor_factory=RealDictCursor
    )

# generic sql executor
def exec_sql(sql: str, params: tuple = (), fetch: bool = False):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            if fetch:
                return cur.fetchone()

# request models
# these are the request models for the API
# they are used to validate the request payload
# they are also used to generate the SQL queries
class VideoIngestRequest(BaseModel):
    video_id: str
    channel_name: Optional[str]
    title: Optional[str]
    published_at: Optional[datetime]
    view_count: Optional[int]
    domain: Optional[str]

class ClaimCreate(BaseModel):
    video_id: str
    claim_text: str
    confidence_score: Optional[int]

class NarrativeCreate(BaseModel):
    title: str
    description: Optional[str]
    domain: Optional[str]

# youtube transcript fetch
def fetch_transcript(video_id: str) -> str:
    # try to fetch the transcript from the YouTube API
    try:
        # if the transcript is found, return the transcript as a string
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join(chunk["text"] for chunk in transcript)
    except (TranscriptsDisabled, NoTranscriptFound):
        # if the transcript is disabled or not found, return an empty string
        return ""
    # if any other error occurs, raise an error
    except Exception as e:
        raise RuntimeError(str(e))

# sql functions
# these are the SQL functions for the API
# they are used to insert the data into the database
# they are also used to generate the SQL queries
def insert_video(payload: VideoIngestRequest, transcript: str):
    sql = """
        INSERT INTO videos (
            video_id,
            channel_name,
            title,
            published_at,
            view_count,
            transcript,
            domain,
            created_at
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,NOW())
        ON CONFLICT (video_id) DO NOTHING;
    """
    exec_sql(sql, (
        payload.video_id,
        payload.channel_name,
        payload.title,
        payload.published_at,
        payload.view_count,
        transcript,
        payload.domain
    ))
# insert a claim into the database
def insert_claim(video_id: str, claim_text: str, confidence_score: Optional[int]) -> int:
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
    row = exec_sql(sql, (video_id, claim_text, confidence_score), fetch=True)
    return row["claim_id"]

# insert a narrative into the database
def insert_narrative(payload: NarrativeCreate) -> int:
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
    row = exec_sql(sql, (
        payload.title,
        payload.description,
        payload.domain
    ), fetch=True)
    return row["narrative_id"]

# link a narrative to a claim
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
    exec_sql(sql, (narrative_id, claim_id))

# increment the narrative count
def increment_narrative_count(narrative_id: int):
    sql = """
        UPDATE narratives
        SET claim_count = claim_count + 1
        WHERE narrative_id = %s;
    """
    exec_sql(sql, (narrative_id,))

# routes
# these are the routes for the API
# this is the actual requests
@app.post("/videos/ingest")
def ingest_video(payload: VideoIngestRequest):
    transcript = fetch_transcript(payload.video_id)
    insert_video(payload, transcript)
    return {"status": "video_ingested", "video_id": payload.video_id}

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
