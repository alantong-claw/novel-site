#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/alantong/ai-work"
VENV="$ROOT/.venv-ppt"

sudo apt-get update
sudo apt-get install -y libreoffice-impress libreoffice-calc python3-venv python3-pip fonts-noto-cjk

if [[ ! -d "$VENV" ]]; then
  python3 -m venv "$VENV"
fi

"$VENV/bin/pip" install --upgrade pip
"$VENV/bin/pip" install python-pptx openpyxl pandas xlsxwriter pillow lxml

echo
echo "Office toolchain ready."
echo "LibreOffice Impress + Calc: installed"
echo "Python venv: $VENV"
echo "Python packages: python-pptx, openpyxl, pandas, xlsxwriter"
