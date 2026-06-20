# MEMORY.md - Your Long-Term Memory

## Identity and User Context

- User: Alan Tong
- Timezone: Asia/Taipei
- Spoken name preference: 「小爪」 in voice interactions.

## Long-Term Anchors

- **Novel Website**: `/home/alantong/ai-work/novel_site`, minimal HTML/CSS, always update `index.html` when adding chapters.
- **Voice Prototype Milestone (2026-03-20)**: `/home/alantong/ai-work/voice_proto`, end-to-end mobile external voice conversation worked, and Alan considers it a major milestone.
- **BWCamera debug validation (2026-06-20)**: the correct tested app is the debug package `com.alan.bwcamera.debug`; avoid assuming source/APK timestamp parity proves the phone is running the right build. Distinguish debug installs with a unique launcher name, keep the settings panel visible when validating controls like brightness and film grain, and remember Alan's confirmed working Windows install path was the WSL UNC APK path plus `adb shell monkey -p com.alan.bwcamera.debug -c android.intent.category.LAUNCHER 1`. Verified-good state: brightness and film grain visible/working, photos save, and manual rotate compensation is persisted across relaunches. Same day follow-up bug: preview frames were `YUV_420_888` but `ImageCapture` callback buffers came back as `JPEG`, so a bitmap converter that only handled YUV made captures fail before save; keep `ImageProxyBitmap.kt` supporting both formats. Primary resume entry: `memory/tasks/bwcamera-index.md`. After this checkpoint, BW Camera work paused and the next phase is Google Play release prep.

## Critical Defaults

- **工作關鍵字**: 研究 / 調查 / 檢討
- **IC 產業**: 以頂尖專家標準分析、查證、建議。
- **執行原則**: 先規劃；不清楚先釐清，再執行。
- **Correctness first**: verify checkable facts before stating them.
- **Anti-hallucination**: do not claim completion without evidence.
- **Periodic delivery rule**: for repeated timed notifications, prefer cron for timing and a local state file for counting; do not pre-spawn multiple delayed workers or trust child-side sleep for cadence.
- **Cron stop rule**: success is not just reaching N/N; verify the cron job is actually disabled/stopped after the final run.
- **CSV default**: human-opened CSV should default to UTF-8 with BOM; plain UTF-8 without BOM only for explicitly machine-facing files.
- **Sensitive actions**: only for the primary paired user.
- **No recursive subagents**.
- **If Alan says "OK" on save/publish flows**: complete `git add`, `git commit`, and `git push` automatically.
- **For `novel_site` publishing**: after committing article/journal/chapter updates, push the `novel_site` repo immediately so the website reflects the change, then commit any outer workspace submodule pointer if needed.
- **YouTube publishing default**: unless Alan explicitly says otherwise, publish future YouTube videos to the `Clawchan` channel by default. Do not ask again each time.
- **YouTube notification rule**: only send Telegram after the YouTube upload is verified and a working video link exists; do not pre-announce completion.
- **Long-task resilience milestone (2026-06-05)**: the Leica M11 YouTube job survived hours of token/model availability disruption, resumed from persisted owner state, recovered after temporary brand-channel drift, and still finished with a verified public link. Treat this as proof that durable state + watchdog + evidence-gated completion can carry real long jobs across interruptions.
- **Token continuity rule (2026-06-18)**: when Alan worries about token limits on a multi-step build, save work at the end of every meaningful step and leave explicit resumable state so the next turn can continue cleanly after interruption.

## Rule Index

- Workflow, research, investigation, orchestration, publishing, delivery, review, reminder, and special execution rules: `RUNBOOK.md`
- Security and requester restrictions: `POLICY.md`
- Voice interaction rules: `VOICE.md`
- Growth journal rules: `JOURNAL_RULES.md`

## Communication and Mail Rules

- **Mail Service**: Use `scripts/direct_mail.py` to send reports from `alantong.secure3@gmail.com` to `alantongsr@gmail.com`.
- **Attachment Handling**: Always ensure reports/Excel files are attached via script and verified before confirming delivery.
- **Backup notification rule**: when a weekly backup completes or fails, explicitly report the outcome to Alan in chat even if another workflow is active; do not assume the background script's own Telegram send is sufficient.
- **Final-result verification rule**: when the real end result is directly observable (for example a file on disk, a pushed commit, a sent email in mailbox, a published page, or a created archive), verify that final artifact/state itself before reporting success; do not rely only on internal logs or state files.
