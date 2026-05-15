# 第66屆全國科展後續規則

更新時間：2026-05-10 17:57 +08:00

## Alan 指示
1. 若同一縣市連續 3 次補查仍無更明確官方證據，先收掉，不再無限追。
2. 最終總整理一定要含新竹縣；新竹縣依 Alan 先前提供之結果連結，已視為已有明確證據，本輪只需整理匯入。
3. 檔案與流程要保留，並於兩週後再撈一輪。

## 實作方式
- 以 `memory/county-science-fair-state.json` 作為縣市狀態主表。
- 以 `research/sciencefair66_results.csv` 作為作品列主表。
- 以 `research/sciencefair66_progress.md` 作為人工可讀進度紀錄。
- 所有對外要給 Alan 直接用 Excel 開啟的 CSV，一律輸出為 **UTF-8 with BOM (`utf-8-sig`)**。
- 若沿用舊 CSV 或人工產生新 CSV，交付前先跑：`python3 scripts/normalize_sciencefair_csv_encoding.py`。
- 弱證據優先補查：南投、桃園、基隆、雲林。
- 兩週後重撈時，優先重查：
  - 已確認公布日未到
  - 專區層級未見名單
  - 已出現全國展作品訊號但未公開名單
  - 得獎/入圍名單已出但未明示推薦全國名單
