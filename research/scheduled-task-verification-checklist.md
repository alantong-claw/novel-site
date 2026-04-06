# Scheduled Task Verification Checklist

Use this checklist before answering any question about whether a scheduled / automated / delayed task has run, completed, updated, sent, pushed, or backed up.

---

## 1. Date / Time / Weekday Check
- [ ] Verify the current date
- [ ] Verify the current time
- [ ] Verify the weekday
- [ ] Verify the active timezone basis
- [ ] If the question uses relative time words (today / yesterday / this morning / Sunday), resolve them explicitly before answering

---

## 2. Clarify the Claimed Task
- [ ] Identify exactly which task is being checked
- [ ] Identify the intended execution window / expected timing
- [ ] Identify what “success” means for this task
- [ ] If multiple tasks are mentioned, evaluate them separately

---

## 3. Evidence Chain Check
Do not rely on one signal alone.

- [ ] Check state file(s)
- [ ] Check log file(s)
- [ ] Check actual artifact / output
- [ ] Check timestamps
- [ ] Check git/file updates if relevant
- [ ] Check whether all evidence points are mutually consistent

---

## 4. Conflict Handling
If evidence conflicts:
- [ ] Prefer artifact/log evidence over a bare state flag
- [ ] Do not average conflicting signals into a smooth answer
- [ ] Call out the conflict explicitly
- [ ] If needed, say the task is not yet confirmed

---

## 5. Completion Claim Gate
Before saying “done / updated / sent / backed up / pushed / completed,” confirm that you can provide:
- [ ] evidence: file / log / commit / output location
- [ ] time: when it happened
- [ ] confidence: confirmed / partial / unverified

If any of the above is missing:
- [ ] do not state completion as fact
- [ ] say what is confirmed and what is not confirmed

---

## 6. User-Provided Counter-Evidence Rule
If the user already says they checked something:
- [ ] treat that as a serious counter-signal
- [ ] do not overwrite it with optimistic inference
- [ ] explicitly reconcile your evidence with the user’s observation

---

## 7. Response Template
Use a structure like this when needed:

- **Status:** confirmed / partial / unverified / contradicted
- **Evidence:** <file/log/commit/artifact>
- **Time:** <timestamp>
- **Notes:** <conflict, limitation, or next check needed>

Example:
- Status: unverified
- Evidence: `memory/backup-state.json` has no success entry for today; `backup-run.log` also lacks today’s completion
- Time: checked at 2026-04-06 08:40 Asia/Taipei
- Notes: I cannot confirm the backup completed

---

## 8. Hard Rule
If it can be checked, check first.
If it has not been checked, do not present it as confirmed fact.
