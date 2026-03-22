#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
NOVEL_DIR="$ROOT/novel_site"
STATE_DIR="$ROOT/memory"
STATE_FILE="$STATE_DIR/novel-progress.json"
TODAY="$(TZ=Asia/Taipei date +%F)"
DOW="$(TZ=Asia/Taipei date +%u)"   # 1=Mon ... 7=Sun
HOUR="$(TZ=Asia/Taipei date +%H)"

mkdir -p "$STATE_DIR"

# Only operate on Sunday from 08:00 onwards.
if [[ "$DOW" != "7" ]]; then
  echo "Not Sunday; skipping."
  exit 0
fi
if (( 10#$HOUR < 8 )); then
  echo "Before 08:00; skipping."
  exit 0
fi

# If chapter already written today, skip.
if [[ -f "$STATE_FILE" ]] && grep -q "$TODAY" "$STATE_FILE"; then
  echo "Weekly chapter already handled today; skipping."
  exit 0
fi

MESSAGE="Today is Sunday after 08:00 Asia/Taipei. Check whether a novel chapter for the current Sunday-Saturday week already exists in /home/alantong/ai-work/novel_site. If missing, draft the next chapter, save it in novel_site, update index.html, then commit and push inside the novel_site git repo. If a chapter for this week already exists, do nothing except report that it is already done. After successful handling, write today's date ($TODAY) into /home/alantong/ai-work/memory/novel-progress.json as the last_run date."

openclaw agent --message "$MESSAGE" --json >/tmp/weekly_novel_check.json
printf '{"last_run":"%s"}\n' "$TODAY" > "$STATE_FILE"
echo "Handled weekly novel check for $TODAY"
