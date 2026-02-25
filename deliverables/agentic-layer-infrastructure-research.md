# Agentic layer infrastructure research (SlideHeroes)

Date: 2026-02-15

## Context / problem statement
SlideHeroes wants a **suite of specialized AI presentation agents** (e.g., Presentation Coach, Q&A Prep, Speaker Notes, Deck Shrinker) inside a **Next.js SaaS**.

This “agentic layer” must support:
- **Orchestration:** multiple agents collaborating per presentation (parallel + sequential flows, interrupts, retries)
- **Memory:** audience/user profiles + preferences across sessions; per-deck state; short-term working memory per run
- **Cost control:** fan-out across agents can explode token/tool usage; need budgets, caching, and observability
- **Model flexibility:** pick different models per agent/task (fast/cheap vs deep reasoning)
- **TypeScript/Next.js fit:** server actions / route handlers; edge vs node constraints
- **Scale:** from ~10 → 1000+ users (queues, rate limits, persistence, concurrency)

---

## Evaluation criteria
For each platform:
1) What it is / core value
2) Pricing (as available)
3) Memory/state management
4) Multi-agent support
5) TypeScript support
6) Production readiness (ops, observability, scaling)

---

## Platform evaluations

### 1) Letta (formerly MemGPT) — <https://www.letta.com/>
**What it does**
- Platform for **stateful agents** with “advanced memory” + continual learning; offers Letta API + Letta Code (CLI).
- GitHub repo describes a full-featured agents API and **TypeScript SDK** (`@letta-ai/letta-client`).

**Pricing** (Letta hosted) — <https://www.letta.com/pricing>
- Free: 3 stateful agents, BYOK (bring your own LLM keys)
- Pro: **$20/mo** (unlimited agents, $20 credits)
- Max: **$200/mo** (higher limits)
- Enterprise: volume, RBAC + SSO

**Memory/state**
- First-class concept (“stateful agents”) with explicit memory blocks + tools.
- Good fit for **cross-session memory** (user preferences, audience profiles) without re-building memory primitives.

**Multi-agent**
- Supports skills + “subagents” (per GitHub README) and generally agent composition.

**TypeScript / Next.js**
- TypeScript SDK is a strong plus.
- In a Next.js app: typically call Letta API from server routes; store Letta agent IDs per user/deck.

**Production readiness**
- Hosted product + OSS; designed for persistent agents.
- Key question: whether you want memory/orchestration *inside Letta* vs keeping core state in your DB.

**Notes / risks**
- Using a hosted agent runtime introduces vendor dependency for memory + orchestration.
- For strict data residency and full control, you may prefer LangGraph/custom.

---

### 2) Master AI ("Master Agent AI") — <https://masteragent.app/>
**What it does**
- Marketing site for a “L4-level intelligent agent matrix system” with “hundreds of parallel agents.”
- Focus appears to be a general-purpose multi-agent system/product.

**Pricing**
- Not clearly listed on the landing page content fetched.

**Memory/state**
- Claims autonomous learning + collaboration; no concrete developer-facing memory primitives found in the fetched page.

**Multi-agent**
- Strongly emphasized in messaging (“hundreds of parallel agents”), but unclear how this is exposed as an SDK/runtime you can embed.

**TypeScript / Next.js**
- No TypeScript SDK or Next.js integration details found in the fetched page.

**Production readiness**
- Insufficient public technical detail from the page to assess (deployment model, observability, data handling, SLAs).

**Verdict**
- **Low-confidence / not enough evidence** that this is a mature, developer-oriented agent infrastructure for a SaaS product today.

---

### 3) Calljmp — <https://calljmp.com/>
**What it does**
- “AI agents and workflows as code” with a **managed agentic backend**. Strong emphasis on:
  - **TypeScript-defined agents**
  - Managed execution (state, retries, timeouts)
  - Observability (traces, logs, metrics) + cost tracking
  - Memory + knowledge primitives, HITL (human-in-the-loop)

