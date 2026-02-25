# Workflow UI Design — End-to-End Step Progression

**Task:** #528
**Date:** 2026-02-18
**Status:** Approved (brainstormed with Mike)

---

## 1) Workflow Architecture

SlideHeroes uses a single guided linear workflow for all presentations. There are no branching paths — every deck goes through the same 5 steps, regardless of how the user starts.

### The 5 Steps

1. **Profile** — Define the audience. Who are you presenting to? Enriched by Proxycurl (person) and web research (company). User reviews and edits structured fields defined by the SlideHeroes Audience Profiling Map. Primary audience only in v1.

2. **Assemble** — Frame the problem and structure the answer. Sub-steps: Presentation Type → Question Type → SCQ (Situation, Complication, Question) → Argument Map (Pyramid Principle tree). This is the complete "thinking" step.

3. **Outline** — Nail the narrative. Language, messaging, supporting points in a cohesive SCQA + next steps frame. Agents (Coach, Skeptic) become available from this step onward via a persistent side panel.

4. **Storyboard** — Map the narrative to slides. Define what each slide does, takeaway headlines, content blocks, evidence needed.

5. **Generate** — Produce the designed deck using a selected template and export (PowerPoint, PDF). No separate export step.

### Key Principles

- First time through is sequential; completed steps are always revisitable
- No hard locks on skipping, but quality indicators show the impact of incomplete steps
- Agents are a layer available from Outline onward, not a separate step
- All entry points (new, upload, brain dump) feed into the same flow at the Assemble step

---

## 2) Navigation & Project Management

### Level 1 — Presentations List

The home screen. A table/grid of all presentation projects showing:
- Presentation name/title
- Current step (e.g., "Outline" or "Storyboard")
- Last updated
- Status indicator (in progress, complete)

Single action: **"New Presentation"** button → always starts at Profile (step 1).

### Level 2 — Project Dashboard

When you click into a presentation, you see a dashboard showing progress across all 5 steps. Each step shows its status (not started / in progress / complete). Click any completed or in-progress step to jump in.

**Returning users** land on the Project Dashboard, not dumped into the middle of a step. They see the big picture and choose where to go.

### Wizard Progression

- A persistent step indicator (top bar or left rail) shows all 5 steps with status
- Current step is highlighted
- Completed steps are clickable (revisitable)
- Future steps are visible but greyed out
- Editing a completed step triggers downstream invalidation warnings ("Your outline may need updating")

### Templates

- Template selection is part of the Generate step — the user picks or uploads a brand template before the deck is produced
- Templates define: slide layouts, colour palette, typography, logo placement
- Users can save templates for reuse across presentations

---

## 3) Entry Points & Materials

**One entry, multiple input methods.** "New Presentation" always starts at Profile. There is no branching based on how you start. The difference is what materials you bring to the Assemble step.

### Adding Materials at Assemble

- **Upload an existing deck** — AI extracts content, structure, and potentially brand template. Extracted content pre-fills SCQ fields and seeds the argument map.
- **Brain dump** — Paste or type unstructured notes, talking points, meeting notes. AI uses this as raw material to suggest SCQ framing and argument structure.
- **Links/documents** — Reports, articles, data sources that provide evidence or context.
- **Any combination** — Upload last year's deck AND brain dump new talking points AND attach a market report. All feed into the same Assemble process.

### How Materials Accelerate the Workflow

- Existing deck → AI proposes SCQ, question type, and argument map based on extracted content. User validates rather than creates from scratch.
- Brain dump → AI identifies key themes and suggests how to structure them into SCQ + Pyramid Principle format.
- Both → AI cross-references the existing deck with new notes and highlights what's changed, what to keep, what to restructure.

**Materials don't skip steps — they pre-fill them.** The user still walks through Profile, SCQ, Argument Map, etc. but with AI-generated suggestions based on their inputs rather than blank fields.

---

## 4) Agent Layer

**Agents are not a workflow step — they're an always-available layer** accessible via a persistent side panel from the Outline step onward.

### Agent Availability by Step

| Step | Available Agents | Why |
|------|-----------------|-----|
| Profile | None | Not enough content to evaluate |
| Assemble | None | Still framing the problem |
| Outline | Coach, Skeptic, Editor | Narrative structure, argument strength, and conciseness can all be evaluated |
| Storyboard | Coach, Skeptic, Editor, Perfectionist | Slide-level content enables consistency checking |
| Generate | All agents | Full deck available for comprehensive review |

