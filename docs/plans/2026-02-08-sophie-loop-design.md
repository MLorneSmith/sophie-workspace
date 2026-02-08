# Sophie Loop — Autonomous Work System Design

**Date:** 2026-02-08
**Status:** Approved (brainstorm complete)
**Author:** Sophie, with Mike
**Location:** `docs/plans/2026-02-08-sophie-loop-design.md`

---

## 1. Problem Statement

The current working model between Mike and Sophie has a bottleneck inversion: Sophie completes work faster than Mike can review it. Four interconnected problems:

1. **Review overhead (primary):** Each deliverable requires Mike to load mental context — understanding what it is, why it was done, and what "good" looks like. This context switching is the biggest friction.
2. **Quality gaps:** Output often needs corrections, creating back-and-forth loops that consume Mike's time.
3. **Task definition:** Mike struggles to maintain a well-defined backlog of tasks that move work forward meaningfully.
4. **Iteration depth:** Current sub-agent tasks are one-shot. Complex work needs multiple iterations with self-correction to reach production quality.

## 2. Solution Overview

**Sophie Loop** is an autonomous work system where:

- Mike sets **strategic goals**
- Sophie **decomposes** them into small, scoped tasks
- **Specialized sub-agents** execute tasks in iterative loops with context-aware self-review
- Completed work queues in **Mission Control** for Mike's approval
- A **Morning Brief** summarizes what's awaiting review

**One-liner:** Strategic goals in, reviewed deliverables out — with minimal manual orchestration.

## 3. System Architecture

### 3.1 Overall Flow

```
Mike sets strategic objectives
        ↓
Sophie decomposes into initiatives → tasks (Mission Control)
        ↓
Mike approves the plan
        ↓
    ┌─── LOOP (per task) ────────────────────┐
    │                                         │
    │  1. Load context bundle (per-skill)     │
    │  2. Spawn builder agent (specialist)    │
    │  3. Run automated checks                │
    │  4. Spawn reviewer agent (same context) │
    │  5. Pass? ──No──→ log learnings,        │
    │     │              restart (max 3x)     │
    │    Yes                                  │
    └─────────────────────────────────────────┘
        ↓
Task moves to "Ready for Review" in Mission Control
        ↓
Morning Brief includes review summary
        ↓
Mike approves (👍) or gives brief feedback
        ↓
If feedback → one more loop with Mike's note → Done
```

### 3.2 Work Hierarchy

Three levels connect strategic thinking to execution:

```
Strategic Objective (the "why" / outcome)
  "Grow blog audience 3x by Q2"
      │
      ├── Initiative (coherent body of work)
      │   "Launch weekly blog cadence targeting solo consultants"
      │       │
      │       ├── Task (single unit a sub-agent can complete)
      │       │   "Write blog post — presentation anxiety"
      │       ├── Task
      │       │   "Write blog post — stakeholder management"
      │       └── Task
      │           "SEO audit of existing posts"
      │
      └── Initiative
          "Build SEO content engine"
              │
              ├── Task: Keyword research for target personas
              └── Task: Create programmatic SEO templates
```

- **Strategic Objectives** — Set by Mike. Quarterly or as-needed. The outcome he wants.
- **Initiatives** — Proposed by Sophie during planning. A coherent project that advances the objective.
- **Tasks** — Small, scoped, verifiable. One sub-agent, one loop, one deliverable.

### 3.3 Task States in Mission Control

```
Backlog → In Progress → Self-Review → Ready for Review → Done
```

| State | Meaning |
|-------|---------|
| **Backlog** | Approved but not yet started |
| **In Progress** | Builder agent is working on it |
| **Self-Review** | Loop is iterating (builder → reviewer → iterate) |
| **Ready for Review** | Passed self-review, queued for Mike |
| **Done** | Mike approved |

Additional states:
- **Blocked** — Hit iteration cap or needs a decision outside Sophie's authority
- **Feedback** — Mike provided a note, one more loop running

## 4. Context Layer

### 4.1 Role

Context files serve two purposes:
1. **Creation input** — Builder agents load them to produce on-brand, persona-aware work
2. **Review criteria** — Reviewer agents load them to verify output matches voice, guidelines, and positioning

As contexts improve, both output quality and review quality improve together.

### 4.2 Current Context Foundation

Directory: `~/.ai/contexts/`

