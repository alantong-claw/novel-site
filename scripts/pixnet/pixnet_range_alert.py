#!/usr/bin/env python3
import json
import sys
from pathlib import Path

ROOT = Path('/home/alantong/ai-work')
DEFAULT_TELEGRAM_TARGET = '8707204748'
DEFAULT_SESSION_KEY = f'agent:main:telegram:direct:{DEFAULT_TELEGRAM_TARGET}'


def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def build_blocked_message(progress: dict) -> str:
    task = progress.get('taskName') or f"pixnet-whisky-{progress['rangeStart']:03d}-{progress['rangeEnd']:03d}"
    next_id = progress.get('nextId')
    last_id = progress.get('lastPublishedId')
    reason = progress.get('watchdogReason') or progress.get('lastError') or 'unknown'
    log_path = progress.get('lastErrorLog', '')
    return (
        f"PIXNET 發文卡住了，已自動標記 blocked。\n\n"
        f"- task: {task}\n"
        f"- 範圍: {progress.get('rangeStart')}-{progress.get('rangeEnd')}\n"
        f"- 已發到: {last_id}\n"
        f"- 下一篇: {next_id}\n"
        f"- 原因: {reason}\n"
        f"- log: {log_path or 'n/a'}"
    )


def build_complete_message(progress: dict) -> str:
    task = progress.get('taskName') or f"pixnet-whisky-{progress['rangeStart']:03d}-{progress['rangeEnd']:03d}"
    return (
        f"PIXNET 發文已完成。\n\n"
        f"- task: {task}\n"
        f"- 範圍: {progress.get('rangeStart')}-{progress.get('rangeEnd')}\n"
        f"- 最後完成: {progress.get('lastPublishedId')}\n"
        f"- 最後文章: {progress.get('lastPublishedUrl') or 'n/a'}"
    )


def main():
    if len(sys.argv) < 2:
        print('usage: pixnet_range_alert.py <progress.json> [telegramTarget|sessionKey]', file=sys.stderr)
        sys.exit(2)

    progress_path = Path(sys.argv[1])
    destination = sys.argv[2] if len(sys.argv) >= 3 else DEFAULT_TELEGRAM_TARGET
    progress = read_json(progress_path)

    session_key = destination if destination.startswith('agent:') else f'agent:main:telegram:direct:{destination}'
    telegram_target = destination.split(':')[-1] if destination.startswith('agent:') else destination

    if progress.get('completed'):
        if progress.get('finalNotified'):
            return
        message = build_complete_message(progress)
        print(json.dumps({
            'sessionKey': session_key,
            'channel': 'telegram',
            'target': telegram_target,
            'message': message,
            'progressPath': str(progress_path),
            'kind': 'complete'
        }, ensure_ascii=False))
        return

    if progress.get('alertSent'):
        return
    if progress.get('status') != 'blocked' and not progress.get('stalled'):
        return

    message = build_blocked_message(progress)
    print(json.dumps({
        'sessionKey': session_key,
        'channel': 'telegram',
        'target': telegram_target,
        'message': message,
        'progressPath': str(progress_path),
        'kind': 'blocked'
    }, ensure_ascii=False))

    progress['alertSent'] = True
    write_json(progress_path, progress)


if __name__ == '__main__':
    main()
