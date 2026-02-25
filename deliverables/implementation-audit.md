# Implementation Audit — Existing SlideHeroes AI Workflow vs New 5‑Step Product Design Bible

**Task:** #530  
**Date:** 2026-02-18  
**Scope audited:** existing implementation under `apps/web/app/home/(user)/ai/*`, `packages/ai-gateway/*`, and Supabase migrations for `building_blocks_submissions`.

This audit assesses what can be reused, what needs minor tweaks, and what must be rebuilt to support the new linear workflow:

**Profile → Assemble → Outline → Storyboard → Generate**

---

## 1) Summary Verdict Table

| Component | Location | Verdict | Effort | Notes |
|---|---|---:|---:|---|
| Assemble form (Blocks) | `apps/web/app/home/(user)/ai/blocks/` | 🔧 Minor tweaks | 2–5 days | Solid multi-step SCQ-ish form + suggestions + persistence, but it mixes “audience” (should move to Profile), lacks Materials + Argument Map, and stores TipTap JSON as **string**. |
| Outline / Canvas | `apps/web/app/home/(user)/ai/canvas/` | 🔧 Minor tweaks | 4–8 days | Real TipTap-based editor + suggestions pane + server/route AI calls. Needs re-anchoring from SCQ tabs to the **Outline artifact**, new context injection (Audience Brief + Argument Map), and integration into the new wizard + agent side panel model. |
| Storyboard | `apps/web/app/home/(user)/ai/storyboard/` | 🔧 Minor tweaks | 5–10 days | Most complete “slide mapping” implementation: slide list/editor, layout selectors, outline→storyboard transform, autosave, PPTX export via PptxGenJS. Needs alignment with new Storyboard spec (slide purpose/takeaways), template system integration, and data model cleanup. |
| Publisher / Generate | `apps/web/app/home/(user)/ai/publisher/` | 🔴 Rebuild | 2–4 days | Current page is a stub. “Generate” is effectively implemented inside Storyboard (PPTX export). New step needs template selection + export consolidated here. |
| AI Gateway / prompts | `packages/ai-gateway/` + web API routes | 🔧 Minor tweaks | 3–7 days | Infra is useful (Portkey routing, configs, prompt partials, parsing improvements). Prompts are built around **title/audience string + SCQ**, not structured Audience Brief / Argument Map / Agents. Needs prompt audit + new templates. |
| Data model | `apps/web/supabase/migrations/*` + usage in UI | 🔧 Minor tweaks (transitional), likely evolves | 4–10 days | `building_blocks_submissions` is a workable v0 artifact store but misaligned with “presentation project” concept and the coming agentic schema. Also stores TipTap JSON as text. |
| Dashboard / Home | `apps/web/app/home/(user)/ai/page.tsx` + `_components/AIWorkspaceDashboard.tsx` | 🔴 Rebuild | 3–6 days | Current AI dashboard is a tile-based launcher (“What would you like to write today?”). New design requires **Presentations List** + per-project Dashboard. |
| Navigation / Routing | Next app router under `app/home/(user)` | 🔧 Minor tweaks | 4–7 days | Routing is conventional and supports new pages, but current flows are not a linear wizard and rely heavily on `?id=` query params. Needs new route structure & shared “workflow shell”. |
| Portkey / Model routing | `packages/ai-gateway/src/*gateway-client*` | ✅ Use as-is (with small integration tweaks later) | 1–2 days | Portkey header plumbing + provider selection works; configs exist. Mastra integration will require a thin adaptation, not a rewrite. |
| Shared components | `apps/web/app/home/(user)/ai/_components/` and `_lib/` | 🔧 Minor tweaks | 1–3 days | Combobox, server-side `getAIGatewayContext`, and some query hooks are reusable but currently coupled to `building_blocks_submissions`. |

---

## 2) Detailed Findings Per Component

### A) Assemble form (Blocks)
**Location:** `apps/web/app/home/(user)/ai/blocks/`

#### What it does now
- Implements a client-side multi-step form (`BlocksMultistepForm.tsx`, `BlocksForm.tsx`) driven by `formContent.ts`.
- Captures:
  - `presentation_type` (4 options)
  - `question_type` (6 options)
  - `title`
  - `audience` (free text)
  - `situation`, `complication`, `answer`
