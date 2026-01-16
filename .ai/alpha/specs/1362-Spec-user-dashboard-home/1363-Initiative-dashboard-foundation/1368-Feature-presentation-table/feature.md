# Feature: Presentation Outline Table

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1363 |
| **Feature ID** | 1363-F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Display a table of the user's recent presentations (building_blocks_submissions) on the dashboard. Shows title, status, slide count, and last updated date. Each row links to the presentation detail/edit page. Includes empty state handling when user has no presentations.

## User Story
**As a** SlideHeroes user
**I want to** see my recent presentations in a table on my dashboard
**So that** I can quickly access and continue working on my presentation outlines

## Acceptance Criteria

### Must Have
- [ ] Table displays up to 10 most recent presentations
- [ ] Columns show: Title, Status badge, Slides count, Last Updated (relative time)
- [ ] Clicking a row navigates to `/home/ai/canvas/[id]`
- [ ] Empty state displays when user has no presentations
- [ ] Empty state includes CTA to create first presentation
- [ ] Table is responsive (horizontal scroll on mobile)
- [ ] Passes `pnpm typecheck` with no errors

### Nice to Have
- [ ] Thumbnail preview column (if available)
- [ ] Sort by column header click
- [ ] Pagination for users with many presentations

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | PresentationOutlineTable component | New |
| **Logic** | Date formatting, status badge mapping | New |
| **Data** | building_blocks_submissions query | Existing |
| **Database** | building_blocks_submissions table | Existing |

## Architecture Decision

**Approach**: Pragmatic - Use @kit/ui/table components with custom cells
**Rationale**: Existing table components from shadcn provide accessibility and styling. Adding custom cells for status badges and links keeps complexity low.

### Key Architectural Choices
1. Use basic @kit/ui/table (not enhanced DataTable) - no sorting/pagination needed initially
2. Client component for click interactions
3. Empty state uses shared DashboardEmptyState component

### Trade-offs Accepted
- No client-side sorting/filtering (acceptable for 10 items)
- Full table re-render on data change (acceptable for dashboard refresh frequency)

## Dependencies

### Blocks
- None

### Blocked By
- 1363-F1: Dashboard Page & Grid (needs grid slot to render into)
- 1363-F4: Empty State System (uses shared empty state component) - soft dependency

### Parallel With
- 1363-F3: Quick Actions Panel (both render in grid, no data dependencies)
- 1363-F4: Empty State System (can develop in parallel, integrate later)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/presentation-outline-table.tsx` - Table component
- `apps/web/app/home/(user)/_components/__tests__/presentation-outline-table.test.tsx` - Component tests

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Render table in grid slot
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Add presentations query
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - Add Presentation type

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create table component structure**: Setup with @kit/ui/table, define columns
2. **Implement row click navigation**: Link to presentation detail page
3. **Add status badge rendering**: Map status to badge variant/color
4. **Implement date formatting**: Relative time with date-fns
5. **Add empty state handling**: Conditional render with DashboardEmptyState
6. **Wire to dashboard loader**: Add presentations query to loader
7. **Write component tests**: Test rendering, empty state, navigation

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6 → 7

## Validation Commands
```bash
# Check TypeScript types
pnpm typecheck

# Run component tests
pnpm --filter web test:unit -- presentation-outline-table

# Visual check (manual)
# Visit http://localhost:3000/home and verify table renders

# Test empty state (manual)
# Temporarily clear building_blocks_submissions for user
```

## Related Files
- Initiative: `../initiative.md`
- Table component: `packages/ui/src/shadcn/table.tsx`
- Badge component: `packages/ui/src/shadcn/badge.tsx`
- Existing queries: `apps/web/app/home/(user)/ai/_lib/queries/building-blocks-titles.ts`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
