# Feature: Outline and Storyboard Workflow Step Editors

## Feature Description

Implement dedicated outline and storyboard editor components for the new presentation workflow (`/home/ai/[id]/outline` and `/home/ai/[id]/storyboard` steps). These editors will be designed from the ground up for the new data model (`outline_contents` and `storyboard_contents` tables) with JSONB storage, while leveraging TipTap rich text editing to provide a familiar and powerful editing experience.

The outline editor will allow users to structure their presentation into sections (loaded from or generated from the assemble step output), while the storyboard editor will transform those sections into visual slide layouts.

## User Story

As a presentation creator
I want to outline my presentation into structured sections and then convert those sections into a visual storyboard
So that I can organize my key talking points and see how they'll be presented slide-by-slide

## Problem Statement

The new workflow routes (`/home/ai/[id]/outline` and `/home/ai/[id]/storyboard`) currently have broken bridges to the old canvas/storyboard editors that depend on the `building_blocks_submissions` table. The old data model (flat text columns) doesn't align with the new flexible JSONB-based tables (`outline_contents.sections`, `storyboard_contents.slides`). We need new editors built specifically for the new data model to:

1. **Reduce data coupling** - Stop reusing old components tied to the old submission model
2. **Leverage flexibility** - Take advantage of JSONB arrays to support variable section/slide structures
3. **Maintain consistency** - Keep the rich editing experience (TipTap) that users expect
4. **Enable AI generation** - Support auto-generation of outline sections from assemble outputs and slides from outlines
5. **Clean architecture** - Build new components as first-class citizens in the workflow, not bridges to legacy code

## Solution Statement

Build two new editor components with supporting infrastructure:

### 1. **Outline Editor** (`[id]/outline/page.tsx`)
- Load or create `outline_contents` record for the presentation
- If no existing outline, fetch `assemble_outputs` (situation, complication, answer) and auto-generate initial sections via AI
- Display TipTap editor for each section with title and rich text body
- Support CRUD operations: add section, edit content, reorder sections (drag/drop), delete section
- Auto-save to `outline_contents.sections` JSONB via server action
- Show progress indicator and last-saved timestamp

### 2. **Storyboard Editor** (`[id]/storyboard/page.tsx`)
- Load or create `storyboard_contents` record for the presentation
- If no existing slides, fetch `outline_contents.sections` and auto-generate slides via AI
- Display slide preview grid (thumbnail view) and detail editor
- Support slide operations: add/delete/reorder slides, edit layout/content per slide
- Each slide can have: title, layout type (title-only, title+content, title+two-column), speaker notes (TipTap), visual notes
- Auto-save to `storyboard_contents.slides` JSONB
- Export to PowerPoint (leverage existing PPTX generator)

### 3. **Supporting Services & Queries**
- `outline-contents.service.ts` - Fetch, save, auto-generate outline sections
- `storyboard-contents.service.ts` - Fetch, save, auto-generate slides from outline
- `generate-outline.action.ts` - Server action to call AI for outline generation
- `generate-storyboard.action.ts` - Server action to call AI for slide generation
- React hooks for data fetching and mutations (via TanStack Query)

## Relevant Files

### Existing Components to Reuse/Reference
- `apps/web/app/home/(user)/ai/canvas/_components/editor/tiptap/` - TipTap editor implementation (can extract and adapt)
- `apps/web/app/home/(user)/ai/storyboard/_lib/services/pptx-generator.ts` - PowerPoint generation (reuse as-is)
- `apps/web/app/home/(user)/ai/[id]/_components/WorkflowShell.tsx` - Layout shell (already in place)
- `packages/supabase/src/database.types.ts` - Auto-generated types for new tables

### Database/Schema Files
- `apps/web/supabase/migrations/20260219010300_add_outline_contents.sql` - Outline table (already created)
- `apps/web/supabase/migrations/20260219010400_add_storyboard_contents.sql` - Storyboard table (already created)
- `apps/web/supabase/migrations/20260219010100_add_assemble_outputs.sql` - Source for auto-generation

