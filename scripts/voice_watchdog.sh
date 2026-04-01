#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
HEALTH_URL="http://127.0.0.1:3110/api/health"
LOG="$ROOT/voice_proto/runtime/voice_watchdog.log"

mkdir -p "$(dirname "$LOG")"

if ! curl -fsS "$HEALTH_URL" | grep -q '"ok":true'; then
  echo "[$(TZ=Asia/Taipei date '+%F %T')] voice health failed; restarting" >> "$LOG"
  "$ROOT/voice_proto/start_voice.sh" >> "$LOG" 2>&1 || true
else
  echo "[$(TZ=Asia/Taipei date '+%F %T')] voice health ok" >> "$LOG"
fi
