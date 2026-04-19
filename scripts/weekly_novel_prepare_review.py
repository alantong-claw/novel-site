#!/usr/bin/env python3
from pathlib import Path
import json, re

ROOT = Path('/home/alantong/ai-work')
STATE = ROOT / 'memory/novel-progress.json'
RULES = ROOT / 'novel_site/PROJECT_RULES_NOVEL.md'
OUTLINE = ROOT / 'novel_site/NOVEL_OUTLINE.md'
NOVEL = ROOT / 'novel_site/novel.html'

obj = json.loads(STATE.read_text())
next_chapter = obj['next_chapter']
chapter_num = int(re.search(r'chapter(\d+)\.html', next_chapter).group(1))
prev_num = chapter_num - 1
prev_path = ROOT / 'novel_site' / f'chapter{prev_num}.html'
review_file = Path(obj['review_file'])
summary_file = Path(obj['summary_file'])

prev_html = prev_path.read_text()
paras = re.findall(r'<p>(.*?)</p>', prev_html, re.S)
last_paras = '\n'.join(p.strip() for p in paras[-3:])

title = f'第{chapter_num}章：待定'
content = f'''章節標題
{title}

章節全文
（待撰寫）

本章重點摘要
- 延續第{prev_num}章收尾，推進主線衝突。
- 讓角色關係與系統風險再上升一階。

角色／關係／伏筆更新
- 待撰寫。

準備發布狀態：等待 Alan 於 Telegram 回覆 OK
'''
review_file.write_text(content)
summary = f'''Weekly novel draft placeholder prepared.
Previous chapter: chapter{prev_num}.html
Last paragraphs from previous chapter:
{last_paras}

Rules source: {RULES}
Outline source: {OUTLINE}
Novel index: {NOVEL}
Review file: {review_file}
'''
summary_file.write_text(summary)
obj['status'] = 'draft_placeholder_ready'
STATE.write_text(json.dumps(obj, ensure_ascii=False) + '\n')
print(review_file)
print(summary_file)
