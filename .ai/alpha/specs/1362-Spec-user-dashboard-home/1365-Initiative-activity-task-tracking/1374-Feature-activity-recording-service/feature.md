# Feature: Activity Recording Service

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1365 |
| **Feature ID** | 1365-F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Implement the TypeScript service and server action for recording user activities, plus database triggers for automatic activity logging on key events (lesson completion, quiz submission, etc.).

## User Story
**As a** developer
**I want to** have a reliable service for recording user activities
**So that** activities are captured automatically via triggers and manually via server actions

## Acceptance Criteria

### Must Have
- [ ] Zod schema for activity data validation (activity_type, entity_type, entity_id, metadata)
- [ ] Server action `recordActivityAction` using `enhanceAction` pattern
- [ ] Activity recorded successfully inserts into user_activities table
- [ ] Revalidates `/home` path after recording
- [ ] Structured logging with Pino logger
- [ ] Graceful error handling that doesn't block primary operations

### Nice to Have
- [ ] Database trigger for lesson_complete event
- [ ] Database trigger for quiz_submit event
- [ ] Integration with presentation create flow

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | recordActivityAction server action | New |
| **Data** | activity.schema.ts Zod schemas | New |
| **Database** | Trigger functions (optional) | New |

## Architecture Decision

**Approach**: Pragmatic (Hybrid)
**Rationale**: Combine database triggers for system events (automatic) with server actions for explicit events (manual). Triggers provide reliability for critical events; server actions offer flexibility.

### Key Architectural Choices
1. **Hybrid Recording**: Triggers for system events + server actions for explicit events
2. **SECURITY INVOKER**: Triggers inherit RLS permissions (safer than SECURITY DEFINER)
3. **Graceful Degradation**: Activity recording failures don't block primary operations
4. **Revalidation Strategy**: `revalidatePath('/home')` updates dashboard after recording

### Trade-offs Accepted
- Trigger complexity increases database maintenance burden
- Manual integration required for some activity types (acceptable for flexibility)

## Dependencies

### Blocks
- F3: Activity Feed Component (needs activities to display)

### Blocked By
- F1: Activity Database Schema (needs table to insert into)

### Parallel With
- None (sequential after F1)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/schema/activity.schema.ts` - Zod validation schemas
- `apps/web/app/home/(user)/_lib/server/activity-server-actions.ts` - Server action
- `apps/web/supabase/migrations/YYYYMMDDHHMMSS_add_activity_triggers.sql` - Trigger functions (optional)

### Modified Files
- `apps/web/app/home/(user)/ai/storyboard/_lib/server/server-actions.ts` - Add activity recording to presentation create (optional)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Zod Schemas**: activity.schema.ts with ActivityType, EntityType, RecordActivitySchema
2. **Create Server Action**: recordActivityAction with enhanceAction wrapper
3. **Add Logging**: Pino logger with structured context
4. **Create Trigger Functions**: log_lesson_complete_activity (optional)
5. **Create Trigger Migration**: Migration file for triggers (optional)
6. **Integrate with Presentation**: Add activity recording to create flow (optional)
7. **Write Unit Tests**: Test schema validation and action logic

### Suggested Order
Schemas → Server action → Unit tests → Triggers (if time permits)

## Validation Commands
```bash
# Test activity recording (manual)
# Create a test script or use the app UI

# Run unit tests
pnpm --filter web test:unit -- activity

# Verify server action compiles
pnpm typecheck

# Run linter
pnpm lint:fix

# Test trigger (if implemented)
# Insert into user_progress and verify user_activities row created
```

## Related Files
- Initiative: `../initiative.md`
- Feature F1: `../pending-Feature-activity-database-schema/feature.md`
- Existing server actions: `apps/web/app/home/(user)/kanban/_lib/server/server-actions.ts`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
