# Agentic Layer — Implementation Plan

**Initiative:** Build the Agentic Layer (Mastra)  
**Objective:** 🚀 Build a Product Customers Love  
**Date:** 2026-02-16  
**Status:** Planning → In Progress  

---

## Overview

The Agentic Layer is SlideHeroes' AI backbone — a suite of specialized agents that analyze, enhance, and prepare presentations. It transforms SlideHeroes from a "generate slides" tool into an **AI consulting platform** where every agent mirrors what a senior consultant would do: stress-test arguments, anticipate questions, check consistency, tailor the message.

This document maps all 27 tasks in the initiative, shows how they connect, and defines the build sequence.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│                   USER INTERFACE                 │
│  Agent Discovery UI (#493) · Extend Existing    │
│  Suggestions UI (#507) · HITL Review (#479)     │
│  Streaming Progress (#496)                      │
├─────────────────────────────────────────────────┤
│               WORKFLOW ORCHESTRATION             │
│  Audience Profiling (#477) · Deck Build (#480)  │
│  Post-Process (#484) · Agent Chaining (#494)    │
├─────────────────────────────────────────────────┤
│                  AGENT CATALOG                   │
│  Launch: Partner, Skeptic, Whisperer, Editor    │
│  (#483) · Post-Launch: Devil's Advocate,        │
│  Auditor, Translator, Perfectionist (#490)      │
├─────────────────────────────────────────────────┤
│            INTEGRATION LAYER (NEW)               │
│  AI Gateway + Portkey Integration (#501, #503)  │
│  TipTap Output Compatibility (#505)             │
│  PPTX Export Compatibility (#506)               │
│  Account/Team Multi-tenancy (#504)              │
├─────────────────────────────────────────────────┤
│               INFRASTRUCTURE                     │
│  Mastra Setup (#474) · DB Schemas (#475✅)       │
│  Migration (#498) · Data Model Migration (#502) │
│  Zod Schemas (#476) · Memory (#486)             │
│  RAG (#487) · Model Routing (#495)              │
│  Error Handling (#499)                          │
├─────────────────────────────────────────────────┤
│              QUALITY & OPERATIONS                │
│  Cost Tracking (#488) · Observability (#489)    │
│  Eval Framework (#500) · Results History (#497) │
└─────────────────────────────────────────────────┘
```

---

## Task Dependency Map

### Phase 0: Foundation (must complete first)
These tasks have no dependencies and everything else builds on them.

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| #475 | Design product DB schemas | ✅ Done | — |
| #498 | Create Supabase migration | Backlog | #475 |
| #473 | Mastra validation spike | In Progress | — |
| #474 | Set up Mastra singleton + storage + vector store | Backlog | #473 |
| #476 | Define Zod schemas for all typed artifacts | Backlog | #475 |
| #438 | Redesign flow and UI of agentic workflow | ✅ Done | — |

**Flow:** Schema design (#475 ✅) → Migration (#498) → Mastra setup (#474) → Everything else

### Phase 1: Core Workflows
The three entry points and the primary workflow.

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| #477 | Build Audience Profiling workflow (WOW #1) | Backlog | #474, #476, #498 |
| #478 | Build person + company research tools | Backlog | #474 |
| #479 | Build HITL UI for Audience Brief review | Backlog | #477 |
| #480 | Build deck build workflow (Outline → Storyboard → Generate) | Backlog | #474, #476, #498 |
| #481 | Build Brain Dump to Outline entry point (WOW #3) | Backlog | #480 |
| #482 | Build Deck Intelligence / Upload entry point (WOW #2) | Backlog | #474, #487 |

**Flow:**
```
Mastra Setup (#474)
    ├── Audience Profiling (#477) → HITL Review UI (#479)
    │       └── Person/Company Research (#478) feeds into profiling
    ├── Deck Build Workflow (#480)
    │       └── Brain Dump Entry (#481) feeds into Outline step
    └── Deck Intelligence/Upload (#482) → needs RAG (#487)
```

### Phase 2: Agent Platform
The agents themselves and the orchestration that runs them.

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| #483 | Launch agents: Partner, Skeptic, Whisperer, Editor | Backlog | #474, #476 |
| #484 | Build post-process workflow (parallel orchestration) | Backlog | #474, #483 |
| #490 | Post-launch agents: Devil's Advocate, Auditor, Translator, Perfectionist | Backlog | #484 |
| #494 | Agent chaining & batch execution | Backlog | #484 |

**Flow:**
```
Mastra Setup (#474) + Zod Schemas (#476)
    └── Launch Agents (#483)
            └── Post-Process Orchestration (#484)
                    ├── Post-Launch Agents (#490)
                    └── Agent Chaining (#494)
```

### Phase 3: User Experience
How users discover, run, and interact with agents.

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| #493 | Agent Discovery & Launch UI | Backlog | #483, #484 |
| #485 | Agent suggestions UI (accept/reject) | Backlog | #483, #498 |
| #496 | Streaming progress UI | Backlog | #484 |
| #479 | HITL UI for Audience Brief review | Backlog | #477 |

**Flow:**
```
Agents (#483) + Orchestration (#484)
    ├── Discovery UI (#493) — how users find and launch agents
    ├── Suggestions UI (#485) — how users act on agent output
    └── Streaming Progress (#496) — what users see while agents run
```

### Phase 4: Infrastructure & Reliability
Supporting systems that make the platform production-grade.

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| #486 | Configure Mastra memory stack | Backlog | #474 |
| #487 | Build RAG pipeline for deck context | Backlog | #474 |
| #495 | Model routing policy per agent | Backlog | #483 |
| #499 | Error handling, retry logic & rate limiting | Backlog | #484 |
| #488 | Cost tracking and attribution | Backlog | #498 |
| #497 | Agent results persistence & version history | Backlog | #498, #485 |

### Phase 5: Quality & Operations (ongoing)
Can start early but runs continuously.

| Task | Name | Status | Depends On |
|------|------|--------|------------|
| #489 | Observability export + agent quality evals | Backlog | #484 |
| #500 | Agent quality eval framework & regression tests | Backlog | #483 |

---

## Critical Path

The fastest path to a working demo (minimum viable agentic layer):

```
#475 ✅ Schema Design
  → #498 Supabase Migration
    → #473 Mastra Spike (in progress)
      → #474 Mastra Setup in Product
        → #476 Zod Schemas
          → #483 Launch Agents (Partner + Skeptic minimum)
            → #484 Post-Process Orchestration
              → #485 Suggestions UI (accept/reject)
              → #496 Streaming Progress UI
```

**Estimated critical path:** ~8-10 tasks, each 2-5 days = **4-8 weeks** to a working agent demo.

**Parallel work** (can happen alongside critical path):
- #477 Audience Profiling (after #474)
- #487 RAG Pipeline (after #474)  
- #478 Research Tools (after #474)
- #486 Memory Stack (after #474)
- #495 Model Routing (after #483)
- #499 Error Handling (after #484)

---

## How the Pieces Connect (End-to-End Flow)

### User Journey: "Analyze My Deck"

1. **User uploads a deck** → Deck Intelligence (#482) extracts content via RAG (#487)
2. **User has an audience profile** → Audience Profiling (#477) with person research (#478), reviewed via HITL (#479)
3. **User clicks "Run Presentation Coach"** → Agent Discovery UI (#493) shows available agents
4. **System creates a workflow run** → DB migration (#498) provides the `workflow_runs` table
5. **Mastra orchestrates the agent** → Mastra setup (#474) with model routing (#495) picks the right model
6. **Agent executes** → Launch agents (#483), streaming results via (#496)
7. **Results appear as suggestions** → Suggestions UI (#485), persisted via (#497)
8. **User accepts/rejects suggestions** → Applied to deck
9. **User chains another agent** → Agent chaining (#494) runs Q&A Prep next
10. **Cost tracked** → Cost tracking (#488) logs tokens per run
11. **Quality monitored** → Observability (#489) + eval framework (#500) catch regressions
12. **If anything fails** → Error handling (#499) retries or surfaces clear error

### Data Flow

```
User Input (deck + audience)
    │
    ▼
┌── RAG Pipeline (#487) ──────────────┐
│   Extracts slides, text, structure   │
│   Stores embeddings in vector store  │
└──────────────┬──────────────────────┘
               │
               ▼
┌── Audience Profile (#477) ──────────┐
│   Person/company research (#478)     │
│   User reviews via HITL (#479)       │
│   Stored in audience_profiles table  │
└──────────────┬──────────────────────┘
               │
               ▼
┌── Workflow Orchestration (#484) ────┐
│   Creates workflow_run record        │
│   Routes to correct model (#495)     │
│   Manages parallel agents            │
│   Handles errors/retries (#499)      │
│                                      │
│   ┌─ Agent: Partner (#483) ────┐    │
│   │  Input: slides + audience   │    │
│   │  Output: suggestions        │    │
│   └─────────────────────────────┘    │
│   ┌─ Agent: Skeptic (#483) ───┐     │
│   │  Input: slides + audience   │    │
│   │  Output: Q&A prep sheet     │    │
│   └─────────────────────────────┘    │
│                                      │
│   Records: agent_runs, tokens, cost  │
└──────────────┬──────────────────────┘
               │
               ▼
┌── Suggestions (#485) ──────────────┐
│   Stored in suggestions table       │
│   Displayed as accept/reject cards  │
│   History tracked (#497)            │
│   Quality evaluated (#500)          │
└─────────────────────────────────────┘
```

---

## Relationship to Other Initiatives

| Initiative | Relationship |
|------------|-------------|
| **Ship the Core Product Experience** (#15) | The agentic layer plugs INTO the core product. Dashboard (#325), Storyboard (#327), Generate (#328), and Export (#329) are the canvas; agents enhance what's on that canvas. |
| **Build the Knowledge Engine** (#17) | RAG pipeline (#487) and Ragie integration (#330) share infrastructure. Knowledge Engine provides the retrieval layer that agents consume. |
| **Harden the Platform** (#16) | PostHog (#113), Zaraz consent (#111), permissions (#106) are platform-level concerns that the agentic layer must respect (e.g., RLS on agent_runs). |
| **Launch & Beta** (#18) | Agents are a key differentiator for beta. At minimum, 2 launch agents should be functional for beta testers. |
| **Competitive Intelligence & Pricing** (#19) | Agent pricing model (included vs. premium add-ons) is an open question that pricing decisions (#342) must address. |

---

## Codebase Integration Tasks (from 2025slideheroes review)

These tasks were identified by reviewing the actual product codebase and ensuring the agentic layer integrates cleanly with what exists.

### Phase 0b: Integration Architecture (parallel with Phase 0)

| Task | Name | Status | Depends On | Why |
|------|------|--------|------------|-----|
| #501 | Integrate Mastra with existing AI Gateway & Portkey | Backlog | #474 | Product already has `packages/ai-gateway` with Portkey routing, usage tracking tables (`ai_request_logs`, `ai_usage_allocations`, `ai_credit_transactions`). Mastra must flow through this, not create parallel tracking. |
| #503 | Resolve Portkey ↔ Mastra model routing architecture | Backlog | #501 | AI Gateway routes through Portkey for model selection + fallback strategies. Per-agent model routing (#495) must work WITH Portkey, not replace it. |
| #502 | Plan building_blocks → agentic data model migration | Backlog | #498 | Current `building_blocks_submissions` table stores everything in one row (title, audience, SCQA, outline, storyboard). New tables (audience_profiles, workflow_runs, agent_runs) decompose this. Need migration strategy. |
| #504 | Align with existing account/team multi-tenancy | Backlog | #498 | Existing system uses `user_id` + `team_id` with `auth.uid()` RLS. Our schemas use `account_id`. Must match existing conventions. |

### Phase 2b: Output Compatibility (parallel with Phase 2)

| Task | Name | Status | Depends On | Why |
|------|------|--------|------------|-----|
| #505 | TipTap editor output compatibility | Backlog | #483 | Outline editor is TipTap-based with `TipTapTransformer` and `format-conversion` utilities. Agent suggestions must produce TipTap-compatible JSON. |
| #506 | PPTX export compatibility | Backlog | #483 | `PptxGenerator` expects `StoryboardData` with typed `Slide[]`. Agent modifications (remove slides, restructure, add notes) must produce valid storyboard data. |
| #507 | Extend existing suggestions UI | Backlog | #483 | Canvas already has `suggestions/` components (`ImprovementCard`, `SuggestionsPane`) using `BaseImprovement` from `@kit/ai-gateway`. Extend this, don't rebuild. |

### Key Architectural Decisions from Codebase Review

**1. AI Gateway is the single entry point for all LLM calls**
```
User Action → Mastra Workflow → AI Gateway (packages/ai-gateway)
                                      → Portkey (routing/fallback)
                                      → LLM Provider
                                      → ai_request_logs (usage tracking)
```
Mastra should NOT call OpenAI/Anthropic directly. It must use the AI Gateway's `createCompletion()` which handles Portkey routing, usage tracking, credit deduction, and rate limiting.

**2. Data model evolution, not replacement**
```
Current: building_blocks_submissions (monolith row)
    ↓ add FKs
New:     building_blocks_submissions
           ├── audience_profile_id → audience_profiles
           ├── workflow_run_id → workflow_runs
           └── (agent_runs link via workflow_run_id)
```
The `building_blocks_submissions` table stays as the "presentation" record. New tables extend it via foreign keys. Existing data continues to work.

**3. Multi-tenancy follows existing pattern**
- Personal accounts: `user_id` + RLS via `auth.uid() = user_id`
- Team accounts: `team_id` via `accounts` table membership
- New agentic tables must use this same pattern, not a separate `account_id`

**4. E2B is development-only**
The `packages/e2b` sandbox is for development/testing. It is NOT part of the production agent pipeline.

---

## Decisions (Resolved 2026-02-18)

1. **✅ Which 2 agents ship first for beta?** → **The Partner (Coach) + The Skeptic (Q&A Prep).** Highest perceived value, most differentiated. The Editor (Deck Shrinker) is a strong #3.
2. **✅ Agent pricing model?** → **Included in subscription for beta** (no friction, maximize adoption + feedback). Move to credit-based billing post-beta once usage patterns are clear. Credit infrastructure (`ai_usage_allocations`, `ai_credit_transactions`) already exists.
3. **✅ Person/company research data sources (#478)?** → **Two-layer approach with Netrows.** Layer 1: **Netrows API** (netrows.com) for structured person/company enrichment (48+ LinkedIn endpoints — title, role history, education, skills, company basics). Proxycurl shut down (nubela.co/blog/goodbye-proxycurl); Netrows is the replacement (€49/mo, 10K credits, API-first, no cookies). Layer 2: Web search + fetch + LLM synthesis for strategy/news/priorities. User-provided context supplements both. Legal posture: comfortable (user-initiated, small scale, legitimate research use case). Task #516 (legal/TOS) resolved. Next step: 25-profile validation experiment via Netrows free credits. See `deliverables/linkedin-data-providers-research.md` for original evaluation.
4. **✅ Mastra vs. alternatives?** → **Proceed with Mastra as primary.** Validation spike (#473) is the gate. If dealbreakers emerge, fallback is Mastra for agent definitions + Vercel AI SDK for streaming (skip LangGraph for TypeScript stack).
5. **✅ Agent results privacy** → **Visible only to the user who triggered them** (not account admins). **90-day retention** or until presentation is deleted, whichever comes first. Include "delete my agent history" button.
6. **✅ building_blocks_submissions evolution** → **Add foreign keys to new tables** referencing existing `building_blocks_submissions`. No data migration needed, lower risk, incremental evolution.

---

## Files & References

| Document | Location | Purpose |
|----------|----------|---------|
| DB Schemas | `deliverables/agentic-layer-db-schemas.md` | Table designs for agent_runs, workflow_runs, suggestions, audience_profiles |
| Infrastructure Research | `deliverables/agentic-layer-infrastructure-research.md` | Evaluation of Mastra vs LangGraph vs alternatives |
| Workflow Redesign | `deliverables/agentic-slide-deck-workflow-redesign.md` | UX flow for the agentic deck workflow |
| Mastra Deep Eval | `deliverables/mastra-deep-evaluation.md` | Detailed Mastra capabilities assessment |
| Mastra Spike Plan | `deliverables/mastra-validation-spike-plan.md` | Validation spike scope and success criteria |
| WOW #4 Agent Layer | `deliverables/wow4-agent-layer.md` | Agent catalog, UX patterns, integration points |
| Agent Profiles Review | `deliverables/agent-profiles-review.md` | Review of agent personality/capability definitions |
