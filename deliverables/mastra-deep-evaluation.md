# Mastra deep evaluation for SlideHeroes Agent Layer (Next.js/TypeScript)

Date: 2026-02-15 (UTC)

## Executive summary

Mastra is a strong fit for SlideHeroes’ “Agent Layer” if you want:

- **A TypeScript-first agent + workflow runtime** with **schema-typed steps**, **parallel/branch/loop control flow**, **streaming**, and **HITL suspend/resume**.
- **Built-in multi-model routing** (provider/model strings), **dynamic model selection** via `RequestContext`, and **fallback chains**.
- **A serious memory stack** (message history + working memory + semantic recall + *observational memory*) and a storage abstraction (Postgres/libSQL/Mongo/etc).
- **Observability that actually ships**: tracing for agents/workflows/tool calls with **token usage**, structured metadata, and exporters to Langfuse/LangSmith/Braintrust/OTEL/etc.
- **Built-in eval primitives (“scorers”)** that can run live (async, sampled) and store results.

Where Mastra is *not* enough out of the box:

- **Product-specific orchestration**: You still need to design your own “deck pipeline” state machine, DB schemas, permissions, and how agent outputs become slide edits.
- **Cost accounting in dollars**: traces capture token usage, but you’ll likely need your own pricing table + cost calculator.
- **UI/UX for HITL**: Mastra provides `suspend()/resume()` and payload schemas, but you still build the UI, persistence, and authorization.
- **Very large-scale / queued background execution**: Mastra supports runners (e.g., Inngest) but you must choose/operate the infra; serverless nuances (flush, external DB) matter on Vercel.

Overall recommendation: **Adopt Mastra for the agent/workflow/memory/observability layer** *if* SlideHeroes is ready to commit to Mastra’s primitives as core infrastructure. It is more complete than “roll your own,” but still expects you to design product-level orchestration and persistence.

---

## What I actually read in the Mastra docs (primary sources)

Key pages fetched:

- Agents overview: <https://mastra.ai/docs/agents/overview>
- Workflows overview: <https://mastra.ai/docs/workflows/overview>
- Workflows suspend/resume: <https://mastra.ai/docs/workflows/suspend-and-resume>
- HITL: <https://mastra.ai/docs/workflows/human-in-the-loop>
- Control flow (parallel/foreach/branch/etc): <https://mastra.ai/docs/workflows/control-flow>
- Agent tools & “agents/workflows as tools”: <https://mastra.ai/docs/agents/using-tools>
- Workflow steps calling agents/tools: <https://mastra.ai/docs/workflows/agents-and-tools>
- Memory overview: <https://mastra.ai/docs/memory/overview>
- Agent memory setup: <https://mastra.ai/docs/agents/agent-memory>
- Working memory (template + schema, resource/thread scope, read-only): <https://mastra.ai/docs/memory/working-memory>
- Semantic recall (vector stores, embedder config, scope): <https://mastra.ai/docs/memory/semantic-recall>
- Observational memory (observer/reflector, token budgets, buffering, scope): <https://mastra.ai/docs/memory/observational-memory>
- RAG overview: <https://mastra.ai/docs/rag/overview>
- Evals/scorers: <https://mastra.ai/docs/evals/overview>
- Observability overview: <https://mastra.ai/docs/observability/overview>
- Tracing deep docs: <https://mastra.ai/docs/observability/tracing/overview>
- Models/model router: <https://mastra.ai/models>
- Next.js integration guide: <https://mastra.ai/guides/getting-started/next-js>
- Deploy with web framework (Next.js on Vercel config): <https://mastra.ai/docs/deployment/web-framework>
- Vercel deployer: <https://mastra.ai/guides/deployment/vercel>

---

## Mastra primitives (relevant to SlideHeroes)

### 1) Agents
From the docs, Mastra Agents are LLM + tools + memory. Notable features:

