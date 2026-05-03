#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
BACKUP_PENDING="$ROOT/memory/backup-pending.json"
NOVEL_STATE="$ROOT/memory/novel-progress.json"

backup_status=""
novel_status=""

if [[ -f "$BACKUP_PENDING" ]]; then
  backup_status="$(python3 - <<'PY'
import json
from pathlib import Path
p = Path('/home/alantong/ai-work/memory/backup-pending.json')
try:
    obj = json.loads(p.read_text())
    print(obj.get('status',''))
except Exception:
    print('')
PY
)"
fi

if [[ -f "$NOVEL_STATE" ]]; then
  novel_status="$(python3 - <<'PY'
import json
from pathlib import Path
p = Path('/home/alantong/ai-work/memory/novel-progress.json')
try:
    obj = json.loads(p.read_text())
    print(obj.get('status',''))
except Exception:
    print('')
PY
)"
fi

did_something=0
had_success=0
had_failure=0

if [[ "$backup_status" == "pending" || "$backup_status" == "started" ]]; then
  if bash "$ROOT/scripts/handle_backup_ok.sh"; then
    had_success=1
  else
    had_failure=1
  fi
  did_something=1
fi

if [[ "$novel_status" == "awaiting_ok" || "$novel_status" == "awaiting_novel_ok" || "$novel_status" == "draft_placeholder_ready" ]]; then
  if bash "$ROOT/scripts/handle_weekly_novel_ok.sh"; then
    had_success=1
  else
    had_failure=1
  fi
  did_something=1
fi

if [[ "$did_something" != "1" ]]; then
  echo "No pending OK-driven flow found."
  exit 1
fi

if [[ "$had_success" == "1" ]]; then
  echo "Handled pending OK-driven flows."
  exit 0
fi

if [[ "$had_failure" == "1" ]]; then
  echo "Found OK-driven flows, but none completed successfully."
  exit 1
fi

echo "Handled pending OK-driven flows."
