# PIXNET 發文實戰流程（2026-04-09）

## 目的
把已驗證成功的 PIXNET 發文流程固定下來，避免之後再被舊假設、錯頁面、或錯 selector 拖慢。

## 核心原則
**Accuracy is more important than fluency.**

每一步都必須先驗證：
1. **實際 URL**
2. **頁面關鍵文字 / 元素**

兩者都對，才往下。若不對，就先停下讀頁面資訊，不要硬往後做。

---

## 已驗證成功的主流程

### 1. 登入 PIXNET
- URL: `https://account.pixnet.tw/login`
- 成功條件：
  - 可見 `input[name="username"]`
  - 可見 `input[name="password"]`
  - 可見 `button[type="submit"]`

### 2. 登入後會到 dashboard
- URL: `https://account.pixnet.tw/dashboard`
- 頁面關鍵文字：
  - `總覽`
  - `前往部落格後台`

### 3. 可直接前往文章列表
- 直接 `goto https://panel.pixnet.tw/posts`
- 實際成功條件：
  - URL: `https://panel.pixnet.tw/posts`
  - 頁面有：
    - `我的文章`
    - `寫文章`
    - `文章狀態`

> 注意：之前曾誤以為會先停在 analytics。清乾淨重來後，直接 goto `/posts` 可以成功到文章列表。

### 4. 進入建立文章頁
- 在 `/posts` 點 `寫文章`
- 成功條件：
  - URL: `https://panel.pixnet.tw/posts/create`
  - 頁面有：
    - `建立文章`
    - `開始寫文章`

**重要：不要把 `/posts/create` 當成已進入 editor。**
這一頁只是中間過渡頁，昨晚與 2026-04-18 早上都曾真實卡在這裡。
若只點了 `寫文章`，但沒有再明確點一次 `開始寫文章`，流程會停在 create 頁，看起來像已經進入寫作流程，實際上還沒到真正 editor。

### 5. 開啟真正 editor
- 在 `/posts/create` **明確點 `開始寫文章`**
- 成功條件：
  - URL 符合：`https://panel.pixnet.tw/posts/<動態數字>`
  - 頁面有：
    - `文章個人分類`
    - `文章閱讀權限`
    - `POWERED BY JODIT`

**正式三段式入口，不可省略：**
1. `https://panel.pixnet.tw/posts`
2. 點 `寫文章`，到 `https://panel.pixnet.tw/posts/create`
3. 點 `開始寫文章`，才進到 `https://panel.pixnet.tw/posts/<動態數字>`

不要假設：
- 到 `/posts/create` 就算成功
- `開始寫文章` 會自動被帶過去
- `/posts/create` 可直接視為 editor ready

---

## 各欄位正確 selector / 互動模型

### 標題欄
**正確元素：**
- `textarea[name="title"]`
- 或 `#文章標題`

**注意：**
- 不要用寬鬆的 `input` selector
- 之前曾抓到 `disabled` input，導致流程誤卡

### 個人分類 / 全站分類 / 權限 / 留言
互動模型：
- 皆為 `role="combobox"` button，不是原生 `<select>`
- 點開後是 popover / cmdk list
- 有些欄位有搜尋框 `搜尋...`

### 已驗證成功的欄位設定
1. 個人分類 → `Whisky`
2. 全站分類(主要) → `美味食記`
3. 全站分類(次要) → `生活綜合`
4. 閱讀權限 → `公開`
5. 留言權限 → `可留言，留言公開`

**成功證據格式：**
- beforeText
- optionText
- afterText
- combobox outerHTML

### 標籤欄位
互動模型：
- 點 `文章標籤` 對應 input
- 輸入文字
- 按 `Enter`
- 成功證據：頁面上出現 tag 文字，input 清空

目前可用 input：
- `input[placeholder="+ 新增標籤"]`

### 圖片上傳
不是普通表單上傳。

正確模型：
1. 點 editor 工具列的 `圖片`
2. 打開 Jodit 圖片 popup
3. 找到 `.jodit-drag-and-drop__file-box`
4. 模擬 `dragenter` / `dragover` / `drop`
5. 成功證據：頁面內出現 `pimg.1px.tw` 的文章圖片 URL

### 發布
互動模型：
- 點右上 `發布`
- 成功後回到 `/posts`
- 成功證據：文章列表中可找到該標題

---

## 已成功完成的實戰案例

### Probe: tag + publish
- 標題：`OpenClaw tag/publish probe 1775738404161`
- 成功加入 tag：`Whisky`
- 成功點發布
- 成功回到 `/posts`
- 成功在列表中找到標題

### 正式發文：編號 110
- 標題：`[Whisky][Japan/Hokkaido] Nikka/余市`
- 圖片：`/mnt/g/TMP/whisky_photo/110_Nikka_余市.jpg`
- 標籤：
  - `Japan`
  - `Hokkaido`
  - `Nikka/余市`
- 發布成功後驗證：
  - post id: `882969663531716657`
  - 列表狀態：`公開`

---

## 110 這篇的資料規則
資料來源：`/mnt/g/TMP/whisky_photo/Whisky365_NoteAll.csv`

對應 row 110：
- Column2: `Nikka/余市`
- Column7: `Japan/Hokkaido`
- Column8: 空白

### 標題規則
格式：
`[Whisky][Column7] Column2 / Column3 / Column8 Yr`

若欄位空白或 `NA` 則省略。
若 `Column8` 是數字，照樣發成 `Column8 Yr`，例如 `7 -> 7 Yr`。
若 `Column8` 是 `*數字`，也照樣發成 `Column8 Yr`，例如 `*7 -> *7 Yr`。
不要把 `*7`、`*6` 之類值正規化成 `1 Yr` 或其他語意化結果。

### 110 的實際標題
`[Whisky][Japan/Hokkaido] Nikka/余市`

### 110 的標籤
- `Japan`
- `Hokkaido`
- `Nikka/余市`

---

## 後續建議
1. 把這條流程封裝成正式 script，而不是多支 probe script
2. 對每一步都輸出：
   - stage
   - url
   - title
   - body snippet
   - before / option / after
3. 發文前後都保留明確成功證據
4. 若頁面不符預期，先回報目前頁面資訊，不要硬做下一步
