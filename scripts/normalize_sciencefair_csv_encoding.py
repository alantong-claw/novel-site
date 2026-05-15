#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path('/home/alantong/ai-work')
TARGETS = [
    ROOT / 'research' / 'sciencefair66_results.csv',
    ROOT / 'research' / 'sciencefair66_unfinished_next_round.csv',
    ROOT / 'research' / 'sciencefair66_rerun_county_status_2026-05-15.csv',
    ROOT / 'research' / 'sciencefair66_results_utf8bom_2026-05-15.csv',
    ROOT / 'research' / 'sciencefair66_junior_earth_science_2026-05-15.csv',
]
TARGET_GLOBS = [
    ROOT / 'research' / 'sciencefair66_snapshots' / '*.csv',
    ROOT / 'research' / 'sciencefair66_workers' / '*_rows.csv',
]


def iter_targets() -> list[Path]:
    seen: set[Path] = set()
    files: list[Path] = []
    for path in TARGETS:
        if path.exists() and path not in seen:
            seen.add(path)
            files.append(path)
    for pattern in TARGET_GLOBS:
        for path in sorted(pattern.parent.glob(pattern.name)):
            if path.is_file() and path not in seen:
                seen.add(path)
                files.append(path)
    return files


def normalize_to_utf8_bom(path: Path) -> bool:
    raw = path.read_bytes()
    text = raw.decode('utf-8-sig')
    normalized = text.replace('\r\n', '\n').replace('\r', '\n').replace('\n', '\r\n')
    out = normalized.encode('utf-8-sig')
    if raw == out:
        return False
    path.write_bytes(out)
    return True


def main() -> None:
    changed = []
    unchanged = []
    for path in iter_targets():
        if normalize_to_utf8_bom(path):
            changed.append(path)
        else:
            unchanged.append(path)
    print('changed:')
    for path in changed:
        print(path)
    print('unchanged:')
    for path in unchanged:
        print(path)


if __name__ == '__main__':
    main()
