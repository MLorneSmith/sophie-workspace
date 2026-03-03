# Current State — Mar 03, 2026 (02:34 EST)

## Agent Fleet — ALL OPERATIONAL
| Agent | Channel | Model | Loop | Status |
|-------|---------|-------|------|--------|
| Neo 🧑‍💻 | #neo | MiniMax M2.5 | 6 detection scripts | Running — queue empty |
| Kvoth 🔍 | #kvoth | MiniMax M2.5 | MC pickup hourly | Running |
| Hemingway ✍️ | #hemingway | Opus 4.6 | MC pickup 2-hourly | Running |
| Viral 🚀 | #viral | MiniMax M2.5 | MC pickup 2-hourly | Ready |
| Michelangelo 🎨 | #michelangelo | MiniMax M2.5 | MC pickup hourly | Ready |

## Bifrost Migration (Spec #2212) — 3/4 MERGED, 1 PLAN READY
- ✅ F1: Bifrost Deployment (#2213 → PR #2220) — MERGED
- ✅ F2: Gateway Client Refactor (#2214 → PR #2219) — MERGED
- ✅ F3: Langfuse Prompt Migration (#2215 → PR #2217) — MERGED
- ⏳ F4: Integration & Cleanup (#2216) — CodeRabbit plan ready, awaiting Neo pickup

## internal-tools Plans Ready
- #22 Content Board consolidation — plan ready
- #23 Agent Pipeline Status — plan ready, PR #24 has 7 CR comments
- #25 Cron Analytics skipped runs — plan ready, PR #26 has 1 CR comment (NaN bug + grid cols)

## Template Pipeline
- ✅ PR #2211 (Template Configs) — MERGED (tech debt: server-only import, truthy check)
- PR #2221 (Library Navigation) — open, 6 CR comments (thumbnails, company profiles tab)
- PR #2222 (Template Selection UI) — open, 10 CR comments (2 critical: hex color formatting)

## Neo Loop Improvements (Today)
- Fixed D-Bus, label names, stale locks
- Added cleanup-stale-locks.py, healthcheck, retry with escalation
- Extended multi-repo pickup (internal-tools + 2025slideheroes)
- Auto-reset on spawn failure (label restore + retry counter)

## Open PRs with CodeRabbit Feedback
- PR #2221 (Library Navigation) — 6 CR comments (thumbnails, company profiles tab)
- PR #2222 (Template Selection UI) — 10 CR comments (2 critical: hex color formatting)
- PR #24 (internal-tools: Agent Pipeline Status) — 7 CR comments
- PR #26 (internal-tools: Cron Analytics skipped runs) — 1 CR comment (NaN bug)

## Key Decisions Today
- Bifrost + Langfuse Cloud (over LiteLLM/Portkey)
- Cloudflare Tunnel for Vercel → EC2 connectivity
- Neo Job Queue: Option B (rabbit-status.py as JSON API)
- MC #684: Consolidate Content Board into Main Task Board

## Major Merges Yesterday (Mar 2)
- PR #2211 — Template Configs
- PR #2217 — Langfuse Prompt Migration
- PR #2219 — Gateway Client Refactor (Portkey → Bifrost)
- PR #2220 — Bifrost EC2 Deployment

## Blockers
- None critical — pipeline running smoothly

## Key Files
- Agent identities: ~/clawd/agents/{neo,kvoth,hemingway,viral,michelangelo}/
- Loop scripts: ~/clawd/scripts/neo-loop/
- Shared infra: ~/clawd/scripts/agent_loop/
- Multi-repo config: ~/clawd/scripts/neo-loop/common.py → WATCHED_REPOS
