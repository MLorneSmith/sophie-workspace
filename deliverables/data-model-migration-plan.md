# Data Model Migration Plan — `building_blocks_submissions` → Agentic Presentation Artifacts (#{502})

**Branch:** `sophie/alpha/S532-536-wire-steps`  
**Decision already made:** **Add new tables with foreign keys; do *not* migrate existing `building_blocks_submissions` data.**
Old table remains for legacy flows until fully deprecated.

This document describes:

1) current state (`building_blocks_submissions` schema + usage)  
2) target state (new tables aligned to `presentation-artifacts.ts`)  
3) migration strategy (DDL order, RLS patterns, deprecation approach)  
4) code migration map (file-by-file)  
5) risks + open questions

---

## 1) Current State Analysis

### 1.1 Canonical schema of `public.building_blocks_submissions`

**Source of truth:**

- `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- `apps/web/supabase/migrations/20250429173500_add_storyboard_column.sql`
- `apps/web/supabase/migrations/20250708115000_fix_all_user_deletion_constraints.sql` (FK delete behavior)
- `apps/web/supabase/migrations/20250918174109_fix_rls_performance_auth_functions.sql` (RLS perf + index)

#### Table DDL (effective)

Columns (as of latest migrations):

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references auth.users(id) on delete cascade` *(initially no ON DELETE, later fixed to CASCADE)*
- `title varchar not null`
- `audience text null`
- `presentation_type varchar null`
- `question_type varchar null`
- `situation text null`
- `complication text null`
- `answer text null`
- `outline text null`
- `storyboard jsonb null` *(added 2025-04-29)*
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Constraints / indexes:

- PK: `(id)`
- FK: `building_blocks_submissions_user_id_fkey (user_id) → auth.users(id) ON DELETE CASCADE`
- RLS performance index: `idx_building_blocks_submissions_user_id_rls ON (user_id)`

RLS:

- Enabled on table.
- Policies (optimized later to use `(select auth.uid())`):
  - SELECT: `auth.uid() = user_id`
  - INSERT: `auth.uid() = user_id`
  - UPDATE: `auth.uid() = user_id`
  - DELETE: `auth.uid() = user_id`

#### What data is actually stored (observed usage patterns)

Although many columns are `text`, the app stores **JSON-serialized TipTap documents as strings** in several places:

- `situation`, `complication`, `answer`: written via `createTiptapFromText()` then `JSON.stringify(...)` in editors.
- `outline`: written as a **stringified TipTap doc** (`generateOutlineAction` stringifies a TipTap JSON with a `meta` field).
- `storyboard`: stored as **JSONB** (already structured), managed by storyboard services.

So the table acts as an all-in-one “artifact bucket” for multiple workflow steps.

---

### 1.2 Code map: where `building_blocks_submissions` is read/written

> Goal: identify all touch points so we can route them to the new tables.

#### A) Assemble step (Blocks)

- `apps/web/app/home/(user)/ai/blocks/_actions/submitBuildingBlocksAction.ts`
  - **Reads:** checks for an identical existing row via:
    - `.match({ user_id, title, audience, presentation_type, question_type, situation, complication, answer })`
  - **Writes:** `insert` new row with same fields.
  - **Notes:** converts plain text to TipTap JSON **string** for SCQ fields.
- `apps/web/app/home/(user)/ai/blocks/_components/BlocksForm.tsx`
  - Orchestrates submit action and navigation.
  - Comment indicates “submit to building_blocks_submissions”.

#### B) Outline step (Canvas)

- `apps/web/app/home/(user)/ai/canvas/_lib/queries/building-blocks-presentation.ts`
  - **Reads:** `select id, title, audience` by submission id.
- `apps/web/app/home/(user)/ai/canvas/_lib/queries/canvas-title.ts`
  - **Reads:** title for a submission id.
- `apps/web/app/home/(user)/ai/canvas/_components/editor/tiptap/tiptap-editor.tsx`
  - **Writes:** `update({ [sectionType]: JSON.stringify(newContent) })` for:
    - `sectionType ∈ { situation, complication, answer, outline }`
- `apps/web/app/home/(user)/ai/canvas/_actions/generate-outline.ts`
  - **Reads:** `select situation, complication, answer`
  - **Writes:** `update({ outline: <stringified TipTap doc> })`
- `apps/web/app/home/(user)/ai/canvas/_actions/generate-ideas.ts`
- `apps/web/app/home/(user)/ai/canvas/actions/generate-improvements.ts`
- `apps/web/app/home/(user)/ai/canvas/_actions/get-outline-suggestions.ts`
  - **Reads:** used as prompt context (varies by file), generally fetches `title/audience/question_type` + SCQ fields.