- **Streaming and non-streaming** response modes: `.stream()` and `.generate()`.
- **Structured output** (Zod/JSON schema) with `response.object`.
- **Multi-step tool calling** with `maxSteps` and `onStepFinish` callbacks for progress/usage.
- **Dynamic model selection**: `model` can be a function of `RequestContext` (e.g., user tier selects model).
- **Subagents and subworkflows**: you can register subagents/workflows inside an agent and they are auto-exposed as tools (`agent-<name>` / `workflow-<name>`).

Implication: Your “12 agents” can be literal Mastra agents, and you can compose them either via workflows (deterministic pipelines) or via an orchestrator agent that calls other agents as tools.

### 2) Workflows
Workflows are schema-typed graphs of steps built with `createStep()` and `createWorkflow()`.

- Steps have `inputSchema` and `outputSchema` and an `execute` function.
- **Control flow** includes:
  - `.then()` sequential chaining
  - `.parallel([...])` fan-out/fan-in with object output keyed by step ids
  - `.foreach(step, { concurrency })` map over arrays with concurrency control
  - `.branch([...])` conditional path selection
  - loops: `.dountil`, `.dowhile`
- Workflows have **state** (`stateSchema`, `setState`) that persists and is carried across suspend/resume.
- Workflows can be run with `.start()` (final result) or `.stream()` (events during execution).

Key limitation (explicit in docs): **`.parallel()` and `.foreach()` are synchronization points**; the next step runs only after all parallel branches/items complete. There is **no built-in “as each branch finishes, feed into next step”** streaming between steps.

### 3) Suspend / resume + HITL
Workflows can pause at any step using `suspend()` and later continue using `run.resume()`.

- A step may define a `resumeSchema` and a `suspendSchema`. It can return `suspend(payload)` when required.
- `resumeData` is passed on resume. `suspendData` lets you access the original payload used to suspend.
- HITL is a documented pattern with `suspend()` payloads for UI display and `bail()` for clean rejection.
- Suspended state is persisted as **snapshots** in configured storage across deployments/restarts.

This maps extremely well to “user must review Audience Brief” and “user accepts/rejects/edits suggestions”.

### 4) Memory architecture
Mastra supports **four complementary memory types**:

1) **Message history** (recent context)
2) **Working memory** (persistent structured data; template markdown or Zod schema; resource or thread scoped; read-only mode)
3) **Semantic recall** (vector DB retrieval of relevant past messages/tool calls/results; configurable `topK`, `messageRange`, scope thread vs resource; embedder config)
4) **Observational memory (OM)**: background **Observer** + **Reflector** agents that compress growing history into dense observations/reflections; stable prefix enables prompt caching; can operate in thread scope (default) or resource scope (experimental)

For SlideHeroes, the most relevant is **Working Memory (schema-based)** for Audience Brief + user preferences, plus either semantic recall or OM for long-running threads.

Notable caution straight from docs:

- **OM resource scope is marked experimental** and may need prompt tuning to avoid cross-thread contamination when multiple threads run simultaneously.

### 5) RAG
Mastra provides a RAG toolkit (`@mastra/rag`) and supports multiple vector stores (pgvector, Pinecone, Qdrant, Mongo, etc). Example shows chunking via `MDocument`, embedding via model-router embedding model, and upsert/query through a vector store adapter.

In SlideHeroes: company research, competitor scanning, internal playbooks, and prior decks all map cleanly to RAG.

### 6) Observability + tracing
Mastra tracing is relatively deep:

- Auto-traces agent runs, LLM calls, tool calls, workflow steps, memory operations.
- Captures **AI-specific metadata** including **token usage**.
- Exporters: DefaultExporter (Studio via storage), CloudExporter (Mastra Cloud), and third parties (Langfuse, LangSmith, Braintrust, Datadog, OTEL, etc).
- Sampling strategies and dynamic config selection are supported.
- Can hide input/output, apply sensitive-data redaction, attach tags and metadata.
- Provides `traceId` in agent/workflow responses.
- Serverless note: you may need to `flush()` before returning.

This is directly relevant to per-agent cost tracking and debugging “why did the agent say this?”.

