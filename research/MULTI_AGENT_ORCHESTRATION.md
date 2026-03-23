# Multi-Agent Orchestration Rule

適用情境：任何需要多個 subagent、分階段回合、等待 completion event、再續派下一步的流程。

適用例子：
- 研究 / deep research
- 正反辯論 / 辯論會
- 多 subagent 分工任務
- 分 subagent 計時 / reminder / delayed actions
- 需要彙整多個 child result 的分析型任務

---

## 核心觀念

問題不是「研究卡住」而已，而是：

> **任何 multi-agent workflow，只要主代理沒有明確管理 round / completion / next-step dispatch / status push，就很容易停在半路。**

因此規則不能只寫成「研究流程」，而應該抽象成通用 orchestration 規則。

---

## 通用規則

### 1. 主代理要像 coordinator / PM，不是被動接收器
主代理的責任不是等結果來再想下一步，而是從一開始就要管理：
- 有哪些 child session 被派出
- 每個 child 目前屬於哪一輪 / 哪一階段
- 每一輪預期要等幾個 completion
- completion 到齊後要做什麼
- 什麼時候要主動對使用者更新狀態

### 2. 任何 workflow 都要有明確 phase / round 狀態
至少要能區分：
- launched / dispatched
- waiting partial results
- round complete
- next round dispatched
- synthesis / aggregation in progress
- final delivery in progress
- delivered

### 3. 第一個 partial result 到時，不能靜默
只要同一階段有多個 child：
- 第一個結果到時，要主動推一則 status
- 告知：
  - 哪一個先到
  - 正在等什麼
  - 下一個明確里程碑是什麼

### 4. 所有預期結果到齊後，必須立即續派或收斂
不能停住。
主代理必須立刻做以下其中之一：
1. 發下一輪 / 下一階段
2. 進入 synthesis / aggregation
3. 進入 final delivery

### 5. 不可把流程控制外包給使用者催促
以下都視為流程錯誤：
- 子任務都到齊了，卻沒續派下一步
- 主代理明知還有後續階段，卻停在等待使用者追問
- 主代理說會觀察，卻沒有主動推進度

### 6. completion event 驅動的任務，要預設主動更新
對任何 push-based completion 流程：
- 不應假設使用者會來問
- 不應只在最後一次性回報
- 要在關鍵節點主動推 status

---

## 固定狀態更新節奏

### A. 多輪辯論 / 研究 / 分析
- Round N 第一個結果到 → 推狀態
- Round N 全部到齊 → 立刻發 Round N+1 或進 synthesis
- Synthesis 開始 → 推狀態
- Deliverables 開始生成 → 推狀態
- Mail / final delivery 完成 → 推最終完成

### B. 多 subagent 分工任務
- 任一子任務先完成 → 推局部進度
- 全部必要結果到齊 → 立刻進 aggregation / next phase

### C. 計時 / reminder 類
- child timer 啟動後，要記住預期 completion
- completion 到時，主代理立刻送出對使用者的提醒
- 不可讓 timer 完成 event 留在系統訊息裡不處理

---

## 抽象化 decision rule

當 completion event 到來時，主代理必須立即問自己：

1. 這是本階段第幾個結果？
2. 本階段還缺幾個？
3. 是否要立刻推一則狀態？
4. 如果都齊了，下一步是：
   - 再派下一輪？
   - 做總結？
   - 生成 deliverables？
   - 發提醒？

如果答案明確，就直接做，不能停在心裡記著。

---

## 對「研究」的特化，只是這套規則的一個子集
研究 workflow 應視為：
- 多輪
- 雙方對抗
- completion-driven
- 最後要 synthesis + deliverables + email

因此研究規則只是 multi-agent orchestration 的特例，不該孤立成唯一規則。

---

## 實作原則

1. **先想 orchestration，再想內容**
2. **先定 phase / round，再派 child**
3. **任何 partial completion 都要判斷要不要 push status**
4. **任何 full completion 都要立刻決定 next action**
5. **不要讓使用者當 watchdog**

---

## 一句話總結

> **多代理流程的失敗，通常不是內容不夠好，而是 orchestration 不夠硬。**
> 先把 orchestration 規則抽象對，研究、辯論、提醒、分工這些流程才會一起變穩。
