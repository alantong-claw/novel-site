#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
PYTHON="$ROOT/.venv-ppt/bin/python"
GEN_SCRIPT="$ROOT/excel/scripts/create_test_report.py"
MAIL_SCRIPT="$ROOT/excel/scripts/send_excel_mail.py"
TASK_DIR="$ROOT/work_tmp/tasks/2026-03-22-excel-workflow-test"
XLSX="$TASK_DIR/2026-03-22-excel-workflow-test-v1.xlsx"
TO_ADDR="${1:-alantongsr@gmail.com}"
SUBJECT="Excel 工作模式測試報表"
BODY="Alan，

這是小爪建立好的 Excel 工作模式測試報表。若你收到且可打開，表示之後我可以直接幫你產生並寄送 Excel 附件。

— 小爪"

set -a
source "$ROOT/.secrets/mail.env"
mkdir -p "$TASK_DIR"
OUTPUT_XLSX="$XLSX" "$PYTHON" "$GEN_SCRIPT"
"$PYTHON" "$MAIL_SCRIPT" "$XLSX" "$SUBJECT" "$BODY" "$TO_ADDR"