### How Agents Work in the UI

- Side panel with agent icons, always visible from Outline onward
- Click an agent → it runs against the current artifact (outline, storyboard, or deck)
- Results appear as inline annotations or a feedback report
- User can accept/reject individual suggestions
- Agents can be re-run after edits

### Agent Output Adapts to the Step

- At Outline: Coach says "Your key message in section 2 doesn't support your overall answer"
- At Storyboard: Coach says "Slide 7 is too dense for a C-suite audience — split into two"
- At Generate: Coach says "The visual on slide 4 contradicts your data point"

Same agent, different depth depending on what content exists.

---

## 5) Quality Indicators & Downstream Invalidation

### Quality Indicators Replace Hard Locks

Users are encouraged to complete every step but aren't blocked from moving forward. The system communicates the impact of incomplete steps.

**Quality signals:**
- A completion meter or score per step (e.g., "Profile: 3 of 8 fields completed")
- Contextual nudges: "Your deck will be significantly better with decision criteria filled in"
- The AI itself can flag gaps: "I notice you skipped audience profiling — I'm making assumptions about your audience. Want to go back?"
- Agent feedback naturally surfaces gaps: Coach might say "I can't evaluate audience fit because no audience profile exists"

### Downstream Invalidation

When a user revisits and edits a completed step, downstream artifacts are marked stale. Key trigger fields:
- **Profile:** Objective, seniority, decision criteria, tone
- **Assemble:** Question type, SCQ content, argument map structure
- **Outline:** Key messages, supporting points

### Invalidation UX

- Stale steps show a warning badge: "Outline may be out of date — Audience profile was updated"
- User chooses: "Regenerate" (AI updates based on changes) or "Keep as is" (dismiss warning)
- Context diff summary shows what changed and what's affected

**No silent regeneration.** The system never overwrites user-edited content without permission. It flags, suggests, and waits.

---

## 6) Existing Codebase Mapping

The current 2025slideheroes codebase has the following relevant components:

### Current Form Flow (`formContent.ts`)
- **Presentation Type:** 4 options (General Business, Sales, Consulting, Fundraising) → stays in Assemble
- **Question Type:** 6 options (Strategy, Assessment, Implementation, Diagnostic, Alternatives, Post-mortem) → stays in Assemble
- **Title** → stays in Assemble
- **Audience** → moves to Profile (expanded into full Audience Brief)
- **SCQ fields** (Situation, Complication, Answer) → stays in Assemble
- **Argument Map** → new addition at end of Assemble (Pyramid Principle tree structure)

### Labels adapt by presentation type
The current system already customizes labels and descriptions based on presentation type (e.g., "prospect" for sales, "stakeholders" for consulting). This pattern should be preserved and extended into the new workflow.

---

## 7) Open Items

- **#527:** Mike to review course Audience Profiling Map and map fields to Profile step UI
- **#528:** This document (workflow UI design) — approved
- **Template system:** Needs detailed spec for template creation, upload, and management
- **Argument Map UI:** Needs detailed spec for the tree editor component
- **Project Dashboard UI:** Needs detailed spec for the progress overview
- **Outline canvas integration:** How does the existing outline canvas connect to the new argument map input?

---

## Decisions Log

| Decision | Date | Notes |
|----------|------|-------|
| 5-step workflow (Profile → Assemble → Outline → Storyboard → Generate) | 2026-02-18 | Generate includes export; no separate export step |
| Single linear path, no branching | 2026-02-18 | All entry points (new, upload, brain dump) feed into same flow |
| Upload and brain dump are input methods at Assemble, not separate entry points | 2026-02-18 | Can use any combination |
| Guided wizard with quality encouragement, not hard locks | 2026-02-18 | First time sequential; completed steps revisitable |
| Agents available from Outline onward as side panel | 2026-02-18 | Not a separate "Polish" step |
| Argument Map at end of Assemble step | 2026-02-18 | Pyramid Principle tree before Outline |
| Primary audience only in v1 | 2026-02-18 | No secondary audience support |
| No Sources tab in v1 | 2026-02-18 | |
| Returning users land on Project Dashboard | 2026-02-18 | See progress across all steps |
| Presentations list as home screen | 2026-02-18 | Multiple projects can be in progress |
| Profile fields defined by course Audience Profiling Map | 2026-02-18 | Pending Mike's review (#527) |
| Templates selected at Generate step | 2026-02-18 | Saved for reuse across presentations |