- Has AI suggestions for:
  - Title suggestions (requires presentation type)
  - Audience suggestions (based on title)
  - Situation/Complication/Answer suggestions (simple inline prompt)
  - Implemented via server action `getSuggestions` and `@kit/ai-gateway` templates for title/audience.
- Persists data into `building_blocks_submissions` using `submitBuildingBlocksAction`.
  - Uses `createTiptapFromText()` to convert plain text into TipTap JSON **string** and stores it into `situation/complication/answer` text columns.

#### Alignment with the Product Design Bible
- ✅ Matches parts of the new Assemble step:
  - Presentation Type, Question Type
  - SCQ fields (currently uses Situation/Complication/Answer; “Q” is implied by question type)
- ❌ Misaligned:
  - **Audience is a free text field here**, but new workflow moves audience to **Profile** as a structured Audience Brief.
  - No “Materials” inputs (upload, brain dump, links) which are central to Assemble.
  - No Argument Map (Pyramid Principle tree) sub-step.
  - Not integrated into a unified per-presentation project wizard; it acts as a creator for an isolated submission row.

#### What needs to change
- **Move audience capture out of Blocks**:
  - Replace `audience` field with a reference to a Profile/Audience Brief artifact (or injected context).
- **Restructure into Assemble step shell**:
  - Either embed this form into Step 2 (Assemble) as a sub-stepper, or extract into smaller components used by the new wizard.
- **Add Materials + Argument Map**:
  - Current formContent pattern is extendable, but the UI needs new sub-step types (file upload / link list / rich brain dump / tree editor).
- **Fix data typing**:
  - Decide whether SCQ fields should be stored as JSONB TipTap documents (recommended) vs strings.

#### Verdict rationale
The implementation is **fundamentally sound** and already implements the exact “presentation type/question type + SCQ capture” pattern the new design retains. But it’s not drop-in: it needs refactoring to fit the new linear workflow and new data model.

---

### B) Outline / Canvas
**Location:** `apps/web/app/home/(user)/ai/canvas/`

#### What it does now
- Provides a TipTap-based editing experience split across tabs:
  - Situation / Complication / Answer / Outline
- Expects a `building_blocks_submissions` row id via query param: `canvas?id=<uuid>`.
- Uses:
  - `EditorPanel` with a resizable editor + suggestions pane.
  - AI “Generate Suggestions” via POST `/api/ai/generate-ideas`.
  - Outline regeneration via `generateOutlineAction` (server action) (not fully audited line-by-line here, but structure is present).
  - Cost-tracking context + `useActionWithCost` wrapper.
- Fetches submission context from Supabase in API routes:
  - `title, audience, situation, complication, question_type, answer`
- Prompt context is composed using ai-gateway partials like `presentationContext`.

#### Alignment with the Product Design Bible
- ✅ Strongly aligned with the “editor + AI assistance” interaction model.
- ✅ The suggestions/feedback pane is a good precursor for the future “agent side panel” UX.
- ❌ Conceptually mis-framed for the new workflow:
  - New **Outline** step is “nail the narrative” (SCQA + next steps frame) as a cohesive artifact, not a tabbed SCQ editor.
  - Agents are explicitly introduced from Outline onward and should be presented as **always-available**, not only “Generate Suggestions”.
  - It relies on `audience` as a string and doesn’t support structured Audience Brief injection.
  - It’s bound to `building_blocks_submissions` ids and query params, not a “presentation project” route segment.

#### What needs to change
- **Re-anchor the page to the Outline artifact**:
  - Replace the 4-tab model with a primary Outline editor (or keep SCQ tabs as sub-views under Assemble, not Outline).
- **Introduce agent layer wiring points**:
  - Suggestions pane should become (or be replaced by) the agent side panel from Outline onward.
  - Its existing patterns (resizable panel, accept/reject, loading animations) are reusable.
- **Context injection**:
  - Update the prompt context from `{title, audience, questionType, SCQ}` to include:
    - Audience Brief (Profile step)
    - Argument Map (end of Assemble)
    - Materials-derived facts/sources (later)
- **Routing/data**:
  - Move from `?id=` (submission) to `/presentations/:presentationId/outline` (or similar) and ensure consistent artifact versioning.

#### Verdict rationale
This is not a stub: it’s real UI and real AI integration. It’s worth keeping and adapting, but the conceptual mapping (tabs and SCQ focus) must change to align with the new step definition.

---

