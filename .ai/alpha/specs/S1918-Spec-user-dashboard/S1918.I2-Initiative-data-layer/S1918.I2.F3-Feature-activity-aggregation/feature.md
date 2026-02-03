# Feature: Activity Aggregation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I2 |
| **Feature ID** | S1918.I2.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Create the activity aggregation query function that fetches recent user activities from multiple source tables (lesson_progress, quiz_attempts, building_blocks_submissions, survey_responses) and merges them into a unified, chronologically sorted activity feed. This is the most complex query in the data layer, requiring parallel fetches and client-side merging.

## User Story
**As a** user viewing my dashboard
**I want to** see a timeline of my recent activities across all features
**So that** I can recall what I've accomplished and maintain momentum in my learning journey

## Acceptance Criteria

### Must Have
- [ ] `loadRecentActivity()` function fetching from 4 source tables
- [ ] Lesson completion activities (from lesson_progress.completed_at)
- [ ] Quiz completion activities (from quiz_attempts with score, passed status)
- [ ] Presentation update activities (from building_blocks_submissions.updated_at)
- [ ] Assessment completion activities (from survey_responses.completed_at)
- [ ] Activities merged and sorted by timestamp (most recent first)
- [ ] Limited to 10 most recent items for performance
- [ ] Each activity has: type, title, timestamp, and type-specific metadata
- [ ] Proper TypeScript typing with discriminated union for activity types

### Nice to Have
- [ ] Database-level UNION query for efficiency (if feasible)
- [ ] Configurable limit parameter
- [ ] Optional filtering by activity type

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (consumed by Activity Feed Widget in I4) | N/A |
| **Logic** | Aggregation and sorting | New |
| **Data** | Multi-table queries | New |
| **Database** | 4 existing tables | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use parallel fetches from each table with client-side merge rather than complex database UNION. This is simpler to maintain, easier to type, and flexible for adding new activity sources. The 10-item limit keeps data volume small enough that client-side sorting is negligible.

### Key Architectural Choices
1. Parallel fetch from 4 tables using `Promise.all()`
2. Client-side transformation to ActivityItem discriminated union
3. Client-side merge and sort (Array.sort by timestamp)
4. Slice to top 10 after sorting

### Trade-offs Accepted
- Multiple round trips instead of single UNION (acceptable for small result sets)
- Client-side sorting overhead (negligible for 10-40 items)
- No pagination (fixed limit sufficient for dashboard)

## Required Credentials
> Environment variables required for this feature to function.

None required - uses existing Supabase authentication.

## Dependencies

### Blocks
- S1918.I4.F3: Activity Feed Widget (consumes activity data)
- S1918.I6: Polish (needs activity data for empty states)

### Blocked By
- F1: Dashboard Types (needs ActivityItem type definition)

### Parallel With
- F2: Dashboard Loader (can be developed in parallel, integrated as additional loader)

## Files to Create/Modify

### New Files
- None (function added to existing loader file)

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Add loadRecentActivity function
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - Ensure ActivityItem types complete

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define activity source queries**: Create individual fetch functions for each table
2. **Implement lesson activity fetch**: Query lesson_progress with lesson title join
3. **Implement quiz activity fetch**: Query quiz_attempts with score and passed status
4. **Implement presentation activity fetch**: Query building_blocks_submissions
5. **Implement assessment activity fetch**: Query survey_responses
6. **Create activity transformer functions**: Convert each source to ActivityItem type
7. **Implement merge and sort logic**: Combine arrays, sort by timestamp, slice to limit
8. **Integrate into main loader**: Add to Promise.all in loadDashboardPageData

### Suggested Order
1. Individual fetch functions (can be parallel)
2. Transformer functions for each activity type
3. Merge/sort/slice logic
4. Integration with main loader

## Validation Commands
```bash
# Type check passes
pnpm typecheck

# Verify activity loader function exists
grep -q "loadRecentActivity" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts && echo "✓ Activity loader exists"

# Verify ActivityItem type is used
grep -q "ActivityItem" apps/web/app/home/\(user\)/_lib/types/dashboard.types.ts && echo "✓ ActivityItem type defined"

# Verify multiple table queries
grep -c "from(" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts | xargs -I {} test {} -ge 5 && echo "✓ Multiple table queries"
```

## Related Files
- Initiative: `../initiative.md`
- Types: `../_lib/types/dashboard.types.ts` (from F1)
- Loader: `../_lib/server/dashboard-page.loader.ts` (from F2)
- Table: `apps/web/supabase/migrations/20250319104726_web_course_system.sql` - lesson_progress, quiz_attempts
- Table: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql` - survey_responses
- Table: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql` - presentations
