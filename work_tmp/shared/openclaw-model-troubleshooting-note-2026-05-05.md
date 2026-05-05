# OpenClaw 模型故障排查 SOP（2026-05-05）

## 這次事件的結論

- `~/.openclaw/openclaw.json` 是目前主配置。
- `~/.openclaw/openclaw-heavy.json` 目前保留即可，但應視為**歷史檔**，不是主生效來源。
- 這次真正卡住的主因，不是 `openclaw.json` 沒吃到，而是 **session persisted state** 還留著 `gpt-5.2-codex`。
- 已確認 `agent:main:main` 的 session model 曾殘留 `gpt-5.2-codex`，後來已改回 `gpt-5.4`。

## 實用心智模型：3 層

### 第 1 層，Session 現行狀態（最常害人）
常見位置：
- `~/.openclaw/agents/main/sessions/sessions.json`

特性：
- 既有 session 可能記住舊 model。
- 改 `openclaw.json` 不一定會立刻覆蓋已存在 session。
- `/model`、UI 重選模型、某些 session patch，都可能寫進這層。

### 第 2 層，特定 override
可能來源：
- per-agent override
- channel override
- cron / isolated job payload model
- heartbeat / hook model
- UI 或 `session_status(model=...)` 類的 session model override

### 第 3 層，全域預設
主檔：
- `~/.openclaw/openclaw.json`

這裡定義：
- `agents.defaults.model.primary`
- `agents.defaults.model.fallbacks`

目前建議順序：
```json
"primary": "openai-codex/gpt-5.4",
"fallbacks": [
  "openai-codex/gpt-5.3",
  "google/gemini-3.1-flash-lite-preview"
]
```

## 這次事件的正確判讀

如果出現：
- 改完 `openclaw.json`
- restart gateway 後也沒報 config error
- 但對話仍卡在舊 model，例如 `gpt-5.2-codex`

優先懷疑：
- **舊 session state 沒被覆蓋**

不要第一時間就認定：
- `openclaw.json` 沒吃到
- `openclaw-heavy.json` 還在偷偷生效

## 3 分鐘排查順序

### Step 1，先看當前 session 實際 model
先用：
- `openclaw status`
- 或 `session_status`

重點不是看你“希望它用什麼”，而是看它“現在真的在跑什麼”。

### Step 2，看全域預設
確認：
- `~/.openclaw/openclaw.json`

重點欄位：
- `agents.defaults.model.primary`
- `agents.defaults.model.fallbacks`

### Step 3，懷疑 session persisted state
看：
- `~/.openclaw/agents/main/sessions/sessions.json`

搜尋關鍵字：
- 舊 model 名稱，例如 `gpt-5.2-codex`
- session key，例如 `agent:main:main`

### Step 4，最後才看舊歷史檔
例如：
- `~/.openclaw/openclaw-heavy.json`

除非有證據顯示某個流程真的在讀它，否則先視為歷史檔。

## 建議操作原則

### 原則 A
**改 `openclaw.json` 是改預設，不保證覆蓋既有 session。**

### 原則 B
如果 UI 的 model 重選會立刻生效，代表它可能不只改 config，也順手改了 session state。

### 原則 C
若 CLI restart 回傳非 0，但 service 最後仍是 running，不要只看 exit code，要再看：
- `openclaw gateway status`
- `systemctl --user status openclaw-gateway`

### 原則 D
如果 model 問題排除後仍出錯，再查 auth / oauth 層，例如 refresh token 問題。

## 這次已確認的重點

- `openclaw-heavy.json`：保留，但降級為歷史檔
- `openclaw.json`：主配置
- `agent:main:main`：曾殘留 `gpt-5.2-codex`
- 現在 Telegram 直聊 session 已正常使用 `gpt-5.4`

## 短版一句話

**OpenClaw 模型怪事，先查 session state，再查 openclaw.json，最後才懷疑 heavy.json。**
