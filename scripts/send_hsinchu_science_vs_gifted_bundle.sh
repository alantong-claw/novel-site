#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
PYTHON="$ROOT/.venv-ppt/bin/python"
PPT_GEN="$ROOT/slides/scripts/create_hsinchu_science_vs_gifted_ppt.py"
XLSX_GEN="$ROOT/excel/scripts/create_hsinchu_science_vs_gifted_xlsx.py"
PPT_MAIL="$ROOT/slides/scripts/send_ppt_mail.py"
XLSX_MAIL="$ROOT/excel/scripts/send_excel_mail.py"
PPT="$ROOT/slides/generated/2026-03-22-hsinchu-science-vs-gifted-v1.pptx"
XLSX="$ROOT/excel/generated/2026-03-22-hsinchu-science-vs-gifted-v1.xlsx"
TO_ADDR="${1:-alantongsr@gmail.com}"

set -a
source "$ROOT/.secrets/mail.env"

"$PYTHON" "$PPT_GEN"
"$PYTHON" "$XLSX_GEN"
"$PYTHON" "$PPT_MAIL" "$PPT" "新竹實驗高中科學班 vs 資優班（簡報版）" $'Alan，\n\n這是整理後的 PowerPoint 簡報版。\n\n— 小爪' "$TO_ADDR"
"$PYTHON" "$XLSX_MAIL" "$XLSX" "新竹實驗高中科學班 vs 資優班（Excel 比較表）" $'Alan，\n\n這是整理後的 Excel 重點比較表。\n\n— 小爪' "$TO_ADDR"

echo "ppt and xlsx sent"
