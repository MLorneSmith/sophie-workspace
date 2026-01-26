# Feature: Skeleton Loading States

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I1 |
| **Feature ID** | S1823.I1.F4 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 4 |

## Description
Create grid-aware skeleton loading components that match the dashboard layout structure. Implement Suspense boundaries for streaming server component rendering, providing smooth perceived performance while data loads.

## User Story
**As a** user loading my dashboard
**I want to** see skeleton placeholders that match the final layout
**So that** the page feels fast and I understand what content is coming

## Acceptance Criteria

### Must Have
- [ ] `DashboardSkeleton` component matches `DashboardGrid` structure
- [ ] Each widget slot has appropriate skeleton (card header + content placeholder)
- [ ] Skeleton uses existing `Skeleton` component from `@kit/ui/skeleton`
- [ ] Loading.tsx file exports skeleton for route-level loading
- [ ] Skeletons animate with `animate-pulse` (default from Skeleton component)

### Nice to Have
- [ ] Suspense boundaries around individual widget groups for progressive loading
- [ ] Staggered animation for skeleton appearance

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | DashboardSkeleton component | New |
| **Logic** | Suspense boundaries | New |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow skeleton patterns from `skeleton-story.tsx` examples in dev-tool. Use the existing Skeleton component and Card wrapper. Match grid structure exactly for seamless transition.

### Key Architectural Choices
1. Use `@kit/ui/skeleton` component (not raw divs with animate-pulse)
2. Mirror exact grid structure from DashboardGrid
3. Card + CardHeader + CardContent structure for each skeleton
4. Route-level loading.tsx for initial page load

### Trade-offs Accepted
- Single skeleton for whole grid vs individual widget skeletons (simpler, sufficient for MVP)

## Required Credentials

None required.

## Dependencies

### Blocks
- S1823.I5.F2: Empty States Polish (may reuse skeleton patterns)

### Blocked By
- F3: Responsive Grid Layout (needs grid structure to mirror)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-skeleton.tsx` - Grid-aware skeleton component

### Modified Files
- `apps/web/app/home/(user)/loading.tsx` - Update to use DashboardSkeleton (optional, may keep GlobalLoader)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create DashboardSkeleton component**: Match DashboardGrid structure with Skeleton components
2. **Implement widget card skeleton**: Reusable skeleton card with header and content areas
3. **Implement chart skeleton**: Skeleton for chart-type widgets (taller content area)
4. **Implement table skeleton**: Skeleton for PresentationTable (rows pattern)
5. **Add to loading.tsx**: Export DashboardSkeleton for route loading
6. **Test loading states**: Verify skeleton renders during slow data fetch

### Suggested Order
1. Base skeleton component (T1)
2. Widget card variants (T2-T4)
3. Loading.tsx integration (T5)
4. Testing and polish (T6)

## Validation Commands
```bash
# TypeScript compilation check
pnpm --filter web typecheck

# Verify component exists
ls -la apps/web/app/home/\(user\)/_components/dashboard-skeleton.tsx

# Visual validation - add artificial delay to loader and observe skeleton
# In dashboard-page.loader.ts, temporarily add:
# await new Promise(resolve => setTimeout(resolve, 3000));
```

## Related Files
- Initiative: `../initiative.md`
- Skeleton component: `packages/ui/src/shadcn/skeleton.tsx`
- Skeleton examples: `apps/dev-tool/app/components/components/skeleton-story.tsx`
- Grid layout: `apps/web/app/home/(user)/_components/dashboard-grid.tsx` (created in F3)
- Existing loading: `apps/web/app/home/(user)/loading.tsx`
