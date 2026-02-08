# Feature: Activity Aggregation Query

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I4 |
| **Feature ID** | S1890.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Create the data layer for aggregating user activity from multiple sources (lesson completions, quiz attempts, presentation updates, assessment completions) into a unified activity stream. This provides the foundation for the Recent Activity Feed widget.

## User Story
**As a** SlideHeroes developer
**I want to** have a unified activity data layer
**So that** the activity feed widget can display a chronological timeline of user actions

## Acceptance Criteria

### Must Have
- [ ] Query lesson_progress for completed lessons (where completed_at IS NOT NULL)
- [ ] Query quiz_attempts for completed quizzes (where completed_at IS NOT NULL)
- [ ] Query building_blocks_submissions for presentation updates
- [ ] Query survey_responses for completed assessments (where completed = true)
- [ ] Merge all sources into unified activity array sorted by timestamp
- [ ] Return last 30 days of activity
- [ ] Support pagination with cursor-based or offset pagination
- [ ] Define TypeScript types for unified activity items
- [ ] Include metadata needed for display (score, title, etc.)

### Nice to Have
- [ ] Enrich with lesson/quiz titles from Payload CMS
- [ ] Activity type filtering parameter

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (data layer only) | N/A |
| **Logic** | Activity loader function | New |
| **Data** | Parallel Supabase queries | New |
| **Database** | lesson_progress, quiz_attempts, building_blocks_submissions, survey_responses | Existing |

## Architecture Decision

**Approach**: Pragmatic - Server-side loader with parallel fetching
**Rationale**: Use the established loader pattern (like course page) with Promise.all() for 60-80% performance improvement. Keep data aggregation in the loader to maintain Server Component benefits.

### Key Architectural Choices
1. Server-side loader function following `*-page.loader.ts` pattern
2. Parallel fetching with Promise.all() for all 4 data sources
3. TypeScript discriminated union for activity types
4. Client-side merge/sort after parallel fetch (cheap for 30-day window)

### Trade-offs Accepted
- No database-level view (simplicity over optimization) - acceptable for expected activity volumes
- Fetching all 4 sources even if some empty - minimal overhead with RLS optimization

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| N/A | Data layer only | N/A | N/A |

**Components to Install**: None - data layer feature

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| None required | All data from internal Supabase tables with RLS | N/A |

> No external credentials required - uses existing authenticated Supabase client.

## Dependencies

### Blocks
- F3: Activity Feed Timeline (consumes this data layer)

### Blocked By
- S1890.I2.F1: Data Layer Types (provides base TypeScript interfaces and loader patterns)

### Parallel With
- F1: Kanban Summary Card (no direct dependency)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/activity-feed.loader.ts` - Server-side loader
- `apps/web/app/home/(user)/_lib/schema/activity.schema.ts` - TypeScript types and Zod schemas

### Modified Files
- None directly - consumed by F3 and page integration

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define activity types schema**: Create discriminated union for activity types
2. **Create activity loader function**: Set up server-side loader with 'server-only'
3. **Implement lesson progress query**: Fetch completed lessons with timestamps
4. **Implement quiz attempts query**: Fetch quiz completions with scores
5. **Implement presentation updates query**: Fetch building_blocks_submissions
6. **Implement survey completions query**: Fetch completed assessments
7. **Build activity merger**: Combine all sources, sort by timestamp, limit
8. **Add pagination support**: Implement cursor or offset-based pagination
9. **Write unit tests**: Test merging, sorting, filtering logic

### Suggested Order
1 → 2 → (3, 4, 5, 6 in parallel) → 7 → 8 → 9

## Validation Commands
```bash
# Verify loader exists
test -f apps/web/app/home/\(user\)/_lib/server/activity-feed.loader.ts && echo "✓ Loader exists"

# Verify schema exists
test -f apps/web/app/home/\(user\)/_lib/schema/activity.schema.ts && echo "✓ Schema exists"

# Typecheck
pnpm typecheck

# Unit tests (after implementation)
# pnpm --filter web test -- -g "activity-feed"
```

## Related Files
- Initiative: `../initiative.md`
- Existing parallel fetch pattern: `apps/web/app/home/(user)/course/page.tsx`
- Lesson progress table: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Quiz attempts table: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Building blocks table: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- Survey responses table: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)

## Activity Type Definitions

### Proposed Schema
```typescript
// Discriminated union for type-safe activity handling
export type ActivityItem =
  | { type: 'lesson_completion'; lessonId: string; courseId: string; timestamp: string; }
  | { type: 'quiz_attempt'; quizId: string; lessonId: string; score: number; passed: boolean; timestamp: string; }
  | { type: 'presentation_update'; presentationId: string; title: string; timestamp: string; }
  | { type: 'survey_completion'; surveyId: string; highestCategory: string | null; timestamp: string; };

export interface ActivityFeedResult {
  items: ActivityItem[];
  hasMore: boolean;
  nextCursor?: string;
}
```

### Query Parameters
```typescript
export interface LoadActivityFeedParams {
  userId: string;
  days?: number;      // Default: 30
  limit?: number;     // Default: 20
  cursor?: string;    // For pagination
}
```
