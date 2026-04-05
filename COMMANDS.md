# 常用指令集 (Common Commands)

## Whisky Photo (威士忌照片)
- **說明**：自動處理 Whisky 的成對照片 (a, t) 與警示圖 (Warning)。圖片會自動等比例縮小至寬度 480 像素或高度 850 像素以內。
- **指令**：
  ```bash
  /tmp/venv/bin/python /home/alantong/ai-work/process_whisky.py
  ```
- **使用流程**：
  1. 將 `編號a.jpg` 與 `編號t.jpg` 放入 `/mnt/g/tmp/whisky_photo/`。
  2. 更新 `/mnt/g/tmp/whisky_photo/filename.txt` (格式：編號_名稱)。
  3. 執行上述指令，檔案將依據 `filename.txt` 自動命名為 `編號_名稱.jpg`。
