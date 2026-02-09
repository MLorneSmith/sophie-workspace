# Feature: Dashboard Data Loader

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I1 |
| **Feature ID** | S2045.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Create the server-side dashboard data loader that fetches all 7 widget datasets in parallel via `Promise.all()`. Integrate the loader into the dashboard page component and pass data to placeholder widget slots. Define TypeScript interfaces for all loader return types.

## User Story
**As a** SlideHeroes user
**I want** the dashboard to load all my data quickly in parallel
**So that** I see a fully populated dashboard in under 2 seconds

## Acceptance Criteria

### Must Have
- [ ] Loader function at `_lib/server/dashboard-page.loader.ts` with `'server-only'` directive
- [ ] Loader wrapped in React `cache()` for per-request memoization
- [ ] 7 parallel queries via `Promise.all()`:
  1. Course progress (`course_progress` table)
  2. Survey scores (`survey_responses` table — latest completed)
  3. Kanban tasks (`tasks` table — `status = 'doing'` limit 3, `status = 'do'` limit 1)
  4. Recent activity (`activity_events` table — latest 10, ordered by `created_at DESC`)
  5. Quick action flags (existence checks on `course_progress`, `survey_responses`, `building_blocks_submissions`)
  6. Coaching data (static Cal.com embed config — no DB query needed)
  7. Presentation outlines (`building_blocks_submissions` table — all, ordered by `updated_at DESC`)
- [ ] TypeScript interfaces defined for each widget's data shape in a `_lib/types/dashboard.types.ts` file
- [ ] Loader integrated into `page.tsx` — data passed as props to placeholder card components
- [ ] Graceful error handling: individual query failures don't crash the entire dashboard (use `Promise.allSettled()` or try/catch per query)
- [ ] All queries use standard Supabase server client (RLS-protected, no admin client)

### Nice to Have
- [ ] Exported `DashboardData` type for downstream widget components
- [ ] Performance logging with `getLogger` for query timing

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Updated page.tsx to consume loader data | Modified |
| **Logic** | Dashboard loader, TypeScript types | New |
| **Data** | 7 parallel Supabase queries | New |
| **Database** | N/A (queries only, no schema changes) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow the exact loader pattern from `personal-account-billing-page.loader.ts`: `server-only` + `cache()` + `Promise.all()`. Use `Promise.allSettled()` for resilience — one failing query shouldn't break the whole dashboard. Return null for failed queries and let widgets handle missing data gracefully.

### Key Architectural Choices
1. Use `Promise.allSettled()` instead of `Promise.all()` so a single query failure doesn't crash the page
2. Define separate TypeScript types per widget (e.g., `CourseProgressData`, `KanbanSummaryData`) to maintain clear boundaries for I2/I3 widget components
3. Coaching "data" is just a config object (Cal.com embed URL) — no DB query needed, but included in the type for completeness

### Trade-offs Accepted
- `Promise.allSettled()` adds complexity extracting results vs plain `Promise.all()`, but prevents cascading failures
- Quick action flags require 3 existence checks (could be optimized to a single RPC function later, but premature for v1)

## Required Credentials
> None required. All data comes from Supabase via RLS-protected queries. Cal.com embed URL uses existing `NEXT_PUBLIC_CALCOM_COACH_USERNAME` and `NEXT_PUBLIC_CALCOM_EVENT_SLUG` env vars (already configured).

## Dependencies

### Blocks
- S2045.I2: Visualization widgets need the loader data types and integration
- S2045.I3: Interactive widgets need the loader data types and integration

### Blocked By
- F1: Dashboard Page Shell (need the page component to integrate loader)
- F2: Activity Events Database (need `activity_events` table and types for query #4)

### Parallel With
- None (depends on both F1 and F2)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Main dashboard loader
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - TypeScript interfaces for widget data

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Integrate loader, pass data to grid slots

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define dashboard TypeScript types**: Create `dashboard.types.ts` with interfaces for all 7 widget data shapes
2. **Create dashboard loader skeleton**: Set up `dashboard-page.loader.ts` with `server-only`, `cache()`, and `Promise.allSettled()` structure
3. **Implement individual query functions**: Write 6 Supabase query functions (course progress, survey scores, kanban tasks, activity events, quick action flags, presentations)
4. **Integrate loader into page**: Update `page.tsx` to call loader and pass data to placeholder cards
5. **Add error handling and logging**: Handle `Promise.allSettled()` rejected results, add performance logging

### Suggested Order
T1 (types) → T2 (loader skeleton) → T3 (query functions) → T4 (page integration) → T5 (error handling + validation)

## Validation Commands
```bash
# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Verify loader exists with server-only
grep -c "server-only" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts

# Verify Promise.allSettled usage
grep -c "allSettled" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts

# Verify cache wrapper
grep -c "cache(" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Loader pattern: `apps/web/app/home/(user)/billing/_lib/server/personal-account-billing-page.loader.ts`
- Workspace loader: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- Activity events types: `apps/web/lib/database.types.ts` (after F2 typegen)
- Page component: `apps/web/app/home/(user)/page.tsx`
