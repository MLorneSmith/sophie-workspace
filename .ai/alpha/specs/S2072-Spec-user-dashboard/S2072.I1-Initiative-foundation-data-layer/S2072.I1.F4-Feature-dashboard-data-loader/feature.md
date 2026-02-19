# Feature: Dashboard Data Loader

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I1 |
| **Feature ID** | S2072.I1.F4 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 4 |

## Description

Create a parallel data loader function that aggregates data from all 6+ data sources needed for the dashboard widgets. The loader uses Promise.all for optimal performance and returns typed data matching the DashboardData interface from F1.

## User Story

**As a** developer
**I want to** have a single loader function that fetches all dashboard data in parallel
**So that** the dashboard loads efficiently and widget implementations have data ready to use

## Acceptance Criteria

### Must Have
- [ ] Loader function created in `_lib/server/dashboard-page.loader.ts`
- [ ] Loader wrapped with React.cache() for per-request deduplication
- [ ] Parallel fetching from all data sources using Promise.all:
  - course_progress table
  - lesson_progress table
  - quiz_attempts table
  - survey_responses table (for assessment scores)
  - tasks table
  - building_blocks_submissions table (for presentations)
- [ ] Return type matches DashboardData from F1
- [ ] Proper error handling with fallback empty states
- [ ] Loader integrated into page.tsx with data passed to grid

### Nice to Have
- [ ] Unit tests for loader function
- [ ] Performance logging for fetch times

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | None | N/A |
| **Logic** | loadDashboardPageData function | New |
| **Data** | Supabase queries | New |
| **Database** | 6 tables queried | Existing |

## Architecture Decision

**Approach**: Service-Loader Pattern with Parallel Fetching
**Rationale**: Follow existing patterns in the codebase (admin-dashboard.loader.ts, members-page.loader.ts). Use Promise.all for parallel fetching to minimize load time. Return fallback empty data on errors.

### Key Architectural Choices

1. **Single loader function**: `loadDashboardPageData()` aggregates all data
2. **Helper functions**: Separate helper for each data source for testability
3. **React.cache()**: Wrap loader for per-request deduplication
4. **Error handling**: Try-catch per data source, return empty data on failure
5. **server-only**: Add import to prevent client-side usage

### Trade-offs Accepted

- Loader returns potentially partial data if some queries fail - widgets must handle null/empty
- No caching beyond React.cache - acceptable as dashboard data is user-specific

## Data Sources

| Source | Table | Fields Needed |
|--------|-------|---------------|
| Course Progress | course_progress | completion_percentage, current_lesson_id |
| Lesson Progress | lesson_progress | count of completed lessons |
| Quiz Attempts | quiz_attempts | latest score, pass status |
| Assessment Scores | survey_responses | category_scores JSONB |
| Tasks | tasks | status, title (for "doing" tasks) |
| Presentations | building_blocks_submissions | id, title, created_at, status |

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|

> None required - uses Supabase with RLS (existing auth context)

## Dependencies

### Blocks
- S2072.I2.F1 (Course Progress Radial) - needs course/lesson progress data
- S2072.I2.F2 (Skills Spider Diagram) - needs assessment scores
- S2072.I3.F1 (Activity Feed) - needs activity aggregation
- S2072.I3.F2 (Quick Actions) - needs context for action determination
- S2072.I3.F3 (Kanban Summary) - needs task data
- S2072.I4.F1 (Coaching Sessions) - needs coaching data (future)
- S2072.I5.F1 (Presentations Table) - needs presentation data

### Blocked By
- S2072.I1.F1 (Dashboard Types) - needs DashboardData type

### Parallel With
- S2072.I1.F2 (Dashboard Page Shell) - can develop in parallel

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Main loader function
- `apps/web/app/home/(user)/_lib/server/load-course-progress.ts` - Course progress helper
- `apps/web/app/home/(user)/_lib/server/load-tasks-summary.ts` - Tasks helper
- `apps/web/app/home/(user)/_lib/server/load-presentations.ts` - Presentations helper

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Call loader and pass data to grid

## Task Hints

### Candidate Tasks
1. **Create loader file**: Create `dashboard-page.loader.ts` with cache wrapper
2. **Add server-only import**: Ensure loader only runs server-side
3. **Implement loadCourseProgress**: Fetch from course_progress and lesson_progress
4. **Implement loadSkillsData**: Fetch category_scores from survey_responses
5. **Implement loadKanbanSummary**: Fetch "doing" tasks from tasks table
6. **Implement loadPresentations**: Fetch from building_blocks_submissions
7. **Create main loader**: Aggregate all helpers with Promise.all
8. **Add error handling**: Wrap each helper in try-catch with fallbacks
9. **Integrate with page**: Call loader in page.tsx and pass to DashboardGrid
10. **Type verification**: Ensure return type matches DashboardData

### Suggested Order
1. Create loader file structure
2. Implement individual data loading helpers
3. Create main loader with Promise.all aggregation
4. Add error handling
5. Integrate with page.tsx
6. Verify data flows correctly

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Verify loader returns expected structure
pnpm --filter web test -- --grep "dashboard" --run

# Manual verification
pnpm dev
# Check server console for query logs
# Verify data available in React DevTools
```

## Related Files
- Initiative: `../initiative.md`
- Types: `../S2072.I1.F1-Feature-dashboard-types/feature.md`
- Reference: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- Reference: `packages/features/admin/src/lib/server/loaders/admin-dashboard.loader.ts`
- Database Types: `apps/web/lib/database.types.ts`
