#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
PYTHON="$ROOT/.venv-ppt/bin/python"
TEXT="$ROOT/research/tv-edge-15tops-market-study-2026-03-23-zh.md"
PPT_GEN="$ROOT/slides/scripts/create_tv_edge_15tops_market_ppt.py"
XLSX_GEN="$ROOT/excel/scripts/create_tv_edge_15tops_market_xlsx.py"
TEXT_MAIL="$ROOT/scripts/send_text_report_mail.py"
PPT_MAIL="$ROOT/slides/scripts/send_ppt_mail.py"
XLSX_MAIL="$ROOT/excel/scripts/send_excel_mail.py"
TASK_DIR="$ROOT/work_tmp/tasks/2026-03-23-tv-edge-15tops-market"
PPT="$TASK_DIR/2026-03-23-tv-edge-15tops-market-v3-tech.pptx"
XLSX="$TASK_DIR/2026-03-23-tv-edge-15tops-market-v1.xlsx"
TO1="${1:-alantongsr@gmail.com}"
TO2="${2:-}"

set -a
source "$ROOT/.secrets/mail.env"

mkdir -p "$TASK_DIR"
OUTPUT_PPT="$PPT" "$PYTHON" "$PPT_GEN"
OUTPUT_XLSX="$XLSX" "$PYTHON" "$XLSX_GEN"

"$PYTHON" "$TEXT_MAIL" "$TEXT" "研究報告：15 TOPS TV Edge Chip 市場推廣（文字版）" $'Alan，\n\n附上完整文字研究報告。\n\n— 小爪' "$TO1"
if [[ -n "$TO2" ]]; then
  "$PYTHON" "$TEXT_MAIL" "$TEXT" "研究報告：15 TOPS TV Edge Chip 市場推廣（文字版）" $'Alan，\n\n附上完整文字研究報告。\n\n— 小爪' "$TO2"
fi
"$PYTHON" "$PPT_MAIL" "$PPT" "研究報告：15 TOPS TV Edge Chip 市場推廣（簡報版）" $'Alan，\n\n附上 PowerPoint 簡報版。\n\n— 小爪' "$TO1"
if [[ -n "$TO2" ]]; then
  "$PYTHON" "$PPT_MAIL" "$PPT" "研究報告：15 TOPS TV Edge Chip 市場推廣（簡報版）" $'Alan，\n\n附上 PowerPoint 簡報版。\n\n— 小爪' "$TO2"
fi
"$PYTHON" "$XLSX_MAIL" "$XLSX" "研究報告：15 TOPS TV Edge Chip 市場推廣（Excel 重點表）" $'Alan，\n\n附上 Excel 重點表。\n\n— 小爪' "$TO1"
if [[ -n "$TO2" ]]; then
  "$PYTHON" "$XLSX_MAIL" "$XLSX" "研究報告：15 TOPS TV Edge Chip 市場推廣（Excel 重點表）" $'Alan，\n\n附上 Excel 重點表。\n\n— 小爪' "$TO2"
fi

echo "text, ppt, xlsx sent"
