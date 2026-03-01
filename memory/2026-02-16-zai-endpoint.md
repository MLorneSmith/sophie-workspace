# 2026-02-16 — ZAI/GLM Endpoint Issue

*Truncated 2026-03-01 — full history in git*

## Root Cause Confirmed
- **Coding Plan endpoint** (`/api/coding/paas/v4/`) → HTTP 200, works
- **Standard endpoint** (`/api/paas/v4/`) → HTTP 429, "Insufficient balance"

OpenClaw's built-in ZAI provider was hitting the standard endpoint, which rejects Coding Plan API keys. This triggered billing cooldown that blocked the working endpoint too.

## Fixes Applied
1. `models.mode: "merge"` — forces Coding Plan endpoint to override built-in
2. ZAI billing cooldown → 18 seconds (was hours)
3. Global billing cooldown → 36 seconds
4. `commands.restart: true` — gateway restart capability

## Key Lesson
Mike's subscription is **Coding Plan only**. The standard endpoint always returns "Insufficient balance" for Coding Plan keys. This is documented in MEMORY.md as a critical warning.
