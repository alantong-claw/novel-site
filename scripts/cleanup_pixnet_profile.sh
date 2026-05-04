#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="${PIXNET_WORKDIR:-/home/alantong/ai-work/work_tmp/pixnet-playwright-test}"
PROFILE_DIR="$BASE_DIR/pixnet-user-data"
ARCHIVE_DIR="$BASE_DIR/profile-archive"
STAMP="$(date +%Y%m%d-%H%M%S)"
KEEP_ARCHIVES="${1:-1}"

mkdir -p "$ARCHIVE_DIR"

if [ ! -d "$PROFILE_DIR" ]; then
  echo "No profile dir: $PROFILE_DIR"
  exit 0
fi

if [ -e "$BASE_DIR/SingletonLock" ] || [ -e "$PROFILE_DIR/SingletonLock" ]; then
  echo "Profile appears in use, aborting to avoid corruption."
  exit 1
fi

TMP_ARCHIVE="$ARCHIVE_DIR/pixnet-user-data-$STAMP"
rm -rf "$TMP_ARCHIVE"
mv "$PROFILE_DIR" "$TMP_ARCHIVE"
mkdir -p "$PROFILE_DIR"

find "$ARCHIVE_DIR" -maxdepth 1 -mindepth 1 -type d -name 'pixnet-user-data-*' | sort | head -n -"$KEEP_ARCHIVES" 2>/dev/null | xargs -r rm -rf

echo "Archived current profile to: $TMP_ARCHIVE"
echo "Created fresh profile dir: $PROFILE_DIR"
echo "Kept latest $KEEP_ARCHIVES archive(s) under: $ARCHIVE_DIR"
