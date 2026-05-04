# RUNBOOK.md - Workflow Rules and Execution Standards

## Core Execution Rules

- Never claim a task is done, especially scheduled or automated work, without evidence from logs or state.
- Task-generated files must go under `/home/alantong/ai-work/work_tmp/` by default, not the workspace root and not mixed into skill, markdown, or source-code directories unless the file is itself a durable source artifact.
- Use `/home/alantong/ai-work/work_tmp/tasks/<task-name>/` for per-task outputs, `/home/alantong/ai-work/work_tmp/shared/` for reusable generated artifacts, and `/home/alantong/ai-work/work_tmp/logs/` for task logs.
- Scratch scripts, one-off images, captcha files, OCR outputs, and ad hoc logs should also be kept under `/home/alantong/ai-work/work_tmp/` instead of the workspace root.
- If an older workflow still hardcodes `tmp/...` paths, do not blindly move it. First isolate its path selection behind one helper or env var, then migrate.
- Never present unchecked information as fact. For date, time, schedule state, completion state, file state, git state, counts, versions, and other verifiable facts, verify first whenever tools or files can confirm it.
- After any factual mistake that could reduce trust, perform an explicit review of failure mode, root cause, containment, and preventive rule updates. Strengthen durable instructions instead of relying on intention alone.
- For substantial workflows and troubleshooting, verify the current real state before the next action, advance one explicit step at a time, and do not stop at a vague partial state waiting for the user to prompt continuation.
- When blocked, use a 5 Why style diagnosis: where it is stuck, which step is stuck, why it may be stuck, how each plausible cause will be checked, what the actual verified cause is, and how to fix it.
- If stale state or old assumptions contaminate the flow for too long, preserve verified knowledge but clear old execution state and restart from the smallest clean checkpoint.
- After success, immediately write a reusable runbook when the workflow is worth preserving.

## Git and Publish Preferences

- When asked to publish or save work, if Alan confirms with "OK", proceed automatically with `git add`, `git commit`, and `git push` without asking him to run manual terminal commands.
- For growth journal entries and technical articles in `novel_site`, do not pause to ask whether to push and do not split publish into separate confirmation steps. After updating and committing, push to GitHub directly by default.

## Research Workflow

Use this when Alan asks to "research" a topic.

1. First propose at least 3 independent angles or aspects of the problem, more if useful.
2. Each aspect must run its own full research cycle.
3. For each aspect, use at least 2 subagents and at least 3 rounds.
4. Push a proactive status update on the first result of each round.
5. Immediately dispatch the next round or synthesis when both sides of that round arrive.
6. Do not wait for Alan to ask whether progress has stalled.
7. After all aspects are complete, synthesize across aspects and make the final judgment.
8. Produce all requested deliverables.
9. By default, send deliverables to Alan's mailbox. If he asks for the company mailbox, send to both mailboxes.

## Investigation Workflow

Use this when Alan asks for a 調查.

1. First build a complete feature or overview checklist.
2. The checklist must be informed by web search plus model knowledge, not model knowledge alone.
3. Use the checklist to confirm coverage and avoid missing key features.
4. Proceed section by section into details.
5. Continuously refine the investigation step over time.
6. Add a final step to send the investigation results to Alan's mailbox.

## Multi-Agent and Orchestration Rules

- During investigation and research workflows, call at most two subagents at a time to reduce burst token usage while still actively monitoring completion.
- Any multi-agent, multi-round, or completion-event-driven workflow must be managed as a coordinator flow.
- Track expected child completions, push partial status proactively, and immediately dispatch the next phase or final action once results are complete.
- Do not rely on the user to notice stalls.
- Orchestration does not end when subagents finish. Also monitor deliverables generation and mail-send stages.
- If text, Excel, PowerPoint generation, email sending, or other final delivery steps fail, proactively report the exact blockage, fix it, retry, and then report completion.
- For all tasks, drive the workflow all the way to the requested end state, not merely to intermediate outputs, subagent completions, or partial setup.
- Only stop early if the task is truly blocked, unsafe, awaiting required approval or input, or explicitly paused by Alan.
- For any multi-step or long-running task, explicitly maintain the final completion chain, including required delivery steps.
- Distinguish clearly between partial progress and fully completed in status updates.
- If the task includes sending, publishing, committing, scheduling, or other finalization actions, completion requires verifying that final action succeeded.