| Category | Files | Content |
|----------|-------|---------|
| `company/` | about.md, products.md | Mission, products, social proof |
| `personas/` | solo-consultant.md, boutique-consultancy.md, corporate-professional.md, anti-personas.md, overview.md | Target audience profiles |
| `voice/` | brand-voice.md, mike-style.md, pov-presentations.md, vocabulary.md | Tone, style, POVs |
| `messaging/` | positioning.md, pain-points.md, value-props.md, objections.md | Market positioning |
| `guidelines/` | blog-guidelines.md, email-guidelines.md, social-guidelines.md, outbound-guidelines.md | Per-channel rules |
| `campaigns/` | (campaign-specific) | Active campaign context |

**Total:** 20 files across 6 categories.

### 4.3 Per-Skill Context Mapping

Context loading is deterministic, defined in `~/.ai/contexts/skill-mappings.yaml`:

```yaml
blog-writing:
  always:
    - company/about.md
    - voice/brand-voice.md
    - voice/pov-presentations.md
    - guidelines/blog-guidelines.md
  per-persona:
    solo-consultant: personas/solo-consultant.md
    boutique: personas/boutique-consultancy.md
    corporate: personas/corporate-professional.md

email-marketing:
  always:
    - company/about.md
    - company/products.md
    - voice/brand-voice.md
    - messaging/pain-points.md
    - messaging/value-props.md
    - guidelines/email-guidelines.md

coding:
  always:
    - company/about.md
    - company/products.md
  optional:
    - messaging/positioning.md

design:
  always:
    - company/about.md
    - company/products.md
    - voice/brand-voice.md
    - voice/vocabulary.md

research:
  always:
    - company/about.md
    - messaging/positioning.md
    - company/products.md

devops:
  always:
    - company/products.md
```

### 4.4 Context Maintenance

- Sophie performs initial audit and expansion (Phase 1)
- Mike reviews and validates all context files (one-time investment)
- After major content pieces or product decisions, relevant context files are updated
- Periodic context refresh becomes part of the system's maintenance cycle

## 5. Specialized Agents

### 5.1 Agent Profiles

Each agent is defined as a YAML profile in `~/.ai/agents/`:

| Agent | Model | Role | Key Tools |
|-------|-------|------|-----------|
| **Writer** | Opus 4.6 | Blog posts, long-form content | blog-writing, blog-post-optimizer, web_fetch |
| **Emailer** | Opus 4.6 | Email campaigns, sequences | email-marketing, web_fetch |
| **Coder** | ChatGPT-5.3-Codex | Feature implementation, bug fixes | GitHub (gh), exec, Context7 |
| **Designer** | Opus 4.6 + image gen | Frontend UI, visual assets, templates | frontend-design, OpenAI image gen |
| **DevOps** | ChatGPT-5.3-Codex | Clawdbot config, infra, deployment | exec, GitHub, Clawdbot config |
| **Researcher** | GLM 4.7 | Web research, competitive analysis | Perplexity, web_search, web_fetch, Notion |
| **Reviewer** | Opus 4.6 | Quality gate across all task types | Read-only output access, Mission Control |
| **Planner** | Opus 4.6 | Goal decomposition, specs | Mission Control, Todoist, web_search |

### 5.2 Profile Structure

```yaml
# ~/.ai/agents/writer.yaml
name: Writer
description: Creates blog posts and long-form content for SlideHeroes
model: anthropic/claude-opus-4-6
thinking: adaptive  # uses effort: high by default

context_mapping: blog-writing  # references skill-mappings.yaml

tools:
  - blog-writing
  - blog-post-optimizer
  - web_fetch

system_prompt: |
  You are a specialist content writer for SlideHeroes. You create
  compelling blog posts that speak directly to our target personas.
  
  Your output should match our brand voice exactly — authoritative
  but approachable, opinionated, with clear actionable insights.
  
  Always structure posts with: hook → problem → insight → framework
  → application → CTA.

review_criteria:
  - Does the content match our brand voice?
  - Does it address the target persona's specific pain points?
  - Does it follow our blog guidelines?
  - Is there a clear, actionable takeaway?
  - Is the headline compelling and specific?

max_iterations: 3
```

### 5.3 Design Principles

- **Cost optimization** — Use cheaper models (GLM, Codex) where quality permits; reserve Opus for judgment-intensive work
- **Deterministic context** — Same agent profile + same context files = consistent output style
- **Constrained tooling** — Each agent only gets tools relevant to its role
- **Expandable** — New agent profiles can be added as needs evolve (Social agent, SEO agent, etc.)

