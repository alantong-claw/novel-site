#!/usr/bin/env bash
set -euo pipefail

echo "handle_pending_ok.sh is deprecated for normal approvals. Use a specific handler instead:" >&2
echo "  backup: bash /home/alantong/ai-work/scripts/handle_backup_ok.sh" >&2
echo "  novel:  bash /home/alantong/ai-work/scripts/handle_weekly_novel_ok.sh" >&2
echo "This fallback will only act when exactly one eligible flow is pending." >&2

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

backup_eligible=0
novel_eligible=0

if [[ "$backup_status" == "pending" || "$backup_status" == "started" ]]; then
  backup_eligible=1
fi

if [[ "$novel_status" == "awaiting_ok" || "$novel_status" == "awaiting_novel_ok" ]]; then
  novel_eligible=1
fi

eligible_count=$((backup_eligible + novel_eligible))

if [[ "$eligible_count" == "0" ]]; then
  echo "No pending OK-driven flow found."
  exit 1
fi

if [[ "$eligible_count" != "1" ]]; then
  echo "Ambiguous OK-driven flow: backup_eligible=$backup_eligible novel_eligible=$novel_eligible" >&2
  exit 2
fi

if [[ "$backup_eligible" == "1" ]]; then
  bash "$ROOT/scripts/handle_backup_ok.sh"
  exit $?
fi

if [[ "$novel_eligible" == "1" ]]; then
  bash "$ROOT/scripts/handle_weekly_novel_ok.sh"
  exit $?
fi

echo "No pending OK-driven flow found."
exit 1
