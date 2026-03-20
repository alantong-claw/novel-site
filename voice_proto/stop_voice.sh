#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/runtime"
VOICE_PID_FILE="$LOG_DIR/voice_proto.pid"
TUNNEL_PID_FILE="$LOG_DIR/cloudflared.pid"

stop_pid() {
  local label="$1"
  local pid_file="$2"

  if [ ! -f "$pid_file" ]; then
    echo "$label not running (no pid file)"
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"
  if kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid"
    echo "Stopped $label (pid $pid)"
  else
    echo "$label not running (stale pid $pid)"
  fi
  rm -f "$pid_file"
}

stop_pid "cloudflared" "$TUNNEL_PID_FILE"
stop_pid "voice_proto" "$VOICE_PID_FILE"
