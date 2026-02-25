# Mastra validation spike — implementation plan + acceptance tests

Date: 2026-02-16 (UTC)
Owner: Sophie
Task: MC #473 — Mastra validation spike: Audience Profiling workflow + parallel agents

## Goal
Validate (in code, not theory) that Mastra can support SlideHeroes’ core orchestration needs:

1) **AudienceProfilingWorkflow**
- typed workflow steps
- schema-based working memory
- **HITL suspend/resume**

2) **PostProcessWorkflow**
- run **Partner** + **Skeptic** in **parallel**
- produce **structured output** that can be stored/rendered

3) **Observability export**
- tracing enabled
- **token usage totals per run** can be exported/summarized

This spike is intended to de-risk framework choice before deeper product integration.

## Non-goals (for the spike)
- No SlideHeroes UI polish
- No real LinkedIn scraping
- No full deck pipeline
- No production auth/permissions

## Repo / location recommendation
Create a standalone prototype in this workspace (not the 2025slideheroes repo):

- `~/clawd/spikes/mastra-validation/`

Rationale: keeps product repo untouched while proving mechanics.

## Deliverables
1) A runnable TS prototype with:
   - a minimal Mastra singleton
   - one profiling workflow with suspend/resume
   - one post-process workflow with parallel agents
2) A scriptable “acceptance test” that:
   - starts workflow, hits a suspend point, prints `runId`
   - resumes workflow with edited schema payload
   - runs parallel agents and prints structured JSON
   - prints token usage totals per workflow run
3) A short README explaining how to run + what “success” looks like.

## Proposed architecture (prototype)
### Data model (minimal)
- `resourceId`: "workspace:demo" (simulates shared context)
- `threadId`: "presentation:demo" (simulates a single run)

### AudienceBrief schema (Zod)
- person: { name, title, linkedinUrl? }
- company: { name, website? }
- priorities: string[]
- objections: string[]
- messaging: { positioning: string[] }

### Workflows
#### 1) `audienceProfilingWorkflow`
Steps:
1. `collectInputs` (deterministic)
2. `synthesizeBrief` (agent → structured output)
3. `hitlReview` (suspend with `proposedBrief`)
4. `persistBrief` (writes to working memory; for spike can also write JSON to disk)

Acceptance test: workflow must suspend at step 3, then resume and complete.

#### 2) `postProcessWorkflow`
- Input: `{ deckText: string }` (for spike, a simple paragraph)
- `.parallel([partnerReviewStep, skepticStep])`
- Output merges to:
  - `partner: { strengths: string[], improvements: { title: string, detail: string }[] }`
  - `skeptic: { questions: { question: string, suggestedAnswer: string }[] }`

Acceptance test: both branches return valid JSON conforming to Zod.

### Observability / token usage
Two options for spike (pick fastest):

**Option A (preferred):** use Mastra exporter (Langfuse/OTEL) if already available locally.
- Export spans
- Write a small summarizer that queries exporter / local store and totals token usage

**Option B (fallback):** capture usage from step callbacks / model provider response usage fields
- less “Mastra-native”, but still validates we can compute totals

Acceptance test: print something like:
- `totalPromptTokens`, `totalCompletionTokens`, `totalTokens`
- breakdown per agent (Partner vs Skeptic) if possible

## Implementation steps (1–2 week spike broken into slices)
### Slice 0 — setup (0.5 day)
- create `spikes/mastra-validation/`
- initialize TS project (node18+/pnpm)
- add Mastra deps
- wire env vars for model provider (use existing dev creds; no secrets committed)

### Slice 1 — profiling workflow + HITL (1–2 days)
- implement schema
- implement `suspend()` step
- implement CLI runner that:
  - starts workflow → prints suspend payload + runId
  - resumes workflow with edited brief

### Slice 2 — parallel agents (1 day)
- implement Partner + Skeptic agent steps
- implement workflow `.parallel()`
- validate structured output

### Slice 3 — observability + token totals (1–2 days)
- enable tracing
- validate traceId per run
- implement token summarizer

### Slice 4 — write-up + recommendation (0.5 day)
- results, friction points, go/no-go

## Open questions to answer during spike
1) What is the cleanest way to persist **AudienceBrief** in a way that is:
   - editable by user
   - accessible as read-only context to downstream agents
   - versioned per audience profile
2) How well do **structured output** + **tool calling** compose for our target models?
3) Can we throttle `.parallel()` to avoid rate limiting, or do we need an external queue/runner?
4) What’s the easiest/most reliable place to compute token totals:
   - Mastra tracing store?
   - provider usage fields?
   - exporter aggregation?

## Acceptance criteria (definition of done for spike)
- ✅ `audienceProfilingWorkflow` suspends and resumes with schema-validated payload
- ✅ `postProcessWorkflow` runs Partner + Skeptic in parallel and returns schema-valid JSON
- ✅ trace/token usage totals per run are printed and attributable to each branch/agent OR at minimum workflow total
- ✅ documented how to run + what was learned
