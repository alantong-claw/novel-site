# Pixnet tmp workspace

這個目錄只保留以下類型：

- debug / diagnose 腳本
- 一次性修復腳本
- 臨時測試腳本
- 本機 package 安裝與實驗用檔案

## 不應放這裡的東西

- 正式長期使用的 workflow 腳本
  - 請放到 `/home/alantong/ai-work/scripts/pixnet/`
- 長期保留的文件規則
  - 請放到正式文件區
- 執行期 profile / controller 狀態 / runtime JSON
  - 請放到 `/home/alantong/ai-work/work_tmp/pixnet-playwright-test/`

## 目前仍留在這裡的原因

這裡的多數 `.js` 是針對單一 Pixnet UI 問題做的探測、診斷、debug 或一次性修補，不適合直接升格為正式 workflow。

## 整理原則

- 若腳本已經可重複使用，且屬於正式流程，移到 `scripts/pixnet/`
- 若腳本只是某次排錯紀錄，保留在這裡或之後刪除
