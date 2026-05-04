import os, json, glob, re, subprocess, sys
from pathlib import Path

BASE = Path('/home/alantong/ai-work')
labels = json.loads((BASE / 'captcha_labels.json').read_text())
variant_script = BASE / 'tmp_captcha_variants_grid.py'

for p in sorted(BASE.glob('live_cap_*.png')):
    name = p.name
    ans = labels.get(name)
    if not ans:
        continue
    prefix = p.stem + '_bench'
    subprocess.run(['python3', str(variant_script), str(p), prefix], check=True, capture_output=True, text=True)
    print(name, ans)
