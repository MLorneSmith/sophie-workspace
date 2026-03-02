# Spec: Sophie Memory System

> **Status:** Approved
> **Created:** 2026-03-01
> **Spec Issue:** MC #663
> **Feature Tasks:** MC #664 (F1), #665 (F2), #666 (F3), #667 (F4), #668 (F5)
> **Estimated Total:** 12-18 days across 5 features

---

## 1. Problem Statement

Sophie and the agent fleet (Neo, Hemingway, Kvoth, Michelangelo, Viral) suffer from three memory problems:

1. **Amnesia** — Sophie forgets preferences and decisions between sessions and after context compaction. Mike repeatedly re-explains things like coding preferences, naming conventions, and past decisions. This is the #1 frustration.

2. **Token bloat** — Every session boots by reading MEMORY.md (~250 lines), LEARNINGS.md (~60 lines), daily logs, and state files. This burns 5-10K tokens before the conversation even starts, and MEMORY.md keeps growing with no automated pruning.

3. **Sub-agent amnesia** — When Sophie spawns Neo or Hemingway, they start with zero context beyond the task brief. Neo doesn't know established coding patterns. Hemingway doesn't know brand voice decisions from last week. Sophie manually curates context injection, but it's inconsistent and incomplete.

**Current architecture:**
- `MEMORY.md` — manually curated during heartbeats (often stale)
- `memory/YYYY-MM-DD.md` — raw daily logs (append-only, never pruned)
- `learnings/LEARNINGS.md` — operational rules from mistakes
- `state/current.md` — survives compaction but manually maintained
- `memory_search` — built-in semantic search (enabled, but underutilized)

---

## 2. User Story

**As** Mike (the human operator),
**I want** Sophie and all sub-agents to remember my preferences, past decisions, and project context across sessions without me repeating myself,
**So that** I spend time on new work instead of re-explaining old context, and my API costs stay reasonable.

---

## 3. User Experience

### 3.1 — Automatic Memory (invisible to Mike)

1. Mike has a conversation with Sophie. He mentions "I prefer feature branches named with the ticket number" or "We decided to use Loops for email."
2. **Mem0 auto-capture** silently extracts these as facts and stores them (preference, decision, etc.)
3. Next session (or after compaction), Mike asks about email tooling.
4. **Mem0 auto-recall** injects the relevant memory: "Decision: Using Loops for email (migrating from ActiveCampaign)" — Sophie answers correctly without being told again.
5. Mike never sees or manages the memory system directly. It just works.

### 3.2 — Sub-Agent Context Injection

1. Mike asks Sophie to spawn Neo for a coding task.
2. Sophie queries Mem0 + SQLite for Neo-scoped memories: coding patterns, architecture decisions, repo conventions, CI requirements.
3. Sophie injects a **context block** into Neo's task brief (e.g., 20-40 relevant memories).
4. Neo works with full awareness of established patterns. No "use TypeScript" reminder needed.

### 3.3 — Explicit Memory Operations

1. Mike says "Remember that the Stripe API version mismatch affects all PRs on dev."
2. Sophie uses `memory_store` to save this as a high-priority fact.
3. Mike says "What do you remember about Stripe issues?"
4. Sophie uses `memory_search` and surfaces the stored fact plus any related auto-captured context.

### 3.4 — Nightly Maintenance (Sleep Mode)

1. Every night at 3am, the sleep mode cron runs automatically.
2. It reviews the day's conversation logs, extracts any facts that auto-capture missed.
3. Promotes important facts to long-term memory, generates a daily digest.
4. Old/superseded memories are automatically deprioritized or pruned.
5. Mike never sees this happening. Zero maintenance.

### 3.5 — Structured Data Queries

1. Over time, Sophie accumulates structured data: contact details, API endpoints, project metadata, competitive intel.
2. Mike asks "Show me all the SaaS tools we've evaluated."
3. Sophie queries the SQLite database with a precise SQL query and returns a structured answer — not fuzzy vector search, but exact data.

**Edge Cases:**
- If Mem0 auto-capture extracts something incorrect, sleep mode's nightly review can catch and correct it
- If a preference changes ("Actually, switch to Resend instead of Loops"), the new memory supersedes the old one — Mem0 handles deduplication
- If sub-agent context injection exceeds a token budget, Sophie truncates to the highest-relevance memories
- If the OpenAI embedding API is down, the system falls back to file-based memory (current behavior) gracefully

---

## 4. Acceptance Criteria

**Must Have:**
- [ ] Mem0 v2 plugin installed and running in self-hosted OSS mode on EC2
- [ ] Auto-capture extracts preferences, decisions, and facts from every Sophie conversation
- [ ] Auto-recall injects relevant memories before each Sophie response
- [ ] Sleep mode runs nightly via cron, processes conversation logs, promotes facts
- [ ] Sub-agent spawn includes scoped memory injection (agent-role-filtered query from Mem0)
- [ ] `memory_store` and `memory_search` tools work for explicit operations
- [ ] Existing markdown files (MEMORY.md, daily logs) continue to work during transition
- [ ] Total boot-time token usage decreases (Mem0 injects only relevant memories, not entire files)

**Nice to Have:**
- [ ] SQLite structured data store for dense/precise queries
- [ ] Identity mapping for multi-channel (Discord, future channels)
- [ ] Graph memory enabled for relationship tracking between entities
- [ ] Weekly memory stats report (how many memories stored, recalled, pruned)
- [ ] Migration script that seeds Mem0 with existing MEMORY.md and LEARNINGS.md content

---

## 5. Scope

