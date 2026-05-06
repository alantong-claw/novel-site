#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
DEST="/mnt/g/ClawChan"
STATE_FILE="$ROOT/memory/backup-state.json"
LOG_FILE="$ROOT/memory/backup-run.log"
TS="$(TZ=Asia/Taipei date '+%Y-%m-%dT%H:%M:%S%z')"
DAY_OF_MONTH="$(TZ=Asia/Taipei date '+%d')"
DAY_OF_WEEK="$(TZ=Asia/Taipei date '+%u')"
MODE="slim"
BACKUP_CMD=(bash "$ROOT/backup_clawchan_slim.sh" "$ROOT" "$DEST")
ARCHIVE_GLOB='clawchan-slim-*.tar.gz'
KEEP_ARCHIVES=5
KEEP_DIRECTORY=0

mkdir -p "$ROOT/memory"

if [[ ! -d /mnt/g ]]; then
  printf '{"last_run":"%s","status":"error","reason":"/mnt/g not mounted"}\n' "$TS" > "$STATE_FILE"
  echo "[$TS] backup failed: /mnt/g not mounted" >> "$LOG_FILE"
  exit 1
fi

mkdir -p "$DEST"

if [[ "$DAY_OF_WEEK" == "7" && "$DAY_OF_MONTH" -le 07 ]]; then
  MODE="full"
  BACKUP_CMD=(bash "$ROOT/backup_clawchan.sh" "$ROOT" "$DEST")
  ARCHIVE_GLOB='clawchan-full-*.tar.gz'
  KEEP_ARCHIVES=5
  KEEP_DIRECTORY=1
fi

set +e
OUTPUT="$("${BACKUP_CMD[@]}" 2>&1)"
CODE=$?
set -e

echo "[$TS] backup mode=$MODE exit=$CODE" >> "$LOG_FILE"
printf '%s\n' "$OUTPUT" >> "$LOG_FILE"

if [[ $CODE -ne 0 ]]; then
  ESCAPED_OUTPUT=$(python3 - <<'PY'
import json,sys
print(json.dumps(sys.stdin.read()))
PY
<<< "$OUTPUT")
  printf '{"last_run":"%s","status":"error","mode":"%s","destination":"%s","detail":%s}\n' "$TS" "$MODE" "$DEST" "$ESCAPED_OUTPUT" > "$STATE_FILE"
  exit $CODE
fi

LATEST_ARCHIVE="$(ls -1t "$DEST"/$ARCHIVE_GLOB 2>/dev/null | head -n 1 || true)"
SIZE=0
if [[ -n "$LATEST_ARCHIVE" && -f "$LATEST_ARCHIVE" ]]; then
  SIZE="$(stat -c %s "$LATEST_ARCHIVE")"
fi

mapfile -t OLD_ARCHIVES < <(ls -1t "$DEST"/$ARCHIVE_GLOB 2>/dev/null | tail -n +$((KEEP_ARCHIVES + 1)) || true)
for f in "${OLD_ARCHIVES[@]}"; do
  rm -f "$f"
done

mapfile -t STAGED_DIRS < <(find "$DEST" -mindepth 1 -maxdepth 1 -type d -regextype posix-extended -regex '.*/[0-9]{8}-[0-9]{6}' | sort -r || true)
LATEST_STAGED_DIR=""
if [[ "$KEEP_DIRECTORY" -eq 1 ]]; then
  LATEST_STAGED_DIR="${STAGED_DIRS[0]:-}"
  if (( ${#STAGED_DIRS[@]} > 1 )); then
    for d in "${STAGED_DIRS[@]:1}"; do
      rm -rf "$d"
    done
  fi
else
  if (( ${#STAGED_DIRS[@]} > 0 )); then
    for d in "${STAGED_DIRS[@]}"; do
      rm -rf "$d"
    done
  fi
fi

printf '{"last_run":"%s","status":"ok","mode":"%s","destination":"%s","latest_archive":"%s","latest_size":%s,"latest_directory":"%s","retention":"keep_latest_5_matching_archives","directory_policy":"%s"}\n' \
  "$TS" "$MODE" "$DEST" "$LATEST_ARCHIVE" "$SIZE" "$LATEST_STAGED_DIR" \
  "$( [[ "$KEEP_DIRECTORY" -eq 1 ]] && echo keep_latest_1_monthly_full_directory || echo remove_all_staged_directories )" > "$STATE_FILE"

echo "[$TS] backup ok mode=$MODE latest=$LATEST_ARCHIVE size=$SIZE latest_dir=$LATEST_STAGED_DIR" >> "$LOG_FILE"
