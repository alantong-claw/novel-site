#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${1:-/home/alantong/ai-work}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DEST_ROOT="${2:-$HOME/clawchan_backups}"
OUT_DIR="$DEST_ROOT/$TIMESTAMP"
ARCHIVE="$DEST_ROOT/clawchan-full-$TIMESTAMP.tar.gz"

mkdir -p "$OUT_DIR"
mkdir -p "$DEST_ROOT"

if [ ! -d "$WORKSPACE" ]; then
  echo "Workspace not found: $WORKSPACE" >&2
  exit 1
fi

echo "Creating full backup from: $WORKSPACE"
echo "Staging to: $OUT_DIR"

# WSL drvfs / Windows-mounted targets can reject owner/group/perms preservation
# and temp-file rename patterns used by plain `-a`, so use a more compatible mode.
rsync -rlD \
  --inplace \
  --no-times \
  --no-perms \
  --no-owner \
  --no-group \
  --exclude 'node_modules/' \
  --exclude '.cache/' \
  --exclude 'dist/' \
  --exclude 'build/' \
  --exclude '.DS_Store' \
  "$WORKSPACE/" "$OUT_DIR/ai-work/"

if [ -d "$WORKSPACE/.git" ]; then
  echo "Git history included."
fi

if [ -d "$WORKSPACE/.secrets" ]; then
  echo "Secrets directory included. Keep this backup private."
fi

tar -czf "$ARCHIVE" -C "$OUT_DIR" ai-work

echo
echo "Full backup complete."
echo "Folder : $OUT_DIR/ai-work"
echo "Archive: $ARCHIVE"
echo "Warning: this backup may contain secrets. Store it securely."
