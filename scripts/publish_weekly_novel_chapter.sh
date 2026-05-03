#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
NOVEL_DIR="$ROOT/novel_site"
STATE_FILE="$ROOT/memory/novel-progress.json"
TODAY="$(TZ=Asia/Taipei date +%F)"

if [[ ! -f "$STATE_FILE" ]]; then
  echo "State file missing: $STATE_FILE"
  exit 1
fi

review_file="$(python3 - <<'PY'
import json
from pathlib import Path
p = Path('/home/alantong/ai-work/memory/novel-progress.json')
obj = json.loads(p.read_text())
print(obj.get('review_file',''))
PY
)"
next_chapter="$(python3 - <<'PY'
import json
from pathlib import Path
p = Path('/home/alantong/ai-work/memory/novel-progress.json')
obj = json.loads(p.read_text())
print(obj.get('next_chapter',''))
PY
)"

if [[ -z "$review_file" || -z "$next_chapter" ]]; then
  echo "Missing review_file or next_chapter in state file"
  exit 1
fi

chapter_basename="$(basename "$next_chapter")"
chapter_num="$(echo "$chapter_basename" | sed -E 's/^chapter([0-9]+)\.html$/\1/')"
chapter_path="$NOVEL_DIR/$chapter_basename"

if [[ ! -f "$review_file" ]]; then
  echo "Draft file missing: $review_file"
  exit 1
fi

if grep -q '（待撰寫）' "$review_file" || grep -q '^第[0-9]\+章：待定$' "$review_file"; then
  echo "Draft is still placeholder content and cannot be published: $review_file"
  exit 1
fi

python3 - "$review_file" "$chapter_path" "$NOVEL_DIR/novel.html" "$chapter_num" <<'PY'
import re, sys
from pathlib import Path
review_path = Path(sys.argv[1])
chapter_path = Path(sys.argv[2])
novel_index = Path(sys.argv[3])
chapter_num = sys.argv[4]
text = review_path.read_text()
match = re.search(r'^章節標題\s*\n(.+?)\n\s*章節全文\s*\n', text, re.S | re.M)
if not match:
    raise SystemExit('Could not parse chapter title from review file')
title = match.group(1).strip()
body_match = re.search(r'章節全文\s*\n(.*?)\n\s*本章重點摘要\s*\n', text, re.S | re.M)
if not body_match:
    raise SystemExit('Could not parse chapter body from review file')
body = body_match.group(1).strip().split('\n\n')
paragraphs = '\n\n'.join(f'        <p>{p.strip()}</p>' for p in body if p.strip())
html = f'''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav><a href="index.html">← 返回目錄</a></nav>
    <article>
        <h1>{title}</h1>
{paragraphs}
    </article>
</body>
</html>
'''
chapter_path.write_text(html)
index = novel_index.read_text()
entry = f'        <li><a href="chapter{chapter_num}.html">{title}</a></li>'
if entry not in index:
    index = index.replace('    </ul>', entry + '\n    </ul>')
    novel_index.write_text(index)
PY

cd "$NOVEL_DIR"
pwd
git status
git remote -v
git branch --show-current
git add "$chapter_basename" novel.html
git commit -m "Add chapter $chapter_num"
git push

python3 - <<'PY'
import json
from pathlib import Path
p = Path('/home/alantong/ai-work/memory/novel-progress.json')
obj = json.loads(p.read_text())
obj['status'] = 'published'
obj['published_on'] = obj.get('date')
p.write_text(json.dumps(obj, ensure_ascii=False) + '\n')
PY

echo "Published $chapter_basename"
