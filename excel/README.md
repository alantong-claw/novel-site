# Excel 報表工作模式

## 目標

讓小爪之後能穩定處理：
- 生成 `.xlsx` 報表
- 寄送報表附件
- 以固定腳本封裝，方便從 Telegram 直接觸發

## 目錄

- `templates/`：範本與欄位說明
- `scripts/`：產生與寄送腳本

> `.xlsx` 任務輸出請優先放到 `/home/alantong/ai-work/work_tmp/tasks/<task-name>/`，不要再和這裡的腳本與說明文件混放。

## 目前第一個流程

- 測試報表生成：`excel/scripts/create_test_report.py`
- 測試報表寄送：`scripts/send_excel_test_report.sh`

## 建議輸出路徑

建議完整路徑格式：
`/home/alantong/ai-work/work_tmp/tasks/YYYY-MM-DD-topic/YYYY-MM-DD-topic-v1.xlsx`

## 預設工具鏈

- Python venv: `/home/alantong/ai-work/.venv-ppt`
- openpyxl / pandas / xlsxwriter
- LibreOffice Calc
