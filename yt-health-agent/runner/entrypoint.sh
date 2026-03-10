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

echo "[runner] Running scraper once immediately (with retry)..."
/app/run_with_retry.sh || true

echo "[runner] Starting cron scheduler..."
cron -f