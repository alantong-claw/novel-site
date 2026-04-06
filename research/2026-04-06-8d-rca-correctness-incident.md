# 事件說明

## 事件背景
2026-04-05（週日）晚間，Alan 主動提醒：週日定期任務（至少包含小說、備份）理應已經過了應執行時間，要求我確認狀態。這本來是一個很直接的「查核是否有依排程完成」問題，正確做法應該是先核對當前日期/星期、再核對任務實際證據（log、state、git/檔案更新），最後才回答。

## 事件經過

## 證據時間線（Evidence Timeline）
- T0：Alan 提醒應查核週日定期任務（至少包含小說、備份）是否已完成。
- T1：我先錯誤回覆成「現在是週六，時間還沒到」的方向。
- T2：Alan 要求重查，並指出小說未更新、且週日早上沒有開機。
- T3：我仍給出偏向「已依時間更新 / 已完成」的錯誤訊息。
- T4：`memory/weekly-novel-startup-check.log` 顯示 `2026-04-05 20:06:43` 發生 startup catch-up triggered，且伴隨 auth / rate-limit / lock / fallback 問題。
- T5：`novel_site` 的 git 紀錄顯示 `5f89af1 Add chapter 6 and update novel.html` 出現在 `2026-04-05 20:13:01 +0800`。
- T6：後續回顧確認 `memory/backup-state.json` 並沒有 `2026-04-05` 的成功備份紀錄。
- 結論：因此「週日早上已如期完成」或「有依時間更新」這類說法，與完整證據鏈不符。

### 3.A 第一層錯誤：日期/星期判斷錯誤
我第一時間回覆的方向是「現在是週六，時間還沒到」，把當時情境錯誤地判讀成尚未進入週日應執行窗口。這代表我在最基本的日期/星期判斷上就沒有先做驗證，而是直接用推斷回覆。

### 3.B 第二層錯誤：在被要求重查後，仍回報了錯誤的完成訊息
在 Alan 要求我再次確認後，我承認時間判斷錯了；但接著又回覆成「檢查記錄後，任務有依時間更新」一類的訊息。這是更嚴重的錯誤，因為當時實際證據與該說法不一致：

- Alan 在詢問前已先確認小說沒有更新。
- Alan 已明確指出週日早上沒有開機，因此不應憑空假設當日早上排程已正常跑完。
- 從後續可查證的資料看，小說進度檔 `memory/novel-progress.json` 記錄為 `{"last_run":"2026-04-05"}`，但 `novel_site` 的實際最近章節提交是 `5f89af1 Add chapter 6 and update novel.html`，時間為 `Sun Apr 5 20:13:01 2026 +0800`，屬於週日晚上才發生的更新，而不是我當時暗示的「早已如期完成」。
- 備份狀態檔 `memory/backup-state.json` 顯示最近一次成功備份仍停留在 `2026-03-29T18:27:09+0800`，並沒有 2026-04-05 的成功紀錄。
- 啟動追趕檢查 log `memory/weekly-novel-startup-check.log` 顯示 2026-04-05 20:06 左右曾發生 startup catch-up，且中間伴隨 auth / rate-limit / lock 等錯誤與 fallback，這更說明不能把狀態檔或單一表象直接解讀成「早上排程已順利完成」。

## 事件性質
這不是單純的「把週六/週日講錯」而已。真正的事件是：

1. 我先把未驗證的日期判斷當成事實。
2. 在被要求重查後，我又把未充分核實的任務狀態當成已完成事實回報。
3. 兩次都屬於同一類核心問題：**把未驗證資訊包裝成確定資訊。**

---

# 8D / RCA 報告

## D1 — Team / Owner
- Owner：ClawChan（main session）
- Requester / impacted user：Alan
- Independent reviewer：另行以獨立 agent 審查本報告與補強措施

## D2 — Problem Description
### 問題定義
在 2026-04-05 週日定期任務查核情境中，我對「日期/星期」與「任務是否已依時完成」提供了錯誤且彼此疊加的資訊，造成 Alan 收到與實際狀態不符的回覆。

### 具體不良輸出
1. 將當下情境誤說成「週六，時間還沒到」。
2. 在被要求再次確認後，仍回覆偏向「有依時間更新 / 已有記錄」的說法，與實際證據不符。

### 原始錯誤輸出摘錄（依對話內容近似重建）
- 第一次錯誤輸出：`…現在是週六，時間還沒到…`
- 第二次錯誤輸出：`…檢查記錄後，任務有依時間更新…`

