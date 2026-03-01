# 2026-02-03 — Email README Clarification

*Truncated 2026-03-01 — full history in git*

## Issue Fixed
Email skill had path references to `.claude/skills/email-style/` which was incorrect. Updated to relative paths.

## Annotation System Built
- `scripts/annotate_email.py` — rule-based technique detector (12 patterns)
- All 118 Superhuman emails now annotated (100% coverage)
- Auto-determines email type (welcome, nurture, story, newsletter, sales, onboarding)