**Pricing** — <https://calljmp.com/pricing>
- Solo: **$20/mo** (1 seat, 1,000 actions included)
- Pro: **$99/mo** (2 seats, 10,000 actions included)
- Premium: custom
- Usage items (examples from pricing page):
  - Agent runs: $0.01/run (Solo/Pro)
  - Dataset queries: $0.01/query
  - Web scrapes: $0.01/scrape
  - LLM inference: **$0.011 per 1k tokens** (as listed)
  - Dataset segments: $0.05/segment

**Memory/state**
- Site explicitly claims: “**Persistent and queryable context, shared across agents**. Durable storage with zero cold starts.”
- Also “Knowledge” via vector/hybrid search.

**Multi-agent**
- Explicit: “Multiple agents, one runtime… share the same execution, state, and observability layer.”

**TypeScript / Next.js**
- Strong: “Define the copilot in TypeScript”; SDK/HTTP; mentions React Web/React Native.

**Production readiness**
- Positioning is explicitly “agentic backend” with retries/timeouts/state/HITL/observability.
- The big unknown is **maturity and lock-in risk** vs established OSS (LangGraph) + your own infra.

**Verdict**
- If the claims hold in practice, Calljmp is one of the closest matches to “agentic layer as a managed service” for a TS/Next.js SaaS.

---

### 4) LangGraph (LangChain) — <https://docs.langchain.com/oss/javascript/langgraph/overview>
**What it does**
- **Low-level orchestration framework + runtime** for building long-running, stateful agents.
- Explicitly focuses on infrastructure: **durable execution, streaming, human-in-the-loop**, memory.

**Pricing**
- LangGraph OSS is free.
- Production tooling often pairs with **LangSmith** / LangChain deployments (paid), but the orchestration library itself is OSS.

**Memory/state**
- Docs emphasize “comprehensive memory” (short-term + long-term across sessions).
- You can persist state in your own DB and implement long-term memory however you want (Postgres + vector DB).

**Multi-agent**
- Graph-based orchestration is a natural fit for multi-agent workflows:
  - supervisor/worker patterns
  - parallel branches
  - handoffs + interrupts

**TypeScript / Next.js**
- Has a JavaScript/TypeScript package (`@langchain/langgraph`) with docs for JS.
- Works well in Next.js on Node runtime; for long-running workflows, best paired with a worker/queue.

**Production readiness**
- Strong story for correctness: durable execution + HITL.
- Requires more engineering (queues, persistence, tracing) than a managed agent platform.

**Verdict**
- Best choice if SlideHeroes wants **maximum control** + a robust orchestration abstraction, and is willing to build supporting infra.

---

### 5) CrewAI (OSS + AMP platform) — <https://docs.crewai.com/> and <https://www.crewai.com/>
**What it does**
- A multi-agent framework + enterprise platform (AMP) with:
  - agents, tasks, flows, guardrails, memory, tracing, training/testing
  - “AMP Cloud / AMP Factory (self-hosted)” options per marketing site

**Pricing** — <https://www.crewai.com/pricing>
- Basic: Free (50 workflow executions/month)
- Professional: **$25/mo** (100 executions included; $0.50/execution beyond included)
- Enterprise: custom

**Memory/state**
- Marketing and docs mention memory/knowledge; specifics depend on implementation.

**Multi-agent**
- Core strength: “crews” of agents with orchestrated workflows.

**TypeScript / Next.js**
- CrewAI is historically Python-first; the fetched docs emphasize Pydantic (Python).
- If SlideHeroes is TS/Next.js-first, CrewAI may impose a polyglot stack or require wrappers.

**Production readiness**
- AMP emphasizes monitoring, permissions, scaling, SOC2/SSO on enterprise.
- For TS-only engineering teams, operational friction may be higher than LangGraph/Vercel AI SDK.

**Verdict**
- Strong product for enterprises; less ideal if you want a **pure TS** agentic layer.