### C) Storyboard
**Location:** `apps/web/app/home/(user)/ai/storyboard/`

#### What it does now
- Provides a storyboard editor that:
  - Allows selecting an existing presentation (`PresentationSelector`) by reading `building_blocks_submissions`.
  - Loads presentation via server action `getPresentationAction`.
  - Builds/maintains a `StoryboardData` model in a provider (`StoryboardProvider`) with autosave.
  - If no storyboard exists, can generate a basic storyboard from TipTap outline (`generateStoryboardFromOutline`) or via `TipTapTransformer` (server-side).
  - Provides slide-level editing: headline editor, layout selector, sortable slide list, content type selectors.
- PowerPoint generation/export:
  - Server action `generatePowerPointAction` uses `PptxGenerator` (PptxGenJS) to generate PPTX buffer, returned as base64, downloaded client-side.
- Database coupling:
  - Tries to read/update `building_blocks_submissions.storyboard` JSONB.
  - Has defensive logic if `storyboard` column is missing.

#### Alignment with the Product Design Bible
- ✅ Matches the definition of Storyboard step: “map narrative to slides” and define slide contents.
- ✅ Has an export mechanism already (even though in the new product this will be the Generate step).
- ❌ Gaps/misalignment:
  - Storyboard should include “what each slide does / takeaway headline / content blocks / evidence needed”. Current `Slide` model has `title`, `headline`, `layoutId`, and `content`, but the UX appears more layout/content focused than “slide purpose/takeaway”.
  - Template selection/branding is not part of this flow yet.
  - Still anchored to `building_blocks_submissions` rather than a first-class presentation project entity.

#### What needs to change
- **Data model + routing:**
  - Move to new presentation/project tables (or keep `building_blocks_submissions` as a transitional artifact store but with a stable “presentation id”).
- **Storyboard semantics:**
  - Add explicit fields per slide: purpose, takeaway headline, evidence needed, speaker notes (if desired).
  - Ensure Storyboard outputs are agent-reviewable (Perfectionist checks consistency).
- **Generate step separation:**
  - Export should likely move behind Step 5 “Generate” UI (template selection + export), while Storyboard focuses on slide plan.

#### Verdict rationale
This is the most “production-shaped” part of the existing AI flow. Reuse is strongly recommended, but it needs data-model alignment and some UX reframing.

---

### D) Publisher / Generate
**Location:** `apps/web/app/home/(user)/ai/publisher/`

#### What it does now
- `page.tsx` renders header + empty body (“Content will be added here”).

#### Alignment with the Product Design Bible
- ❌ Does not implement the new Generate step requirements (template selection, export, final review).
- Export currently exists in Storyboard via `PowerPointExporter`.

#### What needs to change
- Rebuild this step as:
  - Template selection (pick/upload/manage)
  - “Generate deck” / “Export” actions (PPTX/PDF)
  - Optional final agent runs
  - Pulls from storyboard output (and later from a “rendered deck” artifact if you introduce one)

#### Verdict rationale
This is a stub: rebuild.

---

### E) AI Gateway / prompts
**Location:** `packages/ai-gateway/*` and `apps/web/app/api/ai/*`

#### What it does now
- Portkey-backed gateway client (`enhanced-gateway-client.ts`):
  - Chooses provider by model name prefix.
  - Uses Portkey headers (`x-portkey-*`) and request metadata.
- Config templates and use-cases (e.g., `outline-generation/config.ts`).
- Prompt templates:
  - Template registry includes `title-suggestions`, `audience-suggestions`, `test-outline`.
  - Shared prompt partials exist (e.g., `presentationContext`, `baseInstructions`, `improvementFormat`).
- Web app routes build messages manually using these partials (example: `/api/ai/generate-ideas`).

#### Alignment with the Product Design Bible
- ✅ The gateway abstraction is valuable and should remain.
- ✅ The “partial + parser” pattern is good for scaling prompts.
- ❌ Prompt content is based on the **old context model**:
  - `presentationContext` expects `{{audience}}` string and SCQ fields, not Audience Brief.
  - No prompt infrastructure yet for:
    - Profile step (Netrows research + adaptive questions)
    - Argument Map
    - Agents (Coach/Skeptic/Editor/Perfectionist)

#### What needs to change
- Expand prompt templates and partials to accept:
  - Structured audience brief (and/or serialized “brief text” rendering)
  - Argument map representation
  - Downstream invalidation behavior (diff summaries)
