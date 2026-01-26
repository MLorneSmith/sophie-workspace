# Feature: Skeleton Loading States

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I1 |
| **Feature ID** | S1815.I1.F4 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 4 |

## Description
Create dashboard-specific skeleton loading component that matches the grid layout structure. Update the existing `loading.tsx` to use the new skeleton instead of `GlobalLoader` for a polished loading experience.

## User Story
**As a** SlideHeroes user with slow connection
**I want to** see meaningful loading placeholders
**So that** I know the dashboard is loading and what to expect

## Acceptance Criteria

### Must Have
- [ ] `DashboardSkeleton` component matching grid layout structure
- [ ] Row 1: 3 skeleton cards matching widget sizes
- [ ] Row 2: 3 skeleton cards matching widget sizes
- [ ] Row 3: Full-width skeleton card with table-like placeholder rows
- [ ] Update `loading.tsx` to export `DashboardSkeleton`
- [ ] Uses `@kit/ui/skeleton` component for placeholders

### Nice to Have
- [ ] Skeleton card heights roughly match actual widget heights
- [ ] Skeleton pulse animation visible

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `dashboard-skeleton.tsx`, `loading.tsx` | New / Modify |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Dedicated Skeleton Component
**Rationale**: Create reusable skeleton that can be used in both `loading.tsx` (route-level) and as Suspense fallback. Match grid structure exactly for smooth visual transition.

### Key Architectural Choices
1. Extract reusable `SkeletonCard` helper for consistency
2. Table skeleton uses multiple `h-12` skeleton rows to simulate table data
3. Use same grid classes as `DashboardGrid` for identical layout during loading

### Trade-offs Accepted
- Static skeleton heights may not perfectly match dynamic content heights
- No widget-specific skeleton customization (all cards look similar)

## Required Credentials
> None required

## Dependencies

### Blocks
- None (final feature in initiative)

### Blocked By
- F3: Responsive Grid Layout (needs grid structure to match)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-skeleton.tsx` - Skeleton component matching grid layout

### Modified Files
- `apps/web/app/home/(user)/loading.tsx` - Replace GlobalLoader with DashboardSkeleton

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Skeleton bars | Skeleton | @kit/ui/skeleton | Standard skeleton pattern |
| Card containers | Card, CardHeader, CardContent | @kit/ui/card | Consistent with widgets |

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create SkeletonCard helper**: Reusable skeleton card component with header and content placeholders
2. **Create DashboardSkeleton component**: Assemble skeleton grid with 3+3+1 layout
3. **Create table skeleton variant**: Full-width skeleton for presentations table area
4. **Update loading.tsx**: Import and export DashboardSkeleton
5. **Test loading state**: Manually verify skeleton appears during slow loads

### Suggested Order
T1 (SkeletonCard helper), T3 (table variant), T2 (assemble), T4 (loading.tsx), T5 (test)

## Validation Commands
```bash
# Verify skeleton compiles
pnpm typecheck

# Test loading state by adding artificial delay to loader
# (temporarily add: await new Promise(r => setTimeout(r, 3000)))
pnpm dev
# Navigate to /home and verify skeleton appears
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `packages/ui/src/shadcn/skeleton.tsx`
- Grid: `apps/web/app/home/(user)/_components/dashboard-grid.tsx` (from F3)
- Current loading: `apps/web/app/home/(user)/loading.tsx`