### 7) Evals / scorers
Mastra Evals introduce **scorers**:

- Model-graded and rule-based scoring primitives.
- Can attach scorers to agents or workflow steps.
- Run **asynchronously** alongside production traffic with **sampling rate**.
- Stored in `mastra_scorers` table.
- Can score historical traces via Studio.

This is a real differentiator vs frameworks that only do orchestration.

---

## Mapping SlideHeroes to Mastra

### A) Your core workflow: Profile → Assemble → Outline → Storyboard → Generate

**Recommendation:** Implement the *core pipeline* as a **Mastra Workflow** (deterministic, multi-step, resumable).

- *Profile* (audience & company research) is a workflow with potential HITL pause.
- *Assemble/Outline/Storyboard/Generate* are sequential workflow steps.
- Inside steps, use:
  - Agents for “reasoning / writing” tasks (outline/storyboarding/speaker notes)
  - Tools for reliable operations (fetching, storing, slide JSON transforms, calling internal APIs)
  - RAG for grounding

Why workflow (vs one super-agent):

- You want predictable step boundaries, partial progress, caching, and explicit parallelization.
- Slide generation is naturally a pipeline with typed artifacts.

### B) Mapping the 12 agents

Below is a practical mapping of each “agent” to Mastra constructs.

#### Launch agents

1) **The Partner (Presentation Coach)**
- Mastra: **Agent** (deep reasoning) called from a workflow step `reviewDeck`.
- Output: structured per-slide feedback (Zod schema) so UI can render comment cards.
- Model: higher-tier reasoning model.

2) **The Skeptic (Q&A Prep)**
- Mastra: **Agent** + optional RAG tool for retrieving claims / slide content / sources.
- Output: structured list of tough questions + suggested answers + confidence flags.
- Model: strong reasoning model.

3) **The Whisperer (Speaker Notes)**
- Mastra: **Agent** invoked in a workflow `generateSpeakerNotes`.
- Likely `.foreach()` per slide with concurrency (e.g., 3–8) depending on token budget.
- Model: mid-tier (notes are verbose but not deeply strategic).

4) **The Editor (Deck Shrinker)**
- Mastra: could be either:
  - **Workflow** that runs: analyze redundancy → propose merge plan → rewrite → validate consistency.
  - or a single **Agent** with tools for “edit slide JSON” and “recompute table of contents”.
- I’d choose **Workflow** (more deterministic + safer).

#### Post-launch agents

5) **Devil’s Advocate (Counter-Argument)**
- Mastra: Agent that produces counterpoints + risk register; best as structured output.

6) **Auditor (Fact Checker)**
- Mastra: Workflow + tools (web fetch/search; citations capture; claim extraction).
- Likely needs explicit tool control + logging; a pure agent can hallucinate citations.

7) **Translator (Data Storyteller)**
- Mastra: Agent; can be called per chart/table block.

8) **Perfectionist (Consistency Checker)**
- Mastra: Workflow that runs rule-based tools + targeted agent checks.
- Example: tool extracts terms/numbers across slides; agent explains inconsistencies and proposes fixes.

#### Future agents

9) **Spy (Competitor Scanner)**
- Mastra: Workflow with RAG ingestion + periodic execution (runner).

10) **Diplomat (Localization)**
- Mastra: Agent per locale + workflow for glossary consistency + tone.

11) **Advocate (Accessibility)**
- Mastra: Workflow using tools to inspect slide structure and agent to generate alt-text.

12) **Timekeeper (Timing)**
- Mastra: Agent + deterministic tool (estimate time per word/slide) + structured output.

**Pattern:**

- Use **Agents** for “language + judgement”.
- Use **Workflows** when you need multi-step safety, deterministic control flow, retries, HITL, and clear intermediate artifacts.

### C) Orchestration pattern for multiple agents per presentation

You have two reasonable approaches:

1) **Workflow-orchestrated agents (recommended)**
- A `presentationPostProcessWorkflow` can `.parallel()` the Partner/Skeptic/Whisperer/Editor where possible.
- For per-slide tasks (speaker notes, consistency checks), use `.foreach(..., { concurrency })`.

