# Feature: Dashboard Types

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I2 |
| **Feature ID** | S1918.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Create comprehensive TypeScript type definitions for all dashboard data structures. This includes the main `DashboardData` interface, widget-specific types for course progress, assessment scores, tasks summary, activity items, and presentations. Types will be exported for use by both loader functions and widget components.

## User Story
**As a** developer working on dashboard features
**I want to** have well-defined TypeScript types for all dashboard data
**So that** I can build type-safe loaders and widgets with IDE autocompletion and compile-time error checking

## Acceptance Criteria

### Must Have
- [ ] `DashboardData` interface containing all widget data types
- [ ] `CourseProgressData` type with completion percentage and lesson counts
- [ ] `AssessmentScoreData` type with category scores from survey responses
- [ ] `TasksSummaryData` type with status counts and next task
- [ ] `ActivityItem` union type supporting lesson, quiz, presentation, and assessment activities
- [ ] `PresentationData` type with title, type, and timestamps
- [ ] All types exported from a central `dashboard.types.ts` file

### Nice to Have
- [ ] JSDoc comments on all interfaces describing each field
- [ ] Utility types for partial/loading states

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | Type definitions | New |
| **Data** | Type exports | New |
| **Database** | Schema reference | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Create comprehensive but not over-engineered types. Focus on data shapes that match database tables and loader return values. Use TypeScript inference where possible, explicit types for API contracts.

### Key Architectural Choices
1. Single types file for all dashboard types (colocated with loaders)
2. Use Zod schemas only if runtime validation needed (loaders trust RLS-protected data)

### Trade-offs Accepted
- No runtime validation of internal data (trust Supabase RLS)
- Types defined manually rather than generated from database schema

## Required Credentials
> Environment variables required for this feature to function.

None required - this feature is type definitions only.

## Dependencies

### Blocks
- F2: Dashboard Loader (needs types for function signatures)
- F3: Activity Aggregation (needs ActivityItem type)
- S1918.I3: Progress Widgets (needs CourseProgressData, AssessmentScoreData)
- S1918.I4: Activity & Task Widgets (needs TasksSummaryData, ActivityItem)

### Blocked By
- None (foundational feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - All dashboard type definitions

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create types file with CourseProgressData**: Define interface matching course_progress and lesson_progress tables
2. **Add AssessmentScoreData type**: Define interface matching survey_responses.category_scores JSONB
3. **Add TasksSummaryData type**: Define interface with status counts and next task
4. **Add ActivityItem union type**: Define discriminated union for activity types
5. **Add PresentationData type**: Define interface matching building_blocks_submissions
6. **Create DashboardData composite type**: Combine all widget types into main interface
7. **Export all types**: Ensure proper exports for consumers

### Suggested Order
1. Individual widget types (CourseProgressData, AssessmentScoreData, TasksSummaryData, PresentationData)
2. ActivityItem union type (depends on understanding activity sources)
3. DashboardData composite type (combines all above)

## Validation Commands
```bash
# Verify types file exists
test -f apps/web/app/home/\(user\)/_lib/types/dashboard.types.ts && echo "✓ Types file exists"

# Type check passes
pnpm typecheck

# Verify exports are valid
grep -q "export type DashboardData" apps/web/app/home/\(user\)/_lib/types/dashboard.types.ts && echo "✓ DashboardData exported"
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts` - Task type patterns
- Reference: `apps/web/supabase/migrations/20250319104726_web_course_system.sql` - Course tables
- Reference: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql` - Survey tables
