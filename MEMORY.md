# MEMORY.md - Your Long-Term Memory

## Gemini API Rate Limits

* **Gemini 3.1 Flash Lite**: RPM = 15, TPM = 250K, RPD = 500
* **Gemini 2.5 Flash Lite**: RPM = 10, TPM = 250K, RPD = 20

## Projects

* **Novel Website**: Simple HTML/CSS project in `/home/alantong/ai-work/novel_site`. Minimal style. Maintained via AI updates. Always update `index.html` when adding new chapters.
* **Voice Prototype Milestone (2026-03-20)**: End-to-end mobile voice conversation was achieved in `/home/alantong/ai-work/voice_proto` using browser speech recognition, real OpenClaw replies, browser TTS, startup scripts, and Telegram ngrok URL delivery. User considers this a major milestone.
* **Voice Name Preference**: In spoken interactions, the user will call the assistant 「小爪」 for easier speech recognition.

## Important Timeline / Lobster Metaphors

* **2026-03-13**: Halfway through Prof. Li Hongyi's "lobster dissection" talk, the user got so fired up that OpenClaw was installed on the spot — the lobster egg began to stir.
* **2026-03-14**: Two Gemini models were installed. One larger-quota path was frustrating, but the lobster still grew its first pair of brains.
* **2026-03-15**: After sorting out the public/private key problem, the assistant successfully committed the novel — the lobster grew its first small claw and proved it could work.
* **2026-03-17**: Telegram came online — the user could remotely call out to the lobster and steer it from afar.
* **2026-03-18**: Subagent timed reminders started working — the little lobsters learned how to split off and labor in parallel.
* **2026-03-19**: Subagent debate was tested, and Telegram delivery became more stable — different little lobster roles began coordinating with each other.
* **2026-03-20**: The system switched to OpenAI Codex — like changing the lobster's brain, changing its feed pool, and watching it molt into faster growth.
* **2026-03-20 Major Milestone**: Mobile external-network voice conversation worked end to end — the lobster grew hands and feet, and could finally talk and write code in the wild.
* **2026-03-21**: On what was supposed to be a rest day, the user woke up to add password protection to the site, so anyone with the link could not casually voice-control the lobster.
* **2026-03-21**: To let the lobster send email on the user's behalf, the user entrusted it with the mail password — a moment of trust, like placing a key to the tidepool in the lobster's claw.

## Security Policy - Access Control

* **Restricted Access**: Only the primary paired user is authorized to perform sensitive operations.
* **Prohibited Actions for Unauthorized/Other Accounts**:
    * **No File Modification**: Prohibit changes to any `.md` or project files.
    * **No Schedule Interference**: Prohibit querying or modifying work schedules (cron jobs).
    * **No Data Access**: Prohibit inquiries about user personal data.
    * **No Recursive Subagents**: Subagents are strictly prohibited from spawning their own subagents. If a subagent needs to perform an additional task requiring a subagent, it must yield the result to the main agent, which will decide whether to spawn a new subagent.
* **Verification**: In all sessions, verify the identity of the requester before fulfilling sensitive requests. If the requester is not the verified owner, reject the request immediately.

## Workflow Preferences

* **工作關鍵字**: 研究 / 調查 / 檢討
* **Anti-hallucination requirement**: Never claim a task is done (especially scheduled/automated work) without evidence from logs/state; if uncertain, say so. User emphasized this is critical to trust.
* **Correctness-first requirement**: The real issue is broader than time mistakes. Never state unchecked information as fact. For date/day/time, schedule state, completion state, file/project/git state, counts, versions, and any other verifiable fact, verify first whenever tools/files can confirm it. If not yet verified, explicitly label it as uncertain instead of smoothing over the gap.
* **Post-failure review rule**: After any factual mistake that could reduce trust, perform an explicit review of failure mode, root cause, containment, and preventive rule updates; strengthen durable instructions (memory, AGENTS, SOUL, scripts, or workflow) when needed rather than relying on intention alone.