### Workflow Infrastructure
- `apps/web/app/home/(user)/ai/[id]/_components/WorkflowStepBar.tsx` - Step navigation
- `apps/web/app/home/(user)/ai/_components/mock-presentations.ts` - Workflow step definitions

### New Files to Create
- `apps/web/app/home/(user)/ai/[id]/outline/_components/outline-editor.tsx` - Main outline editor component
- `apps/web/app/home/(user)/ai/[id]/outline/_components/section-editor.tsx` - Per-section TipTap editor
- `apps/web/app/home/(user)/ai/[id]/outline/_lib/outline-contents.service.ts` - Data service
- `apps/web/app/home/(user)/ai/[id]/outline/_lib/hooks/use-outline-contents.ts` - React Query hook
- `apps/web/app/home/(user)/ai/[id]/outline/_actions/generate-outline.action.ts` - AI generation action
- `apps/web/app/home/(user)/ai/[id]/storyboard/_components/storyboard-editor.tsx` - Main storyboard editor
- `apps/web/app/home/(user)/ai/[id]/storyboard/_components/slide-editor.tsx` - Per-slide editor
- `apps/web/app/home/(user)/ai/[id]/storyboard/_lib/storyboard-contents.service.ts` - Data service
- `apps/web/app/home/(user)/ai/[id]/storyboard/_lib/hooks/use-storyboard-contents.ts` - React Query hook
- `apps/web/app/home/(user)/ai/[id]/storyboard/_actions/generate-storyboard.action.ts` - AI generation action
- `apps/web/app/home/(user)/ai/[id]/_lib/types/outline.types.ts` - Shared type definitions
- `apps/web/app/home/(user)/ai/[id]/_lib/types/storyboard.types.ts` - Shared type definitions

## Impact Analysis

### Dependencies Affected
- **@tanstack/react-query** - Used for data fetching and mutations (already in project)
- **@tiptap/react** - TipTap editor library (extract from existing canvas usage)
- **lucide-react** - Icons (already in project)
- **@kit/ui** - UI components (already in project)
- **AI Gateway** - For outline/storyboard generation (exists, used in canvas)

No new package dependencies required.

### Risk Assessment

**MEDIUM RISK**

**Why:**
- New components are isolated to the workflow step pages (no impact on old canvas/storyboard routes)
- TipTap editor is well-tested in existing canvas implementation, reusing proven patterns reduces risk
- JSONB operations are standard PostgreSQL; RLS policies already defined in migrations
- Data model is simpler than old system (no multi-column spread, cleaner separation of concerns)
- Server actions follow existing patterns (`enhanceAction`, validation, error handling)

**Mitigations:**
- Thoroughly test auto-generation logic with assemble_outputs edge cases (empty fields, missing data)
- Validate JSONB serialization/deserialization with various section/slide structures
- Test RLS policies to ensure users can only access their own outline_contents/storyboard_contents
- Test undo/redo and state management during rapid edits

### Backward Compatibility

**Fully backward compatible** - No impact on existing systems:
- Old canvas (`/home/ai/canvas?id=...`) and storyboard (`/home/ai/storyboard?id=...`) routes remain functional
- Old `building_blocks_submissions` table untouched
- New workflow routes are separate namespaces
- Existing code has no dependencies on new components

### Performance Impact

**Positive:**
- JSONB storage is more efficient than multi-column approach (single write to update all sections)
- Fewer database round-trips (whole document saved at once vs. multiple columns)
- Simpler query structure (single table per step vs. spreading across submission columns)

**Potential concerns:**
- JSONB array with many sections (100+) might need query optimization; add JSONB indexes if needed
- TipTap serialization for large rich-text documents; lazy-load sections if performance degrades

### Security Considerations

**Authentication/Authorization:**
- Use standard Supabase RLS policies (already defined in migrations)
- Server actions require `auth: true` via `enhanceAction`
- Verify `user_id` matches authenticated user before mutations

