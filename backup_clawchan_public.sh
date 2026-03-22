#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${1:-/home/alantong/ai-work}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DEST_ROOT="${2:-$HOME/clawchan_backups_public}"
OUT_DIR="$DEST_ROOT/$TIMESTAMP"
ARCHIVE="$DEST_ROOT/clawchan-public-$TIMESTAMP.tar.gz"

mkdir -p "$OUT_DIR"
mkdir -p "$DEST_ROOT"

if [ ! -d "$WORKSPACE" ]; then
  echo "Workspace not found: $WORKSPACE" >&2
  exit 1
fi

echo "Creating public-safe backup from: $WORKSPACE"
echo "Staging to: $OUT_DIR"

rsync -a \
  --exclude '.secrets/' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude '.cache/' \
  --exclude 'dist/' \
  --exclude 'build/' \
  --exclude '.DS_Store' \
  "$WORKSPACE/" "$OUT_DIR/ai-work-public/"

tar -czf "$ARCHIVE" -C "$OUT_DIR" ai-work-public

echo
echo "Public-safe backup complete."
echo "Folder : $OUT_DIR/ai-work-public"
echo "Archive: $ARCHIVE"
echo "Secrets, .env files, and .git history were excluded."
