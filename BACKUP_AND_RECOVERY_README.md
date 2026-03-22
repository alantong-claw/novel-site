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

## 3. 救援清單
- `CLAWCHAN_RESCUE_BACKUP_CHECKLIST.md`

## 4. 災難復原 SOP
- `CLAWCHAN_DISASTER_RECOVERY_SOP.md`

## 建議使用方式

### 平常
- 重要改動後：先 commit
- 每隔幾天：跑一次完整備份
- 想放到比較公開的位置：跑一次 public backup

### 出事時
1. 找最新完整備份
2. 依 SOP 還原
3. 補回 secrets / .env
4. 測 email / Telegram / voice
