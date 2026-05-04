#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
PYTHON="$ROOT/.venv-ppt/bin/python"
GEN_SCRIPT="$ROOT/slides/scripts/create_edge_ai_tv_report.py"
MAIL_SCRIPT="$ROOT/slides/scripts/send_ppt_mail.py"
TASK_DIR="$ROOT/work_tmp/tasks/2026-03-22-edge-ai-tv-openclaw-report"
PPT="$TASK_DIR/2026-03-22-edge-ai-tv-openclaw-report-v1.pptx"
TO_ADDR="${1:-alantongsr@gmail.com}"
SUBJECT="15 TOPS Edge AI + TV 控制 + OpenClaw 研究簡報"
BODY="Alan，

這是根據昨天研究整理出的 PowerPoint 簡報版。

— 小爪"

set -a
source "$ROOT/.secrets/mail.env"

mkdir -p "$TASK_DIR"
OUTPUT_PPT="$PPT" "$PYTHON" "$GEN_SCRIPT"
"$PYTHON" "$MAIL_SCRIPT" "$PPT" "$SUBJECT" "$BODY" "$TO_ADDR"