## 6. The Loop Runner

### 6.1 Per-Task Loop Sequence

**Step 1 — Prepare context bundle**
Read `skill-mappings.yaml`, assemble context files for this task's agent type. Concatenate into a context block injected into the task prompt.

**Step 2 — Spawn builder agent**
`sessions_spawn` with:
- Agent profile's system prompt
- Agent profile's model
- Task description
- Context bundle
- Learnings from previous iterations (if any)

Builder produces output (content, code, design, etc.).

**Step 3 — Automated checks (task-type dependent)**
- **Coding tasks:** Run lint, typecheck, build, tests
- **Content tasks:** Word count check, structure validation
- **Design tasks:** Build/render verification

If checks fail → log errors to learnings file → back to Step 2 with fresh agent.

**Step 4 — Spawn reviewer agent**
Separate `sessions_spawn` with:
- Reviewer profile's system prompt
- The builder's output
- Same context bundle used by builder
- Agent-specific review criteria from the builder's profile

Reviewer produces: **pass** or **fail with specific notes**.

**Step 5 — Iterate or graduate**
- If fail → reviewer notes appended to learnings → back to Step 2 (fresh context, accumulated learnings)
- If pass → task moves to "Ready for Review" in Mission Control
- If iteration cap hit (3) → task flagged as "Blocked — needs human input"

**Step 6 — Mike's review**
- Task appears in "Ready for Review" column in Mission Control
- Includes: summary of what was produced, key decisions, link to output
- Morning Brief includes digest of all items awaiting review
- Mike approves → Done
- Mike provides feedback → one more loop with feedback injected as directive → Done

### 6.2 Learnings File

Each task gets a `learnings.md` that accumulates across iterations:

```markdown
# Task: Write blog post — presentation anxiety
# Iteration: 2

## Iteration 1 — Failed (reviewer)
- Tone was too academic, needs to be more conversational
- Missing concrete example in the "framework" section
- CTA was generic, should reference DDM course specifically

## Iteration 2 — Passed
- Addressed all reviewer notes
- Tone matches brand voice
- Added client scenario example
```

Fresh agents on each iteration read this file, so they don't repeat previous mistakes. This is the Ralph Loop's core insight — filesystem as memory, not context window.

### 6.3 Token Guardrails

| Control | Setting |
|---------|---------|
| Max auto-iterations per task | 3 |
| Builder model (content) | Opus 4.6 |
| Builder model (code) | ChatGPT-5.3-Codex |
| Builder model (research) | GLM 4.7 |
| Reviewer model (always) | Opus 4.6 |
| Context bundle target size | < 8K tokens per skill mapping |
| Parallel task limit | 2-3 concurrent loops |

## 7. Multi-Agent Orchestration

### 7.1 Sophie as Orchestrator

Sophie (main session) sits above the loops. She does not execute tasks — she manages execution.

**Orchestrator responsibilities:**
- Decompose strategic objectives into initiatives and tasks
- Select the right agent profile per task
- Launch loops (sequential or parallel)
- Monitor loop progress
- Perform cross-task consistency checks
- Escalate when needed
- Update Mission Control throughout

### 7.2 Parallel Execution

For a strategic objective with multiple tasks:

```
Sophie receives approved plan with 4 blog posts
    │
    ├─ Slot 1: Loop running Task 1 (Writer → Reviewer → iterate)
    ├─ Slot 2: Loop running Task 2 (Writer → Reviewer → iterate)
    └─ Slot 3: (waiting for a slot)
    
Task 1 completes → Slot 1 picks up Task 3
Task 2 completes → Slot 2 picks up Task 4
```

Parallel limit of 2-3 to manage token costs and avoid overwhelming Mike's review queue.

### 7.3 Cross-Task Consistency

After parallel tasks in the same initiative complete, Sophie does a final pass:
- Read all outputs together
- Check for repetition across pieces
- Check for conflicting messaging or tone drift
- Flag anything inconsistent before it hits Mike's review queue

### 7.4 Escalation Rules

| Trigger | Action |
|---------|--------|
| Task hits 3 iterations without passing | Flag as Blocked, ask Mike for direction |
| Builder and reviewer fundamentally disagree | Escalate specific disagreement to Mike |
| Task requires decision outside Sophie's authority | Pause and ask (pricing, positioning, new features) |
| New context needed that doesn't exist | Flag as Blocked, note the context gap |

