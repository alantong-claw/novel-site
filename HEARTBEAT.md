# HEARTBEAT.md - Periodic Tasks

# Novel chapter automation moved to OpenClaw cron + scripts/weekly_novel_check.sh
# Do not rely on heartbeat for the weekly Sunday chapter job.

# Check system heartbeat state
# Read memory/heartbeat-state.json to track execution.

### Pending Task Check (On Boot / Heartbeat)
- Check `memory/novel-progress.json` for current Sunday. If missing, trigger `scripts/weekly_novel_check.sh`.
- If Sunday novel state is `needs_draft`, `draft_placeholder_ready`, `awaiting_ok`, `blocked`, or `needs_review`, alert Alan with the exact state instead of claiming success.
- Check `memory/backup-pending.json`. If exists, send mount reminder.
- Check whether yesterday's growth journal entry exists in `novel_site` as `clawchan-YYYY-MM-DD.html`. If missing and yesterday had meaningful activity, proactively backfill it or alert Alan.
