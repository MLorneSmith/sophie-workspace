# Phase 3A — Mastra Foundation: Implementation Plan

**Date:** 2026-02-20
**Status:** Planning
**Tasks:** #501, #503, #486, #504, #495

---

## Current State

- **AI Gateway** (`packages/ai-gateway`): OpenAI SDK wrapper → Portkey proxy → multi-provider routing
- **Portkey**: Model routing via headers (`x-portkey-config`), cost tracking, fallbacks
- **No Mastra** installed yet
- **Audience profiling** (Phase 2) uses `getChatCompletion()` directly — no agent abstraction

## Target State

Mastra as the **agent/workflow runtime** layered on top of the existing AI Gateway:

```
┌──────────────────────────────────┐
│         Workflow Steps           │  (Profile → Assemble → Outline → Storyboard → Generate)
├──────────────────────────────────┤
│         Mastra Agents            │  (Partner, Skeptic, Whisperer, Editor — Phase 3B)
├──────────────────────────────────┤
│     Mastra Core (new)            │  Workflows, Memory, Tools, Observability
├──────────────────────────────────┤
│     AI Gateway (existing)        │  getChatCompletion(), Portkey routing, cost tracking
├──────────────────────────────────┤
│     Portkey (existing)           │  Provider routing, fallbacks, virtual keys
└──────────────────────────────────┘
```

**Key decision:** Mastra wraps the existing AI Gateway — we do NOT replace Portkey. Mastra's model routing configures which model/provider combo to use per agent, but the actual API calls still flow through Portkey for cost tracking and fallbacks.

---

## Task Breakdown

### #501 — Integrate Mastra with existing AI Gateway & Portkey

**Goal:** Install Mastra, create singleton, wire it to use our existing `getChatCompletion()` as the underlying LLM call mechanism.

**Steps:**
1. Add `@mastra/core` to `packages/ai-gateway` (or create new `packages/mastra` package)
2. Create `mastra.ts` singleton with Postgres storage (Supabase)
3. Create a custom Mastra model provider that delegates to our `getChatCompletion()` / Portkey
4. Verify: Mastra agent can call LLM through existing pipeline

**Decision needed:** New package (`packages/mastra`) vs extend `packages/ai-gateway`?
- **Recommendation:** New `packages/mastra` package — clean separation, ai-gateway stays as the low-level LLM client

### #503 — Resolve Portkey ↔ Mastra model routing architecture

**Goal:** Define how Mastra's model selection interacts with Portkey's routing configs.

**Architecture:**
- Mastra agent definitions specify model by role (e.g., `reasoning: claude-3.5-sonnet`, `fast: gpt-4o-mini`)
- Mastra passes model choice → AI Gateway → Portkey config headers
- Portkey handles provider routing, API keys, fallbacks
- No duplicate routing logic — Mastra selects the model, Portkey handles the provider

**Steps:**
1. Define model routing table: agent role → model → Portkey config
2. Create `getModelForAgent(agentName, taskType)` helper
3. Wire into Mastra's `RequestContext` for dynamic model selection
4. Test: same agent uses different models for different task types

### #486 — Configure Mastra memory stack for SlideHeroes

**Goal:** Set up Mastra's memory layers for presentation context.

**Memory layers:**
- **Message history**: Per-presentation conversation thread (user ↔ agent exchanges)
- **Working memory**: Current presentation state (profile, assemble output, outline, storyboard)
- **Semantic recall**: Vector search over past presentations, best practices, company briefs

**Steps:**
1. Configure Mastra memory with Postgres backend (Supabase)
2. Define thread scoping: one thread per (presentation × agent)
3. Set up working memory schema: presentation artifacts as structured context
4. Configure pgvector for semantic recall (existing Supabase vector extension)
5. Test: agent can recall relevant context from previous steps

### #504 — Align agentic layer with existing account/team multi-tenancy

**Goal:** Ensure Mastra agents respect the existing RLS and account/team boundaries.

**Steps:**
1. Pass `userId` and `accountId` through Mastra's `RequestContext`
2. Ensure all Mastra DB operations use the authenticated Supabase client (not admin)
3. Scope memory/threads to account: `threadId = ${accountId}:${presentationId}:${agentName}`
4. Verify: user A cannot access user B's agent memory or results
5. Test RLS with Mastra's Postgres storage adapter

### #495 — Build model routing policy per agent

**Goal:** Define which models each agent uses and when.

**Policy table:**

| Agent | Default Model | Reasoning Tasks | Fast Tasks |
|-------|--------------|-----------------|------------|
| Partner | gpt-4o | claude-3.5-sonnet | gpt-4o-mini |
| Skeptic | claude-3.5-sonnet | claude-3.5-sonnet | gpt-4o-mini |
| Whisperer | gpt-4o | gpt-4o | gpt-4o-mini |
| Editor | gpt-4o-mini | gpt-4o | gpt-4o-mini |
| Research | gpt-4o | gpt-4o | gpt-4o-mini |

**Steps:**
1. Create `config/agent-model-policy.ts` with the routing table
2. Integrate with #503's `getModelForAgent()` helper
3. Support overrides: user preference, A/B testing, cost mode
4. Wire into Mastra agent definitions

---

## Build Order

```
#501 (Mastra setup + AI Gateway integration)
  ↓
#503 (Portkey ↔ Mastra routing)
  ↓
#495 (Model routing policy per agent)
  ↓
#486 (Memory stack)
  ↓
#504 (Multi-tenancy alignment)
```

#501 is the foundation — everything else depends on Mastra being installed and wired.

---

## Open Questions for Mike

1. **New package or extend ai-gateway?** I recommend `packages/mastra` — cleaner separation.
2. **Mastra version?** Latest stable (`@mastra/core@latest`) — need to check compatibility with our Next.js 15 / React 19 setup.
3. **Storage:** Use existing Supabase Postgres or separate DB? Recommend: same Supabase instance, new `mastra_*` tables.
4. **Vector store for semantic recall:** pgvector (already available in Supabase) or separate? Recommend: pgvector.
5. **Start with which agent?** Recommend: build the Research agent first (it already exists as `researchAudienceAction` — we'd be wrapping existing logic).
