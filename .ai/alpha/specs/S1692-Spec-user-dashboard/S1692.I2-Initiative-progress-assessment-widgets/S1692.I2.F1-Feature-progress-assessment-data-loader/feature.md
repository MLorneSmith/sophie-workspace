# Feature: Progress & Assessment Data Loader

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I2 |
| **Feature ID** | S1692.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Create a server-side data loader that fetches course progress and self-assessment data for the dashboard widgets. This loader extends the existing dashboard data loader pattern to include `course_progress` and `survey_responses` tables with parallel fetching.

## User Story
**As a** SlideHeroes user
**I want to** see my progress and assessment data on my dashboard
**So that** I can immediately understand my learning journey without navigating to separate pages

## Acceptance Criteria

### Must Have
- [ ] Loader fetches `course_progress` for authenticated user
- [ ] Loader fetches `survey_responses.category_scores` for authenticated user
- [ ] Data is fetched in parallel with other dashboard data using `Promise.all()`
- [ ] Loader uses RLS-protected queries (no admin client)
- [ ] TypeScript types are properly defined for loader return types

### Nice to Have
- [ ] Cache wrapper using React's `cache()` function for request deduplication

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A - Data layer only | N/A |
| **Logic** | Dashboard data loader | New |
| **Data** | Supabase RLS queries | Existing |
| **Database** | `course_progress`, `survey_responses` tables | Existing |

## Architecture Decision

**Approach**: Pragmatic - Extend existing loader pattern
**Rationale**: The codebase uses a consistent loader pattern (`_lib/server/*-page.loader.ts`). We follow this pattern to add progress and assessment data to the dashboard, maintaining consistency while enabling parallel data fetching.

### Key Architectural Choices
1. Single loader file that exports a function aggregating all dashboard progress data
2. Use `Promise.all()` for parallel fetching of course_progress and survey_responses

### Trade-offs Accepted
- Data is fetched on every request (no caching) - acceptable for dashboard freshness

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| N/A | Data layer only | N/A | This feature provides data infrastructure |

## Dependencies

### Blocks
- F2: Course Progress Widget (needs this data)
- F3: Spider Chart Widget (needs this data)

### Blocked By
- S1692.I1: Dashboard Foundation (needs page structure and existing loader to extend)

### Parallel With
- None - this is the foundation for this initiative

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/dashboard-progress.loader.ts` - Progress & assessment data loader
- `apps/web/app/home/(user)/_lib/types/dashboard-progress.types.ts` - TypeScript types for loader

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and use the new loader

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create TypeScript types**: Define interfaces for course progress and assessment data
2. **Create loader function**: Implement `loadDashboardProgressData()` with parallel fetching
3. **Integrate with page**: Import loader in dashboard page and pass data to components
4. **Add error handling**: Handle cases where user has no progress/assessment data

### Suggested Order
Types → Loader implementation → Page integration → Error handling

## Validation Commands
```bash
# Type check
pnpm typecheck

# Verify loader compiles
pnpm --filter web build

# Manual verification
# 1. Start dev server: pnpm dev
# 2. Log in as user with course progress
# 3. Check Network tab for data fetching
```

## Related Files
- Initiative: `../initiative.md`
- Existing loader pattern: `apps/web/app/home/[account]/_lib/server/team-account-workspace.loader.ts`
- Course progress table: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Survey responses table: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql`
