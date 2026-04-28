#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT_SESSION_KEY = 'agent:main:telegram:direct:8707204748'

ROOT = Path('/home/alantong/ai-work')
TASK_STATE = ROOT / 'scripts' / 'task_state.py'
DEFAULT_NODE_SCRIPT = ROOT / 'tmp' / 'pixnet-playwright-test' / 'pixnet-publish-one.js'


def now_iso_local():
    return datetime.now().astimezone().strftime('%Y-%m-%dT%H:%M:%S%z')


def now_iso_utc():
    return datetime.now(timezone.utc).isoformat()


def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def update_task_state(state_file: Path, status: str, **fields):
    args = ['python3', str(TASK_STATE), str(state_file), status]
    for k, v in fields.items():
        args.append(f'{k}={v}')
    subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def read_child_task_result(task_id: int):
    task_path = ROOT / 'memory' / 'tasks' / f'pixnet-whisky-{task_id:03d}.json'
    if not task_path.exists():
        return None
    data = read_json(task_path)
    if data.get('status') != 'done':
        return None
    note = data.get('note', '')
    if isinstance(note, str) and note.startswith('https://'):
        return {
            'success': True,
            'result': {
                'num': f'{task_id:03d}',
                'postUrl': note,
            }
        }
    return None


def ensure_progress_defaults(progress: dict):
    progress.setdefault('completed', False)
    progress.setdefault('lastPublishedId', progress['rangeStart'] - 1)
    progress.setdefault('lastPublishedUrl', '')
    progress.setdefault('stallCount', 0)
    progress.setdefault('stalled', False)
    progress.setdefault('failureCount', 0)
    progress.setdefault('status', 'running')
    progress.setdefault('finalNotified', False)
    progress.setdefault('updatedAt', now_iso_utc())
    return progress


def send_completion_notice(progress_path: Path, progress: dict):
    if progress.get('finalNotified'):
        return
    alert_script = ROOT / 'scripts' / 'pixnet' / 'pixnet_range_alert.py'
    proc = subprocess.run(
        ['python3', str(alert_script), str(progress_path), ROOT_SESSION_KEY],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    payload = json.loads(proc.stdout.strip()) if proc.stdout.strip() else None
    if not payload:
        return
    subprocess.run(
        ['openclaw', 'message', 'send', '--channel', 'telegram', '--target', payload['target'], '--message', payload['message']],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )


def main():
    if len(sys.argv) != 2:
        print('usage: pixnet_range_runner.py <progress.json>', file=sys.stderr)
        sys.exit(2)

    progress_path = Path(sys.argv[1])
    progress = ensure_progress_defaults(read_json(progress_path))
    task_name = progress.get('taskName') or f"pixnet-whisky-{progress['rangeStart']:03d}-{progress['rangeEnd']:03d}"
    task_state_file = ROOT / 'memory' / 'tasks' / f'{task_name}.json'
    log_dir = ROOT / 'tmp' / 'pixnet-logs'
    log_dir.mkdir(parents=True, exist_ok=True)

    if progress['completed'] or progress['nextId'] > progress['rangeEnd']:
        progress['completed'] = True
        progress['status'] = 'done'
        progress['updatedAt'] = now_iso_utc()
        write_json(progress_path, progress)
        update_task_state(task_state_file, 'done', task=task_name, alert_scope='owner', current_step='range_complete', last_ok_step='range_complete', note='range already complete', user_notified=progress.get('finalNotified', False))
        send_completion_notice(progress_path, progress)
        return

    next_id = int(progress['nextId'])
    range_note = f"{next_id:03d}/{progress['rangeEnd']:03d}"
    update_task_state(task_state_file, 'running', task=task_name, alert_scope='owner', current_step='launch_single_post', last_ok_step=f"published_{progress.get('lastPublishedId', progress['rangeStart'] - 1):03d}", note=range_note)

    log_file = log_dir / f'pixnet-whisky-{next_id:03d}.log'
    cmd = ['node', str(DEFAULT_NODE_SCRIPT), str(next_id)]
    with log_file.open('w', encoding='utf-8') as f:
        proc = subprocess.run(cmd, stdout=f, stderr=subprocess.STDOUT, text=True)

    log_text = log_file.read_text(encoding='utf-8', errors='ignore')
    result = read_child_task_result(next_id)

    if proc.returncode == 0 and result and result.get('success') and result.get('result', {}).get('num') == f'{next_id:03d}':
        post_url = result.get('result', {}).get('postUrl', '')
        progress['lastPublishedId'] = next_id
        progress['lastPublishedUrl'] = post_url
        progress['nextId'] = next_id + 1
        progress['stallCount'] = 0
        progress['stalled'] = False
        progress['failureCount'] = 0
        progress['status'] = 'running'
        progress.pop('lastError', None)
        progress.pop('lastErrorLog', None)
        progress.pop('watchdogReason', None)
        progress.pop('alertSent', None)
        if progress['nextId'] > progress['rangeEnd']:
            progress['completed'] = True
            progress['status'] = 'done'
        progress['updatedAt'] = now_iso_utc()
        write_json(progress_path, progress)
        update_task_state(task_state_file, 'done' if progress['completed'] else 'running', task=task_name, alert_scope='owner', current_step='range_complete' if progress['completed'] else 'published_one', last_ok_step=f'published_{next_id:03d}', note=post_url or range_note, user_notified=progress.get('finalNotified', False))
        if progress['completed']:
            send_completion_notice(progress_path, progress)
        return

    progress['failureCount'] = int(progress.get('failureCount', 0)) + 1
    progress['stallCount'] = int(progress.get('stallCount', 0)) + 1
    progress['stalled'] = True
    progress['status'] = 'blocked'
    progress['lastError'] = f'publish_failed:{next_id:03d}'
    progress['lastErrorLog'] = str(log_file)
    progress['updatedAt'] = now_iso_utc()
    write_json(progress_path, progress)

    first_line = ''
    for line in reversed(log_text.splitlines()):
        line = line.strip()
        if line:
            first_line = line[:400]
            break
    update_task_state(task_state_file, 'blocked', task=task_name, alert_scope='owner', current_step=f'publish_{next_id:03d}', last_ok_step=f"published_{progress.get('lastPublishedId', progress['rangeStart'] - 1):03d}", error=progress['lastError'], next_action='inspect log and decide whether safe to retry same id', note=first_line or str(log_file), user_notified=False)
    sys.exit(proc.returncode or 1)


if __name__ == '__main__':
    main()