**Data Validation:**
- Validate section/slide structure before save (Zod schemas)
- Sanitize rich-text content from TipTap to prevent XSS
- Validate presentation_id ownership before mutations

**No security vulnerabilities expected** - patterns follow established security practices.

## Pre-Feature Checklist

Before starting implementation:
- [x] Read relevant context documentation (database-patterns, server-actions, react-query-patterns)
- [x] Review outline_contents and storyboard_contents migrations
- [x] Understand existing TipTap implementation in canvas
- [x] Verify assemble_outputs schema for auto-generation source
- [ ] Create feature branch: `feature/outline-storyboard-workflow-editors`
- [ ] Create GitHub issue for tracking
- [ ] Design data type schemas (OutlineSection, StoryboardSlide)
- [ ] Plan AI prompt templates for outline/storyboard generation
- [ ] Identify reusable TipTap components from canvas

## Documentation Updates Required

- **Technical:** Add outline/storyboard editor documentation to `CLAUDE.md` (workflow step patterns)
- **Code comments:** Document TipTap integration, JSONB serialization patterns, auto-generation logic
- **API documentation:** Document server actions for outline/storyboard generation
- **README:** Update workflow step list to reflect new editors (remove "Coming in Phase 2" badges)

## Rollback Plan

**To disable the feature:**

