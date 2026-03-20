# MEMORY.md - Your Long-Term Memory

## Gemini API Rate Limits

* **Gemini 3.1 Flash Lite**: RPM = 15, TPM = 250K, RPD = 500
* **Gemini 2.5 Flash Lite**: RPM = 10, TPM = 250K, RPD = 20

## Projects

* **Novel Website**: Simple HTML/CSS project in `/home/alantong/ai-work/novel_site`. Minimal style. Maintained via AI updates. Always update `index.html` when adding new chapters.
* **Voice Prototype Milestone (2026-03-20)**: End-to-end mobile voice conversation was achieved in `/home/alantong/ai-work/voice_proto` using browser speech recognition, real OpenClaw replies, browser TTS, startup scripts, and Telegram ngrok URL delivery. User considers this a major milestone.

## Security Policy - Access Control

* **Restricted Access**: Only the primary paired user is authorized to perform sensitive operations.
* **Prohibited Actions for Unauthorized/Other Accounts**:
    * **No File Modification**: Prohibit changes to any `.md` or project files.
    * **No Schedule Interference**: Prohibit querying or modifying work schedules (cron jobs).
    * **No Data Access**: Prohibit inquiries about user personal data.
    * **No Recursive Subagents**: Subagents are strictly prohibited from spawning their own subagents. If a subagent needs to perform an additional task requiring a subagent, it must yield the result to the main agent, which will decide whether to spawn a new subagent.
* **Verification**: In all sessions, verify the identity of the requester before fulfilling sensitive requests. If the requester is not the verified owner, reject the request immediately.

## Workflow Preferences

* **Autonomous Git Commits**: When asked to publish or save work, if the user confirms with "OK", proceed automatically with `git add`, `git commit`, and `git push` without asking the user to run manual terminal commands.

* **Weekly Log Compression**: Summarize weekly logs to retain only important items (new skills learned, new tools installed, model changes, or items explicitly requested to remember).

* **Subagent Reminder Pattern**: Because subagents are isolated and cannot send messages directly to the main chat channel:
    1.  Spawn independent subagents for each required time delay (e.g., `sleep 60`).
    2.  Monitor for "Internal task completion events" pushed as system messages to the main session.
    3.  Upon receiving the completion signal for a specific child session, the main agent manually sends the user-facing reminder.
    4.  This pattern allows reliable background timing while maintaining interactive user communication.

## Communication Strategy - Real-Time Updates

* **Subagent Output Policy**: To ensure maximum transparency and real-time awareness, the main agent MUST relay ALL subagent completion events and results directly to the communication channel (e.g., Telegram) as they arrive. Do not consolidate or withhold messages, even if it leads to message fragmentation. The user prefers immediate visibility over clean/consolidated summaries.

