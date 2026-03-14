# Bitwarden Skill (OpenClaw) — Minimal Design

Date: 2026-02-16

## Goal
Enable Sophie/OpenClaw to retrieve credentials from Bitwarden **safely** when needed for operational tasks (logins, API keys, TOTPs), without persisting secrets to disk or leaking them into chat logs.

## Constraints / Non-goals
- **No external network calls** beyond Bitwarden CLI’s normal behavior.
- Do **not** build a new secret store; Bitwarden remains the source of truth.
- Do **not** print secrets to chat by default.
- Keep scope small: documentation + a tiny helper script.

## Proposed Approach
### 1) Add a local skill folder
- Path: `/home/ubuntu/.openclaw/skills/bitwarden/SKILL.md`
- Content: “How to use `bw`”, preconditions, and mandatory safety rules.

This makes Bitwarden usage discoverable and repeatable, and it encodes the “don’t leak secrets” guardrails.

### 2) Provide a small helper script
- Path: `~/clawd/scripts/bitwarden-get-item.sh`
- Purpose: fetch an item by name/id and output a single selected field.
- Defaults to **non-sensitive** output (username).
- Requires explicit flags for sensitive output (`--password`, `--totp`, or `--json`).

## Data Flow
1. Load env vars: `source ~/.clawdbot/.env`
2. Ensure session:
   - If `BW_SESSION` is missing, run `bw unlock --passwordenv BW_PASSWORD --raw` and export the session.
3. Retrieve:
   - `bw list items --search …` (to find item)
   - `bw get item …` (to fetch)
4. Extract via `jq` to return only requested field.

## Security Notes
- Avoid writing secrets to files.
- Prefer piping secrets directly into the consuming command (stdin/env) rather than printing.
- Avoid `set -x` and any command that might echo secrets.

## Future Enhancements (only if needed)
- Redaction helper to display “first 4 chars + length” for debugging.
- Add optional `--org`/collection scoping if vault grows.
- Add a “copy to clipboard” mode for interactive sessions (platform-dependent).
