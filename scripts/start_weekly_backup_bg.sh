#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
LOG="$ROOT/memory/backup-bg.log"
PIDFILE="$ROOT/memory/backup-bg.pid"
STATEFILE="$ROOT/memory/backup-state.json"
TS="$(TZ=Asia/Taipei date '+%Y-%m-%dT%H:%M:%S%z')"

mkdir -p "$ROOT/memory"

if [[ -f "$PIDFILE" ]]; then
  PID="$(cat "$PIDFILE")"
  if kill -0 "$PID" >/dev/null 2>&1; then
    echo "Backup already running (pid $PID)"
    exit 0
  fi
fi

printf '{"last_run":"%s","status":"running","mode":"background"}\n' "$TS" > "$STATEFILE"

nohup bash "$ROOT/scripts/run_weekly_backup_and_report.sh" >> "$LOG" 2>&1 &
echo $! > "$PIDFILE"
echo "Started background backup pid $(cat "$PIDFILE")"
