# Agent Jobs Architecture — From Delegation to Autonomous Work

> **Status:** Approved (2026-02-27), Expanded (2026-02-28)
> **Decision Maker:** Mike Smith
> **Author:** Sophie (AI Assistant)
> **Context:** Discussion prompted by Brian Castle's OpenClaw multi-agent videos

---

## 1. Philosophy: Jobs > Delegation

### The Problem with Delegation

Our original architecture used a **delegation paradigm**: Sophie receives requests, interprets them, spawns sub-agents, waits for results, and relays back to Mike. This creates problems:

- **Sophie is a bottleneck** — if she's busy, compacting context, or down, the whole team stalls
- **Two unnecessary hops** — Mike → Sophie → Agent → Sophie → Mike (each hop costs tokens and time)
- **Agents lack ownership** — sub-agents are ephemeral; they have no persistent identity, no memory of past work, no recurring responsibilities
- **No autonomous initiative** — nothing happens unless Sophie (or Mike) triggers it

### The Job Paradigm

**Insight (credit: Brian Castle):** The value isn't in orchestration. It's in:

1. **Defining the job** — what recurring work does this agent own?
2. **Building the systems** — scheduling, skills, artifact storage
3. **Getting out of the way** — let the agent do its job and report results

**Key shift:** Agents don't need a manager. They need a **job description** and a **system**.

---

## 2. Agent Roster & Job Descriptions

| Agent | Role | Primary Model | Discord Channel | Job Summary |
|-------|------|---------------|-----------------|-------------|
| 🦁 **Sophie** | Chief of Staff | Opus 4.6 | `#sophie` | Strategic partner, system builder, morning briefings, agent hiring |
| 🧑‍💻 **Neo** | Developer | MiniMax M2.5 | `#neo` | Code implementation, PR reviews, CI fixes, tech debt |
| ✍️ **Hemingway** | Content Producer | Opus 4.6 | `#hemingway` | Blog posts, email campaigns, LinkedIn, newsletter |
| 🔍 **Kvoth** | Research Analyst | MiniMax M2.5 | `#kvoth` | Competitive intel, market scanning, trend reports |
| 🎨 **Michelangelo** | Visual Designer | MiniMax M2.5 | `#michelangelo` | Image generation, design assets, presentation visuals |
| 🚀 **Viral** | Growth Engineer | MiniMax M2.5 | `#viral` | SEO audits, analytics, growth experiments, GTM |

### Sophie's Role

