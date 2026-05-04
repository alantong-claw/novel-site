# work_tmp

這裡專放任務執行時產生的檔案，不和規則、文件、原始碼混放。

## 原則

- 任務產物一律先放 `work_tmp/`
- 不要把臨時輸出丟到 workspace root、`tmp/`、`slides/`、`excel/`、`scripts/`
- `slides/`、`excel/` 保留給模板、說明、腳本與固定資源
- `work_tmp/tasks/<task-name>/` 放單次任務輸出
- `work_tmp/shared/` 放可跨任務重用但仍屬產物的中介檔
- `work_tmp/logs/` 放任務執行 log

## 建議結構

- `work_tmp/tasks/<task-name>/`
- `work_tmp/shared/`
- `work_tmp/logs/`

## 命名

- 單次任務目錄建議：`YYYY-MM-DD-topic`
- 檔名保留原格式即可，但盡量跟任務目錄一起收納
