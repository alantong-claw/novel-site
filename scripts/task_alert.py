#!/usr/bin/env python3
import json
import sys
from pathlib import Path

DEFAULT_TELEGRAM_TARGET = '8707204748'
DEFAULT_SESSION_KEY = f'agent:main:telegram:direct:{DEFAULT_TELEGRAM_TARGET}'
ALERTABLE_STATUSES = {'blocked'}
ALERTABLE_WATCHDOG_REASONS = {'running_timeout', 'done_without_final_delivery'}
SUPPRESS_TASK_PREFIXES = ('pixnet-whisky-',)


def is_suppressed_child_task(task_name: str) -> bool:
    if not task_name.startswith(SUPPRESS_TASK_PREFIXES):
        return False
    suffix = task_name[len('pixnet-whisky-'):]
    parts = suffix.split('-')
    return len(parts) == 1 and parts[0].isdigit()


def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def should_alert(task: dict, path: Path) -> bool:
    task_name = task.get('task') or path.stem
    if task.get('alertSent'):
        return False
    if task.get('user_notified') is True:
        return False
    if is_suppressed_child_task(task_name):
        return False
    if task.get('status') in ALERTABLE_STATUSES:
        return True
    if task.get('watchdog_reason') in ALERTABLE_WATCHDOG_REASONS:
        return True
    return False


def build_message(task: dict, path: Path) -> str:
    task_name = task.get('task') or path.stem
    status = task.get('status', 'unknown')
    last_ok = task.get('last_ok_step') or 'unknown'
    current_step = task.get('current_step') or 'unknown'
    reason = task.get('watchdog_reason') or task.get('error') or task.get('note') or 'unknown'
    next_action = task.get('next_action') or 'inspect task state'
    return (
        f"任務需要注意，已自動提醒。\n\n"
        f"- task: {task_name}\n"
        f"- status: {status}\n"
        f"- last ok: {last_ok}\n"
        f"- current: {current_step}\n"
        f"- reason: {reason}\n"
        f"- next: {next_action}\n"
        f"- state: {path}"
    )


def main():
    if len(sys.argv) < 2:
        print('usage: task_alert.py <task_state.json> [telegramTarget|sessionKey]', file=sys.stderr)
        sys.exit(2)

    state_path = Path(sys.argv[1])
    destination = sys.argv[2] if len(sys.argv) >= 3 else DEFAULT_TELEGRAM_TARGET
    task = read_json(state_path)

    session_key = destination if destination.startswith('agent:') else f'agent:main:telegram:direct:{destination}'
    telegram_target = destination.split(':')[-1] if destination.startswith('agent:') else destination

    if not should_alert(task, state_path):
        return

    message = build_message(task, state_path)
    print(json.dumps({
        'sessionKey': session_key,
        'channel': 'telegram',
        'target': telegram_target,
        'message': message,
        'statePath': str(state_path)
    }, ensure_ascii=False))

    task['alertSent'] = True
    write_json(state_path, task)


if __name__ == '__main__':
    main()
