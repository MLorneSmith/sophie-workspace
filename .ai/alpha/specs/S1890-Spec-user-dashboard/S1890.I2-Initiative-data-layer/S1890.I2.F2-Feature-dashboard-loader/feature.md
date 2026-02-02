# Feature: Dashboard Data Loader

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I2 |
| **Feature ID** | S1890.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Create a consolidated server-side data loader that fetches all dashboard data in parallel using `Promise.all()`. The loader queries 6 Supabase tables (course_progress, lesson_progress, quiz_attempts, survey_responses, tasks, building_blocks_submissions) and returns structured data matching the dashboard types. Uses React `cache()` for per-request memoization and includes the 'server-only' directive for tree-shaking.

## User Story
**As a** user viewing my dashboard
**I want to** see all my progress data load quickly
**So that** I can immediately understand my learning status without waiting for multiple separate loads

## Acceptance Criteria

### Must Have
- [ ] Create `user-dashboard.loader.ts` in `_lib/server/` directory
- [ ] Add `import 'server-only'` directive at top of file
- [ ] Implement `loadUserDashboardData()` function wrapped with React `cache()`
- [ ] Fetch from 6 tables in parallel using `Promise.all()`
- [ ] Return data typed as `UserDashboardData` (from F1)
- [ ] Handle null/empty data gracefully (return empty arrays/null, not errors)
- [ ] Query tasks with nested subtasks in single query
- [ ] Filter data by authenticated user's ID
- [ ] Pass all typecheck validations

### Nice to Have
- [ ] Add service logger for debugging
- [ ] Include query timing metrics for performance monitoring

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A - Data layer only | N/A |
| **Logic** | Loader function with caching | New |
| **Data** | Supabase queries | New |
| **Database** | 6 tables (existing) | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow established loader patterns from `personal-account-billing-page.loader.ts` and `load-user-workspace.ts`. Use `Promise.all()` for 60-80% faster data fetching compared to sequential queries. Wrap with React `cache()` for request deduplication.

### Key Architectural Choices
1. Single consolidated loader rather than separate loaders per widget
2. Use `getSupabaseServerClient()` for automatic RLS enforcement
3. Return structured object with all data, let widgets destructure what they need
4. Graceful error handling - return null/empty for missing data

### Trade-offs Accepted
- Single loader means all data loads even if some widgets are hidden
- Future optimization: Lazy loading for below-fold widgets (out of scope for v1)

## Required Credentials
None required - uses existing Supabase server client with RLS.

## Dependencies

### Blocks
- S1890.I3: Progress Widgets (needs course/lesson/survey data)
- S1890.I4: Task & Activity Widgets (needs tasks data)
- S1890.I5: Action Widgets (needs state data for contextual CTAs)
- S1890.I7: Empty States & Polish (needs data availability flags)

### Blocked By
- F1: Dashboard Types (needs types for return type annotation)

### Parallel With
- F3: Activity Aggregation (can develop concurrently once F1 complete)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/user-dashboard.loader.ts` - Main loader function

### Modified Files
- None (page integration handled in S1890.I1)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create server lib directory**: Set up `_lib/server/` if not exists
2. **Scaffold loader file**: Create file with server-only directive and imports
3. **Implement course progress query**: Fetch from `course_progress` table
4. **Implement lesson progress query**: Fetch from `lesson_progress` table
5. **Implement quiz attempts query**: Fetch from `quiz_attempts` table
6. **Implement survey responses query**: Fetch from `survey_responses` table
7. **Implement tasks query**: Fetch from `tasks` with nested `subtasks`
8. **Implement presentations query**: Fetch from `building_blocks_submissions`
9. **Assemble parallel fetch**: Combine with Promise.all()
10. **Add cache wrapper**: Wrap with React cache() and export
11. **Add type annotation**: Ensure return type matches UserDashboardData

### Suggested Order
T1 → T2 → T3-T8 (parallel possible) → T9 → T10 → T11

## Validation Commands
```bash
# Verify loader exists
test -f apps/web/app/home/\(user\)/_lib/server/user-dashboard.loader.ts && echo "✓ Loader exists"

# Check for server-only directive
grep -q "import 'server-only'" apps/web/app/home/\(user\)/_lib/server/user-dashboard.loader.ts && echo "✓ Server-only"

# Check for Promise.all pattern
grep -q "Promise.all" apps/web/app/home/\(user\)/_lib/server/user-dashboard.loader.ts && echo "✓ Parallel fetching"

# Check for cache wrapper
grep -q "cache(" apps/web/app/home/\(user\)/_lib/server/user-dashboard.loader.ts && echo "✓ Cache wrapper"

# Run typecheck
pnpm typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Types: `../_lib/types/user-dashboard.types.ts`
- Pattern reference: `apps/web/app/home/(user)/billing/_lib/server/personal-account-billing-page.loader.ts`
- Pattern reference: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- Database types: `apps/web/lib/database.types.ts`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