- `apps/web/app/api/ai/generate-ideas/route.ts`
  - **Reads:** `title, audience, situation, complication, question_type, answer` to build prompt messages.

#### C) Storyboard step

- `apps/web/app/home/(user)/ai/storyboard/_components/presentation-selector.tsx`
  - **Reads:** lists rows `select id, title, created_at` for selection.
- `apps/web/app/home/(user)/ai/storyboard/_lib/services/storyboard-service.ts`
  - **Reads/Writes:** `select id, title, outline, storyboard`; updates `storyboard` and sometimes `outline`.
  - Has fallback behavior if `storyboard` column doesn’t exist.
- `apps/web/app/home/(user)/ai/storyboard/_lib/services/storyboard-service-client.ts`
  - Client wrapper calling `.from("building_blocks_submissions")` for fetch/update.
- `apps/web/app/home/(user)/ai/storyboard/_lib/hooks/use-presentation-storyboard.ts`
  - **Reads/Writes:** fetch storyboard, save storyboard.
- Tests referencing table name:
  - `apps/web/app/home/(user)/ai/storyboard/_lib/services/storyboard-service*.test.ts`

#### D) Dashboard / list surfaces

- `apps/web/app/home/(user)/_lib/queries/get-presentations-for-dashboard.ts`
  - **Reads:** `select id, title, created_at, storyboard` for dashboard list.
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts`
  - **Reads:** includes `building_blocks_submissions` in dashboard data.
- `apps/web/app/home/(user)/_lib/server/activity.loader.ts`
  - **Reads:** includes `building_blocks_submissions` as part of activity aggregation.
- Type references:
  - `apps/web/app/home/(user)/_lib/dashboard/types.ts`
  - `apps/web/app/home/(user)/ai/_lib/queries/building-blocks-titles.ts`

---

## 2) Target State (Agentic Presentation Artifacts Data Model)

**Source of truth:** `apps/web/app/home/(user)/ai/_lib/schemas/presentation-artifacts.ts`

### 2.1 Core principles

1. **First-class “presentation project”** row that tracks step progression.
   - Instead of implicit state in `building_blocks_submissions`.
2. Separate tables per artifact:
   - Profile (Audience Brief / saved profile): `audience_profiles` *(already exists)*
   - Assemble: `assemble_outputs`, `materials` (+ argument map)
   - Outline: `outline_contents`
   - Storyboard: `storyboard_contents`
   - Generate: `generate_outputs`
3. Use **JSONB for structured artifacts** (argument map, adaptive answers, outline sections,
   storyboard slides/blocks) while keeping relational anchors for queryability.
4. **Foreign keys everywhere** (per decision) to ensure referential integrity.
5. **No backfill migration** from `building_blocks_submissions`.

### 2.2 Proposed tables

> Types below are Postgres/Supabase oriented.

#### A) `public.presentations` (maps `PresentationProjectSchema`)

Purpose: top-level persistent entity; the “project” that the wizard routes around.

Proposed columns:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references auth.users(id) on delete cascade not null`
- `account_id uuid references public.accounts(id) on delete cascade not null`
- `title text not null`
- `current_step text not null`  
  - constraint: `current_step in ('profile','assemble','outline','storyboard','generate')`
- `completed_steps jsonb not null default '[]'::jsonb`  
  - constraint: jsonb array of step strings
- `template_id text null` *(matches Zod: `string | null`)*
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `ix_presentations_user_id (user_id)`
- `ix_presentations_account_id (account_id)`
- `ix_presentations_updated_at (updated_at desc)`

RLS (pattern): identical to `audience_profiles` (user owns rows).

#### B) `public.assemble_outputs` (maps `AssembleOutputSchema`)

Purpose: output of Assemble step: presentation type, SCQ framing, question type, argument map.

Proposed columns:

- `id uuid primary key default gen_random_uuid()` *(optional but useful; Zod uses presentationId as key)*
- `presentation_id uuid references public.presentations(id) on delete cascade not null unique`
- `presentation_type text not null`  
  - constraint: in `('general','sales','consulting','fundraising')`
- `question_type text not null`  
  - constraint: in `('strategy','assessment','implementation','diagnostic','alternatives','postmortem')`
- `situation text not null default ''`
- `complication text not null default ''`
- `argument_map jsonb not null default '{}'::jsonb`  
  - stores `ArgumentMapNodeSchema`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `ix_assemble_outputs_presentation_id (presentation_id)`

RLS:

- (recommended) join-through policy: allow access if `presentations.user_id = auth.uid()`.
  - For performance, denormalize `user_id` as a column if needed, but prefer FK join initially.

#### C) `public.materials` (maps `MaterialItemSchema`)

Purpose: store uploaded/attached materials; ties to a presentation.

Proposed columns:

