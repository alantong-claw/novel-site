# Workflow Execution Rules (2026-04-09)

## Purpose
A reusable workflow and troubleshooting method for substantial tasks, especially multi-step automations, investigations, publishing flows, and any job where stale state, wrong assumptions, or weak verification can waste time or reduce trust.

## 1. Verify the current real state before the next action
Do not advance based on expectation.

Before each meaningful step, verify:
- the current actual location/state (for example URL, file state, git state, scheduler state, process state)
- the current actual evidence (for example page text, visible element, log output, return value, field content)

If the state is not verified, do not proceed.

## 2. Advance one explicit step at a time
Do not assume a whole chain will succeed.

For each step, define:
- the current step
- the success condition
- the success evidence

Only move to the next step after the current one is verified.

## 3. Do not stop and wait for the user to remind you
If work is incomplete, continue the diagnosis or next concrete check instead of pausing at a vague status such as:
- still processing
- not yet verified
- no new result yet

When blocked, actively do the next smallest useful check unless user help is specifically required.

You may stop only when:
- the work is complete, or
- the exact user help needed is clear and specific

## 4. Use a 5 Why style diagnosis when stuck
When a workflow stalls, answer these questions explicitly:
1. Where is it stuck?
2. Which exact step is stuck?
3. Why might it be stuck?
4. What are the plausible causes?
5. How will each plausible cause be checked?
6. What is the actual verified cause?
7. How will it be fixed?

Separate:
- guesses
- verified causes
- fixes

## 5. If stale state contaminates the flow for too long, clear and restart cleanly
When an effort has been polluted by old sessions, old scripts, wrong assumptions, or half-patched execution paths, do not keep patching blindly.

Keep:
- verified knowledge
- real checkpoints
- known-good selectors, commands, and evidence

Clear:
- stale sessions
- old browser/profile state
- broken controllers
- misleading half-finished scripts
- invalid assumptions

Then rebuild from the smallest clean checkpoint.

## 6. After success, immediately write a runbook
Once a workflow is fully verified, document:
- the correct checkpoints
- the verification conditions for each step
- the correct selectors/commands
- the success evidence
- known traps
- the minimal reusable execution flow

This prevents relearning the same path later.

## 7. Keep mainline execution separate from later process review
When a real task is ongoing, finish the mainline work first.

Process reflection, methodology critique, and future guardrails can be noted during the work, but should be turned into formal review material after the mainline task is completed.

This keeps momentum and prevents endless meta-discussion from stalling delivery.

## Short Version
1. Verify real state before acting.
2. Advance one step at a time.
3. Do not stall waiting for user reminders.
4. Use 5 Why style diagnosis when blocked.
5. Clear stale state if the flow is contaminated too long.
6. Write a runbook immediately after success.
7. Separate execution from later review.
