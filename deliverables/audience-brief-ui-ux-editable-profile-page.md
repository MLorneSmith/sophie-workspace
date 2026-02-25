# Audience Brief UI/UX — Two-Step Profile

**Task:** #509
**Date:** 2026-02-17 (original), 2026-02-18 (revised)
**Status:** Approved approach (brainstormed with Mike)

---

## 1) Goal

A lightweight, intelligent audience profiling experience that answers two questions:
1. **Who** are you presenting to?
2. **What do we know** about them that should influence how and what we present?

The UI should feel like adding a contact and having a smart conversation — not filling out a form.

---

## 2) Design Principles

1. **Minimal input, maximum insight.** One input to start. AI does the heavy lifting.
2. **Adaptive, not static.** Questions change based on what the system already knows.
3. **Brief as artifact.** The output is a readable, editable summary — not a database of fields.
4. **Structure is invisible.** The Audience Map quadrants (Personality, Power, Access, Resistance) drive the AI's questions and the brief's structure, but the user never sees them as sections.
5. **Fast for repeat use.** Saved profiles, one-click reuse, "anything changed?" refresh.

---

## 3) Step 1 — "Who are you presenting to?"

### Input
A single field accepting:
- A name + company ("Sarah Chen, TD Bank") — **primary input method**
- A role description ("VP Finance at a mid-size bank") — for when there's no specific person

LinkedIn URLs are NOT required. The system searches by name + company and confirms the right person. This should feel like magic — type a name, see their face.

### Enrichment Flow
1. **Search:** Netrows `/people/search` finds candidates matching name + company (1 credit)
2. **Confirm:** Show top 1-3 matches as profile cards (photo, name, headline, location). User taps the right one.
3. **Enrich:** Netrows `/people/profile` pulls full data — work history, education, skills, summary (1 credit)
4. **Company context:** Web search + LLM synthesis adds company strategy, news, competitive landscape

**Total cost:** 2 credits per person (~€0.01)

- **Role/archetype:** When there's no specific person ("VP Finance at a mid-size bank"), no API call needed. System builds an archetype profile based on the role, industry, and seniority described.

### User Action
- Pick the right person from search results, OR
- Say "none of these" and describe the role manually (3 fields max)
- Review the profile card and correct anything outdated

### UX
Type a name → see their face → tap to confirm. Feels like magic, not a form.

---

## 4) Step 2 — "What should we know about them?"

### Adaptive Smart Questions
Instead of static form fields, the AI generates **3-4 high-impact questions** tailored to what it already knows from enrichment.

The questions are drawn from the course Audience Map quadrants, but the user never sees the framework — just natural questions.

#### Audience Map Framework (behind the scenes)

| Quadrant | What it covers | Example AI question |
|----------|---------------|-------------------|
| **Personality** | Style, energy, emotional state, detail vs big-picture | "Does she prefer data-heavy detail or big-picture narrative?" |
| **Power** | Decision dynamics, who decides, consensus vs hierarchy | "Is she the final decision-maker, or does she need to build consensus?" |
| **Access** | Information preferences, format, pre-reads, setting | "Will they have read materials beforehand?" |
| **Resistance** | Allies, objections, likely questions, pushback points | "What's her likely concern about your proposal?" |

#### How Questions Adapt

**CFO with McKinsey background:**
1. How do decisions get made — is she the final call, or consensus?
2. What's her likely concern about your proposal?
3. Does she prefer data-heavy detail or big-picture narrative?
4. Anything specific on her mind right now?

**Conference of 200 HR leaders:**
1. What's the general knowledge level of the room?
2. What outcome do you want from this presentation?
3. What's the most controversial thing you'll say?
4. How long is your slot?

**Your direct manager (internal update):**
1. What does she need to decide based on this?
2. What questions will she ask?
3. Is anyone else in the room whose opinion matters?

### User Input
- Short answers (1-2 sentences each)
- Optional: skip any question
- Optional: "Add something else" free text for context the AI didn't ask about

---

## 5) Output — The Audience Brief

A **generated, editable summary** that reads like a senior consultant's pre-meeting notes:

> **Sarah Chen, CFO, TD Bank**
>
> Data-driven decision maker with McKinsey background. Expects financial rigor — lead with numbers, not narrative. Final decision authority but will consult risk team. Likely concern: implementation timeline and total cost. Currently focused on digital transformation cost management. Keep to 12-15 slides, conclusion-first.

### Characteristics
- **Human-readable** — not a form, not bullet points of field values
- **Editable** — user can directly edit the text to add nuance or correct anything
- **Compact** — short enough to fit in a context window without burning tokens
- **Structured internally** — behind the scenes, the brief maps to the Audience Map quadrants so downstream steps can use specific signals (tone, data density, decision style, etc.)

### How It Feeds Downstream

The brief is injected as context into every subsequent step:

| Step | How the brief influences output |
|------|-------------------------------|
| **Assemble** | SCQ framed for this person's priorities and concerns |
| **Outline** | Structure optimized for their attention pattern and decision style |
| **Storyboard** | Data density and slide count matched to preferences |
| **Generate** | Language, tone, and emphasis tailored to the room |
| **Agents** | Coach evaluates audience fit; Skeptic generates questions this person would ask |

---

## 6) Saved Profiles & Reuse

- Save profiles to a library ("Sarah Chen — TD Bank CFO")
- Reuse: select a saved profile → system asks "Anything changed?" → refreshes company news/context
- Profiles get richer over time (future: what worked, what didn't)

---

## 7) Validation

### Required before proceeding
- At minimum: a role/title and what you want them to do (objective)
- Everything else is optional but the quality indicator shows impact of richer profiles

### Quality signal
- "Your brief covers 2 of 4 audience dimensions — adding decision dynamics and likely objections will significantly improve your deck"
- Agent feedback surfaces gaps naturally: Coach says "I can't evaluate audience fit because I don't know how they consume information"

---

## 8) Technical Notes

- **Structured schema still exists internally** — the AI parses the brief into structured fields (decision_style, data_preference, objections, etc.) for downstream use
- **Context engineering** — the brief is compressed into a token-efficient format before injection into downstream prompts
- **Enrichment is async** — profile card appears quickly (cached if saved), smart questions generate in parallel
- **Proxycurl** for person enrichment, web search + LLM synthesis for company context

---

## 9) Resolved Decisions

1. **Primary audience only for v1.** No secondary audience support. (2026-02-18)
2. **No Sources tab for v1.** (2026-02-18)
3. **Profile fields defined by course Audience Map** — Personality, Power, Access, Resistance quadrants. (2026-02-18)
4. **Two-step approach** — "Who?" (profile card) → "What do we know?" (adaptive questions) → generated brief. Not a static form. (2026-02-18)
5. **Placement** — depends on workflow UI design (#528). Profile is step 1 of the 5-step wizard. (2026-02-18)

---

## 10) Pending Input

- **#527:** Mike to review course Audience Profiling Map in detail and confirm the 4 quadrants capture everything needed. ✅ Initial review done (Personality, Power, Access, Resistance confirmed).
- **Template for adaptive questions:** Need to define the full question bank per quadrant, with selection logic based on enrichment signals.