2) **Orchestrator agent calling subagents as tools**
- One “Conductor” agent has subagents registered via `agents: { partner, skeptic, ... }`.
- It decides what to run.
- Risk: less deterministic; harder to do fine-grained caching and parallelism.

Given SlideHeroes is “consulting-grade” and you’ll want reliability, I’d use (1) as primary.

---

## Audience Profiling (WOW #1) mapped to Mastra

### What you need

- Research person (LinkedIn) and company (web/news)
- Produce an **editable Audience Brief**
- Save it for reuse
- Feed it into all downstream agents
- Remember “last time you presented to X…”

### Mastra design

**Key idea:** store the Audience Brief as **schema-based working memory** (resource-scoped) and reference it from all agent calls via `memory: { resource, thread }`.

#### Scope model

- `resourceId` = the SlideHeroes **account/user** (or workspace) depending on who owns the profile.
- `threadId` = a specific **presentation** run (or a “profiling” thread).

Working memory (resource-scoped) persists across threads for the same resource. That maps well to “saved profiles for reuse”.

#### Recommended memory mix

- **Working memory (schema)**: canonical Audience Brief (editable, structured)
- **Message history**: the current deck build conversation/context
- **Semantic recall**: optional; useful for “last time” recall across threads if you rely on conversation logs
- **Observational memory**: consider for long iterative sessions where tool outputs and drafts blow up tokens
  - Use **thread scope** (default) to avoid cross-thread contamination.
  - Be cautious about **resource scope** in OM (experimental).

#### HITL for Audience Brief

Implement profiling as a workflow step that can `suspend()` with a payload containing the proposed Audience Brief.

- UI shows the brief, user edits/approves.
- On approve, `run.resume({ resumeData: { approved: true, editedBrief: ... } })`.
- On reject, either `bail({ reason })` or resume with `approved: false` and branch.

Mastra supports exactly this via suspend/resume + `suspendSchema` + `resumeSchema`.

---

## Requirements-by-requirement evaluation

### 1) Multiple agents per presentation (parallel where possible)

**Supported.** Workflows have `.parallel()` and `.foreach(..., { concurrency })`.

- `.parallel()` is unbounded concurrency (no limit option documented).
- `.foreach()` supports concurrency limits.

**Caveat:** `.parallel()` and `.foreach()` are synchronization points; you can stream workflow execution events to UI, but you can’t pipe “first finished result” to next step early.

### 2) Audience Profile as shared context across agents

**Supported.** Use working memory (resource-scoped) + pass consistent `memory: { resource, thread }` on all calls.

- Working memory can be schema-based (strongly recommended for Audience Brief).
- Can set initial working memory via thread metadata or update programmatically.
- Can use read-only mode for subagents that must not mutate the brief.

### 3) Different models per agent + per request

**Supported.** `model` can be a string, array of fallback configs, or a function of `RequestContext`.

- You can dynamically select model by plan tier, agent type, deck complexity, etc.
- Provider-specific options (e.g., OpenAI `reasoningEffort`) can be set per instruction/message.

### 4) Human-in-the-loop (accept/reject/modify)

**Strong support** via workflow `suspend()`/`resume()` and documented HITL patterns.

You still must implement:

- UI components for review/edit
- Authentication/authorization for resume actions
- Persistence of `runId` and suspended step id(s)

### 5) Memory across sessions

**Supported** with a configured storage adapter.

- Message history persists per thread.
- Working memory persists per resource or thread.
- Semantic recall enables cross-time retrieval with vector DB.
- Observational memory compresses long threads.

### 6) Cost tracking per agent per run

**Partially supported.** Tracing captures **token usage** and is queryable via exporters/Studio.

However, **$ cost** typically requires:

- mapping model → price table
- cost computation on usage
- storing cost summaries per run / per customer

Mastra doesn’t claim “billing/cost accounting” as a built-in feature in the docs we read; you’ll build this on top of trace usage.