**In Scope:**
- Mem0 v2 plugin installation and configuration (self-hosted OSS mode)
- MiniMax embedding integration (embo-01, already have API key) with OpenAI fallback
- Sleep mode setup with nightly cron
- Sub-agent memory injection logic in Sophie's spawn workflow
- Slim down MEMORY.md to a thin index (Mem0 becomes the source of truth)
- SQLite database for structured data storage
- Agent scope definitions (which memory categories each agent gets)

**Out of Scope:**
- Mem0 Cloud / hosted mode — self-hosted only, data stays on EC2
- Vector database migration (Qdrant, etc.) — use in-memory vector store to start, upgrade later if needed
- UI/dashboard for memory browsing — CLI only
- Changes to OpenClaw core — plugin-based only
- Cross-instance memory sync — single deployment only

---

## 6. Visual Mockup

_No UI — this is infrastructure. Architecture diagram:_

```
┌─────────────────────────────────────────────────────────┐
│                    Sophie (Main Agent)                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │ Auto-    │  │ Auto-    │  │ Explicit Tools         │ │
│  │ Recall   │  │ Capture  │  │ memory_store/search/   │ │
│  │ (before) │  │ (after)  │  │ forget/list/get        │ │
│  └────┬─────┘  └────┬─────┘  └───────────┬────────────┘ │
│       │              │                     │              │
├───────┴──────────────┴─────────────────────┴──────────────┤
│                    Mem0 v2 Plugin (OSS)                    │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Embeddings │  │ Vector Store │  │ LLM (extraction) │  │
│  │ (MiniMax   │  │ (file-backed │  │ (MiniMax M2.5)   │  │
│  │  embo-01)  │  │  SQLite)     │  │                  │  │
│  └────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌────────────┐  ┌──────────────┐                        │
│  │ Sleep Mode │  │ Identity Map │                        │
│  │ (3am cron) │  │ (channels)   │                        │
│  └────────────┘  └──────────────┘                        │
├───────────────────────────────────────────────────────────┤
│                    SQLite Layer                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ structured_data.db                                    │ │
│  │ Tables: contacts, tools, api_endpoints, projects,     │ │
│  │         competitive_intel, agent_scopes               │ │
│  └──────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────┤
│                 Sub-Agent Spawn Flow                       │
│                                                           │
│  Sophie ──query(scope=neo)──▶ Mem0 + SQLite               │
│         ◀──relevant memories──┘                            │
│         ──inject context──▶ Neo task brief                 │
└───────────────────────────────────────────────────────────┘
```

---

## 7. Feature Breakdown

| # | Feature Name | Priority | Est. Days | Dependencies | Description |
|---|-------------|----------|-----------|--------------|-------------|
| F1 | Mem0 v2 Plugin Install & Config | 1 | 3 | None | Install openclaw-mem0-v2, configure OSS mode with OpenAI embeddings, verify auto-capture and auto-recall work end-to-end |
| F2 | Sleep Mode & Nightly Cron | 2 | 3 | F1 | Configure sleep mode, set up 3am cron job, verify conversation log processing and fact promotion |
| F3 | Sub-Agent Scoped Memory Injection | 3 | 4 | F1 | Define agent scope categories, build spawn-time memory query logic, inject context blocks into task briefs for Neo/Hemingway/Kvoth/Michelangelo/Viral |
| F4 | SQLite Structured Data Store | 4 | 3 | None | Create SQLite DB with tables for structured data, build query helpers, teach Sophie to store/retrieve dense data |
| F5 | Migration & Markdown Slim-Down | 5 | 3 | F1, F2 | Seed Mem0 with existing MEMORY.md + LEARNINGS.md content, slim MEMORY.md to thin index, update boot sequence to rely on Mem0 recall instead of full file reads |

**Dependency Notes:**
- F1 must be stable before F2 and F3 can begin
- F4 is independent — can run in parallel with F1/F2
- F5 should be last, after we've validated Mem0 is reliably capturing and recalling

**Parallel Opportunities:**
- F1 + F4 can run simultaneously (different systems)
- F2 + F3 can run simultaneously after F1 is complete

---

## 8. Risks & Open Questions

**Risks:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| MiniMax embo-01 compatibility with Mem0 OSS | High | Mem0 OSS embedder config supports custom providers. Test early in F1. Fallback: OpenAI text-embedding-3-small. |
| Auto-capture extracts noise/wrong facts | Medium | Sleep mode reviews and corrects. Can tune extraction prompt. Mem0 handles dedup. |
| EC2 memory pressure (8GB box + vector store) | Medium | File-backed SQLite is lightweight. Monitor with existing infra. |
| Mem0 v2 is community plugin (not official) | Low | Well-structured TypeScript, MIT licensed. Can fork if abandoned. Official plugin is fallback. |

**Open Questions:**
- [x] ~~Vector store~~ → File-backed SQLite persistence via Mem0 OSS. Upgrade to Qdrant if we outgrow it.
- [x] ~~Extraction LLM~~ → MiniMax (already paying for it, route via existing API key)
- [x] ~~Embedding model~~ → MiniMax `embo-01` (no new provider needed)
- [ ] How many memories should auto-recall inject per turn? Default is 5, may need tuning.
- [ ] Should sub-agent memory injection have a token budget cap? (e.g., max 2K tokens of context)

---

## 9. Success Metrics

- **Amnesia reduction:** Mike reports re-explaining preferences/decisions ≤1x per week (down from multiple times per session)
- **Token savings:** Boot-time token usage drops by 40%+ (Mem0 injects 5-10 relevant memories vs reading 300+ lines of files)
- **Sub-agent quality:** Neo and Hemingway produce work that respects established patterns without explicit reminders
- **Zero maintenance:** Mike spends 0 minutes per week managing memory (no manual curation, no file editing)

---

_Spec created via Rabbit Plan process. See SOP: `~/clawd/docs/sops/rabbit-plan.md`_
