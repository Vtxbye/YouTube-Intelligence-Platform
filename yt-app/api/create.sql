-- Narrative API tables (videos, claims, narratives)

CREATE TABLE IF NOT EXISTS video_data (
  video_id VARCHAR(11) PRIMARY KEY,
  title TEXT,
  published_at TIMESTAMPTZ,
  channel_name TEXT,
  views INTEGER,
  video_url TEXT,
  duration_seconds INTEGER,
  matched_keywords TEXT,
  transcript TEXT,
  CHECK (duration_seconds > 0 OR duration_seconds IS NULL),
  CHECK (views >= 0 OR views IS NULL)
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id SERIAL PRIMARY KEY,
  video_id VARCHAR(11) NOT NULL REFERENCES video_data(video_id),
  claim_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS narratives (
  narrative_id SERIAL PRIMARY KEY,
  narrative_text TEXT NOT NULL,
  domain TEXT,
  claim_count INTEGER DEFAULT 0,
  first_detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS narrative_claims (
  narrative_id INTEGER REFERENCES narratives(narrative_id),
  claim_id INTEGER REFERENCES claims(claim_id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (narrative_id, claim_id)
);

CREATE TABLE IF NOT EXISTS comments (
  comment_id SERIAL PRIMARY KEY,
  video_id VARCHAR(11) NOT NULL REFERENCES video_data(video_id),
  comment_text TEXT,
  author TEXT,
  likes INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  sentiment_score double precision DEFAULT 0
);

CREATE MATERIALIZED VIEW IF NOT EXISTS narrative_claim_video_view AS
SELECT
  n.narrative_id,
  n.narrative_text,
  n.domain,
  n.claim_count,
  n.first_detected_at,

  c.claim_id,
  c.claim_text,
  c.created_at AS claim_created_at,

  v.video_id,
  v.title AS video_title,
  v.published_at AS video_published_at,
  v.channel_name,
  v.views,
  v.video_url,
  v.duration_seconds,
  v.matched_keywords,
  v.transcript

FROM narratives n
JOIN narrative_claims nc
  ON n.narrative_id = nc.narrative_id
JOIN claims c
  ON nc.claim_id = c.claim_id
JOIN video_data v
  ON c.video_id = v.video_id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS narrative_claim_video_view_uidx
ON narrative_claim_video_view (narrative_id, claim_id, video_id);