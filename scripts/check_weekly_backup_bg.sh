#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
PIDFILE="$ROOT/memory/backup-bg.pid"
STATEFILE="$ROOT/memory/backup-state.json"
LOG="$ROOT/memory/backup-bg.log"

if [[ -f "$PIDFILE" ]]; then
  PID="$(cat "$PIDFILE")"
  if kill -0 "$PID" >/dev/null 2>&1; then
    echo "Backup running (pid $PID)"
    [[ -f "$STATEFILE" ]] && cat "$STATEFILE"
    exit 0
  else
    echo "Backup pid file exists but process not running"
  fi
else
  echo "No backup pid file"
fi

echo "--- state ---"
[[ -f "$STATEFILE" ]] && cat "$STATEFILE" || echo "missing state"
echo
echo "--- log tail ---"
[[ -f "$LOG" ]] && tail -n 30 "$LOG" || echo "missing log"
