#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3110}"
LOG_DIR="$ROOT_DIR/runtime"
VOICE_PID_FILE="$LOG_DIR/voice_proto.pid"
NGROK_PID_FILE="$LOG_DIR/ngrok.pid"

show_pid() {
  local label="$1"
  local pid_file="$2"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" >/dev/null 2>&1; then
      echo "$label: running (pid $pid)"
    else
      echo "$label: stale pid file ($pid)"
    fi
  else
    echo "$label: stopped"
  fi
}

show_pid "voice_proto" "$VOICE_PID_FILE"
show_pid "ngrok" "$NGROK_PID_FILE"

echo "health:"
curl -fsS "http://127.0.0.1:$PORT/api/health" 2>/dev/null || echo "not reachable on port $PORT"

echo
if curl -fsS http://127.0.0.1:4040/api/tunnels >/dev/null 2>&1; then
  echo "ngrok tunnels:"
  curl -fsS http://127.0.0.1:4040/api/tunnels | sed -n 's/.*"public_url":"\([^"]*\)".*/\1/p'
fi
