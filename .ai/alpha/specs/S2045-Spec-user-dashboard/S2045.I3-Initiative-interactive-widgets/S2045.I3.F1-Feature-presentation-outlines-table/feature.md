# Feature: Presentation Outlines Table

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I3 |
| **Feature ID** | S2045.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Build a full-width DataTable component showing the user's presentation outlines from `building_blocks_submissions`. The table includes columns for Title, Presentation Type, Last Updated, and an "Edit Outline" action button. A "New Presentation" button above the table links to the outline creator.

## User Story
**As a** SlideHeroes user
**I want to** see all my presentation outlines in a sortable table on my dashboard
**So that** I can quickly find and edit any presentation without navigating to the AI tools section

## Acceptance Criteria

### Must Have
- [ ] Full-width DataTable component spanning bottom row of the 3-3-1 grid
- [ ] Columns: Title, Presentation Type (Badge), Last Updated (relative time), Edit action (link button)
- [ ] Data fetched from `building_blocks_submissions` table ordered by `updated_at` DESC
- [ ] "Edit Outline" action links to `/home/ai/blocks/{id}` for each row
- [ ] "New Presentation" button above table linking to `/home/ai/blocks`
- [ ] Card wrapper with CardHeader ("Presentation Outlines" title) and CardContent
- [ ] Dark mode support via semantic color classes
- [ ] Wired to dashboard data loader return values

### Nice to Have
- [ ] `data-testid="presentations-table"` on the Card wrapper
- [ ] Presentation type displayed as colored Badge variant

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `presentations-table.tsx` (column defs + DataTable) | New |
| **Logic** | Column definitions, relative time formatter | New |
| **Data** | Supabase query on `building_blocks_submissions` | New (query) |
| **Database** | `building_blocks_submissions` table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Reuse the existing `DataTable` from `@kit/ui/data-table` and `Card` components. Column definitions follow TanStack Table patterns already documented in the codebase. The table is a Server Component wrapping the client-side DataTable.

### Key Architectural Choices
1. Server Component fetches data, passes to client DataTable via props
2. Column definitions defined in a separate `columns.tsx` file following TanStack conventions

### Trade-offs Accepted
- No client-side sorting/filtering for v1 (server-ordered by `updated_at` DESC is sufficient)
- No pagination (users unlikely to have 50+ outlines; can add later)

## Required Credentials
> None required. Data comes from Supabase `building_blocks_submissions` table with RLS.

## Dependencies

### Blocks
- None

### Blocked By
- S2045.I1.F1: Needs dashboard page shell and grid layout
- S2045.I1.F3: Needs dashboard data loader to provide building_blocks data

### Parallel With
- F2 (Coaching Sessions Card), F3 (Quick Actions Panel), F4 (Activity Feed)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/presentations-table.tsx` - DataTable with column definitions
- `apps/web/app/home/(user)/_components/dashboard/presentations-columns.tsx` - Column definitions for TanStack Table

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add PresentationsTable to bottom row of grid
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Add building_blocks_submissions query

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create column definitions**: Define TanStack Table column defs for title, type (Badge), updated_at (relative time), edit action
2. **Create PresentationsTable component**: Client component wrapping DataTable with Card layout and "New Presentation" button
3. **Add loader query**: Add `building_blocks_submissions` query to dashboard loader (select id, title, presentation_type, updated_at)
4. **Wire to dashboard page**: Import PresentationsTable and pass data from loader to the full-width bottom grid slot
5. **Add i18n keys**: Add translation keys for table headers and button labels

### Suggested Order
T1 (loader query) → T2 (column defs) → T3 (table component) → T4 (wire to page) → T5 (i18n)

## Validation Commands
```bash
pnpm typecheck
pnpm lint
grep -c "presentations" apps/web/app/home/\(user\)/_components/dashboard/presentations-table.tsx
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- DataTable component: `packages/ui/src/shadcn/data-table.tsx`
- Building blocks action: `apps/web/app/home/(user)/ai/blocks/_actions/submitBuildingBlocksAction.ts`
- Building blocks migration: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
