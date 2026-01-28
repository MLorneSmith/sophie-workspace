# Feature: Presentation Table Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I5 |
| **Feature ID** | S1864.I5.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Implement a DataTable widget showing the user's presentations with sortable columns (title, type, last updated), quick "Edit Outline" action buttons, and pagination for users with many presentations. The table provides quick access to resume editing presentation outlines.

## User Story
**As a** SlideHeroes user
**I want to** see a table of my presentations on my dashboard
**So that** I can quickly access and edit any presentation outline without navigating through multiple pages

## Acceptance Criteria

### Must Have
- [ ] DataTable renders with columns: Title, Type, Last Updated, Actions
- [ ] Columns are sortable (client-side sorting via TanStack Table)
- [ ] "Edit Outline" button navigates to `/home/ai/canvas?id={presentation_id}`
- [ ] Pagination displays when >10 presentations (page size: 10)
- [ ] Empty state shows when user has no presentations
- [ ] Data loads from `building_blocks_submissions` table via server loader
- [ ] RLS enforces user can only see their own presentations

### Nice to Have
- [ ] Column width is responsive on smaller screens
- [ ] Table scrolls horizontally on mobile

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `PresentationsTableWidget` client component | New |
| **Logic** | Column definitions, sorting state, pagination state | New |
| **Data** | `loadUserPresentations()` server loader function | New |
| **Database** | `building_blocks_submissions` table query | Existing |

## Architecture Decision

**Approach**: Pragmatic - Server Component + Client DataTable
**Rationale**: Follows established pattern from team members table. Server fetches data with RLS protection, client handles sorting/pagination for instant UX. Client-side pagination acceptable for <100 presentations per user.

### Key Architectural Choices
1. Server component fetches all user presentations in single query (no pagination at DB level)
2. Client component handles sorting and pagination via TanStack Table internal state
3. Direct link buttons instead of dropdown menus (single action: Edit Outline)
4. Uses existing `@kit/ui/enhanced-data-table` component

### Trade-offs Accepted
- Client-side pagination limits scalability to ~100 presentations (acceptable for MVP)
- Future migration path: Add server pagination with pageCount prop when needed

## Required Credentials
> None required - uses existing Supabase authentication

## Dependencies

### Blocks
- F2 (Empty States Polish) - needs table widget to polish its empty state
- F4 (E2E Tests) - needs table widget to test

### Blocked By
- S1864.I1.F1 (Types and Loader) - needs DashboardData types
- S1864.I1.F2 (Dashboard Page Shell) - needs page structure to integrate into
- S1864.I1.F3 (Responsive Grid Layout) - needs grid to position widget

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/presentations-table-widget.tsx` - Client component with DataTable
- `apps/web/app/home/(user)/_lib/server/presentations.loader.ts` - Server loader for presentations data

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render PresentationsTableWidget in dashboard grid

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Data table | DataTable | @kit/ui/enhanced-data-table | Existing full-featured table with sorting/pagination |
| Action button | Button | @kit/ui/button | Standard button with outline variant |
| Card wrapper | Card | @kit/ui/card | Consistent dashboard widget container |
| Icon | Pencil | lucide-react | Standard edit icon |

**Components to Install**: None - all components already available

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create presentations loader**: Server-only function to query building_blocks_submissions with RLS
2. **Create table widget component**: Client component with column definitions and DataTable
3. **Define column structure**: Title, Type (nullable), Last Updated (formatted), Actions (link button)
4. **Implement empty state**: Show message when no presentations exist
5. **Integrate into dashboard page**: Import loader and widget, add to grid layout
6. **Add loading skeleton**: Suspense boundary with table skeleton

### Suggested Order
1. Loader → 2. Widget skeleton → 3. Column definitions → 4. Empty state → 5. Page integration → 6. Testing

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Manual testing
# 1. Navigate to /home as authenticated user
# 2. Verify table renders with presentations
# 3. Test sorting by clicking column headers
# 4. Test pagination if >10 presentations
# 5. Click "Edit Outline" and verify navigation to canvas
# 6. Test with user with 0 presentations (empty state)
```

## Related Files
- Initiative: `../initiative.md`
- DataTable component: `packages/ui/src/makerkit/data-table.tsx`
- Building blocks table: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- Canvas page (navigation target): `apps/web/app/home/(user)/ai/canvas/page.tsx`