---

### 6) Vercel AI SDK — <https://ai-sdk.dev/docs/introduction>
**What it does**
- TypeScript toolkit for building AI apps and agents across providers.
- Provides unified APIs for text generation, tool calling, structured output, and UI hooks.

**Pricing**
- OSS library; you pay underlying model providers.

**Memory/state**
- No built-in durable workflow engine; you implement memory:
  - short-term: thread/message store in your DB
  - long-term: profiles + vector store

**Multi-agent**
- Not an orchestration framework. You can build multi-agent flows, but you must implement:
  - concurrency, retries, durable execution, supervision patterns

**TypeScript / Next.js**
- Excellent fit: designed for Next.js/React.

**Production readiness**
- Great “integration layer,” not a runtime. You still need queues/observability/budgets.

**Verdict**
- Best as the **foundation library** for calling models/tools from Next.js, but not sufficient alone for orchestration at scale.

---

### 7) OpenAI Assistants API (and shift to Responses/Agents) — <https://help.openai.com/en/articles/8550641-assistants-api-v2-faq>
**What it does**
- Assistants API provides:
  - persistent **threads** (conversation history stored + truncated)
  - tool access such as Code Interpreter and File Search
- Important roadmap note from OpenAI FAQ:
  - OpenAI released “building blocks of our new **Agents platform**” and is targeting **Assistants API sunset in 1H 2026** after parity.

**Pricing (tooling)**
- Code Interpreter: **$0.03/session** (1-hour session window per thread)
- File Search: **$0.10/GB/day** vector store storage (first GB free)

**Memory/state**
- Thread persistence is helpful for chat history.
- Long-term memory (user preferences across many sessions / apps) usually still belongs in your DB.

**Multi-agent**
- Assistants are per-assistant objects; multi-agent orchestration is still something you implement.

**TypeScript / Next.js**
- Strong; OpenAI Node SDK.

**Production readiness**
- Fully managed, scalable infra; but some constraints (e.g., File Search chunking settings not configurable per FAQ).
- Product risk: API evolution (Assistants → Responses/Agents).

**Verdict**
- Good managed building blocks (threads, tool hosting), but not a full “agent runtime” for orchestrating many specialized agents.

---

### 8) Custom orchestration (direct API calls + your own infra)
**What it is**
- Build your own agent runtime using:
  - Next.js API routes/server actions for request handling
  - a queue/worker system (BullMQ/Redis, Temporal, or Cloud Tasks)
  - Postgres for state + event log
  - vector DB (pgvector, Pinecone, Weaviate) for retrieval/memory
  - observability (OpenTelemetry, Langfuse/LangSmith, dashboards)

**Pricing**
- Infra + model-provider usage.

**Memory/state**
- Maximum flexibility: explicit schemas (User, AudienceProfile, Deck, PresentationRun, AgentRun, Artifacts, MemoryItems).

**Multi-agent**
- Fully custom: supervisor patterns, DAG execution, parallelism, fallbacks, HITL approvals.

**TypeScript / Next.js**
- Native.

**Production readiness**
- Highest effort; highest control.

**Verdict**
- Best if SlideHeroes expects rapid iteration on agent behavior and wants to avoid vendor lock-in.

---

## Comparison matrix (high-level)

