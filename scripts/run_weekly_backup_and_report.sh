#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
BACKUP_SCRIPT="$ROOT/scripts/run_weekly_backup.sh"
STATE_FILE="$ROOT/memory/backup-state.json"
PENDING_FILE="$ROOT/memory/backup-pending.json"
TELEGRAM_TARGET="${1:-8707204748}"

if [[ "${BACKUP_BG:-}" != "1" && "${ALLOW_FOREGROUND:-}" != "1" ]]; then
  echo "This backup script must run in background. Use: $ROOT/scripts/start_weekly_backup_bg.sh"
  exit 1
fi

bash "$BACKUP_SCRIPT"

SUMMARY="Backup finished."
if [[ -f "$STATE_FILE" ]]; then
  SUMMARY="$(cat "$STATE_FILE")"
fi

openclaw message send --channel telegram --target "$TELEGRAM_TARGET" --message "Weekly backup completed: $SUMMARY" >/dev/null

echo "backup completed and summary sent"
