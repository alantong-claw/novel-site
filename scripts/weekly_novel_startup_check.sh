#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
STATE_FILE="$ROOT/memory/novel-progress.json"
TODAY="$(TZ=Asia/Taipei date +%F)"
DOW="$(TZ=Asia/Taipei date +%u)"   # 7=Sun
HOUR="$(TZ=Asia/Taipei date +%H)"
LOG_DIR="$ROOT/memory"
LOG_FILE="$LOG_DIR/weekly-novel-startup-check.log"

mkdir -p "$LOG_DIR"

# Only care on Sundays after 08:00.
if [[ "$DOW" != "7" ]]; then
  exit 0
fi
if (( 10#$HOUR < 8 )); then
  exit 0
fi

# If already handled today, skip.
if [[ -f "$STATE_FILE" ]] && grep -q "$TODAY" "$STATE_FILE"; then
  exit 0
fi

{
  echo "[$(TZ=Asia/Taipei date '+%F %T')] startup catch-up triggered"
  "$ROOT/scripts/weekly_novel_check.sh"
} >> "$LOG_FILE" 2>&1 &
