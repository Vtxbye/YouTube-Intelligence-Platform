#!/bin/bash

# For VM so that our scraper automatically commits new data
cd "$(dirname "$0")"

# Exit if no changes
if git diff --quiet && git diff --cached --quiet; then
    exit 0
fi

timestamp=$(date +"%Y-%m-%d %H:%M:%S")

git add -A
git commit -m "Auto-commit data from VM at $timestamp"
git push origin main