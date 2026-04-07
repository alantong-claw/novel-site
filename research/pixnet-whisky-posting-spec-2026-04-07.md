# PIXNET Whisky 發文規格（2026-04-07）

## 資料來源
- CSV: `/mnt/g/TMP/whisky_photo/Whisky365_NoteAll.csv`
- 圖片目錄: `/mnt/g/TMP/whisky_photo`

## 標題規則
格式：

`[Whisky][Column7] Column2 / Column3 / Column8`

規則：
- `Column7` 取 row[6]
- `Column2` 取 row[1]
- `Column3` 取 row[2]
- `Column8` 取 row[7]
- 若欄位空白或 `NA`，就省略，不硬塞 `/`

## 欄位規則
- 個人分類：`Whisky`
- 全站分類(主要)：`美味食記`
- 全站分類(次要)：`生活綜合`
- 權限：`公開`
- 留言權限：`可留言，留言公開`

## 標籤規則
- `Column7` 以 `/` 分割前後，拆成多個 tag
- 再加入 `Column2`, `Column3`, `Column8`
- 空白或 `NA` 不加入

## 內容規則
- 對應編號文章只貼上對應編號照片
- 圖片來源目錄：`/mnt/g/TMP/whisky_photo`
- 例：編號 `110` 對應 `/mnt/g/TMP/whisky_photo/110_Nikka_余市.jpg`

## 目前已打通能力
- 建文
- 填標題
- 填內文
- 存草稿
- 上傳圖片並插入文章內容
- 加入至少一個 tag

## 尚待收斂
- 分類 / 權限欄位 selector 的穩定自動化
- 正式發布流程