- `id uuid primary key default gen_random_uuid()`
- `presentation_id uuid references public.presentations(id) on delete cascade not null`
- `type text not null`  
  - constraint: in `('upload','braindump','link')`
- `name text not null`
- `content text null` *(extracted text / braindump / URL if you choose)*
- `mime_type text null`
- `file_url text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `ix_materials_presentation_id (presentation_id)`
- optionally `ix_materials_type (type)`

#### D) `public.outline_contents` (maps `OutlineContentSchema`)

Purpose: Outline step artifact (sections array).

Proposed columns:

- `id uuid primary key default gen_random_uuid()`
- `presentation_id uuid references public.presentations(id) on delete cascade not null unique`
- `sections jsonb not null default '[]'::jsonb`  
  - stores array of `OutlineSectionSchema` (TipTap JSON string lives inside `content` field per schema)
- `updated_at timestamptz not null default now()` *(Zod requires updatedAt; still keep created_at too)*
- `created_at timestamptz not null default now()`

Indexes:

- `ix_outline_contents_presentation_id (presentation_id)`

#### E) `public.storyboard_contents` (maps `StoryboardContentSchema`)

Purpose: Storyboard step artifact (slides array).

Proposed columns:

- `id uuid primary key default gen_random_uuid()`
- `presentation_id uuid references public.presentations(id) on delete cascade not null unique`
- `slides jsonb not null default '[]'::jsonb`  
  - stores array of `StoryboardSlideSchema` with nested `ContentBlockSchema`
- `updated_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`

Indexes:

- `ix_storyboard_contents_presentation_id (presentation_id)`

#### F) `public.generate_outputs` (maps `GenerateOutputSchema`)

Purpose: Generate/export step metadata.

Proposed columns:

- `id uuid primary key default gen_random_uuid()`
- `presentation_id uuid references public.presentations(id) on delete cascade not null unique`
- `template_id text not null`
- `export_format text not null`  
  - constraint: in `('pptx','pdf')`
- `export_url text null`
- `generated_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `ix_generate_outputs_presentation_id (presentation_id)`
- optionally `ix_generate_outputs_generated_at (generated_at desc)`

---

## 3) Migration Strategy

### 3.1 Approach recommendation

**Recommended:** *Add new tables alongside the old table* (parallel write) and migrate code step-by-step.

Rationale:

- Decision is already made: **no data migration** from `building_blocks_submissions`.
- Allows staged rollout per step (Profile first, then Assemble, etc.).
- Keeps existing production flows working while new wizard is wired.

### 3.2 Dependency order (DDL)

1. `public.presentations`
2. Artifact tables that depend on `presentations`:
   - `assemble_outputs`
   - `materials`
   - `outline_contents`
   - `storyboard_contents`
   - `generate_outputs`
3. Optional: add a FK from `audience_profiles.presentation_id` → `presentations.id`.
   - `audience_profiles` already has a nullable `presentation_id`, but no FK constraint today.

### 3.3 Handling existing `building_blocks_submissions` data

Per decision:

- **Do not backfill** new tables.
- Keep the old table and RLS in place.
- New wizard creates `presentations` rows and writes artifacts into new tables.

Deprecation plan:

- Phase 1: stop creating new `building_blocks_submissions` rows for new workflows.
- Phase 2: remove UI entry points that rely on old table (or keep under “Legacy”).
- Phase 3: once metrics show no usage, consider a follow-up PR to drop table (or archive via export).

### 3.4 Foreign keys + integrity

- All new artifact tables should have `presentation_id` FK with `ON DELETE CASCADE`.
- Prefer `unique(presentation_id)` for 1:1 artifacts (assemble/outline/storyboard/generate). `materials` remains 1:N.
- Enforce enums via `check` constraints (or Postgres enums if desired later).

### 3.5 RLS policy pattern (follow `audience_profiles`)

Use the same pattern as `audience_profiles`:

- Revoke all from `authenticated, service_role` then re-grant required verbs.
- Enable RLS.
- Policies should be explicit and named consistently:
  - `<table>_read`, `<table>_insert`, `<table>_update`, `<table>_delete`

For artifact tables, either:

1) **Join-through policies** (recommended initially):
   - `USING (exists(select 1 from presentations p where p.id = <table>.presentation_id and p.user_id = auth.uid()))`
2) **Denormalize user_id/account_id** into each artifact row to simplify RLS + indexing (performance-driven; optional).

If join-through is used, add indexes on `presentation_id` for every artifact table.

---

## 4) Code Migration Map (file-by-file)

> Effort estimates assume the new tables + typed query utilities exist.

### 4.1 Blocks (Assemble)

