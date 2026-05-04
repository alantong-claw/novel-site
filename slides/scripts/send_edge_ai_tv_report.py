import os, smtplib
from email.message import EmailMessage
from pathlib import Path

ppt = Path(os.environ.get('PPT_PATH', '/home/alantong/ai-work/work_tmp/tasks/2026-03-22-edge-ai-tv-openclaw-report/2026-03-22-edge-ai-tv-openclaw-report-v1.pptx'))

msg = EmailMessage()
msg['Subject'] = '15 TOPS Edge AI + TV 控制 + OpenClaw 研究簡報'
msg['From'] = os.environ['MAIL_FROM_ADDRESS']
msg['To'] = 'alantongsr@gmail.com'
msg.set_content('Alan，\n\n這是根據昨天研究整理出的 PowerPoint 簡報版。\n\n— 小爪')
msg.add_attachment(
ppt.read_bytes(),
maintype='application',
subtype='vnd.openxmlformats-officedocument.presentationml.presentation',
filename=ppt.name
)

with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
    smtp.login(os.environ['MAIL_FROM_ADDRESS'], os.environ['MAIL_APP_PASSWORD'])
    smtp.send_message(msg)

print('sent', ppt.name)
