# Agent Jobs Architecture — From Delegation to Autonomous Work

> **Status:** Approved (2026-02-27)
> **Decision Maker:** Mike Smith
> **Author:** Sophie (AI Assistant)
> **Context:** Discussion prompted by Brian Castle's OpenClaw multi-agent videos

---

## 1. The Problem with Delegation

Our current architecture uses a **delegation paradigm**: Sophie receives requests, interprets them, spawns sub-agents, waits for results, and relays back to Mike. This creates problems:

- **Sophie is a bottleneck** — if she's busy, compacting context, or down, the whole team stalls
- **Two unnecessary hops** — Mike → Sophie → Agent → Sophie → Mike (each hop costs tokens and time)
- **Agents lack ownership** — sub-agents are ephemeral; they have no persistent identity, no memory of past work, no recurring responsibilities
- **No autonomous initiative** — nothing happens unless Sophie (or Mike) triggers it

## 2. The Job Paradigm

**Insight (credit: Brian Castle):** The value isn't in orchestration. It's in:

1. **Defining the job** — what recurring work does this agent own?
2. **Building the systems** — scheduling, skills, artifact storage
3. **Getting out of the way** — let the agent do its job and report results

**Key shift:** Agents don't need a manager. They need a **job description** and a **system**.

---

## 3. Agent Roster & Job Definitions

| Agent | Role | Job | Recurring Responsibilities | Cadence |
|-------|------|-----|---------------------------|---------|
| 🦁 **Sophie** | Chief of Staff | Strategic partner, system builder | Morning briefing, conversation with Mike, improving agent skills/schedules, escalation handling, hiring new agents | Daily brief, on-demand |
| 🧑‍💻 **Neo** | Developer | Code implementation | Pick up `plan-me` issues, respond to PR reviews, fix CI failures, address tech debt | Continuous (cron-driven) |
| ✍️ **Hemingway** | Content Producer | Content creation | Blog posts, email campaigns, LinkedIn posts, newsletter drafts | Weekly cadence per type |
| 🔍 **Kvoth** | Research Analyst | Intelligence & research | Competitive intel, market scanning, documentation, trend reports | Weekly scans, on-demand deep dives |
| 🎨 **Michelangelo** | Visual Designer | Design & imagery | Image generation, design assets, presentation visuals | On-demand + scheduled brand work |
| 🚀 **Viral** | Growth Engineer | SEO & growth | SEO audits, analytics reports, growth experiments, GTM execution | Weekly reports, daily monitoring |

### Sophie's New Role

