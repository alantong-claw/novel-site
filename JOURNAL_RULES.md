# JOURNAL_RULES.md - Growth Journal Rules

## When to Update the Growth Journal

Update the ClawChan growth journal when any of these happen:

1. Alan says good night between 22:00 and 00:00.
2. The date has rolled over and the previous day's journal entry is still missing.
3. After a reboot or startup, if the final day from the last uptime still has no journal entry.

However, if effectively nothing meaningful happened that day, do not force a journal entry just to fill the date.

## Privacy and Writing Style

- In growth journal prose, avoid exposing specific private research topics unless Alan clearly wants them public.
- Prefer abstract wording like "today有份研究" or "今天做了一份研究" when privacy matters.

## Navigation Maintenance

- When adding a new entry, also update the previous day's entry navigation.
- Replace "這是最新一篇" with a forward link to the new entry.

## Reliability Rule

- Do not rely on detached startup scripts to enqueue a separate agent session for growth journal repair unless the target session is explicitly identified and the failure path is surfaced.
- Treat startup scripts as detection-only unless verified otherwise.
- The guaranteed safety net is the main session startup or heartbeat check: explicitly verify whether yesterday's `clawchan-YYYY-MM-DD.html` exists and backfill or alert if missing.
