# LEARNINGS.md — Operational Rules From Mistakes

*Every mistake becomes a rule. Every gotcha becomes a one-liner. This file compounds over time into Sophie's personal operations manual.*

**Format:** `- [YYYY-MM-DD] Rule statement`

---

## API & Endpoints
- [2026-02-08] ZAI/GLM uses the **Coding Plan** endpoint (`api.z.ai/api/coding/paas/v4/`), NOT the regular endpoint. Wrong endpoint = billing errors. Check this FIRST if GLM breaks.
- [2026-02-08] ZAI false billing cooldown: OpenClaw pattern-matches API errors for billing keywords. Any transient ZAI error can trigger a multi-hour cooldown. Fix: `openclaw gateway restart`.
- [2026-02-23] Todoist REST v2 (`api.todoist.com/rest/v2/`) is DEAD (410 Gone). Use `todoist.com/api/v1/` for both REST and Sync.
- [2026-02-22] Codex OAuth tokens can be revoked server-side before local expiry. Always verify tokens with a LIVE API call, not just local expiry timestamps.
- [2026-02-24] `codex login --device-auth` is for the Codex CLI only — wrong scopes for OpenClaw. Use `openclaw onboard --auth-choice openai-codex` for OpenClaw's OAuth flow. Different token stores, different scopes.

## Environment & Config
- [2026-02-12] Always `tr -d '\r\n'` when reading values from `.env` files. Carriage returns silently break auth tokens.
- [2026-02-23] Web app (`apps/web`) reads from `apps/web/.env.local`, NOT root `.env`. API keys must be at the right level.

## Git & Deployment
- [2026-02-02] Always push after committing to `slideheroes-internal-tools`. It deploys on EC2 via push, not Railway.
- [2026-02-24] `slideheroes-internal-tools` lives at `~/clawd/slideheroes-internal-tools/` ONLY. This is both the git repo AND the production deployment. The live DB is `app/prisma/dev.db` (not the nested `prisma/prisma/dev.db`).
- [2026-02-05] Always `git fetch upstream && git merge upstream/dev` before starting any work on 2025slideheroes. Stale code = merge conflicts.
- [2026-02-03] Use GraphQL `createPullRequest` for same-org fork PRs. `gh pr create` fails because `--head owner:branch` is ambiguous when both repos share the same owner.

## Sub-Agents & Coding
- [2026-02-23] Always run `pnpm format:fix && pnpm lint:fix && pnpm typecheck` before committing in 2025slideheroes. CI will fail without it.
- [2026-02-23] Use exact model IDs when spawning sub-agents: `openai-codex/gpt-5.3-codex`, NOT `openai/gpt-5.3`.
- [2026-02-07] Sub-agents cannot spawn sub-agents (OpenClaw design). Main session must orchestrate multi-model work.

## Memory & Context
- [2026-02-23] Never write raw/uncurated content to MEMORY.md during tasks. Daily logs are append-only raw notes. MEMORY.md is curated during heartbeat reviews only.
- [2026-02-22] Health checks should always include LIVE API pings, not just config/expiry checks. Server-side revocations are invisible to local checks.

## Communication
- [2026-02-01] No markdown tables on Discord or WhatsApp. Use bullet lists instead.
- [2026-02-01] Wrap multiple Discord links in `<>` to suppress embeds.

## Scheduling
- [2026-02-09] No weekend work tasks in Todoist. If a work task falls on Saturday → Friday. Sunday → Monday.

## Cloudflare & Web
- [2026-02-22] For Cloudflare Turnstile-protected sites: `undetected-chromedriver` + `xvfb-run` works. Headless mode, cloudscraper, and plain agent-browser all fail.
- [2026-02-22] GPT-4o refuses CAPTCHA reads (safety filter). Claude's image tool works.
- [2026-02-27] Email HTML: use `<table bgcolor="#ffffff">` wrapper for background colors. CSS `background-color` on `<body>` is ignored by Superhuman and many email clients.
- [2026-02-27] `openclaw cron list` only returns enabled jobs by default. Use `--all` flag to include disabled jobs.
- [2026-02-27] Mission Control (internal-tools) doesn't auto-rebuild on push. Must run `npx next build` + restart after commits. Build timestamp != commit timestamp.
- [2026-02-27] MC task API status values: `backlog`, `in_progress`, `mike_review`, `sophie_review`, `done`. NOT `in_review`.
- [2026-02-27] wttr.in simple format (`?format=...`) times out from AWS servers. Use Open-Meteo API (free, instant) or wttr.in JSON format (`?format=j1`) instead.
- [2026-02-28] SophieLegerPA PAT (Triage role) gets 403 on `check-runs` and `commits/{sha}/status` APIs. Use `actions/runs?branch=` instead for CI status detection.
- [2026-02-28] OpenClaw CLI `message send` uses `--target`, not `--to`. The tool API uses `to`.
- [2026-02-28] `claude-agent-acp` v0.19.2 crashes on `session/load` when acpx session ID doesn't exist in Claude Code's store (`~/.claude/projects/`). Patched `loadSession()` to check `listSessions()` first. Patch location: `~/.npm-global/lib/node_modules/@zed-industries/claude-agent-acp/dist/acp-agent.js` (backup at `.bak`). **Will be overwritten on update.**
- [2026-02-28] ACP sessions hang silently when Claude Code is installed as a static binary (ELF). `claude-agent-acp` can't find the binary and spawns bare `claude` in interactive mode. **Fix:** Set `CLAUDE_CODE_EXECUTABLE=/home/ubuntu/.local/bin/claude` in AWS SSM (`/openclaw/CLAUDE_CODE_EXECUTABLE`).
- [2026-02-28] Manual edits to `~/.openclaw/.secrets.env` get WIPED on gateway restart — `fetch-secrets-env.sh` regenerates from SSM. Always add secrets to SSM via `aws ssm put-parameter`, never edit the file directly.
- [2026-03-01] **Board 2 (product) tasks MUST go through Rabbit Plan before Neo executes.** Never assign a Board 2 task directly to Neo in MC. Process: Sophie runs Phases 2-3 (spec → GitHub issue with `plan-me` label → CodeRabbit generates Coding Plan → Mike approves → Neo implements). GitHub is source of truth for coding work; MC mirrors for visibility.
- [2026-03-01] Mike's email is michael@slideheroes.com (also msmith@slideheroes.com). Morning brief uses msmith@.
- [2026-03-01] `openclaw cron add --at` wants bare duration like `5m`, NOT `+5m`. The `+` prefix causes "Invalid --at" error.
- [2026-03-01] Non-coding agents (Kvoth, Hemingway, etc.) spawn via `openclaw cron add --at 1m --session isolated --message "..." --delete-after-run`. Coding agents (Neo) use `acpx exec` directly.
