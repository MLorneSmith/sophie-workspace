# Feature: Activity Data Aggregation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I3 |
| **Feature ID** | S1823.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
A server-side data aggregation service that unions activity data from multiple tables (lesson_progress, quiz_attempts, building_blocks_submissions, survey_responses) into a single chronological feed. This service provides the data foundation for the Activity Feed Widget and calculates user state for the Quick Actions Panel.

## User Story
**As a** learner using SlideHeroes
**I want to** see all my recent activities in one unified feed
**So that** I can track my progress across courses, quizzes, and presentations

## Acceptance Criteria

### Must Have
- [ ] Union data from 4 tables: lesson_progress, quiz_attempts, building_blocks_submissions, survey_responses
- [ ] Return activities sorted by timestamp (most recent first)
- [ ] Limit results to 10 most recent activities
- [ ] Transform each table's data into common `ActivityItem` type
- [ ] Include activity type, title/description, and timestamp for each item
- [ ] Calculate `userState` booleans for Quick Actions Panel

### Nice to Have
- [ ] Include metadata like quiz score or lesson title where available
- [ ] Optimize query performance with appropriate indexes

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (service layer) | N/A |
| **Logic** | `loadRecentActivities()` function | New |
| **Data** | Union query across 4 tables | New |
| **Database** | Existing activity tables | Existing |

## Architecture Decision

**Approach**: Server-Side Union Query with Type Transformation
**Rationale**: Aggregating data server-side with a single query is more performant than multiple client-side queries. The union query executes in PostgreSQL, taking advantage of RLS policies on each source table.

### Key Architectural Choices
1. Use Supabase RPC or raw SQL for union query (not supported in query builder)
2. Transform results into typed `ActivityItem[]` array
3. Integrate with existing dashboard loader using `Promise.all()`

### Trade-offs Accepted
- Union query requires RPC function or raw SQL (slightly more complex than standard queries)
- Limited metadata to keep query fast (no JOINs for lesson/quiz titles in v1)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| N/A | N/A | N/A | This is a data service, not a UI component |

**Components to Install**: None

## Required Credentials
None required - uses internal database queries only.

## Dependencies

### Blocks
- F3 (Activity Feed Widget consumes this data)
- F4 (Quick Actions Panel uses userState from this service)

### Blocked By
- F1 (Establishes loader patterns and dashboard types)
- S1823.I1.F1 (Dashboard infrastructure)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/load-dashboard-data.ts` - Add `loadRecentActivities()` and `loadUserState()` functions
- `apps/web/supabase/schemas/99-functions.sql` - RPC function for activity union (if needed)
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - Add `ActivityItem` and `UserState` types

### Modified Files
- `apps/web/app/home/(user)/_lib/server/load-dashboard-data.ts` - Extend with activity aggregation

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define activity types**: Create `ActivityItem` and `UserState` TypeScript interfaces
2. **Implement union query**: Create RPC function or Supabase query for activity aggregation
3. **Create loadRecentActivities**: Server function to fetch and transform activities
4. **Create loadUserState**: Function to calculate boolean flags for quick actions
5. **Integrate with loader**: Add to `loadDashboardData()` with Promise.all
6. **Add unit tests**: Test aggregation and transformation logic

### Suggested Order
Types → Union Query/RPC → loadRecentActivities → loadUserState → Integration → Tests

## Validation Commands
```bash
# Type check
pnpm typecheck

# Test union query in Supabase Studio
# SELECT * FROM get_recent_activities();

# Unit tests
pnpm --filter web test:unit -- --grep "activity-aggregation"

# Verify data returns correctly
pnpm dev
# Check console logs from loader
```

## Related Files
- Initiative: `../initiative.md`
- Lesson progress migration: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Quiz attempts migration: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Submissions migration: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- Tasks: `./tasks.json` (created in next phase)
