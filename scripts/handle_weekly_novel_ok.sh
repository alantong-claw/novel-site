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

if [[ "$status" == "needs_draft" || "$status" == "draft_placeholder_ready" ]]; then
  echo "Novel draft is not finished yet. Complete the real chapter draft before NOVEL OK."
  exit 1
fi

if [[ "$status" == "awaiting_novel_ok" ]]; then
  python3 - <<'PY'
import json
from pathlib import Path
p = Path('/home/alantong/ai-work/memory/novel-progress.json')
obj = json.loads(p.read_text())
obj['status'] = 'awaiting_ok'
p.write_text(json.dumps(obj, ensure_ascii=False) + '\n')
PY
  status="awaiting_ok"
fi

if [[ "$status" != "awaiting_ok" && "$status" != "published" ]]; then
  echo "Not awaiting OK, current status: $status"
  exit 1
fi

if [[ "$status" == "published" ]]; then
  echo "Novel already published."
  exit 0
fi

bash "$ROOT/scripts/publish_weekly_novel_chapter.sh"
