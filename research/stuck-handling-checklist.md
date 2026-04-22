# Stuck Handling Checklist

Use this checklist for long-running, multi-step, scheduled, background, or stateful tasks.

---

## 1. Before starting
- [ ] Define the task clearly
- [ ] Define what counts as success
- [ ] Create or identify a state record if the task is substantial
- [ ] Record `started_at`, `last_ok_step`, `current_step`, and a short `note`

---

## 2. When the task first fails
- [ ] Do not jump straight to `blocked`
- [ ] Move to `self_recovering` if the next checks are low-risk
- [ ] Record the real error
- [ ] Verify the real current state
- [ ] Identify the last successful checkpoint
- [ ] Identify the real stuck step

---

## 3. Three-round self-recovery
### Round 1
- [ ] Read the actual error/log
- [ ] Verify the actual state, not the expected state
- [ ] Confirm where the flow is truly stuck

### Round 2
- [ ] Narrow the cause: UI / timing / data / environment / session / permission / dependency / verification logic
- [ ] Eliminate at least one wrong assumption

### Round 3
- [ ] Apply the smallest low-risk fix
- [ ] Retry from the smallest clean checkpoint
- [ ] Re-verify with strict success criteria

---

## 4. Reset rule
If any of the following happens, restart the 3-round count:
- [ ] `current_step` moved forward
- [ ] `last_ok_step` advanced
- [ ] blocker moved to a later step
- [ ] a concrete hypothesis was eliminated and a new verified checkpoint was reached

---

## 5. Blocked decision
Mark `blocked` only if:
- [ ] the same stuck point failed 3 rounds with no real progress
- [ ] no further low-risk diagnosis remains
- [ ] or the next action is high-risk / needs approval / needs user input / needs credentials

If blocked:
- [ ] write a readable summary
- [ ] include `last_ok_step`
- [ ] include `current_step`
- [ ] include the error summary
- [ ] include the next recommended action
- [ ] include whether the user has been notified

---

## 6. High-risk stop conditions
Do not force 3 recovery rounds if the next attempt might:
- [ ] duplicate send/publish
- [ ] overwrite data
- [ ] cause external side effects
- [ ] cost money / repeat charges
- [ ] require credentials or user-only input

---

## 7. Watchdog / reminder layer
For unattended or durable tasks:
- [ ] add a watchdog / cron / heartbeat / periodic check when appropriate
- [ ] detect stale `running` states
- [ ] detect dead workers/processes
- [ ] detect `blocked` states that were not surfaced
- [ ] detect missing final notification/delivery

---

## 8. After the fix works
- [ ] promote the fix into a helper / rule / runbook / checklist if reusable
- [ ] verify this was a flow-level repair, not a one-off lucky pass
- [ ] re-run from a clean start or validate with another case when practical

---

## 9. Legal end states
- [ ] `done`
- [ ] `done` plus required final delivery/notification completed
- [ ] `blocked`
- [ ] `failed_reported`

Never leave the task in:
- [ ] dead but still `running`
- [ ] failed with no readable summary
- [ ] partially complete but presented as fully complete
