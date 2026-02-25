# Profile → Assemble → Outline: Context Flow Spec

**Task:** #512 — Design Profile → Assemble → Outline context flow

## Why this matters
SlideHeroes is building a “pipeline” experience: collect context once, then reuse it to generate:
- a research-backed **Audience/Company Profile**
- a **Brief** (objective, constraints, voice, audience, offer)
- a recommended **Assembly** (what modules/sections to include)
- a high-quality **Outline** (slide-by-slide plan)

The risk: the pipeline becomes a sequence of loosely connected forms + prompts, where context leaks, contradicts itself, or bloats.

This spec defines **what objects exist**, **what each step produces**, and **exactly what gets passed downstream**.

---

## The 3 steps (definition)

### 1) PROFILE (Who is this for?)
**User intent:** “Understand the audience + company well enough to tailor messaging.”

**Inputs (user-provided):**
- Audience person: name, role/title, LinkedIn URL (optional), seniority, function
- Company: name, domain, ticker (optional)
- Meeting context: meeting type, goal, date, stakeholders (optional)

**System inputs (fetched):**
- Company research bundle (official site, filings, news, etc.)
- Person research bundle (best-effort; must be TOS-safe)

**Outputs (structured):**
- `AudienceProfile` (who they are, what they care about, likely objections)
- `CompanyProfile` (what they do, strategy, current priorities, recent changes)
- `ContextConfidence` (what’s solid vs guessed; missing fields)

**Key rule:** PROFILE outputs should be **fact-first** and citeable where possible. Separate “facts” from “inferences”.

### 2) ASSEMBLE (What are we building?)
**User intent:** “Turn profile into a sharp brief and decide what sections the deck needs.”

**Inputs:**
- `AudienceProfile` + `CompanyProfile`
- User’s offering / product / service
- Desired outcome (sell/convince/update/raise)
- Constraints: time, length, brand voice, must-include slides

**Outputs:**
- `ProjectBrief` (the canonical single source of truth)
- `DeckAssemblyPlan` (recommended modules/sections + rationale)

**Key rule:** ASSEMBLE creates the “contract” for OUTLINE. If it’s not in the brief, the outline shouldn’t invent it.

### 3) OUTLINE (How will we tell the story?)
**User intent:** “Create a slide-by-slide plan that’s audience-tailored.”

**Inputs:**
- `ProjectBrief`
- `DeckAssemblyPlan`
- Optional: reference decks, existing slides, brand templates

**Outputs:**
- `DeckOutline` (ordered list of slides with titles, purpose, key points, evidence)
- `NarrativeThread` (core message + proof points + CTA)

**Key rule:** OUTLINE should cite which brief items it is using (traceability).

---

## Canonical data objects (proposed)

### `CompanyProfile`
- `name`, `domain`, `ticker?`
- `summary`
- `products[]`
- `customers[]` (if known)
- `strategyPillars[]` (stated)
- `recentDevelopments[]` (news/earnings)
- `competitors[]`
- `citations[]`

### `AudienceProfile`
- `person`: name, role, org, seniority
- `priorities[]` (what success looks like)
- `painPoints[]`
- `likelyObjections[]`
- `decisionStyle` (fast/consensus/risk-averse, etc.)
- `languagePreferences` (technical vs exec)
- `citations[]` (when possible)

### `ProjectBrief` (the contract)
- `goal` (one sentence)
- `audienceSummary`
- `valueProp` (1–2 sentences)
- `offer` (what we want them to do)
- `stakes` (why now)
- `constraints`: time, slide count, format
- `mustInclude[]` / `mustAvoid[]`
- `proofAssets[]` (case studies, metrics, references)
- `tone` (voice + examples)

### `DeckAssemblyPlan`
- `recommendedSections[]`: {sectionId, name, why, requiredInputs}
- `optionalSections[]`
- `excludedSections[]` (and why)

### `DeckOutline`
Slides array with:
- `slideId`, `title`, `purpose`
- `keyPoints[]`
- `evidence[]` (links to `proofAssets` or citations)
- `briefTrace[]` (which brief fields informed this slide)

---

## Context packaging: what goes downstream
To prevent context bloat and contradictions, downstream steps should receive **summaries + structured objects**, not raw dumps.

### Context packet v1
- `company_profile` (structured + 500–1200 token narrative summary)
- `audience_profile` (structured + 400–900 token narrative summary)
- `project_brief` (structured + 300–800 token narrative summary)
- `assembly_plan` (structured + 200–600 token summary)

### “Raw sources” handling
Raw fetched text (articles, filings, transcripts) should be stored and referenced by id, but **not injected** into the OUTLINE prompt unless:
- the user asks, or
- a slide requires evidence and the evidence isn’t already summarized

---

## UX / Flow details

### PROFILE screen
- Collect minimal required fields first (domain + role/title)
- Run research fetch in background; show “confidence + missing” indicators
- Let user edit/confirm inferred items (industry, competitors)

### ASSEMBLE screen
- Present a draft brief + section recommendations
- User can tweak: objective, offer, must-include sections
- Lock brief as “approved” before OUTLINE runs

### OUTLINE screen
- Generate outline
- Provide traceability: “This slide exists because…” (from brief)
- Allow re-run with deltas ("shorter", "more technical", "add competitor comparison")

---

## Guardrails
- **No invention:** If info isn’t in Profile/Brief, it must be labeled assumption.
- **Traceability:** Outline should reference brief fields.
- **Citation discipline:** Profile claims (company facts) should be citeable.

---

## Suggested next implementation step
1. Implement `ProjectBrief` as the canonical object in DB.
2. Build a small “Context Packet” builder function used by both ASSEMBLE and OUTLINE.
3. Add traceability fields (`briefTrace`) to outline schema.

---

## Related tasks
- #510 Company research engine
- #511 Person research engine
- #518 SCQA form flow refactor (audience step earlier)
- #519 Audience field migration to structured brief
