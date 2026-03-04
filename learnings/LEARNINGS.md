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
- [2026-03-02] When sourcing .secrets.env in cron, use `set -a; . .secrets.env; set +a` — without `set -a`, variables aren't exported to child processes (Python subprocess, openclaw CLI). Adding Mem0 plugin made OPENAI_API_KEY required at config load time, breaking any cron job that calls `openclaw` CLI.
- [2026-03-02] get-model-usage.sh was only scanning agents/main/sessions/ — missed all sub-agent sessions (coder, devops, data-pipeline). Fixed to scan agents/*/sessions/. MiniMax usage went from 0 → 4.6M tokens (was the biggest user).
- [2026-03-02] **Neo Loop: `systemd-run --user` fails in cron context** — cron doesn't inherit `DBUS_SESSION_BUS_ADDRESS` or `XDG_RUNTIME_DIR`. Must set them explicitly: `DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/{uid}/bus` and `XDG_RUNTIME_DIR=/run/user/{uid}`.
- [2026-03-02] **Neo Loop: GitHub labels must match exactly** — repo uses `status:in-progress`, not `in-progress`. Always check `gh label list` before assuming label names. Added healthcheck that validates required labels exist.
- [2026-03-02] **Neo Loop: Active-runs locks must be cleaned up on failure** — if `process-spawn-queue.py` crashes before cleanup, locks persist forever and block all retries. Added `cleanup-stale-locks.py` cron (every 15 min) to clear entries older than 45 min with no running PID.
- [2026-03-02] **Neo Loop: Queue processor needs its own cron** — when multiple tasks are queued simultaneously, only the first gets processed. The trigger mechanism fires once per queue_spawn() but subsequent triggers see "ACP already running" and exit. Added `*/10` cron for `process-spawn-queue.py` to drain remaining tasks.
- [2026-03-02] **Neo Loop: acpx exit code ≠ actual outcome** — acpx can report non-zero exit even when the agent successfully created a branch and PR. Added PR-existence check as secondary success validation.
- [2026-03-02] **Neo Loop: Failed spawns must reset labels for retry** — `process-spawn-queue.py` now resets `status:in-progress` → `plan-me` on failure, removes from processed list, and tracks retry count (max 3). After 3 failures, escalates to `status:blocked` + Discord notification. Prevents tasks from getting stuck in limbo.
- [2026-03-02] **CodeRabbit: New repos need `issue_enrichment.planning` config** — PR review config alone won't generate coding plans from `plan-me` labeled issues. Must explicitly add `issue_enrichment.planning.auto_planning` with label triggers to `.coderabbit.yaml`.
- [2026-03-02] **Neo Loop: Multi-repo checklist** — When adding a new repo to Neo's pipeline: (1) add to `WATCHED_REPOS` in common.py, (2) ensure `.coderabbit.yaml` has `issue_enrichment.planning`, (3) create `plan-me`, `status:in-progress`, `status:blocked` labels, (4) verify CodeRabbit GitHub App is installed on the repo.

## Bifrost
- [2026-03-03] Bifrost stores plugin config in SQLite DB (`/etc/bifrost/config.db`, table `config_plugins`). DB overrides `config.json` on restart. Must update BOTH when changing plugin config.
- [2026-03-03] `fetch-secrets-env.sh` must run as ubuntu user (has `aws --profile openclaw`). Running as root writes 0 vars and wipes the env file. Bifrost systemd uses `ExecStartPre=/bin/su - ubuntu -c /path/to/script`.
- [2026-03-03] Bifrost requires `provider/model` format for model names (e.g., `openai/gpt-4o-mini`, `anthropic/claude-sonnet-4-20250514`).
- [2026-03-03] Bifrost has no pre-built binaries. Build from source: clone repo, `npm install && npm run build` in `ui/`, then `go build` in `transports/` with local replace directives for all plugin modules.
