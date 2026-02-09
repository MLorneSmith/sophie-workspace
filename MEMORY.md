# MEMORY.md - Long-Term Memory

## 🎯 Strategic Priorities — Q1 2026

**Active priorities (in order):**
1. **🚀 Obj 1 — Build a Product Customers Love** — Ship the core AI presentation platform
2. **🤖 Obj 6 — Build the AI Systems** — Sophie's capabilities to accelerate everything else
3. **⚙️ Obj 7 — Build the Business Operating System** — Infrastructure to run the business

**Deferred (post-product):**
4. 📢 Obj 2 — Build an Audience That Trusts Us
5. 🔄 Obj 3 — Convert Existing Customers
6. 🆕 Obj 4 — Acquire Net-New Customers
7. 💎 Obj 5 — Delight & Retain Customers

**Decision rule:** When choosing what to work on proactively, prioritize tasks under Obj 1 > 6 > 7. The other objectives matter but come after there's a product to sell. Confirmed by Mike 2026-02-09.

---

## Initiative Structure (Feb 9 2026)

**35 initiatives across 7 strategic objectives:**

**🚀 Obj 1 — Product** (6): Core Product Experience, Harden the Platform, Knowledge Engine, Launch & Beta, Competitive Intelligence & Pricing, Enterprise Data Security & Local-First

**📢 Obj 2 — Audience** (4): Content Marketing, SEO, Social Media & Community, Thought Leadership & Brand

**🔄 Obj 3 — Convert Existing** (4): Re-engagement & Email Sequences, Platform Migration, Customer Onboarding, Customer Segmentation

**🆕 Obj 4 — Acquire New** (4): Outbound Sales Engine, Partnerships & Affiliates, Sales Infrastructure, Inbound Nurture Campaigns

**💎 Obj 5 — Delight & Retain** (3): Onboarding & Activation, Engagement & Retention Features, Customer Feedback & Success

**🤖 Obj 6 — AI Systems** (4): Knowledge & Context, Orchestration & Quality, Coding Engine, Content Engine

**⚙️ Obj 7 — Business OS** (5): Ship MC v2, Customer Data Ecosystem, Financial & Legal, DevOps & Reliability, Automate Business Ops

---

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

Current Mission Control does NOT match this design — needs rebuild.

---

## Projects & Repos

- **2025slideheroes** - The main SlideHeroes product repo. DO NOT touch unless Mike explicitly asks.
- **slideheroes-internal-tools** - Sophie has full commit/merge authority. Contains Feed Monitor, Mission Control, and internal tooling.

---

## SOP: Working on 2025slideheroes (Feb 5 2026)

**Before starting ANY work on 2025slideheroes, sync with upstream:**

```bash
cd ~/2025slideheroes-sophie

# Fetch latest from upstream (main repo)
git fetch upstream

# Check out the branch you're working from (usually dev)
git checkout dev

# Merge upstream changes
git merge upstream/dev

# Push to origin (Sophie's fork) to keep it current
git push origin dev
```

**For feature branches:**
```bash
# Create feature branch from latest upstream/dev
git fetch upstream
git checkout -b feature/my-feature upstream/dev

# ... do work, commit ...

# Push to fork
git push origin feature/my-feature

# Create PR: fork → main repo's dev branch
```

**Why this matters:** The main repo may have changes from Mike or other sources. Working on stale code leads to merge conflicts and wasted effort. Always start fresh.

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

**The Test:** Before adding a doc, ask "Does Sophie need this to collaborate with Mike?"
- Yes → MC Docs
- No, Mike's knowledge → Notion
- No, Sophie's operational data → Sophie workspace (`memory/`, `state/`)

**Workflow:**
- Sophie writes to `~/clawd/deliverables/`
- Registers with MC Docs API
- Mike reviews in MC Docs UI
- Approved docs can graduate to Notion if needed

**Full spec:** `deliverables/mission-control-docs-recommendation.md`

---

## Notion Second Brain (Feb 3 2026)

**Integration:** sophie-openclaw (token in `~/.clawdbot/.env`)

**Resources Database**
- ID: `c81f483f-1f70-4b10-9b38-0eca92924929`
- Data Source ID: `afacc796-e7c9-4076-9085-1c25e3fd4b7b`
- Properties: Name, Type, Author, URL, Date Consumed, Tags, Summary

**Best Practices Database**
- ID: `18d2323e-f8ce-458e-9231-0097b4785dce`
- Properties: Practice, Domain, Source (→ Resources), Context, Implementation, Applied, Applied Notes, Tags, Date Captured, Rating

---

## Best Practices Capture System (Feb 2 2026)

