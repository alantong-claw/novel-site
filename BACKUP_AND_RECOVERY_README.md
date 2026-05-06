# BACKUP_AND_RECOVERY_README.md

目前已建立以下檔案：

## 1. 完整私密備份腳本
- `backup_clawchan.sh`
- 用途：備份整個工作區，包含 `.secrets/`、`.git/`、記憶檔與專案設定

執行方式：
```bash
cd /home/alantong/ai-work
bash backup_clawchan.sh
```

## 2. 公開安全版備份腳本
- `backup_clawchan_public.sh`
- 用途：排除 `.secrets/`、`.env*`、`.git/`，方便同步到較公開的位置

執行方式：
```bash
cd /home/alantong/ai-work
bash backup_clawchan_public.sh
```

## 3. 瘦身版備份腳本
- `backup_clawchan_slim.sh`
- 用途：排除 `.git/`、`venv/`、`.venv/`、`.venv-ppt/`、`tmp/`、`work_tmp/` 等可重建或暫存資料，節省空間

執行方式：
```bash
cd /home/alantong/ai-work
bash backup_clawchan_slim.sh
```

## 4. 救援清單
- `CLAWCHAN_RESCUE_BACKUP_CHECKLIST.md`

## 5. 災難復原 SOP
- `CLAWCHAN_DISASTER_RECOVERY_SOP.md`

## 建議使用方式

### 平常
- 重要改動後：先 commit
- 每隔幾天：跑一次完整備份
- 想節省空間、保留可重建內容以外的核心資料：跑一次 slim backup
- 想放到比較公開的位置：跑一次 public backup
- 若要跑完整週備份流程（含狀態紀錄與保留策略）：
```bash
bash /home/alantong/ai-work/scripts/run_weekly_backup.sh
```

這會：
- 執行完整私密備份
- 寫入 `memory/backup-state.json`
- 寫入 `memory/backup-run.log`
- 只保留最新 5 份 `.tar.gz` 完整備份
- 只保留最新 1 份展開目錄備份

若要避免聊天/exec 回合過長被中斷，可改用背景模式：
```bash
bash /home/alantong/ai-work/scripts/start_weekly_backup_bg.sh
bash /home/alantong/ai-work/scripts/check_weekly_backup_bg.sh
```

### 出事時
1. 找最新完整備份
2. 依 SOP 還原
3. 補回 secrets / .env
4. 測 email / Telegram / voice
