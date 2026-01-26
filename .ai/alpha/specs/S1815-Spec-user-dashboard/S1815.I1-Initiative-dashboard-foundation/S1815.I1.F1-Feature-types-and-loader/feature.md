# Feature: TypeScript Types & Data Loader

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I1 |
| **Feature ID** | S1815.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Define comprehensive TypeScript interfaces for all dashboard data structures and create a server-side data loader with parallel `Promise.all()` fetching for optimal performance. This is the foundation feature that all other dashboard features depend upon.

## User Story
**As a** developer implementing dashboard widgets
**I want to** have type-safe data structures and a performant data loader
**So that** I can build widgets with confidence and ensure fast page loads

## Acceptance Criteria

### Must Have
- [ ] TypeScript interfaces for all 7 widget data types (CourseProgress, SurveyScores, Tasks, Activities, Presentations, CoachingSessions, DashboardData)
- [ ] Cached data loader using React `cache()` for per-request memoization
- [ ] Parallel data fetching with `Promise.all()` achieving < 500ms total load time
- [ ] Graceful error handling (null/empty returns) for each data source
- [ ] RLS-protected queries (no admin client usage)

### Nice to Have
- [ ] Unit tests for each loader helper function
- [ ] JSDoc comments on interfaces

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | `dashboard-page.loader.ts` | New |
| **Data** | TypeScript interfaces | New |
| **Database** | Queries to 5+ tables | Existing |

## Architecture Decision

**Approach**: Pragmatic Server-First
**Rationale**: Follow existing `load-user-workspace.ts` pattern exactly. Use `cache()` for memoization, `Promise.all()` for parallel fetching, explicit type definitions for safety.

### Key Architectural Choices
1. Export `UserDashboard` type as `Awaited<ReturnType<typeof loadUserDashboard>>` for automatic type inference
2. Each loader helper function handles its own errors and returns null/empty on failure
3. Use `maybeSingle()` for optional single-row queries (course progress, survey scores)

### Trade-offs Accepted
- Coaching sessions returns empty array (placeholder) - real Cal.com integration deferred to I4
- Activity feed aggregation simplified - full implementation in I3

## Required Credentials
> None required - uses existing Supabase RLS-protected client

## Dependencies

### Blocks
- F2: Dashboard Page Shell (needs loader function)
- F3: Responsive Grid Layout (needs types)
- F4: Skeleton Loading (needs data shape understanding)

### Blocked By
- None (foundation feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - TypeScript interfaces for all dashboard data
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Server-side cached loader with parallel fetching

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create types file**: Define all TypeScript interfaces (DashboardData, CourseProgressData, SurveyScoresData, TasksData, ActivityData, PresentationData, CoachingSessionData)
2. **Create loader skeleton**: Set up cached loader with Promise.all structure and helper function stubs
3. **Implement course progress loader**: Query course_progress table, map to CourseProgressData
4. **Implement survey scores loader**: Query survey_responses table, parse category_scores JSON
5. **Implement tasks summary loader**: Query tasks table, aggregate by status
6. **Implement activities loader**: Query multiple tables, combine and sort by timestamp
7. **Implement presentations loader**: Query building_blocks_submissions, limit to 10
8. **Add coaching placeholder**: Return empty array (full implementation in I4)

### Suggested Order
Types file first (T1), then loader skeleton (T2), then individual helpers (T3-T8) which can be parallelized.

## Validation Commands
```bash
# Verify types compile
pnpm typecheck

# Test loader isolation (when tests added)
pnpm --filter web test:unit --grep "dashboard-page.loader"
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- Database types: `apps/web/lib/database.types.ts`