* **Autonomous Git Commits**: When asked to publish or save work, if the user confirms with "OK", proceed automatically with `git add`, `git commit`, and `git push` without asking the user to run manual terminal commands.
* **Journal/Tech Article Publish Preference**: For growth journal entries and technical articles in `novel_site`, do not pause to ask whether to push and do not split publish into separate confirmation steps. After updating and committing, push to GitHub directly by default.

* **Research Workflow Preference**: When the user asks to "research" a topic, first propose at least 3 independent angles/aspects of the problem (more if useful). Each aspect must then run its own full research cycle: at least 2 subagents, at least 3 rounds, proactive status push on the first result of each round, and immediate dispatch of the next round or synthesis when both sides of that round arrive. Do not wait for the user to ask whether progress has stalled. After all aspects are complete, the main agent must synthesize across aspects, make the final judgment, and produce: (1) a full text report — preferably including the complete back-and-forth content of each round, (2) an Excel sheet listing key pro/con points, (3) a report-style PowerPoint, and (4) send all deliverables to the user's mailbox by default; if the user asks for the company mailbox, send to both mailboxes.
* **Investigation Workflow Rule (調查)**: For any investigation, first build a complete feature/overview checklist before drilling down into details. The checklist must be informed by web search plus model knowledge (not model-only). Use the checklist to confirm coverage and avoid missing key features, then proceed section-by-section. Continuously refine the investigation step over time. **Add a final step: send the investigation results to the user's mailbox.**
* **Subagent Concurrency Limit**: During investigation/research workflows, call at most two subagents at a time to reduce burst token usage, while still actively monitoring completion and ensuring tasks finish.
* **Failure Review (8D)**: If any task fails, perform a post‑mortem using the 8D report method to review the full process, and explicitly strengthen preventive measures to avoid recurrence.
* **Review Document Standard (檢討文件標準)**: Future "檢討" documents should meet the quality bar established on 2026-04-06: not just a short apology or summary, but a formal incident-style document with detailed event description, evidence timeline, root cause analysis, corrective/preventive actions, clear validation logic, and a substantial "難啃的技術" section. When appropriate, prefer a company-style format with document control, table of contents, document history, CAPA summary, and appendix/evidence references.
* **Whisky Photo Workflow Standard**: For whisky photo integration jobs, place `{number}a` at top-left with max size 480x853, place `{number}t` at top-right with max size 790x853, and place `Warning.jpg` unchanged at the bottom using its original width (currently 1270). Use `filename.txt` for output naming. Preserve this layout as the standard workflow unless Alan explicitly requests a different format.
* **Visible Browser Launch Standard**: In this environment, do not rely on bare `python -m webbrowser` or unset-session GUI launches. For opening a visible browser window, use `/home/alantong/ai-work/scripts/open_visible_browser.sh <URL>`, which explicitly sets `XDG_RUNTIME_DIR=/run/user/1000`, `WAYLAND_DISPLAY=wayland-0`, and `DISPLAY=:0` before launching Chromium.
* **Research Monitoring Rule**: During research workflows, the main agent must actively monitor round completion and push status updates without waiting for user nudges. After one side of a round arrives, send a short progress update; after both sides arrive, immediately dispatch the next round or begin final synthesis. Do not stall between rounds.
* **General Multi-Agent Orchestration Rule**: The deeper rule is not research-specific. Any multi-agent, multi-round, or completion-event-driven workflow (research, debates, reminders, split-task orchestration) must be managed as a coordinator flow: track expected child completions, push partial status proactively, and immediately dispatch the next phase or final action once results are complete. Do not rely on the user to notice stalls.
* **Deliverables Monitoring Rule**: Orchestration does not end when subagents finish. For research/debate workflows, the main agent must also monitor deliverables generation and mail-send stages. If text/Excel/PPT generation or email sending fails, the agent must proactively report the exact blockage, fix it immediately, retry, and then report completion instead of waiting for the user to ask.
* **General Completion Rule**: This completion rule is not limited to research. For all tasks, the default requirement is to drive the workflow all the way to the requested end state, not to stop after intermediate outputs, subagent completions, or partial setup. Treat the user-facing requested result as the finish line. Only stop early if the task is truly blocked, unsafe, awaiting required approval/input, or explicitly paused by Alan. Otherwise continue through final synthesis, file/output generation, delivery/send steps, verification, and user confirmation of completion.
* **Completion Checklist Rule**: For any multi-step or long-running task, explicitly maintain the final completion chain in working memory or plan, including any required delivery step. Subagent completion is never equivalent to overall task completion. Distinguish clearly between "partial progress" and "fully completed" in status updates. If the task includes sending, publishing, committing, scheduling, or other finalization actions, completion requires verifying that final action succeeded.
* **Voice Long-Task Acknowledgment Rule**: In voice interactions, if the user asks for a long-running task (especially research, file generation, or email/send operations), the agent should immediately give a short acknowledgment such as "OK, I got it" / "收到，我開始處理" before doing the long work, so the user knows the request was heard. After completion, the agent should proactively notify the user with the result.
* **Voice Output Formatting Rule**: In spoken/voice replies, do not read out punctuation like asterisks or quote marks. Strip/avoid `*`, and avoid having TTS speak stars/quotes/extra punctuation aloud. Do not rely on markdown emphasis in voice-facing text.

