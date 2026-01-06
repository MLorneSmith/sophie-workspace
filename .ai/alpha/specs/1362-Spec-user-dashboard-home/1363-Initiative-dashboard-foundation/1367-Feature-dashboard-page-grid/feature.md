# Feature: Dashboard Page & Grid Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1363 |
| **Feature ID** | 1363-F1 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 1 |

## Description
Build the foundational dashboard page at `/home` with a responsive 3-3-1 bento grid layout. Includes the data loader infrastructure with parallel fetching via `Promise.all()`, skeleton loading states for each card slot, and page header with navigation. This is the foundation that all other dashboard features render into.

## User Story
**As a** SlideHeroes user
**I want to** see my personal dashboard when I visit `/home`
**So that** I have a central place to access my presentations, progress, and quick actions

## Acceptance Criteria

### Must Have
- [ ] Dashboard page renders at `/home` route
- [ ] Page header displays with "Dashboard" title and breadcrumbs
- [ ] Responsive 3-3-1 bento grid layout (3 cols desktop, 2 tablet, 1 mobile)
- [ ] Data loader fetches all dashboard data in parallel via `Promise.all()`
- [ ] Skeleton loading states render during data fetch
- [ ] TypeScript types defined for all dashboard data structures
- [ ] Page passes `pnpm typecheck` with no errors

### Nice to Have
- [ ] Grid gap and card sizes match design system (16px gap, 24px on md+)
- [ ] Suspense boundaries for granular streaming of card content

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Dashboard page, Grid layout, Skeletons | New |
| **Logic** | Dashboard data loader with parallel fetching | New |
| **Data** | Supabase queries for submissions, progress, surveys | Existing tables |
| **Database** | building_blocks_submissions, course_progress, survey_responses | Existing |

## Architecture Decision

**Approach**: Pragmatic - Use existing patterns from codebase
**Rationale**: All patterns exist in the codebase (team dashboard, billing page loaders). Reusing proven patterns ensures consistency and reduces risk.

### Key Architectural Choices
1. Server Component with async data loading (no client-side fetching)
2. Single loader function with `cache()` wrapper for deduplication
3. Tailwind CSS Grid for responsive layout (no JS layout library)

### Trade-offs Accepted
- Tighter coupling to current page structure (acceptable for dashboard foundation)
- All data fetched upfront vs. streaming per card (simpler, good for small dataset)

## Dependencies

### Blocks
- 1363-F2: Presentation Outline Table (needs grid slot to render into)
- 1363-F3: Quick Actions Panel (needs grid slot to render into)
- 1363-F4: Empty State System (needs grid slot to render into)

### Blocked By
- None (this is the foundation feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/page.tsx` - Dashboard page (replace current minimal page)
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Data loader
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - TypeScript types
- `apps/web/app/home/(user)/_components/dashboard-skeleton.tsx` - Loading skeletons
- `apps/web/app/home/(user)/loading.tsx` - Route loading state

### Modified Files
- `apps/web/public/locales/en/common.json` - Add dashboard translations
- `apps/web/config/paths.config.ts` - Verify /home path exists

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create dashboard page structure**: Setup page.tsx with HomeLayoutPageHeader and PageBody
2. **Implement data loader**: Create loader.ts with parallel fetching pattern
3. **Define TypeScript types**: Create types for DashboardData, Presentation, etc.
4. **Build responsive grid layout**: Implement 3-3-1 Tailwind grid with breakpoints
5. **Create skeleton components**: Build loading placeholders for each card slot
6. **Add route loading.tsx**: Page-level loading state
7. **Write unit tests for loader**: Test parallel fetching and error handling
8. **Add translations**: Dashboard-related i18n keys

### Suggested Order
1 → 3 → 2 → 4 → 5 → 6 → 7 → 8

## Validation Commands
```bash
# Verify page loads at /home
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/home

# Check TypeScript types
pnpm typecheck

# Run unit tests for loader
pnpm --filter web test:unit -- dashboard-page.loader

# Check responsive layout (manual)
# Visit http://localhost:3000/home in Chrome DevTools mobile view
```

## Related Files
- Initiative: `../initiative.md`
- Existing loader pattern: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- Team dashboard reference: `apps/web/app/home/[account]/page.tsx`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
