#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3110}"
LOG_DIR="$ROOT_DIR/runtime"
VOICE_PID_FILE="$LOG_DIR/voice_proto.pid"
TUNNEL_PID_FILE="$LOG_DIR/cloudflared.pid"
TUNNEL_LOG="$LOG_DIR/cloudflared.log"

pid_is_alive() {
  local pid_file="$1"
  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" >/dev/null 2>&1; then
      return 0
    fi
  fi
  return 1
}

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
    echo "$label: no pid file"
  fi
}

show_pid "voice_proto" "$VOICE_PID_FILE"
show_pid "cloudflared" "$TUNNEL_PID_FILE"

echo "health:"
if curl -fsS "http://127.0.0.1:$PORT/api/health" 2>/dev/null; then
  echo
  echo "voice_proto: responding on port $PORT"
else
  echo "not reachable on port $PORT"
fi

echo
if pid_is_alive "$TUNNEL_PID_FILE"; then
  echo "cloudflared live URL:"
  grep -Eo 'https://[-a-zA-Z0-9]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -n 1 || echo "(URL not detected yet)"
else
  echo "cloudflared live URL: (not running)"
fi
