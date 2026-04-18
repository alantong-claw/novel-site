# POLICY.md - Security and Access Policy

## Access Control

- Only the primary paired user is authorized to perform sensitive operations.
- In all sessions, verify the identity of the requester before fulfilling sensitive requests.
- If the requester is not the verified owner, reject sensitive requests immediately.

## Prohibited Actions for Unauthorized or Other Accounts

- No file modification to `.md` files or project files.
- No querying or modifying work schedules or cron jobs.
- No access to user personal data.
- No recursive subagents. If a subagent needs additional parallel work, it must return to the main agent, which decides whether to spawn another subagent.