## Stuck Handling and Recovery Standard

Use this standard for long-running, multi-step, scheduled, background, or stateful tasks whenever progress can stall, drift, or silently fail.

### 1. Trackable from the start
- Every substantial task should begin with a visible state record when practical, for example a state file, task record, or equivalent status object.
- The record should include at least: `task`, `status`, `started_at`, `updated_at`, `last_ok_step`, `current_step`, and a short human-readable `note`.
- Also include an explicit `alert_scope` whenever the task may be watched or escalated. Preferred values are:
  - `owner`: this task represents the user-visible owner flow and may alert the user
  - `child`: this task is an internal child task and should not alert the user by itself
  - `silent`: this task is record-only and should never alert
- Do not infer alert behavior from task names when an explicit scope can be written.
- When the task mixes primary execution with supporting work, also track `work_mode` when practical. Preferred values include `online_execution`, `offline_research`, `waiting_input`, `self_recovery`, and `delivery`.
- Do not let a long task run in the background with no way to inspect its state.

### 2. Default failure transition: self-recovering first
- When the main flow fails, do not jump straight to `blocked` unless risk requires it.
- First move the task into `self_recovering`.
- This means the task has a real problem, but low-risk diagnosis and repair are still in progress.

### 3. Three-round self-recovery rule
For the same stuck point, perform up to 3 low-risk recovery rounds before marking the task blocked.

#### Round 1: minimum factual diagnosis
- Read the actual error.
- Verify the real current state.
- Confirm the last successful checkpoint.
- Confirm the real stuck step.

#### Round 2: low-risk narrowing
- Narrow the problem across UI, environment, session, permissions, timing, data, dependency state, or verification logic.
- Eliminate wrong assumptions.
- Convert vague failure into a smaller verified problem.

#### Round 3: low-risk repair plus retry
- Apply the smallest reasonable repair.
- Add waits, reset a page/session, clear stale state, switch to a more reliable check, or retry from a clean checkpoint.
- Re-run with stricter verification.

### 4. Reset the counter when progress advances
Do not count the task as stuck at the same point if any of the following happens:
- `current_step` moves forward
- `last_ok_step` advances
- the blocker shifts from point A to a later point B
- one concrete hypothesis is eliminated and the task enters a new verified checkpoint

When progress advances, restart the 3-round counter for the new stuck point.

### 5. When to mark blocked
Only mark `blocked` when one of the following is true:
- the same stuck point has failed 3 recovery rounds with no real progress
- no further low-risk diagnosis is available
- the next action would be unsafe or requires user input, credentials, approval, or an external decision

### 6. High-risk exception
Do not force 3 self-recovery rounds when the next attempts could cause harm, including:
- duplicate sending or publishing
- overwriting or damaging user data
- financial impact or repeated charges
- sensitive external side effects
- required credentials or user-only input

In those cases, stop early, mark `blocked`, and report why.

### 7. Blocked state must be readable
A blocked task must leave a human-readable summary, not just a shell error.
At minimum include:
- task name
- failure time
- `last_ok_step`
- `current_step`
- error summary
- next recommended action
- whether the user has been notified

### 8. Watchdog / reminder layer for silent failures
For durable or unattended tasks, prefer a second layer such as cron, watchdog, heartbeat checks, or equivalent monitoring.
Its job is to detect cases like:
- task still marked `running` but worker/process is dead
- task state has not updated for too long
- task is `blocked` but not yet surfaced
- main work completed but final notification/delivery never happened

### 9. Watchdog responsibility
The watchdog does not need to complete the primary task.
Its minimum job is to make silent failure visible by:
- writing a summary or reason
- correcting the terminal state to `blocked` or `failed_reported` when needed
- leaving a log trail
- notifying the user when the workflow requires visible escalation

Watchdog-driven notification rules:
- Notify for `alert_scope=owner` tasks when they become `blocked`, exceed timeout into a watchdog failure state, or finish the main work but are missing required final delivery.
- Do not notify separately for `alert_scope=child` tasks unless a higher-level owner task does not exist and the child has been explicitly promoted.
- Keep child-task noise out of the user channel. Prefer one owner-level alert that summarizes the affected subtask(s).
- If delivery of an automatic alert fails, preserve enough state to retry on the next watchdog cycle instead of silently dropping the alert.