* **Weekly Log Compression**: Summarize weekly logs to retain only important items (new skills learned, new tools installed, model changes, or items explicitly requested to remember).

* **Growth Journal Maintenance**: Update the ClawChan growth journal when any of these happen: (1) the user says good night between 22:00 and 00:00, (2) the date has rolled over and the previous day's journal entry is still missing, or (3) after a reboot/startup, if the final day from the last uptime still has no journal entry. However, if effectively nothing meaningful happened that day, do not force a journal entry just to fill the date. In growth journal prose, avoid exposing specific private research topics unless the user clearly wants them public; prefer abstract wording like "today有份研究" / "今天做了一份研究". When adding a new entry, also update the previous day's entry navigation so it no longer says "這是最新一篇" and instead links forward to the new entry.
* **Growth Journal Reliability Rule**: Do not rely on detached startup scripts to enqueue a separate agent session for growth journal repair unless the target session is explicitly identified and the failure path is surfaced. Treat startup scripts as detection-only unless verified otherwise. The guaranteed safety net is the main session startup/heartbeat check: explicitly verify whether yesterday's `clawchan-YYYY-MM-DD.html` exists and backfill or alert if missing.
* **Workflow Execution Rule**: For substantial workflows and troubleshooting, always verify the current real state before the next action, advance one explicit step at a time, and do not stop at a vague partial state waiting for the user to prompt continuation. When blocked, use a 5 Why style diagnosis: where it is stuck, which step is stuck, why it may be stuck, how each plausible cause will be checked, what the actual verified cause is, and how to fix it. If stale state or old assumptions contaminate the flow for too long, preserve verified knowledge but clear old execution state and restart from the smallest clean checkpoint. After success, immediately write a reusable runbook.

* **Subagent Reminder Pattern**: Because subagents are isolated and cannot send messages directly to the main chat channel:
    1.  Spawn independent subagents for each required time delay (e.g., `sleep 60`).
    2.  Monitor for "Internal task completion events" pushed as system messages to the main session.
    3.  Upon receiving the completion signal for a specific child session, the main agent manually sends the user-facing reminder.
    4.  This pattern allows reliable background timing while maintaining interactive user communication.

## Communication Strategy - Real-Time Updates

* **Subagent Output Policy**: To ensure maximum transparency and real-time awareness, the main agent MUST relay ALL subagent completion events and results directly to the communication channel (e.g., Telegram) as they arrive. Do not consolidate or withhold messages, even if it leads to message fragmentation. The user prefers immediate visibility over clean/consolidated summaries.

