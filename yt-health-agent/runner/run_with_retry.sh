#!/bin/sh
# Runs the scraper once. On failure, retries every hour up to MAX_RETRIES times.

# Load container environment (cron runs with empty env, Docker vars not inherited)
[ -f /app/container_env.sh ] && . /app/container_env.sh

MAX_RETRIES=5

attempt=1
while [ $attempt -le $((MAX_RETRIES + 1)) ]; do
    echo "[runner] Attempt $attempt at $(date)" >> /data/runner.log 2>&1
    /usr/local/bin/python3 /app/run_daily.py >> /data/runner.log 2>&1
    if [ $? -eq 0 ]; then
        echo "[runner] Attempt $attempt succeeded" >> /data/runner.log 2>&1
        exit 0
    fi
    if [ $attempt -le $MAX_RETRIES ]; then
        echo "[runner] Attempt $attempt failed, retrying in 1 hour..." >> /data/runner.log 2>&1
        sleep 3600
    fi
    attempt=$((attempt + 1))
done

echo "[runner] All $MAX_RETRIES retries exhausted" >> /data/runner.log 2>&1
exit 1
