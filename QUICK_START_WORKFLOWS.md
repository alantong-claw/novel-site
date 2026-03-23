# QUICK START WORKFLOWS

這是一頁式操作手冊，整理 ClawChan / 小爪目前已打通、可重複使用的流程入口。

---

## 1. PowerPoint：研究整理 → 簡報 → 寄信

### Edge AI + TV 控制 + OpenClaw（完整版）
```bash
bash /home/alantong/ai-work/scripts/send_edge_ai_tv_report.sh
```

### Edge AI + TV 控制 + OpenClaw（精簡版 v2）
```bash
bash /home/alantong/ai-work/scripts/send_edge_ai_tv_report_compact_v2.sh
```

### 通用 `.pptx` 附件寄送器
```bash
set -a && source /home/alantong/ai-work/.secrets/mail.env
/home/alantong/ai-work/.venv-ppt/bin/python \
  /home/alantong/ai-work/slides/scripts/send_ppt_mail.py \
  /path/to/file.pptx \
  "郵件主旨" \
  "郵件內文" \
  "alantongsr@gmail.com"
```

---

## 2. Excel：報表 → 寄信

### Edge AI + TV 控制 + OpenClaw（Excel 報表）
```bash
bash /home/alantong/ai-work/scripts/send_edge_ai_tv_report_xlsx.sh
```

### Excel 工作模式測試報表
```bash
bash /home/alantong/ai-work/scripts/send_excel_test_report.sh
```

---

## 3. 研究 bundle：PowerPoint + Excel 一起寄

### 新竹實驗高中科學班 vs 資優班
```bash
bash /home/alantong/ai-work/scripts/send_hsinchu_science_vs_gifted_bundle.sh
```

這會同時：
- 生成 PowerPoint
- 生成 Excel 比較表
- 分別寄到 `alantongsr@gmail.com`

---

## 4. Weekly novel 自動化

### 正式週更檢查腳本
```bash
bash /home/alantong/ai-work/scripts/weekly_novel_check.sh
```

### 開 shell 後的補檢腳本
```bash
bash /home/alantong/ai-work/scripts/weekly_novel_startup_check.sh
```

### 狀態檔
- `/home/alantong/ai-work/memory/novel-progress.json`

---

## 5. Backup 流程

### 完整週備份（含狀態與 retention）
```bash
bash /home/alantong/ai-work/scripts/run_weekly_backup.sh
```

### 完成後回報 Telegram
```bash
bash /home/alantong/ai-work/scripts/run_weekly_backup_and_report.sh
```

### 標記等待 Alan 回 OK
```bash
bash /home/alantong/ai-work/scripts/mark_backup_pending.sh
```

### 收到 Telegram 的 `OK` 後處理 backup
```bash
bash /home/alantong/ai-work/scripts/handle_backup_ok.sh
```

### 狀態檔
- `/home/alantong/ai-work/memory/backup-state.json`
- `/home/alantong/ai-work/memory/backup-pending.json`
- `/home/alantong/ai-work/memory/backup-run.log`

---

## 5.5 語音連結 / 狀態檢查

### 查目前語音服務與 cloudflared link
```bash
bash /home/alantong/ai-work/scripts/check_voice_link.sh
```

---

## 6. Office / Python 環境

### Office 工具鏈安裝
```bash
bash /home/alantong/ai-work/scripts/install_office_tools.sh
```

### Excel 工具鏈安裝
```bash
bash /home/alantong/ai-work/scripts/install_excel_tools.sh
```

### PowerPoint / Excel Python venv
- `/home/alantong/ai-work/.venv-ppt`

---

## 7. 重要工作流文件

- `/home/alantong/ai-work/slides/WORKFLOW.md`
- `/home/alantong/ai-work/slides/README.md`
- `/home/alantong/ai-work/excel/README.md`
- `/home/alantong/ai-work/BACKUP_AND_RECOVERY_README.md`
- `/home/alantong/ai-work/research/backup-ok-flow.md`

---

## 8. 目前已打通的能力

- 研究整理 → PowerPoint → email
- 研究整理 → Excel → email
- PowerPoint + Excel bundle 一起寄
- Weekly novel 自動化
- backup pipeline（含 pending / state / report）
- Telegram 端批准 exec

---

## 9. 研究任務的固定節奏

當 Alan 說「研究某主題」時，預設要照這個節奏：

1. 至少開兩個 subagent
   - A：提出方案 / 架構 / 做法 / 正向主張
   - B：提出反對意見 / 風險 / 缺口 / 反證
2. 至少 3 輪（除非已明顯收斂）
3. 每輪第一個結果到時，要主動推一則進度
4. 每輪雙方結果都到時，要立刻發下一輪或進 synthesis
5. 不可停在等待 Alan 追問
6. 最後一定要輸出：
   - 完整文字檔
   - Excel 正反重點表
   - PowerPoint 報告版
   - email 寄送

參考文件：
- `/home/alantong/ai-work/research/MULTI_AGENT_ORCHESTRATION.md`
- `/home/alantong/ai-work/research/RESEARCH_ORCHESTRATION.md`

---

## 10. 使用原則

1. 能用固定腳本，就不要臨時拼長命令
2. 常用流程優先走 `scripts/` 裡的標準入口
3. 一次只處理一個 approval，避免 approval id 過期互撞
4. 大改動後，記得 commit

---

## 11. 如果未來忘了從哪開始

先看這份：
- `/home/alantong/ai-work/QUICK_START_WORKFLOWS.md`

再看細節文件：
- `slides/WORKFLOW.md`
- `BACKUP_AND_RECOVERY_README.md`
