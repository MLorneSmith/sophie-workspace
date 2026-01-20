# Feature: Presentation Outlines Table

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I4 |
| **Feature ID** | S1607.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Implement a full-width data table displaying all user presentation outlines from building_blocks_submissions. The table shows Title, Audience, Type, Updated date, and an "Edit Outline" action button for each row. Supports client-side sorting and displays an empty state when no presentations exist.

## User Story
**As a** SlideHeroes user
**I want to** see all my presentation outlines in a sortable table
**So that** I can quickly find and continue editing any presentation

## Acceptance Criteria

### Must Have
- [ ] Full-width table renders in row 3 of dashboard grid
- [ ] Columns display: Title, Audience, Type, Updated, Actions
- [ ] "Edit Outline" button navigates to outline editor
- [ ] Table supports client-side sorting by column
- [ ] Empty state displays when user has no presentations
- [ ] Loading skeleton displays during data fetch
- [ ] RLS filters to show only current user's presentations

### Nice to Have
- [ ] Pagination when presentations exceed 10 items
- [ ] Search/filter by title

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | PresentationOutlinesTable | New |
| **Logic** | Column definitions, sorting | New |
| **Data** | Server-side query in page | New |
| **Database** | building_blocks_submissions | Existing |

## Architecture Decision

**Approach**: Pragmatic - Server fetch + Client DataTable
**Rationale**: Data fetched server-side with RLS protection, passed to client DataTable component for interactivity (sorting, pagination). Uses existing MakerKit DataTable - no custom table implementation.

### Key Architectural Choices
1. Server component fetches data with RLS-protected query
2. Client component receives data via props for interactivity
3. Reuse MakerKit DataTable from @kit/ui/data-table
4. Column definitions with useMemo to prevent re-renders
5. Button action navigates via Next.js router

### Trade-offs Accepted
- Client-side sorting only (acceptable for typical user presentation count <100)
- No real-time updates (table refreshes on page navigation)

### Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Table | DataTable | @kit/ui/data-table | Full-featured with sorting |
| Action button | Button | @kit/ui/button | Consistent button styling |
| Edit icon | Pencil | lucide-react | Clear edit semantic |
| Loading | Skeleton | @kit/ui/skeleton | Standard skeleton pattern |
| Empty state | Custom div | N/A | Simple centered message |

## Dependencies

### Blocks
- None

### Blocked By
- S1607.I1: Dashboard Foundation (provides page structure and grid)

### Parallel With
- F1: Quick Actions Panel

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/presentation-outlines-table.tsx` - Client table component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add data fetching and table integration
- `public/locales/en/presentations.json` - Add translation keys (if missing)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define TypeScript types**: Use Database types for PresentationOutline
2. **Create column definitions**: Title, Audience, Type, Updated, Actions columns
3. **Create table component**: PresentationOutlinesTable with DataTable
4. **Implement empty state**: Centered message when no presentations
5. **Add Edit button**: Navigate to outline editor on click
6. **Integrate into page**: Server fetch + Suspense + component rendering
7. **Add loading skeleton**: TableSkeleton component

### Suggested Order
1. TypeScript types (foundation)
2. Column definitions (table structure)
3. Table component shell (basic DataTable)
4. Empty state handling
5. Edit button with navigation
6. Page integration with Suspense
7. Loading skeleton

## Validation Commands
```bash
# TypeScript validation
pnpm --filter web typecheck

# Lint and format
pnpm lint:fix && pnpm format:fix

# Manual testing
# 1. User with presentations: Table shows all with correct columns
# 2. Sort by each column: Verify sorting works
# 3. Click "Edit Outline": Verify navigation to editor
# 4. New user: Empty state displays
# 5. Loading: Skeleton displays briefly
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `packages/ui/src/makerkit/data-table.tsx`
- Reference: `packages/features/team-accounts/src/components/members/account-members-table.tsx`
- Database: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
