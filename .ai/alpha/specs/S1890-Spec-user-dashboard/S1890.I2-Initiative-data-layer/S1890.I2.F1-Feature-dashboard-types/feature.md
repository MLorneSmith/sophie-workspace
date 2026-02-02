# Feature: Dashboard Types

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I2 |
| **Feature ID** | S1890.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Define TypeScript interfaces for all dashboard data structures used by widgets. These types provide type safety across the entire dashboard feature and serve as contracts between the data layer and UI components. Types are derived from existing Supabase-generated types but structured for dashboard-specific aggregations.

## User Story
**As a** developer working on dashboard widgets
**I want to** have strongly-typed interfaces for all dashboard data
**So that** I can safely access data properties with IDE autocomplete and compile-time error checking

## Acceptance Criteria

### Must Have
- [ ] Create `UserDashboardData` interface aggregating all dashboard data
- [ ] Create `CourseProgressData` type for radial chart widget
- [ ] Create `SurveyScoresData` type for spider diagram widget
- [ ] Create `KanbanSummaryData` type for task summary card
- [ ] Create `ActivityFeedItem` type for recent activity timeline
- [ ] Create `PresentationOutline` type for presentations table
- [ ] All types derive from or extend Supabase-generated `Database` types
- [ ] Export types from central location for easy importing

### Nice to Have
- [ ] JSDoc comments explaining each type's purpose
- [ ] Utility types for empty states (e.g., `EmptyableData<T>`)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A - Types only | N/A |
| **Logic** | TypeScript interfaces | New |
| **Data** | Type definitions | New |
| **Database** | Supabase types (existing) | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Create a dedicated types file that imports from Supabase-generated types and creates dashboard-specific aggregate types. This maintains a single source of truth while providing meaningful type names for dashboard components.

### Key Architectural Choices
1. Types file at `_lib/types/user-dashboard.types.ts` to co-locate with feature
2. Use `Pick<>`, `Omit<>`, and intersection types to derive from Database types
3. Export a single `UserDashboardData` interface as the main loader return type

### Trade-offs Accepted
- Slightly more code than using raw Database types, but provides better developer experience and self-documenting code

## Required Credentials
None required - this feature only creates TypeScript types.

## Dependencies

### Blocks
- F2: Dashboard Data Loader (needs types for return type)
- F3: Activity Aggregation (needs ActivityFeedItem type)

### Blocked By
- None (foundation feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/types/user-dashboard.types.ts` - All dashboard type definitions

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create types directory**: Set up `_lib/types/` directory structure
2. **Define course progress types**: `CourseProgressData` from `course_progress` + `lesson_progress`
3. **Define survey scores type**: `SurveyScoresData` from `survey_responses`
4. **Define kanban summary type**: `KanbanSummaryData` from `tasks` + `subtasks`
5. **Define activity feed types**: `ActivityFeedItem` union type for different activities
6. **Define presentation type**: `PresentationOutline` from `building_blocks_submissions`
7. **Create aggregate type**: `UserDashboardData` combining all above
8. **Add type exports**: Ensure clean export structure

### Suggested Order
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 (linear, each builds on previous)

## Validation Commands
```bash
# Verify types file exists
test -f apps/web/app/home/\(user\)/_lib/types/user-dashboard.types.ts && echo "✓ Types file exists"

# Check imports Database types
grep -q "import.*Database" apps/web/app/home/\(user\)/_lib/types/user-dashboard.types.ts && echo "✓ Imports Database types"

# Verify UserDashboardData is exported
grep -q "export.*UserDashboardData" apps/web/app/home/\(user\)/_lib/types/user-dashboard.types.ts && echo "✓ UserDashboardData exported"

# Run typecheck
pnpm typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Database types: `apps/web/lib/database.types.ts`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
