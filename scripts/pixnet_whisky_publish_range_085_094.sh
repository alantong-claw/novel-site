#!/usr/bin/env bash
set -euo pipefail

ROOT=/home/alantong/ai-work
PROGRESS="$ROOT/memory/pixnet-whisky-085-094-progress.json"
python3 "$ROOT/scripts/pixnet/pixnet_range_runner.py" "$PROGRESS"
