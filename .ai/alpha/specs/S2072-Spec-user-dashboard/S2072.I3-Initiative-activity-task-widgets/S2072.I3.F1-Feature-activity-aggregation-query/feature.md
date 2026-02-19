# Feature: Activity Aggregation Query

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I3 |
| **Feature ID** | S2072.I3.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description

Server-side query and loader function that aggregates recent activity from multiple tables (lessons, quizzes, assessments, presentations) using a UNION ALL pattern. Returns a unified list of activity items with type discrimination for the activity feed widget.

## User Story
**As a** learner using the dashboard
**I want to** see my recent learning activities in one place
**So that** I can quickly recall what I've accomplished and continue where I left off

## Acceptance Criteria

### Must Have
- [ ] Loader function aggregates activities from 4 sources: lesson_progress, quiz_attempts, survey_responses, building_blocks_submissions
- [ ] Each activity item includes: id, type, title, timestamp, and optional link
- [ ] Activity type discrimination with proper TypeScript discriminated union
- [ ] Returns last 10 activities sorted by timestamp (newest first)
- [ ] Query uses UNION ALL pattern with per-source LIMIT for performance
- [ ] Proper RLS-aware query with user_id filtering
- [ ] React cache() wrapper for request deduplication

### Nice to Have
- [ ] Database indexes on (user_id, created_at DESC) for activity tables
- [ ] Structured logging with performance metrics

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (data layer only) | N/A |
| **Logic** | Activity loader function | New |
| **Data** | Activity types & transformations | New |
| **Database** | UNION ALL query (no migration) | N/A |

## Architecture Decision

**Approach**: Pragmatic - Reuse existing patterns with minimal abstraction

**Rationale**: The UNION ALL pattern is well-documented in codebase RLS benchmarks. Loader follows established patterns from team workspace loader. No new database tables needed - leverage existing tables with proper indexing.

### Key Architectural Choices
1. Use UNION ALL (not UNION) to avoid deduplication overhead
2. Limit each subquery to 5 items before union, then slice to 10 total
3. Type discriminator via `activity_type` column for icon/color mapping in UI
4. Server-only loader with React cache() for deduplication

### Trade-offs Accepted
- No dedicated activity_events table (uses existing tables directly)
- No real-time updates (polling/refresh only, per spec out-of-scope)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | Uses Supabase client with RLS | N/A |

> If no external credentials required, note "None required" below:
> Uses standard Supabase client with automatic RLS - no additional credentials needed.

## Dependencies

### Blocks
- S2072.I3.F2 (Activity Feed Widget) - needs activity data structure and loader

### Blocked By
- S2072.I1.F2 (Dashboard Types) - needs dashboard data types
- S2072.I1.F3 (Dashboard Data Loader) - integration point

### Parallel With
- S2072.I2.F1 (Course Progress Radial Widget)
- S2072.I2.F2 (Skills Spider Diagram Widget)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/activity.loader.ts` - Activity aggregation loader
- `apps/web/app/home/(user)/_lib/types/activity.types.ts` - Activity item types

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Add activity data to dashboard loader

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define Activity Types**: Create discriminated union type for activity items with proper type safety
2. **Create Activity Loader**: Implement UNION ALL query with per-source limits
3. **Add Query Performance Indexes**: Create indexes on (user_id, created_at DESC) for activity tables
4. **Integrate with Dashboard Loader**: Add activity data to parallel fetch in dashboard loader
5. **Add Unit Tests**: Test loader returns correct structure, handles empty data gracefully

### Suggested Order
1. Define Activity Types (enables type-safe development)
2. Create Activity Loader (core functionality)
3. Add Query Performance Indexes (optional optimization)
4. Integrate with Dashboard Loader (connection to I1)
5. Add Unit Tests (validation)

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification (after F2)
pnpm dev
# Navigate to /home, verify activity data loads in console

# Loader unit test
pnpm --filter web test -- --grep "activity"
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `apps/web/supabase/tests/database/rls-performance-benchmarks.test.sql` (UNION pattern)
- Reference: `apps/web/app/home/[account]/_lib/server/team-account-workspace.loader.ts` (loader pattern)
