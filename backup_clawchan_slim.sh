#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${1:-/home/alantong/ai-work}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DEST_ROOT="${2:-$HOME/clawchan_backups_slim}"
OUT_DIR="$DEST_ROOT/$TIMESTAMP"
ARCHIVE="$DEST_ROOT/clawchan-slim-$TIMESTAMP.tar.gz"

mkdir -p "$OUT_DIR"
mkdir -p "$DEST_ROOT"

if [ ! -d "$WORKSPACE" ]; then
  echo "Workspace not found: $WORKSPACE" >&2
  exit 1
fi

echo "Creating slim backup from: $WORKSPACE"
echo "Staging to: $OUT_DIR"

rsync -rlD \
  --inplace \
  --no-times \
  --no-perms \
  --no-owner \
  --no-group \
  --exclude '.git/' \
  --exclude 'venv/' \
  --exclude '.venv/' \
  --exclude '.venv-ppt/' \
  --exclude 'tmp/' \
  --exclude 'work_tmp/' \
  --exclude 'node_modules/' \
  --exclude '.cache/' \
  --exclude 'dist/' \
  --exclude 'build/' \
  --exclude '.DS_Store' \
  "$WORKSPACE/" "$OUT_DIR/ai-work-slim/"

tar -czf "$ARCHIVE" -C "$OUT_DIR" ai-work-slim

echo
echo "Slim backup complete."
echo "Folder : $OUT_DIR/ai-work-slim"
echo "Archive: $ARCHIVE"
echo "Excluded: .git, venv, .venv, .venv-ppt, tmp, work_tmp, node_modules, .cache, dist, build"
