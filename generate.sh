#!/bin/bash

START_DATE="2025-12-30"
END_DATE="2026-03-08"

CURRENT_DATE="$START_DATE"

MESSAGES=(
  "feat: add new functionality"
  "fix: resolve minor bug"
  "refactor: improve code structure"
  "docs: update documentation"
  "chore: cleanup code"
  "feat: enhance existing feature"
  "fix: handle edge case"
  "refactor: optimize performance"
)

while [ "$(date -d "$CURRENT_DATE" +%s)" -le "$(date -d "$END_DATE" +%s)" ]
do
  DATE=$(date -d "$CURRENT_DATE 14:00:00" +"%Y-%m-%d %H:%M:%S")

  echo "Work done on $DATE" >> log.txt
  git add .

  # Pick random message
  MSG=${MESSAGES[$RANDOM % ${#MESSAGES[@]}]}

  GIT_AUTHOR_DATE="$DATE" \
  GIT_COMMITTER_DATE="$DATE" \
  git commit -m "$MSG"

  CURRENT_DATE=$(date -d "$CURRENT_DATE + 10 days" +"%Y-%m-%d")
done