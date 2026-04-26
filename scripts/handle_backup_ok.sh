#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
PENDING_FILE="$ROOT/memory/backup-pending.json"
TODAY="$(TZ=Asia/Taipei date +%F)"
TS="$(TZ=Asia/Taipei date '+%Y-%m-%dT%H:%M:%S%z')"

if [[ ! -f "$PENDING_FILE" ]]; then
  echo "No pending backup request."
  exit 0
fi

if ! grep -Eq '"status":"(pending|started)"' "$PENDING_FILE"; then
  echo "Backup request is not pending."
  exit 0
fi

if ! grep -q "\"date\":\"$TODAY\"" "$PENDING_FILE"; then
  echo "Pending backup request is for a different date."
  exit 0
fi

OUTPUT="$(bash "$ROOT/scripts/start_weekly_backup_bg.sh")"
printf '{"status":"started","date":"%s","started_at":"%s"}\n' "$TODAY" "$TS" > "$PENDING_FILE"
printf '%s\n' "$OUTPUT"
echo "Backup started for $TODAY"
