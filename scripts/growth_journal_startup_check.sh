#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
NOVEL_DIR="$ROOT/novel_site"
LOG_DIR="$ROOT/memory"
LOG_FILE="$LOG_DIR/growth-journal-startup-check.log"
TODAY="$(TZ=Asia/Taipei date +%F)"
YESTERDAY="$(TZ=Asia/Taipei date -d 'yesterday' +%F)"
HOUR="$(TZ=Asia/Taipei date +%H)"

mkdir -p "$LOG_DIR"

# Only run after 00:00; mainly useful on startup/re-entry next day.
if (( 10#$HOUR < 0 )); then
  exit 0
fi

if [[ -f "$NOVEL_DIR/clawchan-$YESTERDAY.html" ]]; then
  exit 0
fi

{
  echo "[$(TZ=Asia/Taipei date '+%F %T')] missing growth journal for $YESTERDAY detected on startup"
  MESSAGE="Yesterday's growth journal entry ($YESTERDAY) is missing in $NOVEL_DIR. Backfill / create clawchan-$YESTERDAY.html in the same style as nearby entries, update clawchan.html to include it as the latest entry if appropriate, then commit and push inside the novel_site git repo."
  openclaw agent --message "$MESSAGE" --json
} >> "$LOG_FILE" 2>&1
