# MEMORY.md - Long-Term Memory

## ⚠️ Critical Warnings

**ZAI/GLM Endpoint — RECURRING ISSUE**
Mike's subscription uses the **Coding Plan** endpoint. Wrong endpoint = billing errors.

- ✅ `https://api.z.ai/api/coding/paas/v4/`
- ❌ `https://api.z.ai/api/paas/v4/` (regular API)

Check `openclaw.json` → `models.providers.zai.baseUrl` if GLM fails.

---

## Strategic Priorities — Q1 2026

**Active (in order):**
1. **🚀 Obj 1 — Build Product** — Ship AI presentation platform
2. **🤖 Obj 6 — Build AI Systems** — Sophie's capabilities
3. **⚙️ Obj 7 — Build Business OS** — Infrastructure

**Deferred:** Obj 2-5 (audience, conversion, acquisition, retention) — post-product

**Decision rule:** Proactive work → Obj 1 > 6 > 7

---

## Projects & Repos

| Repo | Access | Notes |
|------|--------|-------|
| `2025slideheroes` | Read-only | Main product. Don't touch unless Mike asks. |
| `slideheroes-internal-tools` | Full authority | Mission Control, Feed Monitor, tooling |

**SOP:** Always `git fetch upstream && git merge upstream/dev` before 2025slideheroes work.

---

## Agent Fleet

| Agent | Model (Primary) | Fallback | Role |
|-------|----------------|----------|------|
| 🦁 Sophie | Opus 4.6 | MiniMax M2.5 → GLM-5 → OpenRouter | Orchestration, conversation |
| 🧑‍💻 Neo (The Coder) | MiniMax M2.5* | GLM-5 | Implementation, PRs |
| 🔍 Kvoth (The Researcher) | MiniMax M2.5 | GLM-5 | Competitive intel, research |
| 🎨 Michelangelo (The Artist) | MiniMax M2.5 | GLM-5 | Image generation (nano-banana-pro skill) |
| ✍️ Hemingway (The Writer) | Opus 4.6 | MiniMax M2.5 | Blog posts, emails, LinkedIn, copy |
| 🚀 Viral (The GTM Engineer) | MiniMax M2.5 | GLM-5 | SEO, growth, competitive analysis |

*Neo switches to GPT-5.2-Codex primary on Monday March 2.

**Details:** `memory/archive/agent-fleet.md`

---

## Model Dispatch

| Role | Model | Use case |
|------|-------|----------|
| `code` (Neo) | `minimax/MiniMax-M2.5-highspeed` | Implementation, PRs, bug fixes |
| `research` (Kvoth) | `minimax/MiniMax-M2.5-highspeed` | Web search, competitive analysis |
| `writing` (Hemingway) | `anthropic/claude-opus-4-6` | Content creation, copy |
| `art` (Michelangelo) | `minimax/MiniMax-M2.5-highspeed` | Image generation via nano-banana-pro |
| `gtm` (Viral) | `minimax/MiniMax-M2.5-highspeed` | SEO, growth, GTM strategy |
| `default` (Sophie) | `anthropic/claude-opus-4-6` | Conversation, planning, orchestration |

**Fallback chain:** MiniMax M2.5 → GLM-5 → OpenRouter auto

---

## Platform Decisions

| Category | Choice | Notes |
|----------|--------|-------|
| CRM | Attio | Initial setup done |
| Email | Loops | Migrating from ActiveCampaign |
| YouTube transcripts | Supadata | API key in `~/.openclaw/.secrets.env` |
| AWS | c7i-flex.large | us-east-2, ~$2.65/day |

---

## CodeRabbit Workflow

**Two-stage review:**
1. Pre-commit: `coderabbit --prompt-only --base upstream/dev`
2. Post-PR: Webhook → Sophie iterates → Mike reviews

**Details:** `memory/archive/coderabbit-setup.md`

---

## Preferences

- Mike: friendly + professional tone
- Coding: GLM-5 (GPT-5.2 has thinking loops)
- Nightly builds: GPT agent → internal-tools → Sophie reviews → Mike reviews

---

## Archived

- Agent fleet details: `memory/archive/agent-fleet.md`
- CCProxy setup: `memory/archive/ccproxy-setup.md`
- CodeRabbit setup: `memory/archive/coderabbit-setup.md`
- Mission Control design: `memory/archive/mission-control-design.md`
- Platform integrations: `memory/archive/platform-integrations.md`
