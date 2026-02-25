# Archived from MEMORY.md — 2026-02-23
# These sections are still searchable via QMD but no longer loaded on every session.

## Council v2 - Multi-Agent Deliberation (Feb 7 2026)

Built multi-model council debates in Mission Control. Claude/GPT/GLM deliberate on topics.

**Key architecture insight:** Sub-agents cannot spawn sub-agents (Clawdbot design). Main session must orchestrate true multi-model debates directly.

**Trigger:** Mission Control UI → POST /api/council/debates with `run: true` → webhook → main session spawns 3 models

**Location:** `~/clawd/slideheroes-internal-tools/app/src/app/council/`

---

## Mission Control Reference Design (Feb 2026)

Mike shared reference screenshots from **Henry AI / yourhenry.ai** as the design to emulate for our Mission Control dashboard.

**Key elements:**
- Dark theme, polished second-brain aesthetic
- Top nav with tabs: Tasks, Projects, Memory, Captures, Docs, People
- Tasks view: Kanban board (Recurring → Backlog → In Progress → Review) + Activity feed
- Docs view: Left sidebar with search/filters, file list, markdown document viewer
- Task cards: title, description, linked resource, project badge, timestamp

**Reference files saved:**
- `/home/ubuntu/clawd/reference-designs/mission-control-tasks-view.png`
- `/home/ubuntu/clawd/reference-designs/mission-control-docs-view.png`
- `/home/ubuntu/clawd/reference-designs/MISSION-CONTROL-SPEC.md`

---

## slideheroes-internal-tools CI/CD (Feb 2 2026)

**Pipeline:** Push → CI (GitHub Actions) → Webhook → Auto-deploy to EC2 → Discord notification

**Key components:**
- `.github/workflows/ci.yml` — lint, typecheck, test, build
- `/api/deploy` webhook endpoint — validates GitHub signature, triggers deploy.sh
- `deploy.sh` — pulls, builds, restarts service, sends Discord notification
- `dev-server.sh` — on-demand dev server on localhost:3002 for UI debugging

**Secrets/Config:**
- `DEPLOY_WEBHOOK_SECRET` in `.env.local` — validates GitHub webhook
- `DISCORD_DEPLOY_WEBHOOK` in `.env.local` — notifications to #inbox-sophie
- GitHub webhook configured to send `workflow_run` events to `https://internal.slideheroes.com/api/deploy`
- Cloudflare Access bypass rule for `/api/deploy` path

**Service:** `internal-tools.service` (systemd) on port 3001, proxied via Caddy at `internal.slideheroes.com`

---

## Mission Control Docs Strategy (Feb 2 2026)

MC Docs = the **collaboration layer** between Mike and Sophie. Not personal knowledge (→ Notion), not operational state (→ Sophie workspace).

**4 Document Categories:**
1. **Project Contexts** — Briefs, specs, decision logs (tag: `project`)
2. **Sophie Deliverables** — Recommendations, research, proposals for Mike's review (tag: `deliverable`)
3. **Working Agreements** — How we collaborate, processes, standards (tag: `agreement`)
4. **Reference (Shared)** — APIs, accounts, setup guides we both need (tag: `reference`)

---

## Opus 4.6 Capabilities Research (Feb 7 2026)

Researched Opus 4.6 at Mike's request. Key new features:
- **1M token context window** (beta) — 5x increase, eliminates context rot
- **Adaptive thinking** — 4 effort levels (low/medium/high/max), replaces binary extended thinking
- **Compaction API** — server-side context summarization for infinite conversations
- **128K output tokens** — double previous 64K
- **Agent Teams** (research preview) — parallel agent coordination
- **Claude in PowerPoint** (research preview) — reads layouts/fonts/slide masters, generates full decks

---

## Coding Sub-Agent Strategy (Feb 8 2026)

**Standing decisions:**
- **No new paid tools** — avoid cost sprawl, keep server aligned with Mike's local dev
- **No environment divergence** — server dev environment must mirror Mike's local setup
- **Alpha Orchestrator is Mike-only** — reserved for his local Claude Code usage
- **Use existing subscriptions** — OAuth via ChatGPT/Claude subscriptions, not direct API keys
- **Codex for coding, Opus for everything else** — clear model separation

---

## ZAI/GLM Endpoint — RESOLVED (Feb 8 2026)

Now in LEARNINGS.md and TOOLS.md.

---

## Model Rebalancing Strategy (Feb 12 2026)

**Problem:** 87% Opus / 5% GPT / 7% GLM — hitting Claude limits while OpenAI subscription underutilized.
**Target split:** Opus ~40%, GPT ~45%, GLM ~15%
**Delegation rules in** `config/model-dispatch.json` — always delegate unless it requires conversation context or complex multi-step reasoning.

---

## Codex Token Revocation — Health Check Lesson (Feb 22 2026)

Now in LEARNINGS.md.

---

## Cloudflare Turnstile Bypass (Feb 22 2026)

Now in LEARNINGS.md.
