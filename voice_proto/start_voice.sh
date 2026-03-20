#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3110}"
TELEGRAM_TARGET="${VOICE_TELEGRAM_TARGET:-8707204748}"
LOG_DIR="$ROOT_DIR/runtime"
VOICE_LOG="$LOG_DIR/voice_proto.log"
TUNNEL_LOG="$LOG_DIR/cloudflared.log"
VOICE_PID_FILE="$LOG_DIR/voice_proto.pid"
TUNNEL_PID_FILE="$LOG_DIR/cloudflared.pid"
LAST_TUNNEL_URL_FILE="$LOG_DIR/last_tunnel_url.txt"

mkdir -p "$LOG_DIR"

find_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    command -v cloudflared
    return 0
  fi

  local candidates=(
    "$HOME/bin/cloudflared"
    "$HOME/.local/bin/cloudflared"
    "/usr/local/bin/cloudflared"
    "/usr/bin/cloudflared"
    "/mnt/c/Program Files/Cloudflare/Cloudflared/cloudflared.exe"
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

extract_cloudflared_url() {
  grep -Eo 'https://[-a-zA-Z0-9]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -n 1 || true
}

send_tunnel_url_to_telegram() {
  local url="$1"
  [ -n "$url" ] || return 0

  local previous=""
  if [ -f "$LAST_TUNNEL_URL_FILE" ]; then
    previous="$(cat "$LAST_TUNNEL_URL_FILE")"
  fi

  if [ "$previous" = "$url" ]; then
    echo "cloudflared URL unchanged; skipping Telegram send."
    return 0
  fi

  local message="ClawChan voice URL: $url"
  if openclaw message send --channel telegram --target "$TELEGRAM_TARGET" --message "$message" >/dev/null 2>&1; then
    printf '%s\n' "$url" > "$LAST_TUNNEL_URL_FILE"
    echo "Sent cloudflared URL to Telegram target $TELEGRAM_TARGET"
  else
    echo "Failed to send cloudflared URL to Telegram."
  fi
}

start_tunnel() {
  local cloudflared_bin
  if ! cloudflared_bin="$(find_cloudflared)"; then
    echo "cloudflared not found. Skipping tunnel startup."
    return 0
  fi

  if is_running "$TUNNEL_PID_FILE"; then
    echo "cloudflared already running (pid $(cat "$TUNNEL_PID_FILE"))"
    local existing_url
    existing_url="$(extract_cloudflared_url)"
    [ -n "$existing_url" ] && echo "cloudflared URL: $existing_url"
    send_tunnel_url_to_telegram "$existing_url"
    return 0
  fi

  : > "$TUNNEL_LOG"
  echo "Starting cloudflared for port $PORT ..."
  nohup "$cloudflared_bin" tunnel --url "http://127.0.0.1:$PORT" >"$TUNNEL_LOG" 2>&1 &
  echo $! >"$TUNNEL_PID_FILE"

  local url=""
  for _ in $(seq 1 15); do
    sleep 1
    url="$(extract_cloudflared_url)"
    [ -n "$url" ] && break
  done

  if [ -n "$url" ]; then
    echo "cloudflared URL: $url"
    send_tunnel_url_to_telegram "$url"
  else
    echo "cloudflared started, but tunnel URL was not detected yet. Check: $TUNNEL_LOG"
  fi
}

start_voice
start_tunnel

echo
echo "Done."
echo "Local:  http://127.0.0.1:$PORT"
echo "Health: http://127.0.0.1:$PORT/api/health"