### 7) Must work in Next.js (TypeScript)

**Supported.** There is a Next.js guide using `@mastra/ai-sdk` and Next routes.

Deployment considerations from docs:

- On Vercel (serverless), filesystem is ephemeral → don’t use file-based `LibSQLStore`.
- `next.config.ts` may need `serverExternalPackages: ["@mastra/*"]`.
- For serverless telemetry, call `observability.flush()` before returning.

---

## Gaps / concerns / red flags

### 1) Parallel execution control and limits

- `.parallel()` has no documented concurrency limit. For heavy LLM calls (Partner + Skeptic + Auditor simultaneously), you may need your own throttling layer (queue) to avoid rate limits.
- `.foreach()` has concurrency controls and is likely your primary “fan out” for per-slide tasks.

### 2) Cost tracking not “turnkey”

Tracing gives tokens; converting to dollars and attributing per feature/customer is your responsibility.

### 3) Serverless deployment nuances

- Storage must be external on Vercel.
- Need `flush()` for observability.
- Background/long-running jobs can be cut off; you may prefer workflow runners (Inngest) or long-running worker infrastructure.

### 4) Observational Memory resource scope is experimental

SlideHeroes wants “memory across sessions” and “saved audience profiles”. Working memory handles this safely. OM resource scope is tempting but could cause cross-thread blending; treat with caution.

### 5) Structured output + tool calling compatibility

Docs mention some models may not support tools + structured output in the same call. You’ll need:

- model capability matrix
- or workflows that separate “tool retrieval” step from “structured synthesis” step

### 6) Fact-checking quality still depends on your tools

Mastra provides tool plumbing; **you** must build:

- claim extraction
- source retrieval
- citation formatting
- verification heuristics

### 7) Maturity / ecosystem risk (qualitative)

Not directly measurable from docs, but you should validate:

- release cadence, breaking changes
- long-term support policy
- community size / issue turnaround

(Recommendation: run a 1–2 week spike implementing 2–3 agents + profiling workflow and see real-world friction.)

---

## Concrete architecture proposal for SlideHeroes + Mastra

### High-level components

1) **Mastra instance (singleton)**
- Registers all agents + workflows.
- Configures storage + vector + observability + scorers.

2) **SlideHeroes DB (product DB)**
- `presentations` table
- `audience_profiles` table
- `agent_runs` table (status, inputs, outputs, runId, traceId, token usage, $ cost)
- `workflow_runs` table (Mastra runId, snapshot references, resume payloads)

3) **Mastra storage + vector store**
- Likely **Postgres** (shared) or managed vector store.
- Mastra memory tables live here.

4) **UI / API layer (Next.js)**
- Server Actions or Route Handlers call workflows/agents.
- Streaming via AI SDK UI where appropriate.

### Suggested “canonical artifacts”

- `AudienceBrief` (Zod schema) stored in working memory and in product DB.
- `DeckOutline` / `Storyboard` / `SlideJSON` as typed objects passed between workflow steps.
- `AgentSuggestion[]` with stable IDs for UI accept/reject.

### Proposed workflows

#### 1) `audienceProfilingWorkflow`
Steps:

- `collectInputs` (tool step) – normalize user prompt, target person/company URLs
- `fetchPerson` (tool) – LinkedIn ingestion (likely via your own scraper/API)
- `fetchCompany` (tool) – website/news collection
- `synthesizeBrief` (agent step w/ structured output)
- `hitlReview` (step that `suspend({ brief, reason })` until approved)
- `persistBrief` (tool step) – write to product DB + update working memory

#### 2) `deckBuildWorkflow`

- `loadAudienceContext` (tool) – load brief from DB + inject into memory/thread metadata
- `assembleSources` (tool/RAG) – gather user inputs, docs
- `outline` (agent structured)
- `storyboard` (agent structured)
- `generateSlides` (tool + agent) – slide JSON generation
- `qualityGate` (workflow) – run Perfectionist + Auditor checks
- `hitlDeckReview` (optional suspend)

