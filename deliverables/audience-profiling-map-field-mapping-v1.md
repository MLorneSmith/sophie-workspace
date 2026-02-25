# Audience Brief UI fields — inferred mapping (pending course Audience Profiling Map)

**Task:** MC #527  
**Date:** 2026-02-18  
**Author:** Sophie (nightly backlog)  
**Status:** Draft — **blocked on missing “course Audience Profiling Map” artifact**

## Executive summary
- The draft **Audience Brief UI/UX spec** (`deliverables/audience-brief-ui-ux-editable-profile-page.md`) is directionally aligned with our **WOW #1 Audience Profiling intent** (`deliverables/wow1-audience-profiling.md`) and the **Context Engineering SOP** (decision-relevant, compact, structured).
- However, I could **not locate the SlideHeroes *course* “Audience Profiling Map”** anywhere in this workspace (excluding the product repo), so I cannot do the literal field-by-field inclusion/exclusion audit requested.
- Based on the *product* Audience Brief description in `wow1-audience-profiling.md`, the current UI spec is **missing an explicit “Strategic recommendations / How to tailor” section** (what to lead with / frame as / avoid / include). That section is a key bridge from research → actionable writing guidance.

## What I looked for (evidence)
- Draft UI spec present: `deliverables/audience-brief-ui-ux-editable-profile-page.md` (Sections 1–12; especially Section 4 “Audience Brief Schema”).
- Product Audience Brief description present: `deliverables/wow1-audience-profiling.md` (Section “Output: The Audience Brief” includes: *Communication Profile*, *Strategic Recommendations*, *Presentation Format*).
- Multiple repo searches for “Audience Profiling Map / profiling map / audience map / matrix” did **not** find a course map artifact in `deliverables/`, `.ai/contexts/`, or other obvious folders.

## Field mapping (inferred from WOW #1 doc)
> Source of “map” below is **`deliverables/wow1-audience-profiling.md`** (not the course map).

### 1) Communication Profile → UI spec coverage
From `wow1-audience-profiling.md` (“Communication Profile”):
- Decision-making style
- Attention span / time constraints
- What they trust (evidence types)
- Career context as a proxy for preferences

**Mapped UI fields (existing):**
- **Identity** (Role/Title, Industry/Function, Seniority) — spec Section 4A
- **Decision Criteria** (priorities, proof needed, objections) — spec Section 4C
- **What they already know** — spec Section 4D
- **Language & tone** (tone, density, reading level, do/don’t) — spec Section 4E
- **Slide preferences** (slide count, chart vs text bias, style) — spec Section 4G

**Gaps / tweaks suggested:**
- Add an explicit **“Attention constraints”** field (e.g., max minutes, attention span) or fold it into **Slide Preferences** with a clearer label.
- Consider a structured **“Evidence preference”** field (numbers vs benchmarks vs case studies vs scenario analysis) rather than only free text under “Proof they need”.

### 2) Strategic Recommendations → UI spec gap
From `wow1-audience-profiling.md` (“Strategic Recommendations”):
- Lead with
- Frame as
- Avoid
- Include

**UI spec status:** *Missing as a first-class section.*

**Recommendation:** Add a high-leverage section, e.g.:
- **“Tailoring guidance”**
  - Lead with (1–3 bullets)
  - Frame as (select 1 + optional note)
  - Avoid (1–3 bullets)
  - Include (1–3 bullets)

This is the most “consulting-grade” part of the brief: it converts research into **writing decisions**.

### 3) Presentation Format → UI spec coverage
From `wow1-audience-profiling.md` (“Presentation Format”):
- Structure preference (pyramid / conclusion-first)
- Executive summary expectation
- Data density
- Tone
- Frameworks they recognize
- Length recommendation

**Mapped UI fields (existing):**
- **Language & tone** — spec Section 4E
- **Slide preferences** — spec Section 4G

**Gaps / tweaks suggested:**
- Add explicit **“Structure preference”** (e.g., conclusion-first vs build-up) — could be a simple toggle.
- Add **“Frameworks they recognize / vocabulary”** (chips + free text). This is distinct from “Terms to avoid/define” because it’s positive guidance.

## Redundancies / consolidation opportunities in the current UI spec
- **Tone** appears both as a general concept and via “Density/Reading level” and “Do/Don’t”. That’s fine, but make the UI enforce brevity: “Do/Don’t” should be capped (e.g., 3 each).
- **Key Facts** (spec Section 4H) and **Constraints** (4F) can overlap. Clarify:
  - Constraints = rules for output (must/must-not)
  - Key Facts = facts that change the argument (numbers, initiatives, competitor names)

## Recommended actions (to unblock #527 properly)
1. **Get the actual course “Audience Profiling Map” artifact into the repo** (or paste/link it):
   - Best: add as `deliverables/course-audience-profiling-map.md` (or similar).
   - Then rerun this task to do true include/exclude decisions for v1.
2. If the course map is large, **distill it** into 2 layers:
   - Layer 1 (v1 UI): decision-relevant fields only.
   - Layer 2 (research/backstage): “nice to know” enrichment not shown or only shown behind an “Advanced” accordion.
3. Update the UI spec (`deliverables/audience-brief-ui-ux-editable-profile-page.md`) to include **Tailoring guidance** as a first-class section (Lead with / Frame as / Avoid / Include).

## Open questions / uncertainties
- Without the course map, I cannot confirm whether we’re missing course-specific dimensions like: relationship context, political dynamics, risk posture, or “what success looks like for them personally” (often critical in executive comms). Those may need explicit representation in the v1 UI.
