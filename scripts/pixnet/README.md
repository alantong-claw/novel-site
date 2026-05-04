# Pixnet workflow

正式保留的 Pixnet 自動化腳本放這裡。

## 原則

- `scripts/pixnet/`：長期保留、可重複執行的正式 workflow 腳本
- `tmp/pixnet-playwright-test/`：臨時 debug、探測、一次性修復腳本
- `work_tmp/pixnet-playwright-test/`：執行期資料、browser profile、controller 狀態、暫存 JSON

## 路徑

共用路徑 helper：`/home/alantong/ai-work/scripts/pixnet_paths.js`

預設執行期目錄：
- `work_tmp/pixnet-playwright-test/`

如需暫時沿用舊資料位置：
- 設定 `PIXNET_USE_LEGACY_TMP=1`

## 建議

- 新 workflow 先寫在 `scripts/pixnet/`
- 只有 debug / diagnose 類腳本才留在 `tmp/`
- 不要把 `pixnet-user-data/`、`profile-archive/`、`node_modules/` 納入版控
