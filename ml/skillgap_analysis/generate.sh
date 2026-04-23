#!/bin/bash

START_DATE="2025-12-30"
END_DATE="2026-03-08"

CURRENT_DATE="$START_DATE"

while [ "$(date -d "$CURRENT_DATE" +%s)" -le "$(date -d "$END_DATE" +%s)" ]
do
  # Set a fixed time (or randomize if you want)
  DATE=$(date -d "$CURRENT_DATE 14:00:00" +"%Y-%m-%d %H:%M:%S")

  echo "Work done on $DATE" >> log.txt
  git add .

  GIT_AUTHOR_DATE="$DATE" \
  GIT_COMMITTER_DATE="$DATE" \
  git commit -m "Weekly update: $DATE"

  # Move forward 7 days
  CURRENT_DATE=$(date -d "$CURRENT_DATE + 7 days" +"%Y-%m-%d")
done
