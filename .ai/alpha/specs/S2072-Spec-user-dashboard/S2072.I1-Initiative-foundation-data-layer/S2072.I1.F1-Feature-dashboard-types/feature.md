# Feature: Dashboard Types

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I1 |
| **Feature ID** | S2072.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 1 |

## Description

Establish TypeScript types and Zod schemas for all dashboard data structures. This feature provides the type foundation that enables type-safe development for all subsequent dashboard features.

## User Story

**As a** developer
**I want to** have well-defined TypeScript types for all dashboard data
**So that** I can implement features with confidence and catch errors at compile time

## Acceptance Criteria

### Must Have
- [ ] DashboardData interface aggregating all widget data types
- [ ] CourseProgressData type for course progress radial chart
- [ ] SkillsRadarData type for skills spider diagram
- [ ] KanbanSummaryData type for kanban summary card
- [ ] ActivityFeedItem type for activity feed items
- [ ] QuickActionData type for quick actions panel
- [ ] CoachingSessionData type for coaching sessions card
- [ ] PresentationData type for presentations table
- [ ] All types exported from a single index file

### Nice to Have
- [ ] Zod schemas for runtime validation (if needed for API boundaries)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | Types only, no UI |
| **Logic** | N/A | Types only, no logic |
| **Data** | N/A | Types only, no data |
| **Database** | Database table references | Existing tables referenced |

## Architecture Decision

**Approach**: Schema-First Development with Type Inference
**Rationale**: Follow existing project patterns where Zod schemas define the shape and TypeScript types are inferred. This ensures runtime and compile-time consistency.

### Key Architectural Choices

1. **Single types file**: `apps/web/app/home/(user)/_lib/dashboard/types.ts` - centralized location
2. **Reference existing database types**: Use `Tables<"table_name">` pattern from Supabase
3. **Computed fields typed separately**: Types include both raw database fields and computed values (e.g., percentage)

### Trade-offs Accepted

- Types file may grow large - acceptable as it's the single source of truth
- No Zod schemas by default - add only where runtime validation is needed

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|

> None required - this feature only defines types

## Dependencies

### Blocks
- S2072.I1.F2 (Dashboard Page Shell) - needs types for page props
- S2072.I1.F4 (Dashboard Data Loader) - needs types for return values
- S2072.I2.F1 (Course Progress Radial) - needs CourseProgressData
- S2072.I2.F2 (Skills Spider Diagram) - needs SkillsRadarData
- S2072.I3.F1 (Activity Feed) - needs ActivityFeedItem
- S2072.I3.F2 (Quick Actions) - needs QuickActionData
- S2072.I3.F3 (Kanban Summary) - needs KanbanSummaryData
- S2072.I4.F1 (Coaching Sessions) - needs CoachingSessionData
- S2072.I5.F1 (Presentations Table) - needs PresentationData

### Blocked By
- None

### Parallel With
- None (foundation feature)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/dashboard/types.ts` - All dashboard type definitions

### Modified Files
- None

## Task Hints

### Candidate Tasks
1. **Create types file**: Create `apps/web/app/home/(user)/_lib/dashboard/types.ts`
2. **Define CourseProgressData**: Type for course completion percentage and lesson counts
3. **Define SkillsRadarData**: Type for assessment category scores (structure, story, substance, style, self-confidence)
4. **Define KanbanSummaryData**: Type for "doing" tasks count and next task preview
5. **Define ActivityFeedItem**: Type for activity timeline items (type, timestamp, metadata)
6. **Define QuickActionData**: Type for contextual CTAs
7. **Define CoachingSessionData**: Type for upcoming sessions (date, time, join link)
8. **Define PresentationData**: Type for presentations table row
9. **Define DashboardData**: Aggregated type combining all widget data
10. **Export all types**: Add barrel exports

### Suggested Order
1. Create types file with imports from database.types.ts
2. Define each widget data type in dependency order
3. Define aggregated DashboardData type last
4. Add exports

## Validation Commands
```bash
# Type checking - must pass
pnpm typecheck

# Verify types are exported
grep -E "export (type|interface)" apps/web/app/home/(user)/_lib/dashboard/types.ts
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/lib/database.types.ts`
- Reference: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`
