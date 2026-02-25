# Context Engineering SOP (SlideHeroes)

**Owner:** Product + AI Platform

**Status:** Active

**Last updated:** 2026-02-16

## 0) Purpose

SlideHeroes relies on prompts and retrieved context to produce audience briefs, narratives, storyboards, slide copy, and agentic analyses. This SOP standardizes how we:

- decide what context belongs in model inputs,
- reduce it without losing decision-relevant detail,
- structure it so models can parse it reliably,
- deliver the right pieces at the right stage of the pipeline,
- refresh/invalidate stale context during multi-step sessions.

**Principle:** *More context is not better context.* Too much *relevant* information can still degrade performance by hiding what matters.

## 1) Scope

This SOP applies to any SlideHeroes system that constructs or injects context into an LLM call, including:

- Product flows: Audience Profiling (WOW #1), SCQA narrative building, storyboard → slide generation
- Agentic Layer (WOW #4): fact-checker, design/layout agent, editor, compliance, etc.
- Knowledge Engine retrieval: library/past decks/uploads
- Internal operations: Sophie's prompt construction, MEMORY.md usage, heartbeat state

**Out of scope:** General prompt-writing tips not related to context selection/packaging.

## 2) Definitions

- **Context:** Any information included in the model request beyond the immediate user instruction (system/developer prompts, retrieved docs, prior messages, summaries, deck metadata, brand rules, etc.).
- **Decision-relevant:** Information that can change the model’s output (tone, constraints, facts, priorities, audience, definitions).
- **Compression (not summarization):** Reducing tokens while preserving *structure* and decision-relevant information. Summaries often lose structure and therefore lose controllability.
- **Stage:** The step in a pipeline where the model is being called (outline, narrative, storyboard, slide copy, critique, agent run, etc.).

## 3) The 5-Stage Framework

### Stage 1 — Curate

**Goal:** Decide what information is relevant *for this specific call*.

**Why:** Models can fail from too much relevant information; they may not distinguish the important from the adjacent.

**Decisions:**

- Include / exclude / defer to later stage
- Promote to “must-follow constraints” vs “nice-to-have preferences”

**SlideHeroes examples**

- **Audience Profiling (WOW #1):** From raw LinkedIn/company research, keep only attributes that change the deck (industry vocabulary, seniority, decision criteria, risk tolerance). Drop biography trivia.
- **SCQA narrative building:** If a context builder (e.g., `presentation-context.ts`) injects title + audience + situation + complication + answer into every downstream prompt, curate per stage:
  - Outline generation needs *audience + objective + core answer*, not every research snippet.
  - Slide copy needs *tone + key claims + definitions*, not raw research.
- **Storyboard → slide generation:** For slide N, include: slide objective, section narrative arc, dependencies (e.g., “this slide sets up slide N+1”), and any required data points. Exclude the full deck if not needed.
- **Agentic layer:** Fact-checker needs **claims + cited sources + confidence**. Design agent needs **brand + layout + hierarchy + constraints**. Do not pass sources to design agent unless it affects layout.

**Curation decision criteria**

Keep context if it is:

1. **Hard constraint** (must comply): brand rules, forbidden claims, formatting requirements, regulatory constraints.
2. **Core objective**: what “good” looks like for this deliverable.
3. **Critical facts**: numbers, names, definitions, product truth.
4. **Disambiguation**: reduces ambiguity in user instruction.
5. **High-leverage preferences**: tone, density, slide count, audience sophistication.

Drop or defer context if it is:

- redundant (repeated across sources),
- interesting but not decision-relevant,
- “background” that doesn’t affect output,
- conflicting and unresolved (instead: flag conflict and request clarification),
- likely to bias the model away from task completion (excess caution, policy boilerplate, legalese).

---

### Stage 2 — Compress

**Goal:** Reduce context to its essential form while preserving structure.

**Target:** 60–70% token reduction while maintaining all decision-relevant information.

**Compression techniques (preferred order)**

1. **De-duplication:** remove repeats across retrieved docs.
2. **Canonicalization:** convert varied phrasing into a single normalized representation (e.g., “ICP” fields).
3. **Schema extraction:** map raw text → fields (e.g., `audience.seniority`, `audience.risks`, `tone.do`, `tone.dont`).
4. **Bullet compression:** replace paragraphs with dense bullets.
5. **Reference pointers:** keep an ID + minimal excerpt, and store full text elsewhere for retrieval-on-demand.

**Avoid:** “narrative summaries” that flatten structure (they are hard to route stage-by-stage and easy to misinterpret).

**SlideHeroes examples**

- Convert raw research into an **Audience Brief** schema:
  - who they are, what they care about, how they decide, how they speak, what they already know, what they fear.
- Convert brand guidelines into “**do/don’t**” lists with explicit exceptions.

---

### Stage 3 — Structure

**Goal:** Organize compressed context so the model can parse efficiently.

**Principles**

- **Hierarchy beats prose.**
- The model reads top-to-bottom: early constraints anchor behavior.
- Structure is architecture, not formatting.

**Approved structure patterns**

1. **XML-like tags** (best for multi-agent + tool routing):

```xml
<context>
  <task>
    <objective>...</objective>
    <deliverable>...</deliverable>
  </task>
  <constraints>
    <must>...</must>
    <must_not>...</must_not>
  </constraints>
  <audience>
    <role>...</role>
    <seniority>...</seniority>
    <decision_criteria>...</decision_criteria>
    <language_preferences>...</language_preferences>
  </audience>
  <narrative>
    <scqa>
      <situation>...</situation>
      <complication>...</complication>
      <question>...</question>
      <answer>...</answer>
    </scqa>
  </narrative>
  <references>
    <source id="S1">...</source>
  </references>
</context>
```

2. **Sectioned markdown** for human-readability (acceptable for internal ops and PR review), but preserve strict headings and consistent schemas.

3. **Key-value blocks** for tight token budgets:

```text
AUDIENCE_ROLE=VP Finance
AUDIENCE_TONE=direct, low fluff
GOAL=approve pilot budget
MUST_INCLUDE=3 ROI levers; payback period
MUST_NOT_INCLUDE=unverified claims
```

**Ordering rules**

1. Task + success criteria
2. Hard constraints
3. Definitions
4. Audience + tone
5. Narrative arc / deck-level context
6. Local (slide/section) context
7. References (if needed)

---

### Stage 4 — Deliver

**Goal:** Put the right context in the right place at the right time.

**Placement rules (influence model behavior differently)**

- **System prompt:** identity, global safety, non-negotiable style rules, universal formatting constraints. Keep stable.
- **Developer prompt / template:** workflow logic, evaluation criteria, schemas, required sections.
- **User message:** the current instruction and user-facing preferences.
- **Retrieved context (RAG):** facts, examples, prior decks, brand docs. Must be curated + compressed.

**Do not** dump everything into one message. Use multiple compartments so:

- constraints remain authoritative,
- ephemeral context doesn’t permanently bias the model,
- retrieval can be swapped without rewriting the template.

**Stage-appropriate delivery (SlideHeroes pipeline)**

- **Research → Audience Brief:** include raw sources only for extraction/verification; downstream should consume the structured brief.
- **Outline:** needs framing (objective, audience, core answer, constraints). Avoid detailed slide-level notes.
- **Storyboard:** needs section-level arcs + density preferences + narrative rules.
- **Slide generation:** needs slide-local goal + only the relevant section arc + tone/brand rules.
- **Agentic layer:** each agent gets a *minimal* context bundle tailored to its function.

**Model-specific notes (general)**

- Some models overweight long instruction blocks. Prefer: short invariant rules + structured context blocks.
- If the model “refuses” or becomes overly cautious, reduce policy-like context and move cautionary notes into *conditional checks* (e.g., “If external recipient → confirm”).

---

### Stage 5 — Refresh

**Goal:** Detect and correct stale/invalid context during a session.

**Refresh triggers**

- user changes objective, audience, or constraints
- new file upload / retrieval results
- model-produced assumptions that the user corrects
- long sessions (token drift)
- stage transitions (outline → storyboard → slides)

**Refresh mechanisms**

1. **TTL-based:** mark context blocks with an expiry (“valid for next 3 calls” or “valid for this stage”).
2. **Event-based:** regenerate brief when a key field changes (audience, title, product, claim set).
3. **Explicit invalidation:** write “INVALIDATED:” blocks that the model must treat as obsolete.

**Pattern: Context Diff**

When refreshing, include:

- what changed,
- what is now authoritative,
- what to ignore.

Example:

```text
CONTEXT_UPDATE:
- changed: audience_seniority (Manager → VP)
- changed: objective (inform → secure budget approval)
AUTHORITATIVE:
- audience_seniority=VP
- objective=secure budget approval
IGNORE:
- prior objective=inform
```

## 4) Anti-Patterns (and Fixes)

### A) Over-caution overwhelms instruction

**Observed:** A GPT sub-agent refused to send an email because cautionary context (“external recipients”) dominated the instruction.

**Fix:**

- Curate down policy text; convert to conditional checks.
- Put “confirm before sending externally” as a step, not as global discouragement.
- Deliver caution in developer workflow (“If recipient domain not in allowlist → ask for confirmation”).

### B) Under-context yields generic output

**Observed:** Audience suggestions were generic because the prompt only received a title string.

**Fix:**

- Require an Audience Brief schema (even minimal).
- If fields are missing, explicitly ask for them or retrieve them.
- Avoid free-form context; prefer structured fields.

### C) Full-deck context injected into every slide

**Risk:** Token bloat + attention dilution.

**Fix:**

- Provide deck arc + section arc + slide-local goal; omit unrelated sections.
- Add a retrieval hook for “fetch other slides if needed.”

### D) Mixed authority (facts and preferences interleaved)

**Risk:** Model treats preferences as facts, or vice versa.

**Fix:**

- Separate `<facts>` from `<preferences>` and `<constraints>`.
- Put definitions early.

## 5) Context Budgets (Guidelines)

Budgets are targets; exceed only with justification.

### 5.1 Presentation pipeline budgets (per call)

- **Audience research ingestion (extraction step):** up to 8–12k tokens (raw sources allowed) → output must be a structured brief.
- **Audience Brief delivered downstream:** 800–1,500 tokens.
- **SCQA / narrative framing:** 400–900 tokens.
- **Outline generation:** 800–1,800 tokens total context.
- **Storyboard per section:** 1,200–2,500 tokens (includes section arc + constraints).
- **Slide generation per slide:** 300–900 tokens (slide-local + minimal global constraints).
- **Agentic runs on finished deck:**
  - Fact-checker: 1,000–3,000 tokens (claims + citations + excerpted evidence)
  - Design agent: 700–1,500 tokens (brand + layout rules + slide inventory)
  - Editor: 700–2,000 tokens (tone + consistency rules + key terms)

### 5.2 Budget enforcement rules

- If context exceeds budget, **do not** just truncate. Re-run Curate → Compress.
- Prefer splitting work into multiple calls over one giant call.
- Track budget ownership: template author is responsible for staying within targets.

## 6) PR Review Gate (Required)

Any PR that changes:

- prompt templates,
- context builders/injectors,
- retrieval packing,
- agent context bundles,

**must include a Context Engineering Review**.

### 6.1 What reviewers check

- Stage alignment: context matches the call’s stage
- Budget adherence: token estimates or measured counts
- Schema consistency: structured blocks are stable
- Refresh plan: how context updates over time
- Safety + clarity: no policy bloat, no ambiguous authority

### 6.2 Required PR artifacts

- Before/after example payloads (redact secrets)
- A short “Context diff” explaining what changed and why
- Token estimate (rough is fine) and where compression was applied

## 7) Prompt Template Review Checklist (Use in PRs)

Copy/paste into the PR description and answer each line.

### Curate

- [ ] What is the call’s **stage** and **deliverable**?
- [ ] List the **hard constraints** (must / must-not) — are they minimal?
- [ ] What context was **explicitly excluded** (and why)?
- [ ] Are there any caution/policy blocks that could cause refusal or paralysis?

### Compress

- [ ] Did we remove duplicates and normalize terms?
- [ ] Is the context in a schema/fields vs prose?
- [ ] Is the compressed output still decision-relevant (no missing numbers/definitions)?
- [ ] Approx token reduction: ____% (target 60–70%).

### Structure

- [ ] Are sections clearly separated (e.g., `<constraints>`, `<audience>`, `<facts>`, `<preferences>`)?
- [ ] Is the ordering correct (task → constraints → definitions → audience → local context)?
- [ ] Are there any mixed-authority paragraphs that should be split?

### Deliver

- [ ] Is the context placed in the right compartment (system vs template vs user vs retrieved)?
- [ ] Are we avoiding “everything everywhere” injection?
- [ ] If multiple agents/models are used, does each get a tailored bundle?

### Refresh

- [ ] What events trigger regeneration or invalidation?
- [ ] Is there a TTL or stage boundary that refreshes context?
- [ ] Is explicit invalidation supported (IGNORE/INVALIDATED blocks)?

### Budget

- [ ] Target budget for this call: ____ tokens; estimated actual: ____.
- [ ] If over budget, what was dropped vs compressed?

## 8) Reference Implementations (Examples)

These are patterns to align with in the codebase; adjust names to match the current repo structure.

- **SCQA injection:** a context builder (commonly referenced as `presentation-context.ts`) should implement Curate→Compress before injecting into downstream prompts.
- **Storyboard → slide:** slide prompts should receive *section arc + slide-local goal*, not the full deck.
- **Agentic layer context packs:** define `FactCheckContext`, `DesignContext`, `EditContext` schemas and populate independently.

## 9) Change Log

- 2026-02-16: Initial SOP written and registered in Mission Control.
