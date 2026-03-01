# 2026-02-12 Model Rebalancing Strategy

*Truncated 2026-03-01 — full history in git*

## Problem
- Opus handling ~87% of all turns
- GPT-5.2 Codex only 5% — exclusively overnight coding sub-agents
- Hitting Claude usage limits while OpenAI subscription underutilized

## Strategy Implemented

### Strategy 1: Expand Sub-Agent Delegation
Spawn GPT sub-agents for any task that doesn't need conversational back-and-forth:
- Research & analysis
- Writing first drafts
- Data processing
- Code reviews
- Content extraction

### Strategy 3: Model-Split by Time of Day
- Daytime (active): Opus for direct conversation
- Overnight + background: GPT for all sub-agents and cron jobs
- Heartbeats: GPT (routine checks)

### Strategy 4: GPT for All Cron Jobs
10 jobs switched to GPT-5.2:
- Nightly Backlog (11pm), Nightly Initiatives (2am), Morning Brief (7am)
- MC ↔ Todoist Sync, Feed Refresh, Supabase → BigQuery
- OpenClaw Backup, qmd Index, Cineplex Pick, Date Night Pick

3 jobs stayed on GLM: Presentation Pipeline, Catalog Expansion, Dinner Menu

## Target Split
**Opus ~40%, GPT ~45%, GLM ~15%** (from current 87/5/7)

## API Usage Tracking System
Built tracking for external paid APIs (Perplexity, Supadata, DataForSEO):
- `ApiUsageLog` Prisma model
- `POST /api/v1/usage/log` endpoint
- `GET /api/v1/usage` endpoint
- Updated `/api/v1/costs` to show real tracked data
- `scripts/log-api-usage.sh` helper
