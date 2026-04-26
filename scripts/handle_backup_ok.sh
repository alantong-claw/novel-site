#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
PENDING_FILE="$ROOT/memory/backup-pending.json"
TODAY="$(TZ=Asia/Taipei date +%F)"
TS="$(TZ=Asia/Taipei date '+%Y-%m-%dT%H:%M:%S%z')"
PENDING_DATE="$(grep -o '"date":"[^"]*"' "$PENDING_FILE" 2>/dev/null | head -n 1 | cut -d'"' -f4 || true)"

if [[ ! -f "$PENDING_FILE" ]]; then
  echo "No pending backup request."
  exit 0
fi

if ! grep -Eq '"status":"(pending|started)"' "$PENDING_FILE"; then
  echo "Backup request is not pending."
  exit 0
fi

if [[ -z "$PENDING_DATE" ]]; then
  echo "Pending backup request has no date."
  exit 0
fi

OUTPUT="$(bash "$ROOT/scripts/start_weekly_backup_bg.sh")"
printf '{"status":"started","date":"%s","started_at":"%s"}\n' "$TODAY" "$TS" > "$PENDING_FILE"
printf '%s\n' "$OUTPUT"
echo "Backup started for $TODAY"
