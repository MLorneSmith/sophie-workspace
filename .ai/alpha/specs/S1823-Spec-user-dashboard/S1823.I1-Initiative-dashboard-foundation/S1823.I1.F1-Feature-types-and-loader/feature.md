# Feature: Dashboard TypeScript Types & Loader

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I1 |
| **Feature ID** | S1823.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Define comprehensive TypeScript interfaces for all dashboard data types (course progress, assessment scores, activity feed, tasks, presentations) and create a unified data loader with parallel fetching via `Promise.all()`. This feature establishes the type safety and data infrastructure that all dashboard widgets depend on.

## User Story
**As a** developer building dashboard widgets
**I want to** have strongly-typed data interfaces and a centralized data loader
**So that** I can build widgets with confidence and optimal performance

## Acceptance Criteria

### Must Have
- [ ] TypeScript interfaces defined for: `DashboardCourseProgress`, `DashboardAssessmentScore`, `DashboardActivityItem`, `DashboardTask`, `DashboardPresentation`
- [ ] Unified loader function `loadDashboardData()` fetches all data in parallel with `Promise.all()`
- [ ] Loader returns typed `DashboardData` object with all widget data
- [ ] Individual loader functions exported for selective fetching
- [ ] All types exported from a central barrel file

### Nice to Have
- [ ] JSDoc comments on all interfaces describing each field
- [ ] Type guards for runtime validation

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | TypeScript interfaces | New |
| **Data** | Dashboard data loader | New |
| **Database** | Existing tables | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow existing loader patterns from `load-user-workspace.ts` and team dashboard loaders. Use React `cache()` for per-request memoization and `Promise.all()` for parallel fetching.

### Key Architectural Choices
1. Single unified loader with parallel fetching (60-80% faster than sequential)
2. Individual loaders exported for selective use by widgets
3. Types centralized in single file for easy imports

### Trade-offs Accepted
- Slightly more complex loader vs simpler sequential fetching (justified by performance gains)

## Required Credentials

None required - all data fetched from internal Supabase tables.

## Dependencies

### Blocks
- F2: Dashboard Page Shell (needs loader function)
- F3: Responsive Grid Layout (needs types for widget props)
- F4: Skeleton Loading (needs types for skeleton structure)
- S1823.I2.F1: Course Progress Widget (needs `DashboardCourseProgress` type)
- S1823.I2.F2: Assessment Spider Widget (needs `DashboardAssessmentScore` type)
- S1823.I3.F1: Kanban Summary Widget (needs `DashboardTask` type)
- S1823.I3.F3: Activity Feed Widget (needs `DashboardActivityItem` type)
- S1823.I5.F1: Presentation Table Widget (needs `DashboardPresentation` type)

### Blocked By
- None (root feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/dashboard.types.ts` - TypeScript interfaces
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Unified data loader

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define course progress types**: Create `DashboardCourseProgress` interface based on `course_progress` table
2. **Define assessment types**: Create `DashboardAssessmentScore` interface for survey responses
3. **Define activity types**: Create `DashboardActivityItem` interface for activity feed
4. **Define task types**: Create `DashboardTask` interface based on kanban tasks
5. **Define presentation types**: Create `DashboardPresentation` interface
6. **Create individual loaders**: Implement loader functions for each data type
7. **Create unified loader**: Implement `loadDashboardData()` with `Promise.all()`
8. **Export barrel file**: Create index.ts exporting all types and loaders

### Suggested Order
1. Types first (T1-T5 in parallel)
2. Individual loaders (T6, depends on types)
3. Unified loader (T7, depends on individual loaders)
4. Exports (T8, final step)

## Validation Commands
```bash
# TypeScript compilation check
pnpm --filter web typecheck

# Verify exports work
grep -r "dashboard.types" apps/web/app/home/\(user\)/

# Verify loader is importable
grep -r "loadDashboardData" apps/web/app/home/\(user\)/
```

## Related Files
- Initiative: `../initiative.md`
- Existing loader pattern: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- Team loader pattern: `apps/web/app/home/[account]/_lib/server/team-account-workspace.loader.ts`
