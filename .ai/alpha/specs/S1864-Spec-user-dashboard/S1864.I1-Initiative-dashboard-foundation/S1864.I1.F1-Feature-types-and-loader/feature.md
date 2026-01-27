# Feature: Types and Data Loader

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I1 |
| **Feature ID** | S1864.I1.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Create TypeScript type definitions for all 7 dashboard widget data structures and implement a parallel-fetching data loader using `Promise.all()` with React `cache()` wrapper. This establishes the foundation data flow for the entire dashboard.

## User Story
**As a** developer building dashboard widgets
**I want to** have well-defined TypeScript types and a performant data loader
**So that** I can implement widgets with type safety and optimal data fetching

## Acceptance Criteria

### Must Have
- [ ] TypeScript types defined for all 7 widget data structures (CourseProgress, Assessment, KanbanSummary, ActivityFeed, QuickActions, CoachingSessions, Presentations)
- [ ] `DashboardData` interface aggregating all widget types
- [ ] `loadDashboardPageData()` function using `Promise.all()` for parallel fetching
- [ ] React `cache()` wrapper for request deduplication
- [ ] Placeholder loader functions returning `null` for each widget (to be implemented in future initiatives)
- [ ] Server-only import enforced with `import 'server-only'`
- [ ] TypeScript compiles without errors

### Nice to Have
- [ ] JSDoc comments documenting each type and function

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | `dashboard-page.loader.ts` | New |
| **Data** | `dashboard-types.ts` | New |
| **Database** | N/A (uses existing tables) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow established loader patterns from `admin-dashboard.loader.ts` and `members-page.loader.ts`. Use placeholder loaders returning `null` to enable incremental widget implementation.

### Key Architectural Choices
1. Use `Promise.all()` for parallel fetching (60-80% faster than sequential)
2. Wrap loader with React `cache()` for request deduplication
3. Use `createServiceLogger` for structured error logging

### Trade-offs Accepted
- Placeholder loaders return `null` instead of mock data (simpler, widgets handle empty states)

## Required Credentials
> None required - this feature only defines types and placeholder loaders

## Dependencies

### Blocks
- F2: Dashboard Page Shell (needs loader function)
- F3: Responsive Grid Layout (needs types for data prop)
- F4: Skeleton Loading (no direct dependency, but conceptually related)

### Blocked By
- None (this is the foundation feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/dashboard-types.ts` - TypeScript type definitions
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Data loader with parallel fetching

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create types file**: Define all 7 widget interfaces and DashboardData aggregate type
2. **Create loader file**: Implement loadDashboardPageData with Promise.all and cache wrapper
3. **Add placeholder loaders**: Create 7 placeholder functions returning null
4. **Add logging**: Integrate createServiceLogger for error handling
5. **Verify compilation**: Run pnpm typecheck to ensure types are valid

### Suggested Order
1. Types file first (loaders depend on types)
2. Loader file with placeholder functions
3. Verify with typecheck

## Validation Commands
```bash
# Verify TypeScript compiles
pnpm typecheck

# Check for server-only import
grep -r "import 'server-only'" apps/web/app/home/\(user\)/_lib/server/

# Verify loader function exists
grep -r "loadDashboardPageData" apps/web/app/home/\(user\)/_lib/server/
```

## Related Files
- Initiative: `../initiative.md`
- Pattern reference: `packages/features/admin/src/lib/server/loaders/admin-dashboard.loader.ts`
- Pattern reference: `apps/web/app/home/[account]/members/_lib/server/members-page.loader.ts`
