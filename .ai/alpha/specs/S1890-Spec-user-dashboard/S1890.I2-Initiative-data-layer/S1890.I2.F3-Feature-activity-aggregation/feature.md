# Feature: Activity Aggregation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I2 |
| **Feature ID** | S1890.I2.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Build an activity feed aggregation query that combines data from multiple tables (quiz_attempts, lesson_progress, building_blocks_submissions) into a unified timeline. The aggregation filters to the last 30 days, sorts by timestamp descending, and transforms each record into a consistent `ActivityFeedItem` structure for display in the Recent Activity widget.

## User Story
**As a** user viewing my dashboard
**I want to** see a timeline of my recent learning activities
**So that** I can track what I've accomplished and stay motivated to continue

## Acceptance Criteria

### Must Have
- [ ] Create `aggregateActivityFeed()` helper function
- [ ] Combine activities from: quiz_attempts (quiz completions), lesson_progress (lesson completions), building_blocks_submissions (presentation updates)
- [ ] Filter to last 30 days of activity
- [ ] Sort combined results by timestamp descending (newest first)
- [ ] Transform each record into `ActivityFeedItem` type with consistent structure
- [ ] Limit to 20 items initially (pagination support for future)
- [ ] Handle edge case: user has no activity (return empty array)
- [ ] Include activity type discrimination for icon/styling decisions

### Nice to Have
- [ ] Support cursor-based pagination for "Load More"
- [ ] Add course name lookup for lesson/quiz activities

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A - Data aggregation only | N/A |
| **Logic** | Aggregation function | New |
| **Data** | Cross-table query/transform | New |
| **Database** | 3 tables (existing) | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Since Supabase doesn't support UNION queries directly, fetch from each table separately then merge/sort in JavaScript. This is acceptable for the expected data volume (<1000 items per user). Could optimize with a database view or function if performance becomes an issue.

### Key Architectural Choices
1. Application-level aggregation (fetch → merge → sort) vs database-level UNION
2. Use TypeScript discriminated union for type-safe activity type handling
3. Integrate with main loader to reuse cached queries (no duplicate fetches)
4. Return lightweight objects (exclude full response JSON, etc.)

### Trade-offs Accepted
- More data transfer than a database UNION (acceptable for v1 scale)
- Pagination added later (start with initial 20 items)

## Required Credentials
None required - uses existing Supabase server client with RLS.

## Dependencies

### Blocks
- S1890.I4: Task & Activity Widgets (needs aggregated activity feed)

### Blocked By
- F1: Dashboard Types (needs ActivityFeedItem type)
- F2: Dashboard Data Loader (reuses fetched data)

### Parallel With
- None (depends on F1 and F2)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/activity-aggregation.ts` - Aggregation logic

### Modified Files
- `apps/web/app/home/(user)/_lib/server/user-dashboard.loader.ts` - Import and use aggregation

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create aggregation file**: Set up `activity-aggregation.ts` with server-only directive
2. **Define activity mappers**: Functions to transform each source to ActivityFeedItem
3. **Map quiz attempts**: Transform quiz_attempts to activity items
4. **Map lesson progress**: Transform completed lessons to activity items
5. **Map presentations**: Transform building_blocks_submissions to activity items
6. **Implement aggregation**: Combine, sort, and limit results
7. **Integrate with loader**: Call aggregation in main loader
8. **Add type guards**: Discriminated union helpers for activity types

### Suggested Order
T1 → T2 → T3-T5 (parallel) → T6 → T7 → T8

## Validation Commands
```bash
# Verify aggregation file exists
test -f apps/web/app/home/\(user\)/_lib/server/activity-aggregation.ts && echo "✓ Aggregation file exists"

# Check for server-only directive
grep -q "import 'server-only'" apps/web/app/home/\(user\)/_lib/server/activity-aggregation.ts && echo "✓ Server-only"

# Check aggregation is used in loader
grep -q "aggregateActivityFeed" apps/web/app/home/\(user\)/_lib/server/user-dashboard.loader.ts && echo "✓ Integrated with loader"

# Check for 30-day filter
grep -q "30" apps/web/app/home/\(user\)/_lib/server/activity-aggregation.ts && echo "✓ 30-day filter"

# Run typecheck
pnpm typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Types: `../_lib/types/user-dashboard.types.ts`
- Loader: `../_lib/server/user-dashboard.loader.ts`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