1. Replace outline/storyboard pages with placeholders (as they currently are)
2. Update workflow navigation to skip or hide these steps
3. Keep new database tables (they'll be used eventually; no harm leaving them)
4. No migrations to rollback (tables already exist from #498)

**Monitoring:**
- Track error logs for `outline-contents-service` and `storyboard-contents-service`
- Monitor JSONB serialization errors during saves
- Watch for validation failures in server actions
- Alert on RLS policy violations

## Implementation Plan

### Phase 1: Foundation & Types (2-3 hours)
Set up type definitions, service layer structure, and data access patterns.

### Phase 2: Outline Editor (4-5 hours)
Build the outline step with TipTap editing, auto-generation, and data persistence.

### Phase 3: Storyboard Editor (4-5 hours)
Build the storyboard step with slide management, auto-generation, and layout support.

### Phase 4: Integration & Testing (2-3 hours)
Wire into workflow, test end-to-end, validate data flows, and handle edge cases.

## Step by Step Tasks

### Step 1: Define TypeScript Types for Outline and Storyboard Data

**Tasks:**
- Create `apps/web/app/home/(user)/ai/[id]/_lib/types/outline.types.ts`
  - `OutlineSection` interface (id, title, body as TipTap JSON, order)
  - `OutlineContents` interface (presentation_id, user_id, account_id, sections array, timestamps)
- Create `apps/web/app/home/(user)/ai/[id]/_lib/types/storyboard.types.ts`
  - `StoryboardSlide` interface (id, title, layout type, content, speaker_notes, visual_notes, order)
  - `StoryboardContents` interface (presentation_id, user_id, account_id, slides array, timestamps)
- Export types from `database.types.ts` (auto-generated from migrations)
- Verify types compile with `pnpm typecheck`

**Acceptance Criteria:**
- All types defined and exported
- Types match database schemas
- No TypeScript errors

---

### Step 2: Create Data Service Layer for Outline Contents

**Tasks:**
- Create `apps/web/app/home/(user)/ai/[id]/outline/_lib/outline-contents.service.ts`
  - Class `OutlineContentsService` with methods:
    - `fetchOutlineContents(presentationId)` - Query outline_contents table
    - `createOutlineContents(presentationId, userId, accountId)` - Insert empty outline_contents
    - `updateOutlineSections(presentationId, sections)` - Update sections JSONB
    - `deleteOutlineContents(presentationId)` - Clean up
- Use `getSupabaseServerClient()` for database access
- Add proper error handling and logging
- Verify RLS policies allow user access

**Acceptance Criteria:**
- Service compiles without errors
- Methods handle null/missing records gracefully
- RLS policies verified to work with service

---

### Step 3: Create React Query Hook for Outline Data

**Tasks:**
- Create `apps/web/app/home/(user)/ai/[id]/outline/_lib/hooks/use-outline-contents.ts`
  - Query hook: `useOutlineContents(presentationId)` - Fetch outline_contents
  - Mutation hook: `useSaveOutlineContents(presentationId)` - Auto-save sections
  - Both hooks use React Query v5 patterns (isPending, isError, etc.)
  - Cache strategy: staleTime 5min, gcTime 30min
  - Include error states and loading indicators

**Acceptance Criteria:**
- Hooks use correct React Query v5 API
- Data fetching works end-to-end
- Mutations properly invalidate cache
- TypeScript strict mode passes

---

### Step 4: Create Outline Editor Components

**Tasks:**
- Create `apps/web/app/home/(user)/ai/[id]/outline/_components/outline-editor.tsx`
  - Main component that loads outline_contents data
  - Render sections list with add/reorder/delete buttons
  - Render active section editor below
  - Handle auto-generation on first load
  - Use `useOutlineContents` hook for data

- Create `apps/web/app/home/(user)/ai/[id]/outline/_components/section-editor.tsx`
  - TipTap editor for section body (reuse patterns from canvas)
  - Section title input field
  - Save/discard buttons with auto-save on blur
  - Show save status (saving, saved, error)

- Update `apps/web/app/home/(user)/ai/[id]/outline/page.tsx`
  - Remove placeholder, render outline editor
  - Pass presentationId to editor component
  - Add suspense boundary for loading state

**Acceptance Criteria:**
- Components render without errors
- Sections display correctly from outline_contents
- TipTap editor functional with rich text support
- Save/discard works; auto-save triggers on blur

---

### Step 5: Create Server Action for Outline Generation

**Tasks:**
- Create `apps/web/app/home/(user)/ai/[id]/outline/_actions/generate-outline.action.ts`
  - Server action using `enhanceAction`
  - Input: presentationId, forceRegenerate flag
  - Logic:
    1. Fetch assemble_outputs (situation, complication, answer)
    2. Call AI Gateway to generate outline sections from SCA
    3. Save to outline_contents
    4. Return generated sections
  - Add proper error handling
  - Validate user owns the presentation (RLS handles this)

**Acceptance Criteria:**
- Action invokes correctly from client component
- AI generation produces valid outline sections
- Sections saved to database and returned to client
- Error cases handled gracefully

---

### Step 6: Implement Outline Auto-Generation Logic

**Tasks:**
- Update outline-editor.tsx to call generate-outline action on first load:
  - If outline_contents exists and has sections: load and display them
  - If outline_contents doesn't exist: call generate-outline action automatically
  - Show loading state during generation ("Generating outline from your response...")
  - Display generated sections after completion
  - Allow user to manually trigger regeneration with button

**Acceptance Criteria:**
- First visit to outline step auto-generates outline from assemble output
- User sees clear loading/success states
- Manual regeneration works with force flag
- Edge case: empty/incomplete assemble_outputs handled gracefully

---

### Step 7: Create Data Service Layer for Storyboard Contents

**Tasks:**
- Create `apps/web/app/home/(user)/ai/[id]/storyboard/_lib/storyboard-contents.service.ts`
  - Class `StoryboardContentsService` with methods:
    - `fetchStoryboardContents(presentationId)` - Query storyboard_contents table
    - `createStoryboardContents(presentationId, userId, accountId)` - Insert empty storyboard_contents
    - `updateStoryboardSlides(presentationId, slides)` - Update slides JSONB
    - `deleteStoryboardContents(presentationId)` - Clean up
- Similar structure to outline service
- Verify RLS policies

**Acceptance Criteria:**
- Service compiles without errors
- Methods handle null/missing records gracefully
- RLS policies verified

---

### Step 8: Create React Query Hook for Storyboard Data

**Tasks:**
- Create `apps/web/app/home/(user)/ai/[id]/storyboard/_lib/hooks/use-storyboard-contents.ts`
  - Query hook: `useStoryboardContents(presentationId)` - Fetch storyboard_contents
  - Mutation hook: `useSaveStoryboardContents(presentationId)` - Auto-save slides
  - Same React Query v5 patterns as outline hook

**Acceptance Criteria:**
- Hooks use correct React Query v5 API
- Data fetching works end-to-end
- TypeScript strict mode passes

---

### Step 9: Create Storyboard Editor Components

**Tasks:**
- Create `apps/web/app/home/(user)/ai/[id]/storyboard/_components/storyboard-editor.tsx`
  - Main component that loads storyboard_contents data
  - Two-panel layout: slides list (left), slide detail editor (right)
  - Render slides grid with add/reorder/delete buttons
  - Handle auto-generation on first load

- Create `apps/web/app/home/(user)/ai/[id]/storyboard/_components/slide-editor.tsx`
  - Edit slide title, layout type, content
  - TipTap editor for speaker notes
  - Save/discard with auto-save
  - Show save status

- Update `apps/web/app/home/(user)/ai/[id]/storyboard/page.tsx`
  - Remove placeholder, render storyboard editor
  - Pass presentationId to editor component

**Acceptance Criteria:**
- Components render without errors
- Slides display correctly from storyboard_contents
- Slide editor works with layout support
- Save/discard works; auto-save triggers on blur

---

### Step 10: Create Server Action for Storyboard Generation

**Tasks:**
- Create `apps/web/app/home/(user)/ai/[id]/storyboard/_actions/generate-storyboard.action.ts`
  - Server action using `enhanceAction`
  - Input: presentationId, forceRegenerate flag
  - Logic:
    1. Fetch outline_contents (sections)
    2. Fetch assemble_outputs (for context: presentation_type, question_type)
    3. Call AI Gateway to generate slides from sections
    4. Save to storyboard_contents
    5. Return generated slides
  - Add proper error handling

**Acceptance Criteria:**
- Action invokes correctly from client
- AI generation produces valid slides with layouts
- Slides saved to database and returned
- Error cases handled gracefully

---

### Step 11: Implement Storyboard Auto-Generation Logic

**Tasks:**
- Update storyboard-editor.tsx to call generate-storyboard action on first load:
  - If storyboard_contents exists and has slides: load and display them
  - If storyboard_contents doesn't exist: call generate-storyboard action automatically
  - Show loading state during generation
  - Display generated slides after completion
  - Allow manual regeneration

**Acceptance Criteria:**
- First visit to storyboard step auto-generates slides from outline
- User sees clear loading/success states
- Manual regeneration works
- Edge case: outline_contents missing or empty handled gracefully

---

### Step 12: Integrate PowerPoint Export (Storyboard)

**Tasks:**
- Update `apps/web/app/home/(user)/ai/[id]/storyboard/_actions/export-powerpoint.action.ts`
  - Reuse existing PPTX generator from old storyboard (`pptx-generator.ts`)
  - Input: presentationId
  - Fetch storyboard_contents.slides + outline_contents.sections for content
  - Generate PowerPoint using existing generator
  - Return file download

**Acceptance Criteria:**
- PowerPoint export action works end-to-end
- Generated PPTX has correct slides and content
- File downloads successfully

---

### Step 13: Test Outline Editor End-to-End

**Tasks:**
- Create test file: `apps/web/app/home/(user)/ai/[id]/outline/_components/__tests__/outline-editor.test.tsx`
  - Test auto-generation on first load
  - Test adding/editing/deleting sections
  - Test TipTap content editing
  - Test auto-save functionality
  - Test error states (network, permission errors)
- Run E2E test through Playwright:
  - Navigate to outline step
  - Verify auto-generation runs
  - Add/edit/delete sections
  - Verify saves to database
  - Navigate to storyboard step and back (verify data persists)

**Acceptance Criteria:**
- Unit tests pass
- E2E test passes
- No console errors
- Data persists across navigation

---

### Step 14: Test Storyboard Editor End-to-End

**Tasks:**
- Create test file: `apps/web/app/home/(user)/ai/[id]/storyboard/_components/__tests__/storyboard-editor.test.tsx`
  - Test auto-generation on first load
  - Test adding/editing/deleting slides
  - Test layout type changes
  - Test speaker notes editing
  - Test auto-save functionality
- Run E2E test:
  - Navigate to storyboard step
  - Verify auto-generation runs
  - Edit slides
  - Test PowerPoint export
  - Verify slides saved to database

**Acceptance Criteria:**
- Unit tests pass
- E2E test passes
- PowerPoint export produces valid file
- No console errors

---

### Step 15: Validation Commands

Execute these commands to validate the feature works with zero regressions:

**Commands:**
```bash
# Type checking
pnpm typecheck

# Unit tests
pnpm test:unit -- outline storyboard

# E2E tests (specific workflow tests)
pnpm test:e2e -- --grep "workflow.*outline|workflow.*storyboard"

# Linting
pnpm lint

# Build
pnpm build

# Manual validation (run dev server and test manually)
pnpm dev
# - Navigate to /home/ai/pres-[id]/outline
# - Verify outline auto-generates from assemble step
# - Edit outline sections, verify saves
# - Navigate to /home/ai/pres-[id]/storyboard
# - Verify storyboard auto-generates from outline
# - Edit slides, test PowerPoint export
```

**Expected Results:**
- All commands pass without errors
- No regressions in existing canvas/storyboard routes
- New workflow routes fully functional
- Database queries return expected data with RLS applied

## Testing Strategy

### Unit Tests
- **outline-contents.service.test.ts** - Service methods (fetch, create, update, delete)
- **outline-editor.test.tsx** - Component rendering, state management, TipTap integration
- **section-editor.test.tsx** - Rich text editing, validation, save triggers
- **generate-outline.action.test.ts** - Server action with AI generation mocking
- **storyboard-contents.service.test.ts** - Service methods
- **storyboard-editor.test.tsx** - Component rendering, slide management
- **slide-editor.test.tsx** - Slide editing, layout handling
- **generate-storyboard.action.test.ts** - Server action with AI generation mocking

### Integration Tests
- **outline-workflow.integration.test.ts**
  - Load outline step → auto-generate from assemble → edit sections → save to DB → verify data
  - Fetch outline_contents from DB → verify RLS restrictions by user
- **storyboard-workflow.integration.test.ts**
  - Load storyboard step → auto-generate from outline → edit slides → save to DB
  - Export PowerPoint → verify file structure and content

### E2E Tests
- **workflow-presentation-creation.e2e.test.ts**
  - User flow: Create presentation → Assemble → Outline (auto-gen + edit) → Storyboard (auto-gen + edit) → Export
  - Verify data persists across steps
  - Verify navigation between steps works
  - Test on Chrome and Firefox (browser compatibility)

### Edge Cases
- **Empty/null data handling:**
  - assemble_outputs with empty situation/complication/answer fields
  - outline_contents with zero sections
  - storyboard_contents with zero slides
- **Concurrent edits:**
  - Rapid section adds/deletes
  - Auto-save during active typing
  - Save conflicts (simulate network race conditions)
- **Large content:**
  - Very large rich-text section (10k+ words)
  - Many sections (50+)
  - Many slides (100+)
- **Error scenarios:**
  - Network timeout during save
  - Invalid presentation_id
  - User doesn't own presentation (RLS violation)
  - AI generation service unavailable
  - Invalid JSONB structure from corrupted data

## Acceptance Criteria

1. **Outline Editor**
   - ✅ Loads existing outline_contents or shows empty state
   - ✅ Auto-generates outline sections from assemble_outputs on first visit
   - ✅ User can add, edit, reorder, delete outline sections
   - ✅ TipTap rich text editor works for section bodies
   - ✅ Auto-save triggers on editor blur; shows save status
   - ✅ Manual regeneration available via button
   - ✅ Data persists to outline_contents table
   - ✅ RLS policies prevent access to other users' data

2. **Storyboard Editor**
   - ✅ Loads existing storyboard_contents or shows empty state
   - ✅ Auto-generates slides from outline_contents on first visit
   - ✅ User can add, edit, reorder, delete slides
   - ✅ Slide layout types configurable (title-only, title+content, etc.)
   - ✅ TipTap editor for speaker notes
   - ✅ Auto-save triggers on editor blur; shows save status
   - ✅ Manual regeneration available via button
   - ✅ Data persists to storyboard_contents table
   - ✅ RLS policies prevent access to other users' data

3. **AI Generation**
   - ✅ Outline generation produces valid section structure from assemble outputs
   - ✅ Storyboard generation produces valid slide structure from outline
   - ✅ Generation errors handled gracefully with user-friendly messages
   - ✅ Generation respects presentation_type and question_type context

4. **Integration**
   - ✅ Outline/storyboard steps integrated into workflow navigation
   - ✅ PowerPoint export works from storyboard step
   - ✅ Data flows correctly: Assemble → Outline → Storyboard → Export
   - ✅ No regressions in old canvas/storyboard routes

5. **Quality**
   - ✅ Zero TypeScript errors (strict mode)
   - ✅ All tests pass (unit, integration, E2E)
   - ✅ Linting passes
   - ✅ Code follows project conventions and patterns
   - ✅ Performance acceptable (no slow queries, reasonable bundle impact)

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions:

```bash
# Type checking - must pass with zero errors
pnpm typecheck

# Linting - must pass with zero errors
pnpm lint:fix
pnpm lint

# Unit tests - outline and storyboard services, components, actions
pnpm test:unit

# E2E tests - full workflow from presentation creation through export
pnpm test:e2e

# Build validation - must produce valid production build
pnpm build

# Manual validation checklist
# 1. Start dev server: pnpm dev
# 2. Create a new presentation (go through assemble step)
# 3. Navigate to /home/ai/[id]/outline
#    - Verify outline auto-generates from assemble outputs
#    - Edit outline sections
#    - Verify save status shows "Saved"
#    - Refresh page; verify outline persists
# 4. Navigate to /home/ai/[id]/storyboard
#    - Verify storyboard auto-generates from outline
#    - Edit slides
#    - Test PowerPoint export button
#    - Verify exported file contains slide content
# 5. Navigate back to outline, then to storyboard
#    - Verify data persists across navigation
# 6. Test old routes still work
#    - /home/ai/canvas?id=[submissionId] should work (old flow)
#    - /home/ai/storyboard?id=[submissionId] should work (old flow)
# 7. Browser DevTools console should show zero errors
```

## Notes

### AI Generation Prompts
Will need to define prompts for:
1. **Outline generation** - Takes situation, complication, answer → generates outline sections with talking points
2. **Storyboard generation** - Takes outline sections → generates slides with layout recommendations and content

These will integrate with the existing AI Gateway service used in the canvas implementation.

### TipTap Extraction
The outline and storyboard editors will reuse TipTap patterns from the existing canvas implementation:
- Extract reusable TipTap component with toolbar
- Support formatting: bold, italic, underline, headings, lists, links
- JSON serialization to store in JSONB columns

### Future Enhancements (Out of Scope)
- Drag-and-drop section/slide reordering UI (currently add/delete, can add drag later)
- Comments/feedback on sections/slides
- Version history/undo (beyond browser undo)
- Collaborative editing (real-time sync with other users)
- Template selection for slides
- Asset management (images, video in slides)

### Dependencies
No new npm packages required. Using:
- TipTap (already in project, extract from canvas)
- TanStack Query v5 (already in project)
- Supabase client (already in project)
- Shadcn UI components (already in project)
- AI Gateway service (already in project)