Sophie **stops being the router** and becomes the chief of staff:
- Morning briefing (what happened overnight, what's on the agenda)
- Strategic conversation partner (planning, decisions)
- System builder (improving agent skills, tuning schedules, building infrastructure)
- Hiring manager (designing new agent jobs when needs emerge)
- Escalation point (agents flag issues they can't handle)

**She doesn't touch the work itself. She doesn't spawn Neo. Neo has a job and does it.**

---

## 4. Three Systems Every Agent Needs

### 4.1 Scheduling System

Each agent has **their own cron-driven task triggers**. These are NOT Sophie's cron jobs — they belong to the agent.

**Implementation:** OpenClaw cron jobs with `sessionTarget: "isolated"` and `payload.kind: "agentTurn"`, targeting the specific agent's model and identity. Plus Linux cron scripts (like the Neo Loop pattern) for detection logic.

**The Neo Loop Pattern** (built 2026-02-27) is the reference implementation:
- Python scripts detect work (poll GitHub, check PRs, scan for failures)
- Scripts queue spawn requests with concurrency guards and cooldowns
- Wake events trigger execution
- Results announced to the agent's dedicated channel

This pattern should be **replicated for each agent** where applicable.

### 4.2 Skills (Process Definitions)

Each agent has skills that define **how** they do their recurring work. A skill is an operating manual for a particular job function.

Skills live in `~/clawd/skills/` (or agent-specific skill directories). Task instructions should be minimal — just "run skill X" — because the detailed process lives in the skill file.

**Key principle:** When you improve a skill, you're making the agent permanently better at their job. Skills are where you "work on your business."

### 4.3 Artifacts (Output Storage)

**Definition:** Artifacts are the tangible, persistent outputs of an agent's work. Not chat messages (ephemeral), but deliverables that need a browsable, reviewable home.

| Agent | Artifact Types | Storage Location |
|-------|---------------|-----------------|
| 🧑‍💻 Neo | PRs, branches, commits, code reviews | GitHub (PRs) + `~/clawd/artifacts/neo/` (logs, summaries) |
| ✍️ Hemingway | Blog drafts, email copy, LinkedIn posts | `~/clawd/artifacts/hemingway/` (markdown files) |
| 🔍 Kvoth | Research reports, competitive analyses | `~/clawd/artifacts/kvoth/` (markdown reports) |
| 🎨 Michelangelo | Generated images, design assets | `~/clawd/artifacts/michelangelo/` (images + metadata) |
| 🚀 Viral | SEO audits, analytics reports | `~/clawd/artifacts/viral/` (markdown reports) |
| 🦁 Sophie | Meeting notes, decision logs, briefings | `~/clawd/artifacts/sophie/` + `~/clawd/memory/` |

**Standardized structure:**
```
~/clawd/artifacts/
  neo/
    2026-02-27/
      pr-2194-apollo-enrichment.md
      pr-2195-sparse-data.md
  hemingway/
    2026-02-27/
      blog-draft-template-system.md
  kvoth/
    2026-02-27/
      competitive-analysis-pitch-tools.md
```

**Artifact files should be scannable by Mission Control** (`/api/docs/scan` already supports custom directories). Add `~/clawd/artifacts/` to the scan directories so all agent output appears in the /docs page.

**Naming convention:** `{type}-{slug}.md` with YAML frontmatter for metadata (agent, date, task_id, status).

---

## 5. Discord Architecture

### Decision: Dedicated Discord Channels with Separate Bots

Each agent gets:
- **A dedicated Discord bot application** (separate token, name, avatar)
- **A dedicated Discord channel** (e.g., `#neo-dev`, `#hemingway-content`)
- **Direct communication with Mike** — agents post their work results, status updates, and questions to their own channel

This means:
- Creating 5 additional Discord bot applications (Neo, Hemingway, Kvoth, Michelangelo, Viral)
- Sophie keeps the existing bot
- Each bot joins the SlideHeroes server
- Each has a dedicated channel

### Channel Structure
```
#general          — Sophie (conversation, briefings, planning)
#neo-dev          — Neo (PRs, CI fixes, code work)
#hemingway-writes — Hemingway (drafts, content pipeline)
#kvoth-research   — Kvoth (reports, analyses)
#michelangelo-art — Michelangelo (designs, images)
#viral-growth     — Viral (SEO, analytics, GTM)
```

### Why Multi-Bot (Not Multi-Channel with One Bot)
- Each agent has a **distinct identity** — name, avatar, personality
- DM capability — Mike can DM any agent directly
- Cleaner UX — you know who's talking
- Separate notification control per agent
- Closer to the "real team" mental model

---

## 6. Decisions Made (2026-02-27)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Paradigm | Jobs > Delegation | Agents should own recurring work, not be spawned for one-off tasks |
| Sophie's role | Chief of Staff | Strategic partner + system builder, not router |
| Scheduling | Neo Loop pattern (replicate) | Python detection scripts + OpenClaw cron, proven tonight |
| Artifacts | Standardized per-agent dirs | `~/clawd/artifacts/{agent}/` with MC scan integration |
| Discord | Separate bots per agent | Distinct identities, dedicated channels, direct reporting |
| Pilot agent | Neo (Developer) | Already has Neo Loop, clearest job definition, most to gain |

---

## 7. Implementation Plan

### Phase 1: Neo Pilot (Next)
1. Create Neo Discord bot application + `#neo-dev` channel
2. Configure OpenClaw with Neo's Discord channel
3. Convert Neo Loop scripts to report directly to `#neo-dev` (not wake Sophie)
4. Create `~/clawd/artifacts/neo/` with artifact logging
5. Define Neo's full job description (skill file)
6. Add Neo's artifact directory to Mission Control scan

### Phase 2: Hemingway + Kvoth
7. Create Discord bots + channels for Hemingway and Kvoth
8. Build Hemingway's content production loop (weekly blog, email, LinkedIn cadence)
9. Build Kvoth's research loop (weekly competitive scan, trend monitoring)
10. Standardize artifact output for both

### Phase 3: Viral + Michelangelo
11. Create Discord bots + channels
12. Build Viral's SEO/analytics loop
13. Build Michelangelo's design pipeline
14. Full team operational

### Phase 4: Refinement
15. Cross-agent coordination protocol (when Neo needs Kvoth's research, etc.)
16. Agent-to-agent communication (agents can post in each other's channels)
17. Sophie's morning briefing pulls from all agent artifact dirs
18. Dashboard improvements — per-agent views in Mission Control

---

## 8. Open Questions

- **Agent memory:** Should each agent have their own `MEMORY.md` / `LEARNINGS.md`? Or shared?
- **Cross-agent work:** When a task spans multiple agents (e.g., blog post needs research + writing + images), who coordinates? Sophie? Or do agents request from each other?
- **Failure handling:** When an agent's cron job fails repeatedly, who gets notified? Sophie? Mike? Both?
- **Cost tracking:** Per-agent token usage tracking — needed for ROI analysis
- **Model assignment:** Should agent model preferences be in the job definition or OpenClaw config?

---

## 9. Inspiration

This architecture was inspired by [Brian Castle's OpenClaw setup](https://youtu.be/bzWI3Dil9Ig) (Builder Methods) where he runs 4 agents on a single Mac Mini with:
- Custom BMHQ dashboard for task scheduling/dispatch
- Per-agent Slack bots
- Skills-based process definitions
- Brainown app for artifact browsing
- The mental model: "hire agents for jobs, not tasks"

Our implementation differs in infrastructure (AWS vs Mac Mini), chat platform (Discord vs Slack), and tooling (Mission Control vs BMHQ), but the core philosophy aligns.

---

## 10. Related Documents

- [Template System Vision](./template-system-vision.md) — example of structured execution plan
- Neo Loop scripts: `~/clawd/scripts/neo-loop/` — reference implementation for agent scheduling
- Agent Fleet details: `~/clawd/memory/archive/agent-fleet.md`