#### 3) `postProcessWorkflow` (WOW #4)

- `.parallel([partnerReview, skepticQA, whispererNotes, editorShrink])`
- `mergeSuggestions` (tool step) – store suggestions in DB for UI

### Multi-agent suggestion storage pattern

Store each agent’s suggestions in a normalized table:

- `suggestion_id`, `presentation_id`, `agent_id`, `slide_id?`, `type`, `payload`, `status` (pending/accepted/rejected), `created_at`

The UI can accept/reject with granular edits.

### Memory strategy recommendation (practical)

- Audience Brief: **Working memory (schema)**, **read-only** for most downstream agents.
- Current deck build: message history on the **presentation thread**.
- “Last time you presented to X…”: either
  - store explicit “presentation outcomes” in product DB and inject as context, or
  - rely on semantic recall across resource threads (works, but I’d prefer explicit product DB for reliability).
- Observational memory: enable on long-running “interactive builder” threads where tool outputs get huge.

### Cost tracking implementation sketch

- Use tracing spans’ token usage.
- Add `requestContextKeys: ["userId", "presentationId", "agentId", "workspaceId"]` so every span is labeled.
- Export traces to your preferred platform (Langfuse/OTEL).
- Build a small “cost summarizer” job:
  - for each `traceId`, sum usage per model, multiply by price, store in `agent_runs`.

Mastra gives the plumbing; you own the accounting.

---

## Code-level sketches (TypeScript)

> These are *architecture sketches* based on documented APIs.

### 1) Mastra singleton configuration

```ts
// src/mastra/index.ts
import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { PgStore } from "@mastra/pg";
import { Observability, DefaultExporter, SensitiveDataFilter } from "@mastra/observability";

import { audienceProfilingWorkflow, deckBuildWorkflow, postProcessWorkflow } from "./workflows";
import { partnerAgent, skepticAgent, whispererAgent, editorAgent } from "./agents";

export const mastra = new Mastra({
  logger: new PinoLogger(),
  storage: new PgStore({
    id: "mastra-storage",
    connectionString: process.env.DATABASE_URL!,
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "slideheroes",
        exporters: [new DefaultExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
        requestContextKeys: ["userId", "workspaceId", "presentationId", "agentId"],
      },
    },
  }),
  agents: { partnerAgent, skepticAgent, whispererAgent, editorAgent },
  workflows: { audienceProfilingWorkflow, deckBuildWorkflow, postProcessWorkflow },
});
```

### 2) Audience Brief schema-based working memory

```ts
import { z } from "zod";

export const AudienceBriefSchema = z.object({
  person: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    roleSummary: z.string().optional(),
    linkedinUrl: z.string().url().optional(),
  }),
  company: z.object({
    name: z.string().optional(),
    website: z.string().url().optional(),
    industry: z.string().optional(),
    recentNews: z.array(z.object({ title: z.string(), url: z.string().url().optional() })).optional(),
  }),
  priorities: z.array(z.string()).optional(),
  likelyObjections: z.array(z.string()).optional(),
  messaging: z.object({
    tone: z.enum(["formal", "consulting", "friendly"]).optional(),
    positioning: z.array(z.string()).optional(),
  }).optional(),
});
export type AudienceBrief = z.infer<typeof AudienceBriefSchema>;
```

```ts
// inside an agent
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

export const partnerAgent = new Agent({
  id: "partner-agent",
  name: "The Partner",
  instructions: "You are a consulting partner reviewing a pitch deck...",
  model: "anthropic/claude-opus-4-1",
  memory: new Memory({
    options: {
      workingMemory: {
        enabled: true,
        scope: "resource",
        schema: AudienceBriefSchema,
      },
    },
  }),
});
```

### 3) Profiling workflow with HITL suspend/resume