| Platform | What it is | Pricing signal | Memory/state | Multi-agent orchestration | TS/Next.js fit | Prod readiness / scaling |
|---|---|---:|---|---|---|---|
| Letta | Stateful agent platform (hosted + OSS) | Free/Pro $20/Max $200/Ent | **Strong first-class memory** | Good (subagents/composition) | **Yes** TS SDK | Strong; vendor runtime |
| Master Agent AI | General multi-agent “matrix” product | Unclear | Unclear | Claimed | Unclear | Unclear (insufficient detail) |
| Calljmp | Managed agentic backend, TS agents | $20/$99 + usage | Strong claims: persistent shared memory + knowledge | **Strong positioning** | **Excellent** | Designed for scaling + observability |
| LangGraph | OSS orchestration framework/runtime | OSS (paid ecosystem) | Strong primitives; you store state | **Excellent** (graphs/DAGs) | **Yes** (langgraphjs) | Strong, but you operate it |
| CrewAI | Multi-agent framework + AMP platform | Free/$25/Ent | Mentioned; platform features | Strong (crews/flows) | Weak/medium (Python-first) | Strong with AMP; OSS depends |
| Vercel AI SDK | TS model/tool integration | OSS | You implement | You implement | **Excellent** | Depends on your infra |
| OpenAI Assistants | Managed assistant + threads + tools | Tool add-ons ($0.03 session; $0.10/GB/day) | Threads help; long-term external | You implement | **Excellent** | High, but evolving API |
| Custom | Build your own runtime | Infra + usage | **Max control** | **Max control** | **Excellent** | Strong if engineered well |

---

## Top 3 recommendations (for SlideHeroes)

### #1 LangGraph (JS) + Vercel AI SDK (library layer)
- **Why:** best balance of control + robust orchestration primitives, with a strong TypeScript story.
- **Use when:** you want to own memory + workflows, and avoid being locked into a hosted agent runtime.

### #2 Calljmp (managed agentic backend)
- **Why:** purpose-built for “agents as TypeScript” with managed execution/state/observability.
- **Use when:** you want to ship fast and offload orchestration + ops.
- **Caveat:** vendor/maturity risk vs OSS.

### #3 Letta (stateful memory-first agents)
- **Why:** strongest first-class “agent memory” platform with TS SDK and transparent entry pricing.
- **Use when:** long-lived personalized agents are the product differentiator (remembering the user/audience deeply).

Honorable mention: OpenAI Assistants/Responses as a *tooling substrate* (threads + file search), but not the full orchestration layer.

---

## Final recommendation (pragmatic architecture for 10 → 1000+ users)

### Recommended stack
- **Orchestration:** LangGraph (JavaScript) for DAGs, interrupts, HITL
- **Model/tool interface:** Vercel AI SDK (provider-agnostic) or direct provider SDKs
- **State + memory:** Postgres (run state + artifacts) + pgvector for retrieval
- **Async execution:** worker queue (BullMQ/Redis or Temporal) to run long tasks off the request thread
- **Observability + cost:** tracing (OpenTelemetry), per-run token accounting, budgets, eval sets

### Architecture sketch (text)
1. **Next.js app** receives a user request (e.g., “Generate speaker notes + anticipate Q&A”).
2. Create a **PresentationRun** record (deckId, userId, requestedAgents[], budgetCents, modelPolicy).
3. Enqueue a job `presentation_run:{id}`.
4. **Worker** executes a LangGraph graph:
   - Supervisor node reads run config + audience profile
   - Parallel nodes call specialized agents:
     - Deck Shrinker (cheap/fast model)
     - Speaker Notes (mid model)
     - Q&A Prep (deep reasoning model)
     - Presentation Coach (optionally interactive/HITL)
   - Each node writes artifacts to Postgres + embeds key outputs into pgvector.
   - A join node composes final deliverables.
5. UI streams progress via websockets/SSE; user can approve HITL steps.

### Cost management pattern
- Per-run **token budget** and per-agent ceilings.
- Caching: reuse embeddings, reuse deck parsing results.
- Model policy: route “draft” passes to cheap models; final polish to higher quality.

---

## Open questions / due diligence checklist
Before committing to a managed platform (Calljmp/Letta):
- Data residency + retention (PII), deletion APIs, SOC2/ISO status
- Latency + concurrency limits; queueing guarantees
- How to export/port your agents and stored memories if you switch providers

For a LangGraph/custom build:
- Pick queue tech (BullMQ vs Temporal) and define a stable run/event schema early
- Decide what “memory” means for SlideHeroes (profile DB vs agent memory vs RAG)

