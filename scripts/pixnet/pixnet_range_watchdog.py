#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path('/home/alantong/ai-work')


def now_utc():
    return datetime.now(timezone.utc)


def parse_ts(s: str):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace('Z', '+00:00'))
    except Exception:
        return None


def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    if len(sys.argv) < 2:
        print('usage: pixnet_range_watchdog.py <progress.json> [stall_minutes]', file=sys.stderr)
        sys.exit(2)

    progress_path = Path(sys.argv[1])
    stall_minutes = int(sys.argv[2]) if len(sys.argv) >= 3 else 8
    progress = read_json(progress_path)
    updated_at = parse_ts(progress.get('updatedAt'))
    if not updated_at:
        sys.exit(0)

    if progress.get('completed'):
        sys.exit(0)

    age_seconds = (now_utc() - updated_at.astimezone(timezone.utc)).total_seconds()
    if age_seconds < stall_minutes * 60:
        sys.exit(0)

    progress['stalled'] = True
    progress['status'] = 'blocked'
    progress['stallCount'] = int(progress.get('stallCount', 0)) + 1
    progress['lastError'] = progress.get('lastError') or 'range_progress_stalled'
    progress['watchdogReason'] = f'no progress for {int(age_seconds)}s'
    progress['updatedAt'] = now_utc().isoformat()
    write_json(progress_path, progress)


if __name__ == '__main__':
    main()
