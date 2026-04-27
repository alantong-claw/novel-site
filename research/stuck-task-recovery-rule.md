# 持續性任務卡住治理規則

## 目的
避免持續性、跨多輪對話、背景執行或排程型任務在失敗後靜默停住，直到使用者下次追問才被發現。

## 這次先補的三件事

1. **每個長任務都要有狀態檔**
2. **失敗時一定要寫可讀摘要**
3. **加 watchdog 檢查「卡住但沒回報」**

這一版先解決「知道自己卡住」與「不可以無聲停住」，並加入卡住前的最小自救規則。

---

## 一、任務狀態檔

每個持續性任務至少要有一個 JSON state file，建議放在 `memory/tasks/`。

### 基本狀態
- `pending`
- `running`
- `self_recovering`
- `blocked`
- `done`
- `failed_reported`

### 最低欄位
```json
{
  "task": "pixnet-whisky-070-076",
  "status": "running",
  "alert_scope": "owner",
  "updated_at": "2026-04-21T11:55:00+0800",
  "started_at": "2026-04-21T08:05:00+0800",
  "last_ok_step": "built publish spec",
  "current_step": "login -> posts",
  "note": "human-readable short summary"
}
```

### 原則
- 禁止停在沒有 state 的背景執行
- 任務開始時就寫 `running`
- 若任務可能被 watchdog / alert pipeline 掃描，明確寫 `alert_scope`
- `alert_scope` 建議值：
  - `owner`：對使用者可見的主任務，可主動提醒
  - `child`：內部子任務，不單獨提醒
  - `silent`：只記錄，不提醒
- 不要再用 task 名稱猜它該不該通知
- 每次跨過明確 checkpoint 就更新 `last_ok_step`
- 任務完成時寫 `done`
- 任務失敗或阻塞時，不可只讓 stderr 結束，必須寫 `blocked` 或 `failed_reported`

---

## 二、失敗摘要

任何長任務一旦失敗，至少要落一份可讀摘要。不要只留 shell error。

### 最低內容
- task 名稱
- 失敗時間
- 最後成功步驟
- 卡住步驟
- 原始錯誤摘要
- 下一步建議
- 是否已通知使用者

### 建議格式
```json
{
  "task": "pixnet-whisky-070-076",
  "status": "blocked",
  "failed_at": "2026-04-21T08:07:26+0800",
  "last_ok_step": "spec built + image choice confirmed",
  "current_step": "login -> posts",
  "error": "did-not-reach-posts:https://account.pixnet.tw/login",
  "next_action": "diagnose login/session establishment before retry",
  "user_notified": false
}
```

### 原則
- `blocked` = 有明確 blocker，尚未完整通知或尚待處置
- `failed_reported` = 已明確通知使用者且完成收尾
- 不可在失敗後維持 `running`

---

## 三、卡住前先 self-recovery / self-diagnosis

這是新補的規則。

### 原則
- **blocked 之前，先進 self-recovery / self-diagnosis**
- **只要不涉及風險操作，就先自己試著解至少 3 輪**
- **若 3 輪後仍卡在同一地方，才標 `blocked` 回報**
- **如果有進度往前，就重算 3 輪**

### 什麼叫一輪
一輪是「對同一個卡點做一次最小但實質的排查 / 修復嘗試」，例如：
1. 重讀 state / log / 錯誤訊息
2. 驗證實際頁面 / pid / session / 檔案狀態
3. 換一個低風險策略再試一次

### 什麼叫有進度
以下任一成立，就算有進度，可重算 3 輪：
- `current_step` 往前推進
- `last_ok_step` 更新
- blocker 從 A 變成更後面的 B
- 已排除一個明確假設，進入下一個明確檢查點

### 什麼情況不可進 self-recovery
- 需要使用者額外憑證 / 輸入
- 涉及外部敏感操作風險
- 可能造成重複發送 / 重複發布 / 重複扣款
- 可能破壞資料或覆蓋使用者內容

遇到這些情況，就不要硬做 3 輪，應直接 `blocked` 並說明原因。

---

## 四、watchdog

watchdog 的責任不是幫主任務做完整工作，而是：
- 發現 `running` 太久
- 發現背景程序已死但 state 還是 `running`
- 發現 `blocked` 太久且尚未通知
- 強制把任務從靜默狀態拉回「可見狀態」

### 最小檢查規則
1. `running` 超過預期時間上限
2. state 顯示 `running`，但 pid 已不存在
3. `blocked` 超過門檻仍未標記 `user_notified=true`

### watchdog 最低動作
- 補寫 summary / reason
- 將狀態改成 `blocked` 或 `failed_reported`
- 留 log
- 如果有明確應通知的設計，就通知使用者
- 若自動通知送失敗，要保留可重試狀態，不可把提醒悄悄吞掉
+
+### watchdog 通知分流
+- `alert_scope=owner`：可以主動通知
+- `alert_scope=child`：不要單獨通知，應由 owner task 彙總
+- `alert_scope=silent`：永不通知
+- 不要讓 child task 直接轟炸使用者頻道

---

## 五、實作原則

### 先不要做
- 大量自動重試
- 複雜工作流引擎
- 分散在每個腳本各自亂寫

### 先做
- 共用 task state helper
- 共用 failure summary helper
- 一支簡單 watchdog script
- 任務腳本中明確記錄 self-recovery attempt 次數與卡點位置

---

## 六、這次 PIXNET 案例對應

### 發生的問題
- 任務開始後沒有穩定的 end-to-end state tracking
- 腳本失敗時沒有把 state 收斂到 `blocked`
- 沒有 watchdog 主動發現並回報
- 最後變成要等使用者下一次追問才知道沒完成

### 套用後應有表現
- 任務開始：`running`
- 成功建立 spec 後更新 `last_ok_step`
- 卡在 login -> posts 時：轉 `self_recovering`
- 先做最多 3 輪低風險診斷 / 修復
- 若仍卡在同一點：改寫 `blocked`
- 寫出可讀摘要
- watchdog 發現未通知，主動提醒或至少強制收尾狀態

---

## 七、完成通知 / final delivery

持續性任務若包含使用者明確期待的完成通知，則「任務做完」不等於「流程完成」。

### 必補規則
- 做完主要工作後，若流程要求通知使用者，必須真的送出完成通知
- 通知送出成功後，state 才能標記 `user_notified=true`
- 若只做到主工作完成，但未送通知，流程仍是不完整

### 建議狀態語意
- `done` = 主工作完成
- `done + user_notified=true` = 整體完成並已收尾

### 失敗案例
以下都不算真正完成：
- 文章都發完了，但沒有通知使用者
- 備份已完成，但沒有回報完成結果
- 檔案已產出，但該寄送/發布/通知的最後一步沒做

---

## 八、完成定義

對持續性任務來說，完成不只分 `done`。

合法終態只有三種：
1. `done` 且必要時已 `user_notified=true`
2. `blocked` 且已留下清楚原因
3. `failed_reported` 且已明確通知使用者

不合法終態：
- 背景程序死掉，但 state 仍是 `running`
- 腳本退出後什麼都沒寫
- 任務沒完成也沒回報
- 主工作做完，但 completion notification / final delivery 沒做
