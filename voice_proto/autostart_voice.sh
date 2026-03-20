#!/usr/bin/env bash
set -euo pipefail

VOICE_DIR="/home/alantong/ai-work/voice_proto"
AUTOSTART_LOG="$VOICE_DIR/runtime/autostart.log"
mkdir -p "$VOICE_DIR/runtime"

(
  cd "$VOICE_DIR"
  PORT="${PORT:-3110}" ./start_voice.sh
) >>"$AUTOSTART_LOG" 2>&1 &