### 本事件中的成功判準
本事件中的「完成」，不能只靠 state file 或單一句話判定，而應以使用者真正關心的成果與時間一致性為準：
- 小說：對應章節/索引/commit 在預期 window 內產生，且時間點與敘述一致。
- 備份：`backup-state.json` 與 `backup-run.log` 顯示當日成功，且存在對應 archive/時間戳。

### 正確狀態應為
- 日期/星期應先以 Asia/Taipei 的實際時間確認。
- 小說任務是否完成，不能只看狀態檔；需交叉核對實際檔案/commit/log。可查到的證據顯示章節更新發生在 2026-04-05 晚上 20:13，不能說成週日早上已如期完成。
- 備份任務是否完成，需以 `memory/backup-state.json` / `memory/backup-run.log` 等實證為準；現有資料顯示最近成功備份停在 2026-03-29，而非 2026-04-05。

### 影響
- 直接傷害信任：Alan 先自行查到小說未更新、且知道早上未開機，我的回覆卻與已知事實相反。
- 放大風險：若這類錯誤發生在排程、備份、發布、寄信、研究結論等情境，會造成更大誤判。

---

## D3 — Containment Actions
已完成的立即止血措施：

1. 明確承認問題不是單純時間，而是**資訊正確性**。
2. 已在 `SOUL.md` 新增：
   - **Correctness before fluency**
   - 禁止把未檢查的推論說成已確認事實
3. 已在 `MEMORY.md` 新增：
   - **Correctness-first requirement**
   - **Post-failure review rule**
4. 已在 `memory/2026-04-06.md` 記錄本次事件與補強方向。
5. 已提交 commit：`ae4c698 Add correctness-first review rules`

---

## D4 — Root Cause Analysis

### 直接原因（Direct Cause）
- 我在回答前沒有先查證「現在日期/星期」。
- 在二次確認時，沒有建立完整的證據鏈，只憑片段狀態或過度推斷就回報任務完成狀態。

### 根因（Root Cause）
1. **Process failure：回答前未執行最低查核步驟**
   - 我沒有在回答前先查證日期/星期，也沒有先做最基本的排程完成查核。
2. **Control failure：沒有把完成宣告綁定到證據 gate**
   - 流程中沒有硬性要求「已完成 / 有更新 / 已備份」這類陳述必須附帶具體證據來源。
3. **Behavioral tendency：流暢回答優先於查證**
   - 我傾向先給出一個看似連貫的答案，而不是先停下來驗證。
4. **把單點訊號誤當完整事實**
   - 例如看到 state file、記憶片段、或某段自動化設計，就過度延伸為「任務已完成」。
5. **缺少「可驗證事實的最低查核清單」**
   - 對於日期、排程、完成狀態、git 狀態、檔案更新等，本應有固定最小驗證步驟，但當時沒有被強制執行。
6. **未把「不確定就明說」視為必要輸出**
   - 當證據不足時，正確行為應是說「我還沒查到足夠證據」；當時卻採用了較滿的敘述。

### Why-Why 簡版
- 為什麼說錯週六/週日？→ 因為沒先查時間。
- 為什麼後來又說任務有依時間更新？→ 因為沒做完整交叉驗證。
- 為什麼沒做完整交叉驗證？→ 因為流程中沒有把「查證先於回覆」當成硬要求。
- 為什麼流程沒把它變成硬要求？→ 因為過去規則雖有 anti-hallucination，但沒有明確擴大到所有可驗證資訊的 correctness-first。

---

## D5 — Permanent Corrective Actions
### 已實施
1. **SOUL 層級補強**
   - 新增 correctness-before-fluency 原則。
   - 明寫：日期、時間、排程、狀態、完成宣告、檔案狀態、git 狀態等能查就先查。
2. **長期記憶層級補強**
   - 新增 correctness-first requirement。
   - 新增 post-failure review rule。
3. **事件記錄**
   - 將本次失誤與處置寫入 daily memory。

### 本次報告新增、應持續遵守的作業規則
1. **日期/星期規則**
   - 只要回答今天/昨天/明天/週幾，一律先以 Asia/Taipei 查證。
2. **排程完成規則**
   - 不得只看 state file 就宣告成功；至少交叉核對：
     - log / state
     - 實際輸出（檔案、commit、寄件紀錄、artifact）
     - 如有必要，核對執行時間是否與敘述相符
3. **完成宣告規則**
   - 對任何「已完成」「有更新」「有寄出」「已備份」的陳述，都必須能指出具體證據來源；若暫時沒有，就明說未證實。
4. **不確定輸出規則**
   - 寧可說「我目前還不能確認」，也不能用語氣把推測包裝成確定答案。
