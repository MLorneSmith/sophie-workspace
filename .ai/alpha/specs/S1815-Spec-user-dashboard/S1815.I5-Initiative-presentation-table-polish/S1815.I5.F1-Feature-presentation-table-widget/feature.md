# Feature: Presentation Table Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I5 |
| **Feature ID** | S1815.I5.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Implement a full-width presentations table widget for the user dashboard displaying the user's building blocks submissions with edit links, sorting, and pagination. The table provides quick access to presentation outlines without navigating to the presentations list.

## User Story
**As a** SlideHeroes user
**I want to** see my recent presentations in a table on the dashboard
**So that** I can quickly access and edit my presentation outlines without extra navigation

## Acceptance Criteria

### Must Have
- [ ] Full-width table spanning entire dashboard width below other widgets
- [ ] Columns: Title, Audience, Type, Updated, Actions
- [ ] Sort by updated_at descending (most recent first)
- [ ] "Edit" link in actions column navigating to `/home/ai/canvas?id={id}`
- [ ] Server-side data loading via dashboard loader
- [ ] Pagination with limit of 10 presentations per page
- [ ] Empty state when user has no presentations

### Nice to Have
- [ ] Column headers with sort indicators (future enhancement)
- [ ] Responsive horizontal scroll on mobile

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | PresentationsTableWidget, column definitions | New |
| **Logic** | Dashboard data aggregation | Existing (extend loader) |
| **Data** | building_blocks_submissions query | Existing (adapt query) |
| **Database** | building_blocks_submissions table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Leverage existing DataTable component from @kit/ui with custom column definitions. The DataTable already handles sorting, pagination, and responsive behavior. We only need to define columns and integrate with the dashboard loader.

### Key Architectural Choices
1. Use existing `DataTable` component from `@kit/ui/data-table` with client-side rendering
2. Fetch data server-side in dashboard loader, pass to client component
3. Define columns with `ColumnDef<T>[]` pattern matching existing implementations

### Trade-offs Accepted
- Client-side pagination for v1 (server-side pagination deferred to reduce complexity)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Table | DataTable | @kit/ui/data-table | Full-featured table with sorting, pagination |
| Actions | Button with Link | @kit/ui/button | Consistent styling, accessible |
| Badge (Type) | Badge | @kit/ui/badge | Status/category display |
| Empty State | EmptyState | @kit/ui/empty-state | Consistent empty state pattern |

**Components to Install**: None - all components already exist in packages/ui

## Required Credentials
> Environment variables required for this feature to function.

None required - uses internal database queries via Supabase client with RLS.

## Dependencies

### Blocks
- F2: Empty States Polish (needs table empty state to standardize)
- F3: Accessibility Compliance (needs table for keyboard nav testing)
- F4: E2E Dashboard Tests (needs table rendering for test coverage)

### Blocked By
- S1815.I1.F1: Dashboard Page Shell (provides layout container) - likely complete
- Dashboard loader infrastructure must exist

### Parallel With
- None (root feature for this initiative)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/presentations-table-widget.tsx` - Table widget component
- `apps/web/app/home/(user)/_lib/types/presentation.ts` - TypeScript types (if not exists)

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Add presentations query
- `apps/web/app/home/(user)/page.tsx` - Add widget to dashboard layout

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define TypeScript types**: Create/extend types for presentation table data
2. **Add presentations query to loader**: Extend dashboard loader with building_blocks_submissions query
3. **Create column definitions**: Define ColumnDef array with all columns and actions
4. **Create table widget component**: Implement PresentationsTableWidget with DataTable
5. **Create empty state**: Add empty state for no presentations
6. **Integrate into dashboard page**: Add widget to page layout
7. **Add data-testid attributes**: For E2E testing

### Suggested Order
1. Types → 2. Loader → 3. Columns → 4. Widget → 5. Empty State → 6. Integration → 7. Test IDs

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Start dev server and verify table renders
pnpm dev
# Navigate to /home with user that has presentations

# Verify empty state
# Navigate to /home with new user (no presentations)

# Test edit link navigation
# Click edit on a presentation, verify canvas loads

# Lint and format
pnpm lint:fix
pnpm format:fix
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `packages/ui/src/makerkit/data-table.tsx`
- Reference: `packages/features/admin/src/components/admin-accounts-table.tsx` (pattern)
- Schema: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
