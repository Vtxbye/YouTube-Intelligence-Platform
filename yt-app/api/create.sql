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

CREATE TABLE IF NOT EXIST comments (
  comment_id SERIAL PRIMARY KEY,
  video_id VARCHAR(11) NOT NULL REFERENCES video_data(video_id),
  comment_text TEXT,
  author TEXT,
  likes INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  sentiment_score double precision DEFAULT 0,
)
