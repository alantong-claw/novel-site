#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
NOVEL_DIR="$ROOT/novel_site"
STATE_FILE="$ROOT/memory/novel-progress.json"
REVIEW_DIR="$ROOT/memory/novel-review"
TODAY="$(TZ=Asia/Taipei date +%F)"
DOW="$(TZ=Asia/Taipei date +%u)"

if [[ "$DOW" != "7" ]]; then
  echo "Not Sunday; skipping."
  exit 0
fi

mkdir -p "$ROOT/memory" "$REVIEW_DIR"

if [[ -f "$STATE_FILE" ]] && grep -q "\"date\":\"$TODAY\"" "$STATE_FILE"; then
  echo "Already tracked today."
  exit 0
fi

latest_num="$(find "$NOVEL_DIR" -maxdepth 1 -type f -regextype posix-extended -regex '.*/chapter[0-9]+\.html' -printf '%f\n' | sed -E 's/^chapter([0-9]+)\.html$/\1/' | sort -n | tail -n 1)"

if [[ -z "$latest_num" ]]; then
  printf '{"date":"%s","status":"blocked","reason":"no_chapter_files","detail":"No chapterN.html exists in novel_site."}\n' "$TODAY" > "$STATE_FILE"
  echo "Blocked: no chapterN.html files found in $NOVEL_DIR"
  exit 2
fi

next_num=$((latest_num + 1))
review_file="$REVIEW_DIR/$TODAY-chapter$next_num-draft.md"
summary_file="$REVIEW_DIR/$TODAY-chapter$next_num-summary.txt"

printf '{"date":"%s","status":"needs_draft","latest_chapter":"chapter%s.html","next_chapter":"chapter%s.html","review_file":"%s","summary_file":"%s"}\n' \
  "$TODAY" "$latest_num" "$next_num" "$review_file" "$summary_file" > "$STATE_FILE"

echo "Needs draft: latest is chapter$latest_num.html, next is chapter$next_num.html"
