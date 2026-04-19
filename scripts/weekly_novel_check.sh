#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
STATE_FILE="$ROOT/memory/novel-progress.json"
NOVEL_DIR="$ROOT/novel_site"
TODAY="$(TZ=Asia/Taipei date +%F)"
DOW="$(TZ=Asia/Taipei date +%u)"

if [[ "$DOW" != "7" ]]; then
  echo "Not Sunday; skipping."
  exit 0
fi

if [[ -f "$STATE_FILE" ]] && grep -q "$TODAY" "$STATE_FILE"; then
  echo "Already handled today."
  exit 0
fi

mkdir -p "$(dirname "$STATE_FILE")"

LATEST_CHAPTER="$(find "$NOVEL_DIR" -maxdepth 1 -type f -name 'chapter-*.html' | sort | tail -n 1 || true)"

if [[ -z "$LATEST_CHAPTER" ]]; then
  printf '{"last_checked":"%s","status":"blocked","reason":"no_chapter_files","detail":"No chapter-*.html exists in novel_site, so weekly next-chapter automation cannot determine the next chapter."}\n' "$TODAY" > "$STATE_FILE"
  echo "Blocked: no existing chapter-*.html files found in $NOVEL_DIR"
  exit 2
fi

printf '{"last_checked":"%s","status":"needs_review","latest_chapter":"%s","detail":"Weekly chapter automation requires manual review/approval before drafting and publishing."}\n' "$TODAY" "$(basename "$LATEST_CHAPTER")" > "$STATE_FILE"

echo "Needs review: latest chapter is $(basename "$LATEST_CHAPTER"). Weekly automation intentionally stops before drafting/publishing."