Sophie **stops being the router** and becomes the chief of staff:
- Morning briefing (what happened overnight, what's on the agenda)
- Strategic conversation partner (planning, decisions with Mike)
- System builder (improving agent skills, tuning schedules, building infrastructure)
- Hiring manager (designing new agent jobs when needs emerge)
- Escalation point (agents flag issues they can't handle)
- Team reporting (aggregates agent output for Mike)

**She doesn't touch the work itself. She doesn't spawn Neo. Neo has a job and does it.**

### Job Description Template

Every agent gets a formal job description covering:

```
1. Identity — Name, emoji, role title, model, channel
2. Mission — One-sentence purpose
3. Recurring Responsibilities — What they do on schedule (with cadence)
4. Workflow — Step-by-step for their primary work type
5. Tools & Skills — What skills/tools they use
6. Cross-Agent Communication — How to request work from other agents
7. Escalation — What to do when things go wrong
8. Artifacts — What they produce and where it goes
9. Safety Rails — Concurrency guards, budgets, hours
```

**Reference implementation:** Neo's job description at `~/clawd/skills/neo-job/SKILL.md`

---

## 3. Platform Layer — Shared Infrastructure

Every agent gets these systems out of the box. This is the "company infrastructure" that Sophie builds and maintains.

### 3.1 Scheduling: The Two-Layer Pattern

Each agent has **their own cron-driven task triggers**. Sophie is not in the execution path.

**Layer 1: Detection (Linux Cron — cheap, no model tokens)**
Python scripts run on Linux crontab at short intervals. They poll external sources (GitHub API, Mission Control, RSS feeds, etc.) to detect whether work exists. This costs nothing — just API calls and file reads.

**Layer 2: Execution (ACP Claude Code or OpenClaw Sub-Agent — on-demand only)**
Pre-configured OpenClaw cron jobs with `sessionTarget: "isolated"`. These jobs are **disabled** (never run on a schedule) — they're only triggered on-demand by the detection scripts.

#### The Flow

```
Linux cron (every N min)
  → Python script polls for work
  → If work found:
      1. Write task to spawn queue (state/{agent}-loop/spawn-queue.jsonl)
      2. Post notification to agent's Discord channel
      3. Trigger agent's execution job
      4. Job reads queue → spawns session (ACP Claude Code or sub-agent)
      5. Results announced to agent's channel
  → If no work: exit silently (zero tokens consumed)
```

#### Per-Agent Loop Designs

Not all agents use the same trigger types. The loop design varies by role:

| Agent | Primary Trigger | Detection Method | Cadence |
|-------|----------------|------------------|---------|
| 🧑‍💻 Neo | GitHub events + MC tasks | GitHub API polling (issues, PRs, CI) | 10-30 min |
| ✍️ Hemingway | MC tasks with due dates | MC API polling (assigned tasks approaching deadline) | Daily check (morning) |
| 🔍 Kvoth | MC tasks + scheduled scans | MC API polling (research-request tasks) + time-based cron (weekly scans) | MC: hourly / Scans: weekly |
| 🎨 Michelangelo | MC tasks (reactive) | MC API polling (image-request tasks) | Hourly |
| 🚀 Viral | Scheduled reports + MC tasks | Time-based cron (weekly audit, daily rank check) + MC API polling | Daily/weekly |

**Key insight:** MC task polling is the universal trigger — every agent needs "check if I have assigned tasks." GitHub polling is Neo-specific. Time-based scheduling (no detection layer needed) serves calendar-driven agents like Hemingway and Viral.

**Three trigger patterns:**

1. **Event-driven** (Neo): Poll external system for events → spawn on detection. Needs detection scripts.
2. **Task-driven** (All agents): Poll MC for assigned tasks → spawn when found. Universal detection script.
3. **Calendar-driven** (Hemingway, Kvoth, Viral): Just a scheduled cron job that fires on cadence. No detection layer — the schedule *is* the trigger.

Most agents will use a mix of task-driven (cross-agent requests, ad-hoc work) and calendar-driven (recurring responsibilities). Neo is the outlier with heavy event-driven work.

#### Detailed Loop Specs

**Neo (Developer):**
| Loop | Type | Cadence | Script |
|------|------|---------|--------|
| Issue pickup | Event-driven (GitHub) | */30 8-23 | `neo-issue-pickup.py` |
| PR review response | Event-driven (GitHub) | */15 8-23 | `neo-review-responder.py` |
| CI fix | Event-driven (GitHub) | */10 8-23 | `neo-ci-fix.py` |
| MC task pickup | Task-driven (MC) | */30 8-23 | `neo-mc-pickup.py` |
| Nightly backlog | Calendar-driven | 23:00 | OpenClaw cron job |

**Hemingway (Content Producer):**
| Loop | Type | Cadence | Notes |
|------|------|---------|-------|
| MC task pickup | Task-driven (MC) | */120 9-18 | Cross-agent content requests |
| Content deadline check | Calendar-driven | 9:00 Mon | Check MC for approaching deadlines, prioritize week's work |
| Execution harness: OpenClaw sub-agent | | | Skills: email-marketing, blog-writing, blog-post-optimizer, linkedin-content |

*Blocker: needs content strategy + calendar defined first (task #648)*

**Kvoth (Research Analyst):**
| Loop | Type | Cadence | Notes |
|------|------|---------|-------|
| MC task pickup | Task-driven (MC) | */60 9-18 | Cross-agent research requests |
| Weekly competitive scan | Calendar-driven | 10:00 Mon | Recurring competitive analysis of AI presentation tools |
| Execution harness: OpenClaw sub-agent | | | Skills: perplexity-research, context7, web_search |

*Previous competitive intel (Feb 10): one-off, not recurring. Need to productionize.*

**Michelangelo (Visual Designer):**
| Loop | Type | Cadence | Notes |
|------|------|---------|-------|
| MC task pickup | Task-driven (MC) | */60 9-21 | Image/design requests from other agents |
| Purely reactive — no scheduled work | | | |
| Execution harness: OpenClaw sub-agent | | | Skills: nano-banana-pro |

*Blocker: needs style guidelines + reference images (task #647)*

**Viral (Growth Engineer):**
| Loop | Type | Cadence | Notes |
|------|------|---------|-------|
| MC task pickup | Task-driven (MC) | */120 9-18 | Ad-hoc SEO/growth requests |
| Weekly SEO audit | Calendar-driven | 10:00 Tue | Full site audit, triggers cross-agent tasks |
| Weekly analytics digest | Calendar-driven | 16:00 Fri | Traffic/conversion summary |
| Execution harness: OpenClaw sub-agent | | | Skills: seo-audit, perplexity-research |

*Blocker: needs SEO automation strategy defined (task #649) — what actions does an audit trigger?*

#### Execution Harness Selection

| Task Type | Harness | Rationale |
|-----------|---------|-----------|
| Code implementation | ACP Claude Code | Persistent context, diff-aware, auto-test, CLAUDE.md conventions |
| Research / analysis | OpenClaw sub-agent | No coding harness needed |
| Content creation | OpenClaw sub-agent | Writing skills, not code tools |
| Git-only ops | OpenClaw sub-agent | No code intelligence needed |
| Image generation | OpenClaw sub-agent | nano-banana-pro skill |

**Key principle:** Detection is free. Execution uses the best available harness for the job. Sophie is never involved.

#### Safety Rails (Universal — Built Into Detection Layer)

Every agent's detection scripts include:
- **Concurrency guard** — 1 active run per task (prevents double-spawning)
- **Daily cooldown** — max N attempts per task per day (configurable per agent)
- **Auto-expire** — 45-min timeout clears stale locks
- **Dedup window** — 30-min check prevents duplicate queuing
- **Operating hours** — 8am-11pm ET (configurable, no overnight surprises)
- **Memory gate** — check available RAM before spawning (prevents OOM)

#### Shared Utilities

All detection scripts import from a shared library:
- `~/clawd/scripts/agent-loop/common.py` — spawn queue management, safety rails, Discord notifications, memory checks
- Pattern: each agent has their own `~/clawd/scripts/{agent}-loop/` directory with agent-specific detection scripts that import common utilities

### 3.2 Agent Identity Files

Each agent gets a set of identity and configuration files:

```
~/clawd/agents/{agent}/
  AGENTS.md        — Job description, workflow, escalation, cross-agent protocol (strategic direction)
  SOUL.md          — Personality, voice, communication style
  LEARNINGS.md     — Mistakes and operational rules (persists across sessions)
  MEMORY.md        — Long-term memory (curated periodically)
```

**Note:** AGENTS.md is the strategic direction file that *we* manage — it tells the agent what to do and how to work. OpenClaw platform boilerplate (boot sequences, tool usage, memory protocol) lives separately in the OpenClaw agent config, not in AGENTS.md.

**AGENTS.md** is the single source of truth for each agent. It contains:
- Who you are and what you do
- Your recurring responsibilities and how to execute them
- How to communicate with other agents (cross-agent protocol)
- What to do when things go wrong (escalation ladder)
- Your workspace, tools, and safety constraints

**SOUL.md** defines personality and voice. Neo should sound different from Hemingway — technical and terse vs. eloquent and deliberate.

**LEARNINGS.md** captures mistakes that become permanent rules. When Neo learns that `pnpm typecheck` catches things `lint` doesn't, that persists. Each agent's learnings are specific to their domain.

**MEMORY.md** stores curated long-term context. Updated during periodic reviews, not during active work.

### 3.3 Skills (Process Definitions)

Each agent has skills that define **how** they do their recurring work. A skill is an operating manual for a particular job function.

- Skills live in `~/clawd/skills/` (shared) or agent-specific directories
- Task instructions should be minimal — just "run skill X" — because the detailed process lives in the skill file
- **When you improve a skill, you make the agent permanently better at their job**

### 3.4 Artifacts (Output Storage)

Artifacts are the tangible, persistent outputs of an agent's work — not chat messages (ephemeral), but deliverables that need a browsable, reviewable home.

```
~/clawd/artifacts/
  neo/
    2026-02-28/
      pr-2202-template-config.md
  hemingway/
    2026-02-28/
      blog-draft-ai-presentations.md
  kvoth/
    2026-02-28/
      competitive-analysis-pitch-tools.md
  michelangelo/
    2026-02-28/
      hero-image-landing-page.png
  viral/
    2026-02-28/
      seo-audit-february.md
```

**Naming convention:** `{type}-{slug}.md` with YAML frontmatter (agent, date, task_id, status)

**Mission Control integration:** All artifact directories scanned by MC's `/api/docs/scan` for browsable visibility.

### 3.5 Discord Channels

Each agent gets a dedicated Discord channel:

| Channel | Agent | Purpose |
|---------|-------|---------|
| `#sophie` | Sophie | Conversation, briefings, planning with Mike |
| `#neo` | Neo | PR updates, CI fixes, code work reports |
| `#hemingway` | Hemingway | Content drafts, editorial pipeline |
| `#kvoth` | Kvoth | Research reports, competitive intel |
| `#michelangelo` | Michelangelo | Design assets, image generation |
| `#viral` | Viral | SEO reports, analytics, growth experiments |

**Current state (single bot):** All agents post as Sophie's bot but with their own personality/model via `agents.bindings` channel routing.

**Target state (multi-bot):** Each agent has their own Discord bot application with distinct name, avatar, and identity. Pending OpenClaw multi-account Discord support (#3306).

**Pre-created bot tokens:** Stored in AWS SSM, ready to swap in when multi-account ships.

### 3.6 Task Management (Mission Control)

**Single system, agent-specific views.** Mission Control is the task management system for all agents.

#### How It Works

- **All agents share one task board** with standard columns (backlog, in_progress, in_review, done)
- **Agent assignment** — tasks are assigned to agents via the `assignee` field
- **Agent-specific views** — MC provides filtered views per agent (e.g., "Neo's board" = all tasks assigned to Neo)
- **Tags for routing** — task tags indicate the type of work and which agent should pick it up

#### Task Lifecycle

```
1. Task created (by Mike, Sophie, or another agent)
2. Assigned to agent (explicitly or via tag-based routing)
3. Agent's detection loop picks it up
4. Agent executes, creates artifacts, updates task status
5. Task moves to in_review (if PR) or done (if standalone)
6. Artifacts linked from task for review
```

#### Agent-Created Tasks (Cross-Agent Requests)

Agents can create tasks for other agents:
```
Hemingway needs a hero image → creates MC task:
  - name: "Hero image for AI presentations blog post"
  - assignee: michelangelo
  - tag: image-request
  - details: Brief with specs, reference to blog draft
  - linked_artifact: artifacts/hemingway/2026-02-28/blog-draft-ai-presentations.md
```

The receiving agent's detection loop picks up newly assigned tasks and executes them.

#### Content Pipeline (Hemingway)

**Decision:** Content is managed through MC tasks, not a separate Kanban. The existing `contentType` (blog, email, linkedin) and `contentPhase` (idea, outline, draft, review, published) fields on tasks handle the content lifecycle. MC provides a content-specific Kanban *view* that groups Hemingway's tasks by `contentPhase` — giving Mike the visual pipeline while keeping everything in one system.

This means Hemingway's detection loop is identical to other agents: poll MC for `assigned_agent=hemingway` tasks. Content planning (populating the calendar) is a Sophie/Mike responsibility; Hemingway executes what's assigned.

---

## 4. Cross-Agent Communication

### Protocol: Task-Based, Asynchronous

Agents communicate through **Mission Control tasks**, not direct messages. This is:
- **Tracked** — every request is a task with status
- **Asynchronous** — no agent waits for another
- **Auditable** — Mike can see all inter-agent requests
- **Decoupled** — agents don't need to know each other's implementation details

### How It Works (In AGENTS.md)

Each agent's AGENTS.md includes a Cross-Agent Communication section:

```markdown
## Cross-Agent Communication

When you need work from another agent, create a Mission Control task:

| Need | Create Task For | Tag |
|------|----------------|-----|
| Research for a blog post | Kvoth | research-request |
| Image/design asset | Michelangelo | image-request |
| Code implementation | Neo | code-request |
| Content/copy | Hemingway | content-request |
| SEO analysis | Viral | seo-request |

**Task format:**
- name: Clear description of what you need
- assignee: {target-agent}
- tag: {request-type}
- details: Full brief with context, specs, references
- link any relevant artifacts

**Do NOT:**
- Wait for the other agent to finish (you're async)
- Try to do the other agent's job yourself
- Escalate to Sophie for routing (she's not a router)
```

### When Sophie Gets Involved

Sophie only coordinates cross-agent work when:
- A task spans 3+ agents and needs sequencing
- There's a conflict or priority dispute
- An agent is stuck and escalates
- Strategic decisions are needed about approach

---

## 5. Governance

### 5.1 Failure Escalation (Universal Pattern)

Every agent follows the same escalation ladder, customized in their AGENTS.md:

```
Level 1: RETRY — Automatic retry with backoff (built into detection scripts)
Level 2: COOLDOWN — After N failures, pause and log to agent's LEARNINGS.md
Level 3: NOTIFY CHANNEL — Post to agent's Discord channel explaining the failure
Level 4: ESCALATE TO SOPHIE — Create MC task tagged "escalation" assigned to Sophie
Level 5: ESCALATE TO MIKE — Sophie flags to Mike (or agent posts directly if Sophie is down)
```

**Agent-specific thresholds (configured in AGENTS.md):**
- Neo: 3 CI fix attempts → cooldown → notify `#neo`
- Hemingway: Draft rejected twice → escalate to Sophie for editorial direction
- Kvoth: Research source unavailable → try alternate sources → notify `#kvoth`

### 5.2 Cost & Token Governance

**Per-agent tracking:**
- Each agent's sessions are tagged with their agent ID
- Sophie's morning briefing includes per-agent token usage from the previous day
- Usage script: `~/clawd/scripts/get-model-usage.sh` (already tracks by session)

**Budgets:**
- Daily token ceiling per agent (soft limit — detection scripts check before spawning)
- Weekly aggregate reviewed by Sophie in Monday briefing
- Runaway protection: individual session timeout (30-60 min depending on agent)

**Cost allocation:**
| Agent | Expected Daily Budget | Rationale |
|-------|----------------------|-----------|
| Neo | High (coding sessions are token-heavy) | Primary value producer |
| Hemingway | Medium (long-form content) | Weekly cadence, not daily |
| Kvoth | Low-Medium (search + synthesis) | Mostly API calls, not generation |
| Michelangelo | Low (image gen is API-priced, not token-priced) | Nano Banana Pro billing |
| Viral | Low-Medium (analysis + reports) | Weekly cadence |
| Sophie | Medium (briefings, conversation) | Scales with Mike's engagement |

### 5.3 Reporting & Accountability

**Daily:** Each agent's detection scripts log what they did to their artifact directory. Sophie's morning briefing aggregates this.

**Weekly digest (produced by Sophie):**
```
Team Report — Week of Feb 24
━━━━━━━━━━━━━━━━━━━━━━━━━━
🧑‍💻 Neo: 7 PRs opened, 12 CI fixes, 8 review responses
✍️ Hemingway: 2 blog drafts, 1 email campaign, 3 LinkedIn posts
🔍 Kvoth: 1 competitive analysis, 2 trend reports
🎨 Michelangelo: 5 images generated
🚀 Viral: 1 SEO audit, weekly analytics report
━━━━━━━━━━━━━━━━━━━━━━━━━━
Total tokens: XXX | Total cost: $X.XX
```

---

## 6. Agent Onboarding Playbook

### How to "Hire" a New Agent

Standardized checklist for bringing a new agent online:

```
□ 1. DEFINE — Write the job description (use template from §2)
□ 2. IDENTITY — Create AGENTS.md, SOUL.md, LEARNINGS.md, MEMORY.md
□ 3. DISCORD — Create bot application + dedicated channel
     - Create bot in Discord Developer Portal
     - Store token in AWS SSM (/openclaw/{AGENT}_DISCORD_BOT_TOKEN)
     - Create channel, add binding in OpenClaw config
□ 4. SKILLS — Identify or create skills the agent needs
     - Symlink shared skills, create agent-specific ones
□ 5. SCHEDULING — Build detection + execution loops
     - Create ~/clawd/scripts/{agent}-loop/ directory
     - Write detection scripts (import from common.py)
     - Create disabled OpenClaw cron jobs for execution
     - Add Linux crontab entries for detection
□ 6. ARTIFACTS — Set up artifact storage
     - Create ~/clawd/artifacts/{agent}/
     - Add to Mission Control doc scan directories
□ 7. TASK VIEWS — Configure MC filtered view for the agent
□ 8. TEST — End-to-end test: detection → queue → spawn → execute → artifact → Discord notification
□ 9. DOCUMENT — Update this architecture doc with agent details
□ 10. ANNOUNCE — Introduce the agent in #general
```

### Estimated Setup Time Per Agent

- Detection scripts (adapt from Neo Loop): 2-4 hours
- Identity files (AGENTS.md, SOUL.md): 1-2 hours
- Skills & testing: 2-4 hours
- Discord + MC setup: 30 min
- **Total: ~1 day per agent**

---

## 7. Implementation Roadmap

### Phase 1: Neo Pilot ✅ (Complete)
- ✅ Neo Discord bot + `#neo` channel
- ✅ Channel binding configured
- ✅ Neo Loop (issue pickup, review response, CI fix)
- ✅ Artifact storage + MC scan integration
- ✅ Job description (skill file)
- ✅ ACP Claude Code as execution harness
- ✅ Safety rails (concurrency, cooldown, dedup, memory gate)

### Phase 2: Platform Hardening

**Priority order (dependencies flow downward):**

1. **MC `assigned_agent` feature** — Add `assigned_agent` field to tasks, API filter support (`GET /tasks?assigned_agent=neo`), agent name/emoji on task cards. This is a blocker for cross-agent communication and agent-specific task views.
2. **Design agent loops** — Finalize detection patterns per agent (event-driven, task-driven, calendar-driven). See §3.1 Per-Agent Loop Designs.
3. **Neo's identity files** — Create `~/clawd/agents/neo/AGENTS.md`, `SOUL.md`, `LEARNINGS.md` as the reference template for all agents. AGENTS.md = strategic direction (not OpenClaw boilerplate).
4. **Extract shared infrastructure** — Move truly common utilities (MC polling, spawn queue, safety rails) to `~/clawd/scripts/agent-loop/common.py`. Keep agent-specific detection logic separate.
5. **Per-agent token tracking** — Tag sessions by agent ID, update `get-model-usage.sh` to report per-agent, feed into morning briefing.
6. **Onboarding playbook** — Document the process we used for steps 1-5 as a repeatable checklist/skill.

### Phase 3: Hemingway + Kvoth
- [ ] Create Discord channels + bot applications
- [ ] Write job descriptions and identity files
- [ ] Build Hemingway's content production loop:
  - Weekly blog post pipeline (research → outline → draft → review)
  - Email campaign cadence
  - LinkedIn post scheduling
- [ ] Build Kvoth's research loop:
  - Weekly competitive scan
  - Trend monitoring (RSS/news)
  - On-demand deep dive capability
- [ ] Standardize artifact output for both

### Phase 4: Viral + Michelangelo
- [ ] Create Discord channels + bot applications
- [ ] Write job descriptions and identity files
- [ ] Build Viral's SEO/analytics loop:
  - Weekly SEO audit
  - Daily rank tracking
  - Growth experiment framework
- [ ] Build Michelangelo's design pipeline:
  - On-demand image generation (triggered by other agents' requests)
  - Scheduled brand asset creation
- [ ] Full team operational

### Phase 5: Refinement
- [ ] Cross-agent coordination — live testing with real multi-agent tasks
- [ ] Sophie's morning briefing pulls from all agent artifact dirs
- [ ] Weekly team digest (automated)
- [ ] Dashboard improvements — per-agent views in Mission Control
- [ ] Multi-bot Discord (when OpenClaw #3306 ships)
- [ ] Agent-to-agent DMs (agents can request from each other directly)

---

## 8. Decisions Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| 2026-02-27 | Paradigm | Jobs > Delegation | Agents should own recurring work, not be spawned for one-off tasks |
| 2026-02-27 | Sophie's role | Chief of Staff | Strategic partner + system builder, not router |
| 2026-02-27 | Scheduling | Neo Loop pattern (replicate) | Python detection + OpenClaw cron, proven in production |
| 2026-02-27 | Artifacts | Standardized per-agent dirs | `~/clawd/artifacts/{agent}/` with MC scan integration |
| 2026-02-27 | Discord | Dedicated channels now, separate bots later | Channel routing works today; tokens stored for future |
| 2026-02-27 | Pilot agent | Neo | Already has Neo Loop, clearest job definition |
| 2026-02-28 | Cross-agent comms | Task-based via Mission Control | Async, tracked, auditable, decoupled |
| 2026-02-28 | Agent memory | Per-agent LEARNINGS.md + MEMORY.md | Domain-specific learning persists across sessions |
| 2026-02-28 | Failure escalation | Universal ladder in each AGENTS.md | Retry → cooldown → notify channel → Sophie → Mike |
| 2026-02-28 | Execution harness | ACP Claude Code default for coding, sub-agent for non-coding | Best tool for the job type |
| 2026-02-28 | Task management | Single MC instance, agent-specific views | One source of truth, filtered perspectives |
| 2026-02-28 | Agent identity location | `~/clawd/agents/{agent}/` | Inside workspace, version-controllable, Sophie can read/update |
| 2026-02-28 | AGENTS.md purpose | Strategic direction only, no platform boilerplate | Clean separation — we manage intent, OpenClaw manages mechanics |
| 2026-02-28 | MC assigned_agent | New field + API filter + card display | Blocker for cross-agent task routing and agent-specific views |
| 2026-02-28 | Loop design | Three patterns: event-driven, task-driven, calendar-driven | Not all agents are GitHub-centric; MC polling is the universal trigger |
| 2026-03-01 | Code task tracking | Option A: GitHub is source of truth for coding, MC mirrors for visibility | Neo's loops already poll GitHub. MC mirrors with `githubIssue` link. Sophie syncs status manually (automate later). |
| 2026-02-28 | Content management | Option A: MC tasks with contentType/contentPhase (kill separate Kanban) | Single system principle; content-specific Kanban view in MC instead of separate tool |
| 2026-02-28 | Agent identity writes | Agents can update own LEARNINGS.md + MEMORY.md; AGENTS.md is Sophie/Mike-managed | Agents learn from experience, but strategic direction stays centrally controlled |

---

## 9. Open Questions

- **Multi-bot Discord timeline:** When will OpenClaw ship #3306? Monitor for updates.
- **Agent self-improvement:** Should agents be able to update their own skills/AGENTS.md based on learnings? Or Sophie-only?
- **Scaling limits:** At what point does the c7i-flex.large instance need upgrading? (Current: 1 concurrent ACP session safe, 2+ risks OOM)
- **Agent hiring criteria:** When does a new agent make sense vs. expanding an existing agent's responsibilities?

---

## 10. Inspiration

This architecture was inspired by [Brian Castle's OpenClaw setup](https://youtu.be/bzWI3Dil9Ig) (Builder Methods) where he runs 4 agents on a single Mac Mini with per-agent Slack bots, skills-based process definitions, and the mental model: "hire agents for jobs, not tasks."

---

## 11. Related Documents

- Neo job description: `~/clawd/skills/neo-job/SKILL.md`
- Neo Loop scripts: `~/clawd/scripts/neo-loop/`
- Agent fleet archive: `~/clawd/memory/archive/agent-fleet.md`
- Template system vision: `./template-system-vision.md`
