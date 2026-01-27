# Feature: Activity Data Aggregation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I3 |
| **Feature ID** | S1864.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Create the `activity_logs` database table infrastructure to track user activities across the platform, including lesson completions, quiz attempts, task completions, and presentation updates. Includes migration, RLS policies, aggregation function, and integration with existing server actions.

## User Story
**As a** learner using SlideHeroes
**I want** my activities to be tracked and recorded
**So that** I can see my recent progress on the dashboard activity feed

## Acceptance Criteria

### Must Have
- [ ] `activity_logs` table created with proper schema (id, user_id, activity_type, entity_id, entity_name, metadata, created_at)
- [ ] `activity_type` enum includes: lesson_completed, quiz_completed, assessment_completed, presentation_created, presentation_updated, task_completed, coaching_booked
- [ ] RLS policies ensure users can only view/create their own activity logs
- [ ] Indexes on (user_id), (created_at DESC), and composite (user_id, created_at DESC)
- [ ] `get_recent_activities(user_id, limit)` RPC function for efficient querying
- [ ] Activity logging integrated into lesson completion server action
- [ ] Activity logging integrated into quiz completion server action
- [ ] Activity logging integrated into task status change (to 'done') server action
- [ ] TypeScript types generated via typegen

### Nice to Have
- [ ] Seed data script for testing activity feed
- [ ] Activity logging for assessment completion

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (infrastructure feature) | N/A |
| **Logic** | `logActivity()` helper function | New |
| **Data** | `get_recent_activities()` RPC | New |
| **Database** | `activity_logs` table, RLS policies | New |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Simple append-only activity log table with RLS protection. No event sourcing or complex aggregation - just a straightforward log that powers the activity feed widget.

### Key Architectural Choices
1. Dedicated `activity_logs` table rather than aggregating from existing tables (cleaner, faster queries)
2. `activity_type` enum for type safety and query efficiency
3. `metadata` JSONB column for flexible additional data (scores, durations, etc.)
4. RPC function for aggregation rather than complex client-side queries

### Trade-offs Accepted
- Requires updating existing server actions to add logging calls
- Some data duplication (activity name stored in both original table and log)
- Activity logs grow unbounded (consider retention policy in v2)

## Required Credentials
> None required - uses existing Supabase database connection

## Dependencies

### Blocks
- F3: Activity Feed Widget (needs this table and RPC)
- F4: Quick Actions Panel (could use activity data for context)

### Blocked By
- S1864.I1.F1: Dashboard TypeScript types (for activity type definitions)

### Parallel With
- F1: Kanban Summary Widget (no dependency)

## Files to Create/Modify

### New Files
- `apps/web/supabase/schemas/18-activity-logs.sql` - Schema definition
- `apps/web/app/home/(user)/_lib/server/activity-logger.ts` - Helper function for logging
- `apps/web/app/home/(user)/_lib/schema/activity.schema.ts` - Zod schemas and types

### Modified Files
- `apps/web/app/home/(user)/course/_lib/server/server-actions.ts` - Add activity logging to lesson completion
- `apps/web/app/home/(user)/kanban/_lib/server/server-actions.ts` - Add activity logging to task completion

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create schema file**: Define enum, table, indexes, RLS policies in SQL
2. **Create aggregation function**: `get_recent_activities()` RPC with user_id and limit params
3. **Generate and apply migration**: Run supabase:db:diff and migration up
4. **Generate TypeScript types**: Run supabase:web:typegen
5. **Create activity logger helper**: Server-side `logActivity()` function
6. **Create Zod schemas**: Activity type enum and validation schemas
7. **Integrate with lesson completion**: Add logging call to course server actions
8. **Integrate with task completion**: Add logging call to kanban server actions
9. **Create seed data**: Optional development seed for testing

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

## Validation Commands
```bash
# Apply migration and generate types
pnpm --filter web supabase migration up
pnpm supabase:web:typegen

# Verify table exists
pnpm --filter web supabase db exec --file - <<< "SELECT * FROM public.activity_logs LIMIT 1;"

# Verify RPC function
pnpm --filter web supabase db exec --file - <<< "SELECT * FROM public.get_recent_activities(auth.uid(), 10);"

# Test activity logging by completing a lesson/task
# Then query activity_logs to verify entry created

# Run type check
pnpm --filter web typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Existing course server actions: `apps/web/app/home/(user)/course/_lib/server/server-actions.ts`
- Existing kanban server actions: `apps/web/app/home/(user)/kanban/_lib/server/server-actions.ts`
- Migration pattern reference: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