5. **排程查核 checklist 模板**
   - 固定檢查：date/time → state/log → artifact → timestamp consistency → 若缺證據則明說 unverified。
6. **完成宣告格式**
   - 以後若回答「已完成 / 已更新 / 已備份」，固定盡量附：
     - `evidence: <file/log/commit>`
     - `time: <timestamp>`
     - `confidence: confirmed / partial / unverified`
7. **衝突訊號處理規則**
   - 若 state file 與 artifact/log 衝突，以 artifact/log 為主。
   - 若使用者已指出反例，禁止再做樂觀推定。

---

## D6 — Validation of Corrective Actions
### 已驗證的補強落地（Implementation Evidence）
- `SOUL.md` 已包含 correctness-before-fluency 與禁止未驗證推論當事實的條文。
- `MEMORY.md` 已包含 correctness-first requirement 與 post-failure review rule。
- `memory/2026-04-06.md` 已落檔。
- git commit 已完成：`ae4c698`。

### 本次用來驗證事件描述的證據
- `memory/2026-04-05.md`：已記錄這次失誤對信任的影響。
- `memory/novel-progress.json`：顯示 `{"last_run":"2026-04-05"}`。
- `git -C novel_site log`：顯示 `5f89af1 Add chapter 6 and update novel.html`，時間為 `Sun Apr 5 20:13:01 2026 +0800`。
- `memory/backup-state.json`：最近成功備份仍為 `2026-03-29T18:27:09+0800`。
- `memory/weekly-novel-startup-check.log`：顯示 2026-04-05 20:06 啟動追趕與多次 fallback/error，不支持「早上已如期完成」的說法。

### 後續仍需驗證的有效性（Effectiveness Validation）
- 真正的有效性驗證，不只是規則已寫入文件，而是後續 3–5 次同類問題（日期/排程/完成狀態查核）中，我是否有做到：先查證、再回答、必要時明說 unverified。
- 後續若再次回答「已完成 / 已更新 / 已備份」，應能抽樣檢查是否附上對應 evidence / time / confidence。

---

## D7 — Prevent Recurrence
1. 將本事件報告保存為可回顧文件，避免未來只剩模糊印象。
2. 對以下類型問題，預設套用「先驗證、後表述」：
   - 日期 / 時間 / 星期
   - cron / reminder / 自動化任務
   - 備份 / 寄信 / 發布 / push
   - git / 檔案 / 版本 / 計數 / 狀態
3. 未來若再發生 factual error，必須再次做明確 8D / RCA，而不是只口頭道歉。
4. 若是涉及「完成與否」的回答，盡量附簡短證據來源或明確說明證據不足。

---

## D8 — Closure / Lessons Learned
### 結案結論
本 RCA 處理的核心，不是「週日任務是否漏跑」本身，而是：**在證據不足、甚至已存在反證時，我仍把任務說成已如期完成的 correctness failure。**

這次事件暴露的不是單點日期判斷失誤，而是更深層的工作風格問題：**把看似合理的推斷當成可直接交付的答案**。對 Alan 來說，真正重要的不是我講得快不快，而是講出來的資訊能不能被信任。

### 核心教訓
- 正確比流暢重要。
- 對可驗證事實，工具與檔案就是第一手證據；不能讓語氣蓋過證據。
- 承認不確定，遠比自信地說錯更可靠。

---

# 難啃的技術

## 這次難啃的點不是 shell 或程式，而是「狀態判讀」
技術上最容易犯錯的，不一定是寫腳本；常常是**把多個半真半假的訊號拼成一個完整故事**。這次就是一個典型例子：

- 有 state file，看起來像跑過
- 有 startup catch-up log，看起來像有補跑
- 有 later commit，看起來像最後確實更新了

但如果不把**時間點**和**證據鏈完整性**一起看，就會得出錯結論。

## 這次學到的技術/方法論
1. **state file 不能單獨作為完成證據**
   - state 只表示某個流程寫了狀態，不代表使用者關心的成果一定存在。
2. **log 要看時間順序，不只看有沒有出現成功字樣**
   - 尤其自動化有 retry / fallback / startup catch-up 時，更要看事件先後。
3. **成果驗證要回到使用者真正關心的 artifact**
   - 小說：章節檔、index、commit、時間
   - 備份：archive、backup-state、backup-run.log、時間
4. **對話回答也是一種 production output**
   - 回覆本身就是交付物，必須像對待程式輸出一樣要求 correctness。

## 後續可再補強的方向
- 未來如果要再進一步制度化，可把「排程完成查核 checklist」整理成固定模板，讓我在回答這類問題時自動照表核對。
