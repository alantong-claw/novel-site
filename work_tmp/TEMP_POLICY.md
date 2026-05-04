# Temp and Task Output Policy

## Goal

把任務產物、暫存檔、scratch script、圖片、log 集中到 `work_tmp/`，方便日後清理硬碟。

## Current buckets

- `work_tmp/tasks/`：正式任務輸出
- `work_tmp/images/`：單次任務產出的圖片
- `work_tmp/captcha/`：驗證碼相關圖片與標註
- `work_tmp/logs/`：一般任務 log
- `work_tmp/pixnet-logs/`：Pixnet 執行 log 備份/彙整
- `work_tmp/osrtt/`：單次 OCR/辨識輸出
- `work_tmp/scratch/`：臨時腳本、測試腳本、一次性小工具
- `work_tmp/shared/`：可跨任務重用但仍屬產物的檔案

## Important exception

`tmp/pixnet-playwright-test/` 目前仍是活的 workflow 目錄，很多 Pixnet 腳本直接硬編碼引用，暫時不能直接搬走。

如果要徹底收編這塊，應先把：
- Playwright user-data
- controller status/command
- batch json
- diagnose scripts

改成由單一 helper 或環境變數決定路徑，再做搬遷。

## Rule going forward

- 新的 scratch script 不要再丟 workspace root
- 新的臨時圖片 / json / txt 不要再丟 workspace root
- 預設改放 `work_tmp/` 對應子目錄