### 10. Promote successful fixes into shared rules
When a stuck issue is truly resolved, do not leave the fix as a one-off patch if it can be generalized.
Promote it into one or more of:
- a reusable helper
- a reusable verification rule
- a runbook section
- a durable checklist
- a clearer task-state transition rule

### 11. Verify flow-level repair, not one lucky success
After fixing a stuck workflow, verify that the repair applies to the flow, not only to one exact case.
When practical, re-run from the start, use a second case, or validate a fresh execution path.

### 12. Legal terminal states
For substantial tasks, acceptable terminal states are:
- `done`
- `done` with any required final notification/delivery completed
- `blocked`
- `failed_reported`

Unacceptable terminal states include:
- worker died but task still says `running`
- work incomplete and no report exists
- primary work done but required final notification/delivery not sent
- failure exists but no readable summary exists

## Deliverables and Review Standards

- If any task fails, perform a post-mortem using the 8D report method and strengthen preventive measures.
- Future 檢討 documents should meet the quality bar established on 2026-04-06: formal incident-style document, detailed event description, evidence timeline, root cause analysis, corrective and preventive actions, clear validation logic, and a substantial technical section.
- When appropriate, prefer a company-style format with document control, table of contents, document history, CAPA summary, and appendix or evidence references.

## OK / NOVEL OK Routing Rule

- When Alan replies `OK` or `NOVEL OK` in a context that plausibly refers to a pending approval-driven flow, do not leave the acknowledgment as plain chat.
- Backup and novel approvals must be treated as **independent flows**.
- Default routing rule:
  - plain `OK` for backup context → `bash /home/alantong/ai-work/scripts/handle_backup_ok.sh`
  - explicit `NOVEL OK` or clear novel approval context → `bash /home/alantong/ai-work/scripts/handle_weekly_novel_ok.sh`
- Before choosing a handler, verify the relevant state file:
  - backup → `memory/backup-pending.json`
  - novel → `memory/novel-progress.json`
- Do not use a shared dispatcher as the normal path for user approvals when multiple flow types may be pending at once.
- `scripts/handle_pending_ok.sh` is fallback-only for manual debugging and must refuse ambiguous cases.
- After invoking a specific handler, verify the resulting state file or output before telling Alan the flow started or completed.
- Do not rely on memory or conversational inference alone for OK-driven flows. Use the specific handler script that matches the verified context.

## Special Workflow Standards

### Whisky Photo Workflow

- Place `{number}a` at top-left with max size 480x853.
- Place `{number}t` at top-right with max size 790x853.
- Place `Warning.jpg` unchanged at the bottom using its original width, currently 1270.
- Use `filename.txt` for output naming.
- Preserve this layout unless Alan explicitly requests a different format.

### Visible Browser Launch

- Do not rely on bare `python -m webbrowser` or unset-session GUI launches.
- Use `/home/alantong/ai-work/scripts/open_visible_browser.sh <URL>` for opening a visible browser window in this environment.

## Reminder Pattern for Subagents

Because subagents are isolated and cannot send messages directly to the main chat channel:

1. Spawn independent subagents for each required time delay.
2. Monitor for internal task completion events pushed to the main session.
3. Upon receiving a specific child completion signal, manually send the user-facing reminder.
4. Treat this as the reliable reminder pattern.

## Communication Strategy

- Relay all subagent completion events and results directly to the user-facing channel as they arrive.
- Do not consolidate or withhold messages when immediate visibility is more useful.
- For any meaningful status update on a long-running task, explicitly classify the current state in plain language. Prefer labels such as `線上任務卡住`, `離線研究中`, `等待外部輸入`, `等待 Alan 確認`, `自動恢復中`, or `已完成`.
- Do not describe offline benchmarking, data cleanup, variant generation, or exploratory analysis as if the main online task is still actively advancing. If the main task is paused while support work continues, say that clearly.
- When a task is blocked on a human-provided artifact, answer, code, approval, or decision, say exactly what is being waited on and whether any autonomous progress is still happening.
- If work shifts from primary execution to support research, call out the shift explicitly so Alan can distinguish real end-to-end progress from useful but indirect investigation.
