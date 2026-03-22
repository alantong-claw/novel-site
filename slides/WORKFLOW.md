# Office / PowerPoint / Excel 工作模式

## 目標

讓小爪之後能穩定處理：
- PowerPoint (`.pptx`)
- Excel (`.xlsx`)
- 匯出報表
- email 寄送附件

## 目前工具鏈

- LibreOffice Impress
- LibreOffice Calc
- Python virtualenv: `/home/alantong/ai-work/.venv-ppt`
- python-pptx
- openpyxl
- pandas
- xlsxwriter
- Noto Sans CJK 字型

## 建議工作流程

### PowerPoint
1. 先定簡報目標、聽眾、時長
2. 先做大綱
3. 生成 `.pptx`
4. 補講稿 / 備註
5. email 寄送

### Excel
1. 先定資料來源與欄位
2. 定輸出格式（表格 / 報表 / 摘要頁）
3. 生成 `.xlsx`
4. 必要時加公式 / 樣式 / 第二頁摘要
5. email 寄送

## 安裝腳本

### 一次補齊 Office 工具
```bash
bash /home/alantong/ai-work/scripts/install_office_tools.sh
```

### 只補 Excel 工具
```bash
bash /home/alantong/ai-work/scripts/install_excel_tools.sh
```

## Exec approvals 建議

建議將以下納入 allowlist：
- `/home/alantong/ai-work/scripts/*`
- `/home/alantong/ai-work/.venv-ppt/bin/python`
- `/usr/bin/libreoffice`
- `/usr/bin/python3`

完整建議檔：
- `/home/alantong/ai-work/research/exec-approvals.suggested.json`
