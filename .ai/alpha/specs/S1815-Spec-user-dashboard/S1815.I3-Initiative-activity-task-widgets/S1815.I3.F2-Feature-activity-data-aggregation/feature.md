# Feature: Activity Data Aggregation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I3 |
| **Feature ID** | S1815.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Create a unified activity data aggregation layer that collects recent user activities from multiple sources (quiz completions, lesson progress, presentation updates, course milestones) into a single typed data structure. This provides the data contract for the Activity Feed Widget.

## User Story
**As a** developer building the activity feed
**I want to** have a unified API that aggregates activity from all sources
**So that** the activity feed widget can display a consistent timeline without knowing about individual data sources

## Acceptance Criteria

### Must Have
- [ ] TypeScript types for unified `ActivityItem` structure
- [ ] Loader function `loadRecentActivity()` that aggregates from 4 sources
- [ ] Parallel fetching from all activity sources using `Promise.all()`
- [ ] Merged and sorted results by timestamp (newest first)
- [ ] Limit to 10 most recent activities
- [ ] Activity types: quiz_completed, lesson_completed, presentation_created, presentation_updated

### Nice to Have
- [ ] Enrich activity with Payload CMS metadata (lesson/quiz titles)
- [ ] course_started/course_completed activity types

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (data layer only) | N/A |
| **Logic** | Activity aggregation and sorting | New |
| **Data** | `loadRecentActivity()` loader | New |
| **Database** | Queries to 4 existing tables | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use parallel fetching pattern from existing codebase. Keep aggregation simple - merge arrays, sort by timestamp, slice. Avoid over-engineering with database views or complex joins.

### Key Architectural Choices
1. Client-side aggregation (in Node.js loader) rather than database-level UNION
2. Parallel fetch all sources with individual limits (20 each), then merge and limit to 10
3. Activity ID includes source type to prevent collisions (e.g., `quiz-${id}`)
4. TypeScript discriminated union for activity types

### Trade-offs Accepted
- Multiple round trips to database (4 queries) instead of single view - acceptable for dashboard load
- Titles may not be available without Payload CMS enrichment - can show generic activity types initially
- No real-time updates - acceptable for v1

## Component Strategy

This feature is data-only, no UI components needed.

## Required Credentials
None required - all data from internal Supabase tables with RLS protection.

## Dependencies

### Blocks
- F3: Activity Feed Widget (consumes this data contract)

### Blocked By
- S1815.I1: Dashboard Foundation (provides dashboard loader pattern and types)

### Parallel With
- F1: Kanban Summary Widget
- F4: Quick Actions Panel

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/types/activity.types.ts` - ActivityItem types
- `apps/web/app/home/(user)/_lib/server/loaders/activity.loader.ts` - Aggregation loader
- `apps/web/app/home/(user)/_lib/server/loaders/activity-sources/quiz-activity.ts` - Quiz source
- `apps/web/app/home/(user)/_lib/server/loaders/activity-sources/lesson-activity.ts` - Lesson source
- `apps/web/app/home/(user)/_lib/server/loaders/activity-sources/presentation-activity.ts` - Presentation source
- `apps/web/app/home/(user)/_lib/server/loaders/activity-sources/course-activity.ts` - Course source

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Add activity to parallel fetch

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define activity types**: Create TypeScript types for unified activity structure
2. **Create quiz activity loader**: Fetch recent quiz completions
3. **Create lesson activity loader**: Fetch recent lesson completions
4. **Create presentation activity loader**: Fetch recent presentation creates/updates
5. **Create course activity loader**: Fetch course start/complete milestones
6. **Create aggregation loader**: Combine all sources, sort, limit
7. **Add to dashboard loader**: Integrate into parallel fetch

### Suggested Order
1. Types first (establishes contract)
2. Individual source loaders (can be done in parallel)
3. Aggregation loader
4. Dashboard integration

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Unit tests (if created)
pnpm --filter web test:unit --grep "activity"

# Manual testing
# Test via browser dev tools network tab
# Verify activity data loads in dashboard
```

## Data Sources Reference

| Source | Table | Timestamp Field | Activity Types |
|--------|-------|-----------------|----------------|
| Quizzes | `quiz_attempts` | `completed_at` | quiz_completed |
| Lessons | `lesson_progress` | `completed_at` | lesson_completed |
| Presentations | `building_blocks_submissions` | `created_at`, `updated_at` | presentation_created, presentation_updated |
| Courses | `course_progress` | `started_at`, `completed_at` | course_started, course_completed |

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/ai/_lib/queries/building-blocks-titles.ts` - Presentation query pattern
- Reference: `apps/web/app/home/(user)/course/_lib/server/server-actions.ts` - Progress update patterns
- Tasks: `./tasks.json` (created in next phase)
