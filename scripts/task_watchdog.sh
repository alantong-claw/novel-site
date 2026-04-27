#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
TASK_DIR="$ROOT/memory/tasks"
LOG="$ROOT/memory/task-watchdog.log"
NOW_EPOCH="$(date +%s)"
RUNNING_TIMEOUT_SECS="${RUNNING_TIMEOUT_SECS:-1800}"
BLOCKED_NOTIFY_TIMEOUT_SECS="${BLOCKED_NOTIFY_TIMEOUT_SECS:-600}"

mkdir -p "$TASK_DIR"
mkdir -p "$(dirname "$LOG")"

touch "$LOG"

python3 - <<'PY' "$TASK_DIR" "$LOG" "$NOW_EPOCH" "$RUNNING_TIMEOUT_SECS" "$BLOCKED_NOTIFY_TIMEOUT_SECS"
import json
import os
import sys
from datetime import datetime

TASK_DIR, LOG, NOW_EPOCH, RUNNING_TIMEOUT_SECS, BLOCKED_NOTIFY_TIMEOUT_SECS = sys.argv[1:6]
NOW_EPOCH = int(NOW_EPOCH)
RUNNING_TIMEOUT_SECS = int(RUNNING_TIMEOUT_SECS)
BLOCKED_NOTIFY_TIMEOUT_SECS = int(BLOCKED_NOTIFY_TIMEOUT_SECS)


def parse_ts(s):
    if not s:
        return None
    try:
        return int(datetime.strptime(s, '%Y-%m-%dT%H:%M:%S%z').timestamp())
    except Exception:
        return None


def log(msg):
    with open(LOG, 'a', encoding='utf-8') as f:
        f.write(msg + '\n')


def save(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

for name in sorted(os.listdir(TASK_DIR)):
    if not name.endswith('.json'):
        continue
    path = os.path.join(TASK_DIR, name)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        log(f'[{datetime.now().astimezone().strftime("%F %T")}] unreadable state: {path}')
        continue

    status = data.get('status', '')
    updated_at = parse_ts(data.get('updated_at'))
    if not updated_at:
        continue

    age = NOW_EPOCH - updated_at

    if status == 'running' and age > RUNNING_TIMEOUT_SECS:
        data['status'] = 'blocked'
        data['watchdog_reason'] = 'running_timeout'
        data['next_action'] = data.get('next_action') or 'inspect task and summarize blocker'
        data['updated_at'] = datetime.now().astimezone().strftime('%Y-%m-%dT%H:%M:%S%z')
        save(path, data)
        log(f'[{datetime.now().astimezone().strftime("%F %T")}] marked blocked by watchdog: {path}')

    elif status == 'done' and not data.get('user_notified', False) and age > BLOCKED_NOTIFY_TIMEOUT_SECS:
        data['watchdog_reason'] = 'done_without_final_delivery'
        data['next_action'] = data.get('next_action') or 'send final completion update or mark intentionally silent'
        data['updated_at'] = datetime.now().astimezone().strftime('%Y-%m-%dT%H:%M:%S%z')
        save(path, data)
        log(f'[{datetime.now().astimezone().strftime("%F %T")}] done task missing final delivery: {path}')

    elif status == 'blocked' and not data.get('user_notified', False) and age > BLOCKED_NOTIFY_TIMEOUT_SECS:
        log(f'[{datetime.now().astimezone().strftime("%F %T")}] blocked task awaiting notify: {path}')
PY

PIXNET_ALERT_TARGET="${PIXNET_ALERT_TARGET:-8707204748}"

for progress in "$ROOT"/memory/pixnet-whisky-*-progress.json; do
  [[ -e "$progress" ]] || continue
  python3 "$ROOT/scripts/pixnet/pixnet_range_watchdog.py" "$progress" 8 || true
  alert_json="$(python3 "$ROOT/scripts/pixnet/pixnet_range_alert.py" "$progress" "$PIXNET_ALERT_TARGET" 2>/dev/null || true)"
  if [[ -n "$alert_json" ]]; then
    target="$(printf '%s' "$alert_json" | python3 -c 'import sys,json; print(json.load(sys.stdin)["target"])')"
    message="$(printf '%s' "$alert_json" | python3 -c 'import sys,json; print(json.load(sys.stdin)["message"])')"
    printf '[%s] pixnet blocked alert sending: %s -> %s\n' "$(date '+%F %T')" "$progress" "$target" >> "$LOG"
    if openclaw message send --channel telegram --target "$target" --message "$message" >> "$LOG" 2>&1; then
      printf '[%s] pixnet blocked alert sent: %s -> %s\n' "$(date '+%F %T')" "$progress" "$target" >> "$LOG"
    else
      printf '[%s] pixnet blocked alert delivery failed: %s -> %s\n' "$(date '+%F %T')" "$progress" "$target" >> "$LOG"
      python3 - <<'PY' "$progress"
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
data = json.loads(path.read_text(encoding='utf-8'))
data['alertSent'] = False
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
PY
    fi
  fi
done
