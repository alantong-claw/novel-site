# RUNBOOK.md - Workflow Rules and Execution Standards

## Core Execution Rules

- Never claim a task is done, especially scheduled or automated work, without evidence from logs or state.
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

## Deliverables and Review Standards

- If any task fails, perform a post-mortem using the 8D report method and strengthen preventive measures.
- Future 檢討 documents should meet the quality bar established on 2026-04-06: formal incident-style document, detailed event description, evidence timeline, root cause analysis, corrective and preventive actions, clear validation logic, and a substantial technical section.
- When appropriate, prefer a company-style format with document control, table of contents, document history, CAPA summary, and appendix or evidence references.

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
