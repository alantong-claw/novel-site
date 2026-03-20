#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3110}"
LOG_DIR="$ROOT_DIR/runtime"
VOICE_LOG="$LOG_DIR/voice_proto.log"
NGROK_LOG="$LOG_DIR/ngrok.log"
VOICE_PID_FILE="$LOG_DIR/voice_proto.pid"
NGROK_PID_FILE="$LOG_DIR/ngrok.pid"

mkdir -p "$LOG_DIR"

find_ngrok() {
  if command -v ngrok >/dev/null 2>&1; then
    command -v ngrok
    return 0
  fi

  local candidates=(
    "$HOME/bin/ngrok"
    "$HOME/.local/bin/ngrok"
    "/usr/local/bin/ngrok"
    "/mnt/c/ProgramData/chocolatey/bin/ngrok.exe"
    "/mnt/c/Users/$USER/AppData/Local/ngrok/ngrok.exe"
  )

  for candidate in "${candidates[@]}"; do
    if [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

is_running() {
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

port_responding() {
  curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1
}

start_voice() {
  if is_running "$VOICE_PID_FILE"; then
    echo "voice_proto already running (pid $(cat "$VOICE_PID_FILE"))"
    return 0
  fi

  if port_responding; then
    echo "voice_proto already responding on port $PORT (no pid file)."
    return 0
  fi

  echo "Starting voice_proto on port $PORT ..."
  (
    cd "$ROOT_DIR"
    PORT="$PORT" nohup npm start >"$VOICE_LOG" 2>&1 &
    echo $! >"$VOICE_PID_FILE"
  )

  sleep 2
  echo "voice_proto log: $VOICE_LOG"
  curl -fsS "http://127.0.0.1:$PORT/api/health" || {
    echo "voice_proto health check failed. Check: $VOICE_LOG"
    exit 1
  }
  echo
}

start_ngrok() {
  local ngrok_bin
  if ! ngrok_bin="$(find_ngrok)"; then
    echo "ngrok not found. Skipping tunnel startup."
    return 0
  fi

  if is_running "$NGROK_PID_FILE"; then
    echo "ngrok already running (pid $(cat "$NGROK_PID_FILE"))"
    return 0
  fi

  echo "Starting ngrok for port $PORT ..."
  nohup "$ngrok_bin" http "$PORT" >"$NGROK_LOG" 2>&1 &
  echo $! >"$NGROK_PID_FILE"
  sleep 3

  local url
  url="$(curl -fsS http://127.0.0.1:4040/api/tunnels 2>/dev/null | sed -n 's/.*"public_url":"\([^"]*\)".*/\1/p' | head -n 1 || true)"
  if [ -n "$url" ]; then
    echo "ngrok URL: $url"
  else
    echo "ngrok started, but tunnel URL was not detected yet. Check: $NGROK_LOG"
  fi
}

start_voice
start_ngrok

echo
echo "Done."
echo "Local:  http://127.0.0.1:$PORT"
echo "Health: http://127.0.0.1:$PORT/api/health"
