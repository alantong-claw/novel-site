#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
DEST="/mnt/g/ClawChan"
STATE_FILE="$ROOT/memory/backup-state.json"
LOG_FILE="$ROOT/memory/backup-run.log"
TS="$(TZ=Asia/Taipei date '+%Y-%m-%dT%H:%M:%S%z')"

mkdir -p "$ROOT/memory"

if [[ ! -d /mnt/g ]]; then
  printf '{"last_run":"%s","status":"error","reason":"/mnt/g not mounted"}\n' "$TS" > "$STATE_FILE"
  echo "[$TS] backup failed: /mnt/g not mounted" >> "$LOG_FILE"
  exit 1
fi

mkdir -p "$DEST"

set +e
OUTPUT="$(bash "$ROOT/backup_clawchan.sh" "$ROOT" "$DEST" 2>&1)"
CODE=$?
set -e

echo "[$TS] backup exit=$CODE" >> "$LOG_FILE"
printf '%s\n' "$OUTPUT" >> "$LOG_FILE"

if [[ $CODE -ne 0 ]]; then
  ESCAPED_OUTPUT=$(python3 - <<'PY'
import json,sys
print(json.dumps(sys.stdin.read()))
PY
<<< "$OUTPUT")
  printf '{"last_run":"%s","status":"error","destination":"%s","detail":%s}\n' "$TS" "$DEST" "$ESCAPED_OUTPUT" > "$STATE_FILE"
  exit $CODE
fi

LATEST_ARCHIVE="$(ls -1t "$DEST"/clawchan-full-*.tar.gz 2>/dev/null | head -n 1 || true)"
SIZE=0
if [[ -n "$LATEST_ARCHIVE" && -f "$LATEST_ARCHIVE" ]]; then
  SIZE="$(stat -c %s "$LATEST_ARCHIVE")"
fi

# Retention: keep latest 5 full backup archives, remove older ones.
mapfile -t OLD_BACKUPS < <(ls -1t "$DEST"/clawchan-full-*.tar.gz 2>/dev/null | tail -n +6 || true)
for f in "${OLD_BACKUPS[@]}"; do
  rm -f "$f"
done

# Retention: keep only the newest staged directory, remove older timestamped folders.
mapfile -t STAGED_DIRS < <(find "$DEST" -mindepth 1 -maxdepth 1 -type d -regextype posix-extended -regex '.*/[0-9]{8}-[0-9]{6}' | sort -r || true)
LATEST_STAGED_DIR="${STAGED_DIRS[0]:-}"
if (( ${#STAGED_DIRS[@]} > 1 )); then
  for d in "${STAGED_DIRS[@]:1}"; do
    rm -rf "$d"
  done
fi

printf '{"last_run":"%s","status":"ok","destination":"%s","latest_archive":"%s","latest_size":%s,"latest_directory":"%s","retention":"keep_latest_5_archives_and_latest_1_directory"}\n' "$TS" "$DEST" "$LATEST_ARCHIVE" "$SIZE" "$LATEST_STAGED_DIR" > "$STATE_FILE"

echo "[$TS] backup ok latest=$LATEST_ARCHIVE size=$SIZE latest_dir=$LATEST_STAGED_DIR" >> "$LOG_FILE"
