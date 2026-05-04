#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
PYTHON="$ROOT/.venv-ppt/bin/python"
GEN_SCRIPT="$ROOT/excel/scripts/create_edge_ai_tv_report_xlsx.py"
MAIL_SCRIPT="$ROOT/excel/scripts/send_excel_mail.py"
TASK_DIR="$ROOT/work_tmp/tasks/2026-03-22-edge-ai-tv-openclaw-report"
XLSX="$TASK_DIR/2026-03-22-edge-ai-tv-openclaw-report-v1.xlsx"
TO_ADDR="${1:-alantongsr@gmail.com}"
SUBJECT="15 TOPS Edge AI + TV 控制 + OpenClaw 研究報表（Excel）"
BODY="Alan，

這是根據同一題研究整理出的 Excel 報表版。

— 小爪"

set -a
source "$ROOT/.secrets/mail.env"
mkdir -p "$TASK_DIR"
OUTPUT_XLSX="$XLSX" "$PYTHON" "$GEN_SCRIPT"
"$PYTHON" "$MAIL_SCRIPT" "$XLSX" "$SUBJECT" "$BODY" "$TO_ADDR"
