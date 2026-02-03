# Feature: Dashboard Loader

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I2 |
| **Feature ID** | S1918.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Create the main dashboard data loader with parallel fetching using `Promise.all()`. This loader orchestrates fetching course progress, survey scores, tasks summary, and presentations data in parallel. The loader follows existing patterns using React's `cache()` wrapper for request-level deduplication and exports typed return values.

## User Story
**As a** user visiting my dashboard
**I want to** see all my data load quickly
**So that** I can immediately understand my progress and next actions without waiting

## Acceptance Criteria

### Must Have
- [ ] Main `loadDashboardPageData()` function with `cache()` wrapper
- [ ] Parallel fetching of 4+ data sources using `Promise.all()`
- [ ] `loadCourseProgress()` - fetches completion percentage and lesson counts
- [ ] `loadSurveyScores()` - fetches category_scores from latest survey response
- [ ] `loadTasksSummary()` - fetches task counts by status and next "do" task
- [ ] `loadPresentations()` - fetches user's building_blocks_submissions
- [ ] All functions use typed Supabase client with RLS protection
- [ ] Exported `DashboardPageData` type via `Awaited<ReturnType<...>>`
- [ ] Page load time < 1.5s LCP (parallel fetch optimization)

### Nice to Have
- [ ] Error handling that returns partial data on individual fetch failures
- [ ] Query result caching hints for Supabase

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (consumed by page) | N/A |
| **Logic** | Loader functions | New |
| **Data** | Supabase queries | New |
| **Database** | RLS-protected tables | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow established loader patterns from `members-page.loader.ts` and `team-account-workspace.loader.ts`. Use simple `Promise.all()` without error recovery complexity - if one query fails, the whole load fails (simpler UX with error boundary).

### Key Architectural Choices
1. Single loader file with internal helper functions
2. `cache()` wrapper for per-request deduplication
3. No individual error handling (let Promise.all reject)
4. Type inference via `Awaited<ReturnType<...>>`

### Trade-offs Accepted
- All-or-nothing loading (partial failures not handled gracefully)
- No query-level caching (relies on Supabase connection pooling)

## Required Credentials
> Environment variables required for this feature to function.

None required - uses existing Supabase authentication.

## Dependencies

### Blocks
- S1918.I3.F1: Course Progress Widget (needs loadCourseProgress data)
- S1918.I3.F2: Assessment Spider Widget (needs loadSurveyScores data)
- S1918.I4.F1: Kanban Summary Widget (needs loadTasksSummary data)
- S1918.I5.F2: Presentations Table Widget (needs loadPresentations data)
- S1918.I6: Polish (needs loader for error states)

### Blocked By
- F1: Dashboard Types (needs type definitions for function signatures)

### Parallel With
- F3: Activity Aggregation (can be developed independently, integrated later)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Main loader with all query functions

### Modified Files
- None (dashboard page integration is in I1)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create loader file skeleton**: Set up file with imports, cache wrapper, and main function signature
2. **Implement loadCourseProgress**: Query course_progress and lesson_progress tables
3. **Implement loadSurveyScores**: Query latest survey_responses with category_scores
4. **Implement loadTasksSummary**: Query tasks with status counts and next task
5. **Implement loadPresentations**: Query building_blocks_submissions with sorting
6. **Wire up Promise.all**: Combine all loaders into main function
7. **Export types**: Add DashboardPageData type export
8. **Add validation**: Verify type safety and add unit tests

### Suggested Order
1. File skeleton with types import
2. Individual query functions (can be parallel tasks)
3. Main loader function combining queries
4. Type exports and documentation

## Validation Commands
```bash
# Verify loader file exists
test -f apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts && echo "✓ Loader exists"

# Type check passes
pnpm typecheck

# Verify main loader is exported
grep -q "export const loadDashboardPageData" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts && echo "✓ Loader exported"

# Verify Promise.all pattern used
grep -q "Promise.all" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts && echo "✓ Parallel fetching"
```

## Related Files
- Initiative: `../initiative.md`
- Types: `../_lib/types/dashboard.types.ts` (from F1)
- Pattern: `apps/web/app/home/[account]/members/_lib/server/members-page.loader.ts`
- Pattern: `apps/web/app/home/[account]/_lib/server/team-account-workspace.loader.ts`
- Reference: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts` - Task query patterns
