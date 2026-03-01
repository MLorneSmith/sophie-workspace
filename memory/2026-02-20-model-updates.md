# 2026-02-20 Model Updates

*Truncated 2026-03-01 — full history in git*

## Issue: Model ID Mismatch After Codex Re-auth

**Root cause:** OpenClaw config wizard replaced `gpt-5.2` with `gpt-5.3-codex` and `glm-4.7` with `glm-5` during re-auth, but 17 cron jobs still referenced old model IDs.

**Fixed:** All 17 cron jobs updated:
- 15 jobs: `openai-codex/gpt-5.2` → `openai-codex/gpt-5.3-codex`
- 2 jobs: `zai/glm-4.7` → `zai/glm-5`

## ZAI/GLM False Billing Error — Recurring Issue

Same issue as before. OpenClaw entered billing cooldown for ZAI provider.

**Root cause confirmed:** Coding plan endpoint (`/api/coding/paas/v4/`) returns 200 OK, regular endpoint (`/api/paas/v4/`) returns 429 "Insufficient balance." OpenClaw detects regular endpoint error and cools down provider.

**Fix:** Gateway restart clears in-memory cooldown. `kill -USR1` did NOT clear cooldown — needed full process kill + restart.

## Lesson
Model ID changes in config don't automatically update cron job configurations. After any model changes, audit cron jobs for stale model references.