- `ai/blocks/_actions/submitBuildingBlocksAction.ts` → **Rewrite** to:
  - create `presentations` row (if not exists) + `assemble_outputs` row
  - optional: create/update `materials` based on step UI
  - **Effort:** Large (logic + routing + schema changes)
- `ai/blocks/_components/BlocksForm.tsx` → Update to use new actions.
  - Route using `presentationId`.
  - **Effort:** Medium

### 4.2 Canvas (Outline)

- `ai/canvas/_lib/queries/building-blocks-presentation.ts` → replace with:
  - `getPresentation(client, presentationId)` reading from `presentations`
  - (optionally) join audience/profile if needed
  - **Effort:** Small
- `ai/canvas/_components/editor/tiptap/tiptap-editor.tsx` → change persistence target from
  `building_blocks_submissions.[sectionType]` to:
  - `assemble_outputs` for SCQ fields (if still edited here), and/or
  - `outline_contents.sections` for outline editing
  - **Effort:** Large (data model changes; editor expects per-section saves)
- `ai/canvas/_actions/generate-outline.ts` → write to `outline_contents`
  instead of `building_blocks_submissions.outline`
  - **Effort:** Medium
- `app/api/ai/generate-ideas/route.ts` and canvas actions that fetch context →
  recompose context from:
  - `presentations.title`
  - `audience_profiles` / audience brief text
  - `assemble_outputs` (presentationType, questionType, SCQ, argument map)
  - `materials`
  - **Effort:** Medium

### 4.3 Storyboard

- `ai/storyboard/_components/presentation-selector.tsx` → list from `presentations` instead of `building_blocks_submissions`
  - **Effort:** Small
- `ai/storyboard/_lib/services/storyboard-service.ts` and client/hook wrappers →
  move reads/writes from `building_blocks_submissions.storyboard` to `storyboard_contents.slides`
  - **Effort:** Medium/Large (depending on how much the internal types differ)

### 4.4 Dashboard / activity loaders

- `home/(user)/_lib/queries/get-presentations-for-dashboard.ts` → query `presentations` instead of legacy table
  - **Effort:** Medium
- `home/(user)/_lib/server/activity.loader.ts` → add `presentations`-based activities
  (and/or keep legacy until cutover)
  - **Effort:** Medium

### 4.5 Shared type/query helpers

- `ai/_lib/queries/building-blocks-titles.ts` → replace with `getPresentationTitles`
  - **Effort:** Small
- `home/(user)/_lib/dashboard/types.ts` and other TS types → swap from
  `Tables<'building_blocks_submissions'>` to `Tables<'presentations'>`
  - **Effort:** Small/Medium

---

## 5) Risks & Open Questions

### 5.1 Risks

1. **RLS join performance:** join-through policies can be slower without indexes and careful
   `auth.uid()` usage.
   - Mitigation: indexes on `presentation_id`, use `(select auth.uid())`, measure; denormalize `user_id` if necessary.

2. **JSON shape drift:** Zod schemas define nested JSON structures; storing in JSONB is flexible but needs validation boundaries.
   - Mitigation: validate in server actions before writing; keep Zod schemas as canonical.

3. **TipTap storage format mismatch:** current system stores TipTap docs as stringified JSON in
   `text` columns; new schemas sometimes embed TipTap JSON as strings (Outline sections
   `content: string`).
   - Mitigation: decide per artifact whether to store TipTap JSONB directly or keep
     the “stringified TipTap JSON” convention consistent.

4. **Legacy vs new routing coexistence:** both `building_blocks_submissions` and new
   `presentations` may exist, causing UX confusion.
   - Mitigation: clear “Legacy” labeling or isolate routes.

### 5.2 Open questions for Mike

1. Should `audience_profiles.presentation_id` become an actual FK to `presentations(id)` (and do we want cascade)?
2. Do we want Postgres enums for `current_step`, `presentation_type`, `question_type`, `export_format` or keep `check` constraints?
3. For Outline sections `content`, do we store TipTap JSON as:
   - JSONB (preferred for validation/search) OR
   - stringified JSON (matches current app patterns)?
4. Should artifact tables denormalize `user_id` + `account_id` to simplify RLS and queries?

---

## Appendix A — Related files read for this plan

- Supabase migrations:
  - `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
  - `apps/web/supabase/migrations/20250429173500_add_storyboard_column.sql`
  - `apps/web/supabase/migrations/20250708115000_fix_all_user_deletion_constraints.sql`
  - `apps/web/supabase/migrations/20250918174109_fix_rls_performance_auth_functions.sql`
- New schemas:
  - `apps/web/app/home/(user)/ai/_lib/schemas/presentation-artifacts.ts`
- Audience profiles baseline:
  - `apps/web/supabase/schemas/50-audience-profiles.sql`
- Audit context:
  - `~/clawd/deliverables/implementation-audit.md`