**#capture channel** (Discord id: `1468019433854210259`) — Mike shares links from mobile, Sophie extracts best practices.

**When a link appears in #capture:**
1. Identify source type (Substack article, YouTube video, Reddit thread)
2. Fetch content:
   - Substack/articles: use `web_fetch` for article text
   - YouTube: fetch transcript via API (youtube-transcript-api or supadata.ai)
   - Reddit: fetch post + top comments via `web_fetch`
3. Run extraction prompt to identify 3-7 actionable best practices
4. Each practice needs: statement, domain, context, implementation notes
5. Add to Notion Best Practices database (when API connected)
6. Reply in #capture confirming extraction complete

**Domains:** Sales, Product, Marketing, Operations, Leadership, Technical, Personal

**Docs:** `docs/capture-process.md`, `deliverables/best-practices-extraction-recommendation.md`

---

## Opus 4.6 Capabilities Research (Feb 7 2026)

Researched Opus 4.6 at Mike's request. Key new features:
- **1M token context window** (beta) — 5x increase, eliminates context rot
- **Adaptive thinking** — 4 effort levels (low/medium/high/max), replaces binary extended thinking
- **Compaction API** — server-side context summarization for infinite conversations
- **128K output tokens** — double previous 64K
- **Agent Teams** (research preview) — parallel agent coordination
- **Claude in PowerPoint** (research preview) — reads layouts/fonts/slide masters, generates full decks
- **ARC AGI 2: 68.8%** (nearly 2x Opus 4.5's 37.6%), BrowseComp 84%, Finance Agent 60.7%
- Same pricing as Opus 4.5

**Identified new workflow opportunities:**
1. Full codebase reviews (1M context)
2. PowerPoint prototype generation (directly relevant to SlideHeroes product)
3. Financial modeling for SlideHeroes
4. Multi-document batch research synthesis
5. Deeper Council debates with max effort reasoning
6. End-to-end spec → implementation with agent teams
7. Competitive analysis at scale

---

## Coding Sub-Agent Strategy (Feb 8 2026)

**Primary coding agent: Codex CLI (GPT-5.2-codex)** — not Claude Code.

**Standing decisions:**
- **No new paid tools** — avoid cost sprawl, keep server aligned with Mike's local dev
- **No environment divergence** — server dev environment must mirror Mike's local setup
- **Alpha Orchestrator is Mike-only** — reserved for his local Claude Code usage
- **Use existing subscriptions** — OAuth via ChatGPT/Claude subscriptions, not direct API keys
- **Codex for coding, Opus for everything else** — clear model separation

**Setup created:**
- `~/.codex/config.toml` — model, sandbox, approval config
- `~/2025slideheroes-sophie/AGENTS.md` — Project context for Codex (ported from CLAUDE.md)
- `.ai/bin/codex/implement` — GitHub issue → implementation → validation → commit → report
- `.ai/bin/codex/codecheck` — typecheck + lint + format with auto-fix
- `.ai/bin/codex/commit` — conventional commits with agent traceability
- `.ai/bin/codex/review` — review implementation against GitHub issue spec

**How Sophie spawns Codex:**
```bash
# Via wrapper script
exec pty:true workdir:~/2025slideheroes-sophie background:true command:".ai/bin/codex/implement 123"

# Direct
exec pty:true workdir:~/2025slideheroes-sophie command:"codex exec --full-auto 'task'"
```

**Auth status:** API key login working. Mike has a Todoist task to switch to OAuth via ChatGPT subscription (`codex login --device-auth`).

---

## ZAI/GLM Endpoint — RESOLVED (Feb 8 2026)

**DO NOT FORGET THIS.** Mike's Z.AI subscription uses the **Coding Plan**, which requires a different API endpoint:

- **Regular API:** `https://api.z.ai/api/paas/v4/`
- **Coding Plan (Mike's subscription):** `https://api.z.ai/api/coding/paas/v4/`

**Config fix:** Added `models.providers.zai` in OpenClaw config (`openclaw.json`) with `baseUrl` set to the coding endpoint. Without this, GLM calls fail with billing errors because they hit the wrong endpoint.

**This was a recurring issue (3 times!)** — always check this if GLM stops working.

---

## Preferences & Notes

- Mike prefers friendly + professional tone
- Default model: Opus 4.6 (conversation, planning, research, complex reasoning)
- Coding sub-agents: Codex CLI / GPT-5.2-codex (implementation work)
- Coding fallback: GLM 4.7 if Codex unavailable
- GLM for bulk/slow tasks: batch processing, scheduled jobs, draft generation, research summaries
- Nightly builds: delegate to GPT agent → internal-tools repo → Sophie reviews/merges → Mike reviews in morning
