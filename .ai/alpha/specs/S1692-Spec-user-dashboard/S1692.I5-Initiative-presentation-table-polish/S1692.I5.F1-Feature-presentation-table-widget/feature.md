# Feature: Presentation Table Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I5 |
| **Feature ID** | S1692.I5.F1 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 1 |

## Description
Implement the Presentation Outline Table widget for the user dashboard, including the data loader, DataTable component, empty state, and navigation. This widget displays the user's building blocks submissions in a sortable table with quick access to edit and view actions.

## User Story
**As a** SlideHeroes user
**I want to** see my presentations in a table on my dashboard
**So that** I can quickly access and manage my created content

## Acceptance Criteria

### Must Have
- [ ] Data loader fetches presentations from `building_blocks_submissions` table
- [ ] Table displays columns: Title, Type, Updated, Actions (Edit/View)
- [ ] Table sorted by `updated_at` descending by default
- [ ] Row click navigates to presentation editor (`/home/ai/canvas?id=<id>`)
- [ ] Empty state shown when user has no presentations
- [ ] Empty state includes "Create Presentation" CTA button
- [ ] Loading skeleton shown while data fetches

### Nice to Have
- [ ] Client-side sorting on all columns
- [ ] Relative time formatting for Updated column (e.g., "2 days ago")
- [ ] Presentation type badges with colors

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `PresentationsTable` component with DataTable | New |
| **UI** | `PresentationsEmptyState` component | New |
| **Logic** | `loadUserDashboardData` loader function | New |
| **Logic** | Column definitions with formatters | New |
| **Data** | Query `building_blocks_submissions` table | Existing |
| **Database** | RLS policies for user ownership | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Leverage existing DataTable and EmptyState components from `@kit/ui`. Server-side data loading with React `cache()` for request memoization. Client-side sorting is sufficient for expected data volume (<100 presentations per user).

### Key Architectural Choices
1. Use `@kit/ui/data-table` for table implementation (built-in sorting, pagination)
2. Server Component fetches data, passes to Client Component for interactivity
3. No client-side state management - data flows from server to render

### Trade-offs Accepted
- Client-side sorting limits to ~100 rows efficiently (acceptable for MVP)
- No server-side filtering initially (out of scope per initiative)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Data table | DataTable | @kit/ui/data-table | Existing pattern, TanStack Table |
| Empty state | EmptyState | @kit/ui/empty-state | Consistent UX |
| Action buttons | Button | @kit/ui/button | Standard component |
| Type badge | Badge | @kit/ui/badge | Visual categorization |
| Loading | Skeleton | @kit/ui/skeleton | Consistent loading pattern |

**Components to Install**: None - all components already available

## Dependencies

### Blocks
- F2: Empty States Polish (provides table empty state to audit)
- F3: Accessibility Compliance (provides table to test)
- F4: E2E Dashboard Tests (provides table to test)

### Blocked By
- None (root feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/load-user-dashboard.ts` - Data loader with cache wrapper
- `apps/web/app/home/(user)/_components/presentations-table.tsx` - Client component with DataTable
- `apps/web/app/home/(user)/_components/presentations-empty-state.tsx` - Empty state component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import loader, render table widget, add Suspense boundary

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create TypeScript types**: Define `DashboardPresentation` interface
2. **Create data loader**: Implement `loadUserDashboardData` with cache wrapper and Supabase query
3. **Create table column definitions**: Define ColumnDef array with Title, Type, Updated, Actions
4. **Create PresentationsTable component**: Client component wrapping DataTable
5. **Create PresentationsEmptyState component**: Empty state with CTA
6. **Integrate into dashboard page**: Import loader, add Suspense, render table
7. **Add loading skeleton**: Create loading state while data fetches
8. **Add row click navigation**: Handle click to navigate to editor

### Suggested Order
1. Types → 2. Loader → 3. Empty State → 4. Columns → 5. Table → 6. Integration → 7. Loading → 8. Navigation

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Unit tests
pnpm --filter web test:unit

# Manual verification
# 1. Navigate to /home as authenticated user
# 2. Verify table renders with user's presentations
# 3. Verify empty state shows for new user
# 4. Click row and verify navigation to editor
```

## Related Files
- Initiative: `../initiative.md`
- DataTable: `packages/ui/src/makerkit/data-table.tsx`
- EmptyState: `packages/ui/src/makerkit/empty-state.tsx`
- Building blocks schema: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- Similar loader: `apps/web/app/home/(user)/billing/_lib/server/personal-account-billing-page.loader.ts`
