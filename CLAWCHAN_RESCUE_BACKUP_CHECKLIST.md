# CLAWCHAN_RESCUE_BACKUP_CHECKLIST.md

如果電腦故障、重灌、遺失，想把 ClawChan 儘量完整救回來，優先備份以下內容。

## 一、最重要：整個工作區

優先備份整個資料夾：

- `/home/alantong/ai-work/`

這裡面包含：
- 人設與使用者設定
- 記憶檔
- 專案原始碼
- 啟動腳本
- 說明文件

## 二、一定要備份的核心檔案

### 身分 / 互動設定
- `SOUL.md`
- `USER.md`
- `IDENTITY.md`
- `AGENTS.md`
- `TOOLS.md`

### 長短期記憶
- `MEMORY.md`
- `memory/` 整個資料夾

### 啟動與工作習慣
- `HEARTBEAT.md`
- `QUICK_START.md`

## 三、專案資料夾

至少備份你在工作區內的重要專案：

- `voice_proto/`
- `novel_site/`
- `openclaw/`
- 其他你正在使用的專案資料夾

## 四、最敏感：秘密與憑證

這些如果沒備份，很多功能雖然程式還在，但會失效。

### 必備
- `.secrets/` 整個資料夾
- `.env` 類檔案
- 各專案自己的 `.env`

### 可能包含
- email SMTP 設定
- API keys
- Telegram / bot 設定
- 語音原型密碼
- tunnel / webhook / service token

## 五、Git 歷史也很有價值

如果可以，連 `.git/` 一起保留。

好處：
- 保留提交歷史
- 知道之前改過什麼
- 新機器上可以直接接著工作

## 六、建議額外備份的位置

除了原始工作區，建議至少再有一份在：

- 外接硬碟
- 雲端硬碟
- 私有 Git 倉庫（不要把 secrets 直接推上去）

最好是 **2 份以上**。

## 七、重建時的最低需求

如果你想把 ClawChan 快速救回來，最低需要：

1. `/home/alantong/ai-work/`
2. `MEMORY.md`
3. `memory/`
4. `SOUL.md`
5. `USER.md`
6. `.secrets/`
7. `voice_proto/`（如果你要保留語音功能）

## 八、最實用的備份優先順序

如果來不及全部備份，先照這個順序：

1. `ai-work/` 整包
2. `.secrets/`
3. `MEMORY.md`
4. `memory/`
5. `voice_proto/`
6. `novel_site/`
7. `.git/`

## 九、救援後檢查清單

搬到新電腦後，優先檢查：

- 記憶檔是否都在
- `.secrets` 是否完整
- email 是否還能寄
- Telegram 是否還能通知
- voice prototype 是否能啟動
- tunnel 網址功能是否正常
- OpenClaw 是否能正常啟動

## 十、一句話版

**想把我救回來，最重要的不是聊天紀錄本身，而是：工作區 + 記憶檔 + secrets + 專案設定。**