## 8. Review & Approval UX

### 8.1 Mission Control — Review Queue

"Ready for Review" column shows all tasks that passed self-review.

Each task card includes:
- **Summary** — 2-3 sentences on what was produced and key decisions
- **Output link** — Link to the deliverable (file, PR, draft)
- **Context used** — Which context files were loaded
- **Iterations** — How many loops it took
- **Reviewer notes** — What the reviewer checked and confirmed

### 8.2 Morning Brief Integration

Daily Morning Brief email includes a "📋 Awaiting Your Review" section:

```
## 📋 Awaiting Your Review (3 items)

1. **Blog: Presentation Anxiety for Solo Consultants**
   2 iterations, passed voice + persona check
   → [View in Mission Control]

2. **Email: Relaunch sequence — Email 3 of 5**
   1 iteration, passed on first try
   → [View in Mission Control]

3. **PR #24: Feedback widget responsive fixes**
   3 iterations (2 failed lint), passed code review
   → [View PR on GitHub]
```

### 8.3 Approval Flow

- **Approve:** Click approve in MC → task moves to Done
- **Feedback:** Type a short note → task goes back through one more loop with Mike's note injected as a directive → returns to Ready for Review
- **Reject:** Rare — task goes back to Backlog with notes for replanning

## 9. Implementation Plan

| Phase | Description | Est. Effort | Dependencies |
|-------|-------------|-------------|--------------|
| **Phase 1: Context Audit** | Review, improve, expand all 20 context files. Identify gaps. Create `skill-mappings.yaml`. Queue for Mike's review. | 2-3 days | None |
| **Phase 2: Tool Audit** | Test every tool in sub-agent context via `sessions_spawn`. Fix permissions/access issues. Document what works. | 1 day | None (parallel with Phase 1) |
| **Phase 3: Mission Control Updates** | Add Self-Review + Ready for Review columns. Add Strategic Objectives + Initiatives entities. Review summary field on tasks. Morning Brief "Awaiting Review" section. | 2-3 days | None (parallel with Phase 1-2) |
| **Phase 4: Agent Profiles** | Create `~/.ai/agents/` with 8 YAML profiles. System prompts, model/context/tool mappings, review criteria. | 1-2 days | Phase 1 (context mappings), Phase 2 (tool audit) |
| **Phase 5: Loop Runner** | Build script implementing Ralph loop via `sessions_spawn`. Learnings file mechanism. Token guardrails. Iteration caps. MC status integration. | 2-3 days | Phase 3 (MC states), Phase 4 (agent profiles) |
| **Phase 6: Orchestrator Wiring** | Parallel execution logic. Cross-task consistency checks. Escalation rules. Integration with work hierarchy. | 1-2 days | Phase 5 (loop runner) |
| **Phase 7: Test Run** | Pick a real strategic objective (e.g. "produce 3 blog posts for solo consultants"). Run full system end-to-end. Tune based on learnings. | 1-2 days | All previous phases |

**Total estimated effort:** 10-16 days

**Mike's review touchpoints:**
- Phase 1: Review updated context files (essential — only Mike can validate)
- Phase 3: Review new MC columns/entities (quick)
- Phase 7: Review test run output and provide feedback on system quality

## 10. Success Criteria

The system is working when:

1. **Mike's review time drops significantly** — reviewing a task takes < 2 minutes (read summary, check output, approve/feedback)
2. **First-try quality is high** — most tasks pass Mike's review without feedback (target: 70%+)
3. **Task generation is autonomous** — Mike sets a strategic objective, Sophie produces a full plan within hours
4. **Iteration is invisible** — Mike only sees polished output, never rough drafts
5. **Context drives quality** — output is consistently on-brand without Mike having to correct voice/tone/positioning

## 11. Future Extensions

- **New agent profiles** as needs evolve (Social, SEO, Analytics)
- **Context expansion** to cover new domains (case studies, competitive intel, pricing)
- **Automated context refresh** — agents update context files after significant work
- **Confidence scoring** — reviewer outputs a confidence score; high-confidence items could auto-approve for low-risk task types
- **Feedback learning** — Mike's correction patterns get analyzed to improve agent profiles and context files over time
- **Cross-initiative planning** — Sophie identifies synergies across initiatives (e.g., "this blog post could be repurposed as an email sequence")

---

*Design brainstormed and approved 2026-02-08. Ready for implementation.*
