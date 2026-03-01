# 2026-02-08 — Feedback URLs

*Truncated 2026-03-01 — full history in git*

## Feedback System Deployed
- Cloudflare Worker at `slideheroes-feedback.slideheroes.workers.dev`
- HMAC-signed URLs — no auth needed, work from email AND Discord
- Clicking 👍/👎 shows "Thanks for your feedback!" page
- Forwards to Mission Control via CF Access service tokens

## Integrated into Briefing
- Data script generates signed feedback URLs for every feed item
- Template uses `[👍](url) · [👎](url)` format

## Lesson
When sourcing from `~/.clawdbot/.env`, always pipe through `tr -d '\r\n'` to strip carriage returns.
