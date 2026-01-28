# Feature: Dashboard Data Loader & Types

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I1 |
| **Feature ID** | S1877.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description

Creates a server-side loader function with `Promise.all()` parallel fetching for dashboard data and TypeScript types for all dashboard data structures. This provides the data layer foundation that widgets will consume.

## User Story

**As a** Learning Lauren (active user seeking presentation skills)
**I want to** see dashboard widgets populated with my current progress, tasks, and activity
**So that** I can understand where I am in my learning journey without waiting for slow sequential data loads

## Acceptance Criteria

### Must Have

- [ ] Loader function created at `apps/web/app/home/(user)/_lib/server/user-dashboard-page.loader.ts`
- [ ] TypeScript types defined for dashboard data (course progress, assessment scores, tasks, activity, presentations)
- [ ] Loader uses `Promise.all()` for parallel data fetching
- [ ] Individual data fetching functions for each widget type (course, assessment, tasks, activity, presentations)
- [ ] Server-only import present
- [ ] Proper error handling with structured logging
- [ ] Return type exported for use in page component

### Nice to Have

- [ ] Caching strategy applied for frequently accessed data
- [ ] Pagination parameters for large data sets (presentations, activity)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | None (no UI - pure data layer) | N/A |
| **Logic** | Loader functions with parallel fetching | New |
| **Data** | TypeScript types for dashboard data | New |
| **Database** | Queries to existing tables | Existing (new queries only) |

## Architecture Decision

**Approach**: Pragmatic - Follow existing loader patterns, use parallel fetching
**Rationale**: Codebase has established loader patterns in `members-page.loader.ts` with `Promise.all()` for optimal performance (60-80% faster). TypeScript types should follow `Awaited<ReturnType<>>` pattern for inference.

### Key Architectural Choices

1. **Server-Only Loader**: Use `'server-only'` import to enforce server-side only execution
2. **Parallel Fetching**: All independent queries grouped in `Promise.all()` calls
3. **Type Inference**: Use `Awaited<ReturnType<typeof loadDashboardPageData>>` for automatic type inference
4. **Helper Functions**: Break down into focused functions (loadCourseProgress, loadAssessmentData, loadTasks, etc.)
5. **RPC Functions**: Use direct `.from()` queries for simple operations, create RPC only if complex joins needed

### Trade-offs Accepted

- Initial implementation queries all data (optimization for selective loading can come later)
- No caching on first pass (add `cache()` decorator if needed after profiling)

## Required Credentials

> Environment variables required for this feature to function. Extracted from research files.

None required - uses internal Supabase client with existing credentials.

## Dependencies

### Blocks
- S1877.I2 - Progress Widgets (requires course/assessment data types)
- S1877.I3 - Activity & Task Widgets (requires tasks/activity data types)
- S1877.I4 - Presentation Table & Polish (requires presentation data types)

### Blocked By
- S1877.I1.F1 - Dashboard Page & Grid (needs page structure to wire data)

### Parallel With
- S1877.I1.F3 - Skeleton & Empty States (can develop simultaneously after F1)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/user-dashboard-page.loader.ts` - Main loader function
- `apps/web/app/home/(user)/_lib/server/dashboard-data.types.ts` - TypeScript type definitions

### Modified Files
- None (new file additions only)

## Task Hints

> Guidance for the next decomposition phase

### Candidate Tasks

1. **Create TypeScript type definitions**: Define interfaces for CourseProgressData, AssessmentData, TasksData, ActivityData, PresentationsData, and combined DashboardPageData
2. **Create course progress loader**: Query `course_progress` and `lesson_progress` tables
3. **Create assessment data loader**: Query `survey_responses` table for category_scores
4. **Create tasks loader**: Query `tasks` and `subtasks` tables for kanban data
5. **Create activity loader**: Query `ai_request_logs` table for recent activity
6. **Create presentations loader**: Query `building_blocks_submissions` table for presentation list
7. **Combine with Promise.all()**: Group independent queries into parallel fetch calls
8. **Add error handling**: Structured logging with context for each query
9. **Export types**: Define `DashboardPageData` as `Awaited<ReturnType<>>`

### Suggested Order

1. Create type definitions first (all data structures)
2. Implement individual loader functions (one per data source)
3. Combine in main loader with Promise.all()
4. Add error handling and logging
5. Export types for use in page component

## Validation Commands

```bash
# Typecheck
pnpm typecheck

# Verify loader compiles
pnpm --filter web build

# Manual test: verify types are exported correctly
# grep -r "DashboardPageData" apps/web/app/home/\(user)/
```

## Related Files

- Initiative: `../initiative.md`
- Spec: `../../spec.md`
- Tasks: `./S1877.I1.F2.T*-<slug>.md` (created in next phase)
