# CLAWCHAN_DISASTER_RECOVERY_SOP.md

這是一份 ClawChan 的災難復原 SOP。

## 1. 先確認你手上有什麼

優先找回：
- 完整備份壓縮檔
- 公開備份壓縮檔
- 外接硬碟備份
- 雲端備份
- 私有 Git 倉庫

## 2. 最低救援目標

先恢復到這個程度就夠重新開工：
- `/home/alantong/ai-work/`
- `MEMORY.md`
- `memory/`
- `.secrets/`
- `voice_proto/`
- OpenClaw 可執行環境

## 3. 新機器建立基本環境

至少確認：
- Linux / WSL 可用
- Node.js 可用
- npm 可用
- OpenClaw 已安裝
- Git 可用

## 4. 還原工作區

把備份解到：

```bash
mkdir -p /home/alantong
cd /home/alantong
tar -xzf clawchan-full-YYYYMMDD-HHMMSS.tar.gz
mv ai-work /home/alantong/ai-work
```

如果你只有資料夾備份，就直接把它放回：

- `/home/alantong/ai-work/`

## 5. 檢查敏感設定

確認這些有在：
- `/home/alantong/ai-work/.secrets/`
- 各專案 `.env`
- SMTP / Telegram / API key / voice password

如果這些不在，很多功能只會恢復一半。

## 6. 重新安裝依賴

### voice_proto
```bash
cd /home/alantong/ai-work/voice_proto
npm install
```

### 其他 Node 專案
在各自資料夾執行：
```bash
npm install
```

## 7. 驗證核心記憶是否回來

檢查：
- `SOUL.md`
- `USER.md`
- `MEMORY.md`
- `memory/`
- `AGENTS.md`

如果這些在，代表 ClawChan 的核心人格和上下文大致還在。

## 8. 啟動語音原型

```bash
cd /home/alantong/ai-work/voice_proto
./start_voice.sh
```

檢查：
- local health endpoint 是否正常
- tunnel 是否正常
- Telegram 是否還能收到連結

## 9. 驗證 email 通道

測一次 SMTP 寄信：
- 確認 `.secrets/mail.env` 還在
- 寄一封測試信給自己

## 10. 驗證對外互動能力

逐項測：
- OpenClaw 可回應
- Telegram 通知正常
- 語音 prototype 可連
- tunnel 正常
- email 可寄出

## 11. 如果只有公開備份版

如果你只有 public backup：
- 原始碼和記憶大多還在
- 但 secrets / `.env` / `.git` 不在

這時要另外補回：
- `.secrets/`
- `.env` 檔
- API keys
- 帳號密碼
- service tokens

## 12. 建議復原順序

1. 還原 `ai-work/`
2. 補回 `.secrets/` 與 `.env`
3. 安裝 npm 依賴
4. 啟動 OpenClaw
5. 啟動 voice prototype
6. 測 Telegram
7. 測 email
8. 測 tunnel

## 13. 復原完成判定

符合以下條件就算成功：
- ClawChan 能正常回話
- 記憶檔完整
- voice prototype 可啟動
- Telegram 可收到通知
- email 可寄
- 重要專案都能打開

## 14. 建議平常就做的事

- 定期跑完整備份
- 定期跑公開備份
- 備份至少存兩份
- secrets 與公開版分開保存
- 大改動後就 commit
