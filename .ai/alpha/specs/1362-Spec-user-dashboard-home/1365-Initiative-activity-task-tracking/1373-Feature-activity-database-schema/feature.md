# Feature: Activity Database Schema

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1365 |
| **Feature ID** | 1365-F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Create the `user_activities` database table with RLS policies, indexes, and enums to store user activity events. This is the foundation for all activity tracking features.

## User Story
**As a** system administrator
**I want to** have a secure, performant database table for storing user activities
**So that** activity data can be recorded and queried efficiently with proper access control

## Acceptance Criteria

### Must Have
- [ ] `user_activities` table created with columns: id, account_id, user_id, activity_type, entity_type, entity_id, metadata (JSONB), created_at
- [ ] RLS enabled with policies for SELECT (users view own) and INSERT (users record own)
- [ ] Performance indexes on account_id, user_id, and created_at DESC
- [ ] TypeScript types generated via `pnpm supabase:web:typegen`
- [ ] Activity type enum: lesson_complete, quiz_submit, presentation_create, presentation_update, assessment_complete, coaching_booked
- [ ] Entity type enum: lesson, quiz, presentation, assessment, coaching_session

### Nice to Have
- [ ] Composite index on (account_id, created_at DESC) for dashboard queries
- [ ] Index on (entity_type, entity_id) for entity-specific lookups

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | N/A | N/A |
| **Data** | TypeScript types from typegen | New |
| **Database** | user_activities table, RLS policies, indexes | New |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow existing schema patterns from tasks table; use JSONB metadata for flexibility; subquery RLS pattern for 10-100x performance boost.

### Key Architectural Choices
1. **JSONB Metadata**: Flexible schema for activity-specific data (scores, titles, slugs) without table changes
2. **Subquery RLS Pattern**: `user_id = (select auth.uid())` instead of `user_id = auth.uid()` for performance
3. **Separate Enums**: activity_type and entity_type as PostgreSQL enums for type safety
4. **Immutable Audit Trail**: Grant only SELECT/INSERT, not UPDATE/DELETE

### Trade-offs Accepted
- Schema changes require migration for new activity types (acceptable for audit trail stability)
- No soft delete - activities are permanent (intentional for audit purposes)

## Dependencies

### Blocks
- F2: Activity Recording Service (needs table to insert into)
- F3: Activity Feed Component (needs table to query)

### Blocked By
- None (foundation feature)

### Parallel With
- F4: Kanban Summary Card (can develop in parallel - queries existing tasks table)

## Files to Create/Modify

### New Files
- `apps/web/supabase/schemas/18-user-activities.sql` - Table, RLS, indexes, grants

### Modified Files
- None (standalone schema file)

### Generated Files
- `apps/web/lib/database.types.ts` - Updated via typegen

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Schema File**: Write 18-user-activities.sql with table definition
2. **Define Enums**: Add activity_type and entity_type enums
3. **Create RLS Policies**: SELECT for view own, INSERT for record own
4. **Add Indexes**: Performance indexes on key columns
5. **Generate Migration**: Run supabase:db:diff
6. **Apply Migration**: Run migration up
7. **Generate Types**: Run supabase:web:typegen
8. **Verify Access**: Test RLS with sample queries

### Suggested Order
Create schema → Generate migration → Apply migration → Generate types → Verify

## Validation Commands
```bash
# Generate migration
pnpm --filter web supabase:db:diff -f create_user_activities_table

# Apply migration
pnpm --filter web supabase migration up

# Generate TypeScript types
pnpm supabase:web:typegen

# Verify table exists
pnpm --filter web supabase db reset --dry-run 2>&1 | grep user_activities

# Run typecheck
pnpm typecheck

# Run linter
pnpm lint:fix
```

## Related Files
- Initiative: `../initiative.md`
- Existing tasks table: `apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
