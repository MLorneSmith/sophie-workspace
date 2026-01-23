# Feature: Activity Data Aggregation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I3 |
| **Feature ID** | S1692.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 2-3 |
| **Priority** | 2 |

## Description
Create a unified activity data layer that aggregates user activities from multiple sources (lessons, quizzes, courses, presentations, assessments) into a single queryable view. This foundation enables the Activity Feed widget and future activity-related features.

## User Story
**As a** developer
**I want** a unified activity data source
**So that** I can efficiently display user activities without complex multi-table joins in application code

## Acceptance Criteria

### Must Have
- [ ] Database view combining 5 activity sources with RLS
- [ ] TypeScript loader function with proper types
- [ ] Activities sorted by timestamp (newest first)
- [ ] Pagination support (limit parameter)
- [ ] Type-safe metadata for each activity type

### Nice to Have
- [ ] Index optimization for timestamp queries
- [ ] Activity type filtering support

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (data layer) | N/A |
| **Logic** | `user-activity.loader.ts` | New |
| **Data** | `user_activities` view | New |
| **Database** | View + migration | New |

## Architecture Decision

**Approach**: Database View with Server Loader
**Rationale**: A database view provides optimal performance (single query vs 5 joins), automatic RLS enforcement via source tables, and clean separation of concerns. The loader function provides type safety and caching.

### Key Architectural Choices
1. Use UNION ALL view for activity sources - single query, indexed
2. `security_invoker = true` to inherit RLS from source tables
3. JSONB metadata field for activity-specific data
4. Server-only loader with `cache()` wrapper for per-request memoization

### Trade-offs Accepted
- Migration required for view creation
- View depends on source table schemas (tight coupling)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| N/A | N/A | N/A | Data layer only - no UI components |

## Dependencies

### Blocks
- F3: Activity Feed Widget (requires this aggregation)

### Blocked By
- None (uses existing tables)

### Parallel With
- F1: Kanban Summary Widget
- F4: Quick Actions Panel

## Files to Create/Modify

### New Files
- `apps/web/supabase/schemas/18-user-activity-view.sql` - Database view schema
- `apps/web/app/home/(user)/_lib/server/user-activity.loader.ts` - TypeScript loader

### Modified Files
- None (migration auto-generated)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create database view schema**: UNION ALL combining 5 activity sources
2. **Generate and apply migration**: supabase:db:diff, migration up
3. **Create loader function**: TypeScript with proper types
4. **Generate TypeScript types**: supabase:typegen
5. **Test RLS enforcement**: Verify user can only see own activities
6. **Test with sample data**: Insert test activities and query

### Suggested Order
1. Create schema file with view definition
2. Generate migration
3. Apply migration to local Supabase
4. Generate types
5. Create loader function
6. Test with real user data

## Database Schema

```sql
-- Activity sources to combine:
-- 1. lesson_progress (completed_at) -> lesson_completed
-- 2. quiz_attempts (completed_at) -> quiz_completed
-- 3. course_progress (completed_at) -> course_completed
-- 4. building_blocks_submissions (created_at) -> storyboard_submitted
-- 5. survey_responses (created_at, completed=true) -> survey_completed

CREATE VIEW user_activities AS
SELECT
  'lesson_completed' as activity_type,
  user_id,
  lesson_id as entity_id,
  completed_at as timestamp,
  jsonb_build_object('completion_percentage', completion_percentage) as metadata
FROM lesson_progress
WHERE completed_at IS NOT NULL

UNION ALL
-- ... additional sources ...

ORDER BY timestamp DESC;
```

## Validation Commands
```bash
# Generate migration
pnpm --filter web supabase:db:diff -f user_activity_view

# Apply migration
pnpm --filter web supabase migration up

# Generate types
pnpm supabase:web:typegen

# Type check
pnpm typecheck

# Test query (via Supabase Studio or psql)
# SELECT * FROM user_activities WHERE user_id = 'test-user-id' LIMIT 10;
```

## Related Files
- Initiative: `../initiative.md`
- Source tables: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- View pattern: `apps/web/supabase/schemas/15-account-views.sql`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
