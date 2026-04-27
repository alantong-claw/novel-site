#!/usr/bin/env python3
import json
import os
import sys
from datetime import datetime


def now_taipei_iso():
    return datetime.now().astimezone().strftime('%Y-%m-%dT%H:%M:%S%z')


def main():
    if len(sys.argv) < 3:
        print('usage: task_state.py <state_file> <status> [key=value ...]', file=sys.stderr)
        sys.exit(1)

    state_file = sys.argv[1]
    status = sys.argv[2]
    updates = {'status': status, 'updated_at': now_taipei_iso()}

    for arg in sys.argv[3:]:
        if '=' not in arg:
            continue
        k, v = arg.split('=', 1)
        if v.lower() == 'true':
            updates[k] = True
        elif v.lower() == 'false':
            updates[k] = False
        else:
            updates[k] = v

    data = {}
    if os.path.exists(state_file):
        try:
            with open(state_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception:
            data = {}

    if status == 'running' and 'started_at' not in data:
        updates['started_at'] = updates['updated_at']

    if 'alert_scope' not in data and 'alert_scope' not in updates:
        updates['alert_scope'] = 'owner'

    data.update(updates)
    os.makedirs(os.path.dirname(state_file), exist_ok=True)
    with open(state_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(json.dumps(data, ensure_ascii=False))


if __name__ == '__main__':
    main()