- Ensure prompt context assembly matches the new `presentation-context.ts` plan referenced in the sequenced build plan.

#### Verdict rationale
Keep the infra; update the content layer.

---

### F) Data model
**Location:** `apps/web/supabase/migrations/*` + usage in pages/actions

#### What it does now
- Primary table: `public.building_blocks_submissions` (created in `20250211000000_web_create_building_blocks_submissions.sql`).
  - Columns: `title`, `audience`, `presentation_type`, `question_type`, `situation`, `complication`, `answer`, `outline` (all text-ish), timestamps.
  - RLS policies per-user.
- Storyboard support added later via migration `20250429173500_add_storyboard_column.sql`.

#### Alignment with the Product Design Bible
- ✅ Works as a minimal “presentation artifact store” for v0.
- ❌ Missing core concepts for the new product:
  - No first-class “presentation project” entity with step statuses.
  - No structured Profile/Audience Brief storage.
  - No versioning / invalidation flags per step.
  - Stores TipTap JSON blobs as **strings** in `text` columns.

#### What needs to change
- Near-term (Phase 1B):
  - You *can* keep using `building_blocks_submissions` to wire old pages into the new shell.
- Medium-term (Phase 1D+ / Phase 2+):
  - Add new tables per `agentic-layer-db-schemas.md` and migrate.
  - Convert rich-text artifacts to JSONB or a typed artifact model.

#### Verdict rationale
Transitional reuse is fine, but do not over-invest; it will evolve.

---

### G) Dashboard / Home
**Location:** `apps/web/app/home/(user)/ai/page.tsx` + `apps/web/app/home/(user)/ai/_components/AIWorkspaceDashboard.tsx`

#### What it does now
- AI home renders `AIWorkspaceDashboard` with tiles:
  - “Build New Presentation” → `/home/ai/blocks`
  - “Edit Existing Presentation” → combobox navigates to `/home/ai/canvas?id=...`
  - “Create Storyboard” → `/home/ai/storyboard`
  - “Generate your PowerPoint” → placeholder combobox (fake options)

#### Alignment with the Product Design Bible
- ❌ Does not match:
  - Presentations List home screen
  - Per-project Dashboard
  - Linear step wizard

#### What needs to change
- Replace with:
  - Presentations List (table/grid) showing project title, current step, last updated.
  - “New Presentation” starts Profile.
  - Clicking a presentation opens its Project Dashboard.

#### Verdict rationale
Rebuild.

---

### H) Navigation / Routing
**Location:** `apps/web/app/home/(user)/ai/*` + `apps/web/app/home/(user)/layout.tsx`

#### What it does now
- App router structure is conventional and easy to extend.
- AI features live under `/home/ai/*`.
- Navigation between blocks/canvas/storyboard uses links and query params.

#### Alignment with the Product Design Bible
- ✅ Underlying Next.js structure is compatible.
- ❌ Current route model encodes “tools” not “workflow steps”, and lacks a presentation-scoped dashboard.

#### What needs to change
- Introduce a presentation-scoped route tree, e.g.:
  - `/home/presentations` (list)
  - `/home/presentations/:id` (dashboard)
  - `/home/presentations/:id/profile|assemble|outline|storyboard|generate`
- Implement a shared “workflow shell” layout that renders step navigation and status.

#### Verdict rationale
No rewrite of the framework, but meaningful route refactor.

---

### I) Portkey / Model routing
**Location:** `packages/ai-gateway/src/enhanced-gateway-client.ts`

#### What it does now
- Creates an OpenAI-compatible client targeting Portkey proxy.
- Sets headers: API key, virtual key, provider, and optional config.
- Adds request metadata (user/team/feature/session).

#### Alignment with the Product Design Bible
- ✅ Fully compatible with the design direction.
- ✅ Likely the correct foundation for Mastra to call through (with a wrapper).

#### What needs to change
- Minimal:
  - Ensure Mastra tool-calls can leverage the same routing.
  - Possibly refactor “provider selection by model prefix” into a shared utility/policy later.

---

### J) Shared components
**Location:** `apps/web/app/home/(user)/ai/_components/*` and `_lib/*`

#### What it does now
- `Combobox` and `EditPresentationCombobox` are reusable UI primitives.
- `getAIGatewayContext()` centralizes auth + default config.
- `_lib/hooks/use-building-blocks-titles` and queries support selection.

