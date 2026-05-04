#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
PYTHON="$ROOT/.venv-ppt/bin/python"
TEXT="$ROOT/research/digital-ic-ai-adoption-2026-03-23-zh.md"
PPT_GEN="$ROOT/slides/scripts/create_digital_ic_ai_adoption_ppt.py"
XLSX_GEN="$ROOT/excel/scripts/create_digital_ic_ai_adoption_xlsx.py"
PPT_MAIL="$ROOT/slides/scripts/send_ppt_mail.py"
XLSX_MAIL="$ROOT/excel/scripts/send_excel_mail.py"
TASK_DIR="$ROOT/work_tmp/tasks/2026-03-23-digital-ic-ai-adoption"
PPT="$TASK_DIR/2026-03-23-digital-ic-ai-adoption-v1.pptx"
XLSX="$TASK_DIR/2026-03-23-digital-ic-ai-adoption-v1.xlsx"
TO1="${1:-alantongsr@gmail.com}"
TO2="${2:-}"

set -a
source "$ROOT/.secrets/mail.env"

mkdir -p "$TASK_DIR"
OUTPUT_PPT="$PPT" "$PYTHON" "$PPT_GEN"
OUTPUT_XLSX="$XLSX" "$PYTHON" "$XLSX_GEN"

SUBJECT_TEXT="研究報告：如何推廣數位 IC 設計工程師使用 AI 輔助工作（文字版）"
BODY_TEXT=$'Alan，\n\n附上今天研究後的完整文字版報告。\n\n— 小爪'

python3 - <<'PY' "$TEXT" "$SUBJECT_TEXT" "$BODY_TEXT" "$TO1" "$TO2"
import os, sys, smtplib
from email.message import EmailMessage
from pathlib import Path
text_path, subject, body, to1, to2 = sys.argv[1:6]
msg = EmailMessage()
msg['Subject'] = subject
msg['From'] = os.environ['MAIL_FROM']
recipients = [to1] + ([to2] if to2 else [])
msg['To'] = ', '.join(recipients)
msg.set_content(body + "\n\n" + Path(text_path).read_text(encoding='utf-8'))
with smtplib.SMTP(os.environ.get('MAIL_SMTP_HOST', 'smtp.gmail.com'), int(os.environ.get('MAIL_SMTP_PORT', '587'))) as s:
    s.starttls()
    s.login(os.environ['MAIL_USER'], os.environ['MAIL_PASS'])
    s.send_message(msg)
print('sent text report to', ', '.join(recipients))
PY

"$PYTHON" "$PPT_MAIL" "$PPT" "研究報告：如何推廣數位 IC 設計工程師使用 AI 輔助工作（簡報版）" $'Alan，\n\n附上今天研究後的 PowerPoint 報告。\n\n— 小爪' "$TO1" ${TO2:+"$TO2"}
"$PYTHON" "$XLSX_MAIL" "$XLSX" "研究報告：如何推廣數位 IC 設計工程師使用 AI 輔助工作（Excel 重點表）" $'Alan，\n\n附上今天研究後的 Excel 正反重點表。\n\n— 小爪' "$TO1" ${TO2:+"$TO2"}

echo "text, ppt, xlsx sent"
