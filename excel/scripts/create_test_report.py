from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font
import sys

ROOT = Path('/home/alantong/ai-work/excel')
HELPER_DIR = Path('/home/alantong/ai-work/scripts')
if str(HELPER_DIR) not in sys.path:
    sys.path.append(str(HELPER_DIR))
from office_output_path import output_path
OUT = output_path('2026-03-22-excel-workflow-test', '2026-03-22-excel-workflow-test-v1.xlsx', 'OUTPUT_XLSX')

wb = Workbook()
ws = wb.active
ws.title = 'Summary'
rows = [
    ['Item', 'Status', 'Note'],
    ['LibreOffice Calc', 'OK', '已安裝'],
    ['python-pptx workflow', 'OK', 'PPT 生成與寄信已打通'],
    ['Excel workflow', 'OK', '測試報表生成中'],
    ['Generated at', '2026-03-22', 'ClawChan test'],
]
for r in rows:
    ws.append(r)
for cell in ws[1]:
    cell.font = Font(bold=True)
ws.column_dimensions['A'].width = 24
ws.column_dimensions['B'].width = 16
ws.column_dimensions['C'].width = 40

wb.save(OUT)
print(OUT)
