#!/bin/bash
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends cron tzdata ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY run_daily.py /app/run_daily.py
COPY entrypoint.sh /app/entrypoint.sh
COPY run_with_retry.sh /app/run_with_retry.sh

RUN chmod +x /app/entrypoint.sh /app/run_with_retry.sh

RUN printf "CRON_TZ=America/Chicago\n0 0 * * * /app/run_with_retry.sh\n" > /etc/cron.d/yt_daily \
    && chmod 0644 /etc/cron.d/yt_daily \
    && crontab /etc/cron.d/yt_daily

CMD ["/app/entrypoint.sh"]