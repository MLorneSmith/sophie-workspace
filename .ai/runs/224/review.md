PASS

- Verified files exist:
  - /home/ubuntu/.openclaw/skills/bitwarden/SKILL.md
  - /home/ubuntu/clawd/scripts/bitwarden-get-item.sh
  - /home/ubuntu/clawd/docs/plans/2026-02-16-bitwarden-skill-design.md
- Good security posture: avoids printing secrets by default; sensitive output is opt-in.
- Script bash syntax OK; executable.
- Note (minor): `.login.totp` is typically the seed; if we need generated codes, use `bw get totp <id>`.