```ts
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { AudienceBriefSchema } from "../schemas/audience";

const synthesizeBrief = createStep({
  id: "synthesize-brief",
  inputSchema: z.object({ personText: z.string(), companyText: z.string() }),
  outputSchema: z.object({ brief: AudienceBriefSchema }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("partnerAgent"); // or dedicated profiling agent
    const res = await agent.generate(
      `Build an audience brief from:\nPERSON:\n${inputData.personText}\nCOMPANY:\n${inputData.companyText}`,
      { /* structured output would be configured on agent or via createStep(agent,{...}) */ }
    );
    return { brief: res.object as any };
  },
});

const reviewStep = createStep({
  id: "review",
  inputSchema: z.object({ brief: AudienceBriefSchema }),
  outputSchema: z.object({ brief: AudienceBriefSchema }),
  suspendSchema: z.object({ reason: z.string(), proposed: AudienceBriefSchema }),
  resumeSchema: z.object({ approved: z.boolean(), edited: AudienceBriefSchema.optional() }),
  execute: async ({ inputData, resumeData, suspend, bail }) => {
    if (!resumeData) {
      return suspend({ reason: "Approve or edit the Audience Brief", proposed: inputData.brief });
    }
    if (resumeData.approved === false) {
      return bail({ reason: "User rejected the Audience Brief" });
    }
    return { brief: resumeData.edited ?? inputData.brief };
  },
});

export const audienceProfilingWorkflow = createWorkflow({
  id: "audience-profiling",
  inputSchema: z.object({ personText: z.string(), companyText: z.string() }),
  outputSchema: z.object({ brief: AudienceBriefSchema }),
})
  .then(synthesizeBrief)
  .then(reviewStep)
  .commit();
```

### 4) Parallel post-processing agents

```ts
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const partnerReview = createStep({ id: "partner-review", /* ... */ });
const skepticQA = createStep({ id: "skeptic-qa", /* ... */ });
const whispererNotes = createStep({ id: "whisperer-notes", /* ... */ });
const editorShrink = createStep({ id: "editor-shrink", /* ... */ });

export const postProcessWorkflow = createWorkflow({
  id: "post-process",
  inputSchema: z.object({ presentationId: z.string(), deckJson: z.any() }),
  outputSchema: z.object({
    partner: z.any(), skeptic: z.any(), notes: z.any(), shrink: z.any(),
  }),
})
  .parallel([partnerReview, skepticQA, whispererNotes, editorShrink])
  .map(async ({ inputData }) => ({
    partner: inputData["partner-review"],
    skeptic: inputData["skeptic-qa"],
    notes: inputData["whisperer-notes"],
    shrink: inputData["editor-shrink"],
  }))
  .commit();
```

---

## How Mastra integrates into Next.js (practical)

Mastra’s Next.js guide shows:

- calling agents from route handlers
- streaming agent output in AI SDK UI format via `@mastra/ai-sdk`
- hydrating message history by calling `memory.recall()`

Key production note:

- Vercel: externalize storage; don’t use file-based LibSQL
- add `serverExternalPackages: ["@mastra/*"]` in `next.config.ts`

For SlideHeroes (not “chat UI”), you’ll likely stream:

- progress events (workflow `.stream()`)
- partial draft artifacts (e.g., outline sections)

---

## Recommendation: should SlideHeroes adopt Mastra?

### Adopt if

- You value **typed workflows**, built-in HITL, and a memory system beyond simple chat history.
- You want observability + evals built in rather than stitching together 3–4 vendors.
- You can tolerate some framework lock-in at the orchestration layer.

### Be cautious if

- You need hard guarantees around **parallel throttling** and queuing without extra infra.
- You must deploy only on serverless without durable connections and don’t want to run workflow runners.
- You want “agents as pure functions” with minimal runtime framework.

### Practical next step (low-risk validation)

Run a spike implementing:

1) `audienceProfilingWorkflow` with suspend/resume + schema working memory
2) `postProcessWorkflow` that runs Partner + Skeptic in parallel, storing structured suggestions
3) observability export to your preferred platform; compute token usage totals per run

If that spike feels smooth and you can model your artifacts cleanly, Mastra is likely the right foundation.
