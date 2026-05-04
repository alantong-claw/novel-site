# PowerPoint 工作模式

這個目錄用來管理 ClawChan / 小爪 之後幫 Alan 製作的投影片。

## 結構

- `templates/`：投影片模板、樣式設定、共用素材說明
- `scripts/`：產生投影片的腳本

> `.pptx` 任務輸出請優先放到 `/home/alantong/ai-work/work_tmp/tasks/<task-name>/`，不要再和這裡的腳本與說明文件混放。

## 目前環境

- LibreOffice Impress：已安裝
- Python virtualenv：`/home/alantong/ai-work/.venv-ppt`
- python-pptx：已安裝
- 中文字型：Noto Sans CJK 已安裝

## 預設工作流程

1. 先確認簡報目標、對象、時長
2. 先產生大綱
3. 生成 `.pptx`
4. 必要時補講稿、逐頁備註、圖表建議
5. 需要時寄送 email 版本

## 建議命名

輸出檔名格式：
`YYYY-MM-DD-topic-v1.pptx`

建議完整路徑格式：
`/home/alantong/ai-work/work_tmp/tasks/YYYY-MM-DD-topic/YYYY-MM-DD-topic-v1.pptx`

例如：
- `2026-03-22-powerpoint-workflow-test-v1.pptx`
- `2026-03-25-edge-ai-report-v1.pptx`
