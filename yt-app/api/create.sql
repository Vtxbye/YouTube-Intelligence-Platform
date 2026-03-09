CREATE TABLE IF NOT EXISTS video_data (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT,
  video_id VARCHAR(11) UNIQUE,
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