#### Alignment with the Product Design Bible
- ✅ Patterns are reusable.
- ❌ Currently tied to `building_blocks_submissions` and the old “AI tools” routing.

#### What needs to change
- Generalize from “building blocks submissions” to “presentations/projects”.

---

## 3) Surprises / Risks Affecting the Sequenced Build Plan

1. **Publisher/Generate is not implemented** (it’s a stub). Export currently lives in Storyboard. Phase 1B wiring Step 5 to publisher will require either:
   - temporarily pointing Step 5 to Storyboard export, or
   - moving the exporter into publisher during Phase 1B.

2. **Storyboard depends on a DB migration that may not be present in all environments.**
   - Storyboard code handles “column does not exist” errors and tries to generate storyboard from outline, but saving will fail until `20250429173500_add_storyboard_column.sql` is applied.

3. **Rich-text artifacts are stored as strings in `text` columns.**
   - `createTiptapFromText()` writes JSON string into `situation/complication/answer` fields, but DB schema defines them as `text`.
   - Some code treats outline/storyboard as JSON objects, other parts treat them as strings. This increases brittleness when integrating new steps.

4. **Routing is query-param driven (`?id=`) and not presentation-project scoped.**
   - The new design’s “Project Dashboard + revisitable steps” will want stable presentation IDs and step statuses.

5. **AI Gateway templates registry is sparse.**
   - Title/audience suggestions are templated, but many other prompts are assembled ad-hoc in route handlers. This makes the coming “prompt audit” (#524) more work than it looks, because the source of truth is split across packages and app routes.

---

## 4) Recommendations for Phase 1B (Wire vs Scaffold vs Rebuild)

### What to wire (fastest path to a clickable 5-step shell)
- **Step 2 (Assemble):** wire current **Blocks** form, but:
  - Rename step label to “Assemble” in the shell.
  - Accept that `audience` is temporarily captured here until Profile ships (Phase 2), or hide the audience field and inject placeholder.
- **Step 3 (Outline):** wire current **Canvas** page as a temporary Outline editor.
  - Minimal route adapter: `presentationId → building_blocks_submissions.id` for now.
- **Step 4 (Storyboard):** wire existing **Storyboard** page.
- **Step 5 (Generate):** temporarily wire to **Storyboard export** (PowerPointExporter) *or* lift exporter into a new Generate page.

### What to scaffold (structure first, fill later)
- **Step 1 (Profile):** placeholder page that sets expectations (“Coming soon”) and stores nothing (per build plan).
- **Project Dashboard:** even a simple “step tiles + statuses” scaffold is valuable early.

### What to rebuild immediately (Phase 1B)
- **AI Home → Presentations List:** replace the tile dashboard with a real list.
- **Publisher page:** either delete/ignore until rebuilt, or rebuild into “Generate” and move export there.

### Tactical refactors that de-risk later phases
- Add a single abstraction for “current presentation id” and route structure.
- Decide on TipTap storage format (JSONB preferred) before implementing Profile + Agent layer context injection.

---

## Appendix: Key Files Touched During Audit

- Blocks:
  - `.../blocks/_config/formContent.ts`
  - `.../blocks/_components/BlocksForm.tsx`
  - `.../blocks/_actions/submitBuildingBlocksAction.ts`
  - `.../blocks/_actions/ai-suggestions-action.ts`
- Canvas:
  - `.../canvas/_components/canvas-page.tsx`
  - `.../canvas/_components/editor-panel.tsx`
  - `apps/web/app/api/ai/generate-ideas/route.ts`
- Storyboard:
  - `.../storyboard/_components/storyboard-page.tsx`
  - `.../storyboard/_lib/providers/storyboard-provider.tsx`
  - `.../storyboard/_lib/services/storyboard-service.ts`
  - `.../storyboard/_lib/services/powerpoint/pptx-generator.ts`
- Supabase:
  - `.../migrations/20250211000000_web_create_building_blocks_submissions.sql`
  - `.../migrations/20250429173500_add_storyboard_column.sql`
- AI Gateway:
  - `packages/ai-gateway/src/enhanced-gateway-client.ts`
  - `packages/ai-gateway/src/prompts/partials/presentation-context.ts`
  - `packages/ai-gateway/src/prompts/prompt-manager.ts`
