# Backup 的 Telegram OK 後一鍵執行流程

目前已具備：
- 週日 09:30 Telegram 提醒掛載 G: drive
- 備份等待旗標：`memory/backup-pending.json`
- 設旗標腳本：`scripts/mark_backup_pending.sh`
- 標準備份腳本：`scripts/run_weekly_backup.sh`
- 完成後回報腳本：`scripts/run_weekly_backup_and_report.sh`
- OK 後處理腳本：`scripts/handle_backup_ok.sh`

## 工作流

1. 週日提醒送出前/時，先執行：
```bash
bash /home/alantong/ai-work/scripts/mark_backup_pending.sh
```

2. Alan 在 Telegram 回 `OK`

3. 小爪直接執行：
```bash
bash /home/alantong/ai-work/scripts/handle_backup_ok.sh
```

這會：
- 檢查今天是否真的有 pending backup
- 執行完整備份
- 更新 `memory/backup-state.json`
- 發 Telegram 完成訊息
- 將 pending 狀態改成 done

## 備註

這一版已經把「OK 後執行 backup」封裝完成。剩下的只是對話層在收到 `OK` 時自動呼叫這支腳本。
