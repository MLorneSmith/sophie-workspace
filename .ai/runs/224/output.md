## Implemented Bitwarden skill + helper

### Files created
- `/home/ubuntu/.openclaw/skills/bitwarden/SKILL.md`
  - Documents safe usage of `bw` CLI, including unlocking via `BW_PASSWORD` and session management via `BW_SESSION`.
  - Includes mandatory safety rules (avoid printing secrets; prefer piping; minimal field extraction).

- `/home/ubuntu/clawd/scripts/bitwarden-get-item.sh`
  - Helper script to fetch a Bitwarden item by name or id and output a selected field.
  - Defaults to `username` to avoid leaking secrets.
  - Requires explicit flags (`--password`, `--totp`, or `--json`) for sensitive output.

- `/home/ubuntu/clawd/docs/plans/2026-02-16-bitwarden-skill-design.md`
  - Minimal design document covering goal, constraints, approach, data flow, and security notes.

### Notes
- Verified `bw` and `jq` exist on host.
- Script marked executable.
