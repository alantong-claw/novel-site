#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
STATE_FILE="$ROOT/memory/novel-progress.json"

if [[ ! -f "$STATE_FILE" ]]; then
  echo "State file missing"
  exit 1
fi

status="$(python3 - <<'PY'
import json
from pathlib import Path
p = Path('/home/alantong/ai-work/memory/novel-progress.json')
obj = json.loads(p.read_text())
print(obj.get('status',''))
PY
)"

if [[ "$status" != "awaiting_ok" ]]; then
  echo "Not awaiting OK, current status: $status"
  exit 1
fi

bash "$ROOT/scripts/publish_weekly_novel_chapter.sh"
