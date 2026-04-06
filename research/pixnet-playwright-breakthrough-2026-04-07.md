# PIXNET Playwright 自動發文打通進度（2026-04-07）

## 已實測打通能力

1. 可用 Playwright persistent session 進入 PIXNET 後台
2. 可進入文章建立頁與實際 editor 頁
3. 可自動填入文章標題
4. 可自動填入 Jodit editor 內文
5. 可成功按下「儲存草稿」並得到成功訊息
6. 可打開「圖片」上傳 popup
7. 可定位真實 uploader 節點：`.jodit-drag-and-drop__file-box`
8. 可透過模擬 drag/drop 事件上傳圖片並將圖片插入文章內容

## 本次已確認的圖片插入證據

- 文章 editor HTML 內出現：

```html
<img src="https://pimg.1px.tw/blog/alantong/post/882023561366150926/882033864309022286.jpg">
```

- 代表 `/mnt/g/TMP/whisky_photo/110_Nikka_余市.jpg` 已成功上傳並插入該草稿。

## 仍待完整驗證的項目

1. 分類欄位自動設定的穩定 selector
2. 標籤欄位自動設定的穩定 selector
3. 閱讀權限 / 留言權限等下拉欄位自動設定
4. 正式發布流程（尚未執行）

## 技術關鍵

- 不能只用 `setInputFiles()`，PIXNET/Jodit 的圖片上傳流程更接近拖放互動。
- 改以模擬 `dragenter` / `dragover` / `drop` 事件鏈後，圖片成功插入 editor。
- 真正 upload UI 不在 iframe，而是 Jodit popup / dropzone：
  - `span[aria-label="圖片"]`
  - `.jodit-drag-and-drop__file-box`
  - `input[type="file"][accept="image/*"]`

## 目前狀態結論

> PIXNET 這條線已經打通到「登入後台 → 建文 → 填標題/內文 → 存草稿 → 上傳圖片並插入文章內容」。

尚未完成的只剩欄位細節與正式發布驗證。
