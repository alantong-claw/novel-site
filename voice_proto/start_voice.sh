#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3110}"
TELEGRAM_TARGET="${VOICE_TELEGRAM_TARGET:-8707204748}"
LOG_DIR="$ROOT_DIR/runtime"
VOICE_LOG="$LOG_DIR/voice_proto.log"
NGROK_LOG="$LOG_DIR/ngrok.log"
VOICE_PID_FILE="$LOG_DIR/voice_proto.pid"
NGROK_PID_FILE="$LOG_DIR/ngrok.pid"
LAST_NGROK_URL_FILE="$LOG_DIR/last_ngrok_url.txt"

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

get_ngrok_url() {
  curl -fsS http://127.0.0.1:4040/api/tunnels 2>/dev/null | sed -n 's/.*"public_url":"\([^"]*\)".*/\1/p' | head -n 1 || true
}

send_ngrok_url_to_telegram() {
  local url="$1"
  [ -n "$url" ] || return 0

  local previous=""
  if [ -f "$LAST_NGROK_URL_FILE" ]; then
    previous="$(cat "$LAST_NGROK_URL_FILE")"
  fi

  if [ "$previous" = "$url" ]; then
    echo "ngrok URL unchanged; skipping Telegram send."
    return 0
  fi

  local message="ClawChan voice URL: $url"
  if openclaw message send --channel telegram --target "$TELEGRAM_TARGET" --message "$message" >/dev/null 2>&1; then
    printf '%s\n' "$url" > "$LAST_NGROK_URL_FILE"
    echo "Sent ngrok URL to Telegram target $TELEGRAM_TARGET"
  else
    echo "Failed to send ngrok URL to Telegram."
  fi
}

start_ngrok() {
  local ngrok_bin
  if ! ngrok_bin="$(find_ngrok)"; then
    echo "ngrok not found. Skipping tunnel startup."
    return 0
  fi

  if is_running "$NGROK_PID_FILE"; then
    echo "ngrok already running (pid $(cat "$NGROK_PID_FILE"))"
    local existing_url
    existing_url="$(get_ngrok_url)"
    [ -n "$existing_url" ] && echo "ngrok URL: $existing_url"
    send_ngrok_url_to_telegram "$existing_url"
    return 0
  fi

  echo "Starting ngrok for port $PORT ..."
  nohup "$ngrok_bin" http "$PORT" >"$NGROK_LOG" 2>&1 &
  echo $! >"$NGROK_PID_FILE"
  sleep 3

  local url
  url="$(get_ngrok_url)"
  if [ -n "$url" ]; then
    echo "ngrok URL: $url"
    send_ngrok_url_to_telegram "$url"
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
