#!/bin/sh
set -e

echo "[runner] Starting container..."
date

echo "[runner] Waiting for Ollama to be ready..."
until curl -sf "${OLLAMA_URL:-http://ollama:11434}/api/tags" > /dev/null 2>&1; do
  echo "[runner] Ollama not ready yet, retrying in 5s..."
  sleep 5
done
echo "[runner] Ollama is ready."

# Write only the vars run_daily.py needs into a root-only file for cron
printenv | grep -E "^(YT_API_KEY|DB_MAX|MONTHS_BACK|MIN_DURATION_SECONDS|MIN_VIEWS|OLLAMA_MODEL|OLLAMA_URL|OUT_CSV|STATE_FILE|DISCOVERY_PAGES_PER_QUERY|PLAYLIST_PAGES_PER_CHANNEL|MAX_VIDEOS_PER_CHANNEL|MAX_COLLECT_CHANNELS|EXCLUDE_MADE_FOR_KIDS|NEGATIVE_TERMS|TRANSCRIPT_DAILY_LIMIT|TRANSCRIPT_FETCH_DELAY|TRANSCRIPT_SAVE_EVERY|TRANSCRIPTS_FILE|TRANSCRIPT_STATUS_FILE)=" \
  | sed "s/'/'\\\\''/g; s/=\(.*\)/='\1'/" | sed 's/^/export /' > /app/container_env.sh
chmod 600 /app/container_env.sh

echo "[runner] Running scraper once immediately (with retry)..."
/app/run_with_retry.sh || true

echo "[runner] Starting cron scheduler..."
cron -f