# Feature: Skeleton Loading States

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I1 |
| **Feature ID** | S1864.I1.F4 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 4 |

## Description
Create skeleton loading components that match the dashboard grid layout structure. These skeletons display during initial page load while data is being fetched, providing visual feedback and preventing layout shift.

## User Story
**As a** user waiting for my dashboard to load
**I want to** see placeholder shapes matching the final layout
**So that** I know content is loading and the page doesn't jump around

## Acceptance Criteria

### Must Have
- [ ] Skeleton matches 3-3-1 grid layout structure
- [ ] Each widget skeleton has Card structure (header + content area)
- [ ] Skeleton displays during initial page load (Suspense fallback)
- [ ] Uses `@kit/ui/skeleton` component with animate-pulse
- [ ] Responsive layout matches DashboardGrid breakpoints
- [ ] Full-width skeleton for 7th widget position

### Nice to Have
- [ ] Skeleton heights approximate actual widget heights
- [ ] Smooth transition from skeleton to real content

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `dashboard-skeleton.tsx` | New |
| **Logic** | N/A | N/A |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Mirror the DashboardGrid structure exactly using Skeleton components inside Card containers. Keep it simple with consistent sizing.

### Key Architectural Choices
1. Same grid classes as DashboardGrid for layout consistency
2. Card + Skeleton composition for each widget
3. Fixed skeleton heights (will refine as widgets are implemented)
4. No JavaScript - pure CSS animation

### Trade-offs Accepted
- Generic skeleton heights (may not match exact widget heights initially)

## Required Credentials
> None required - this is a pure UI component

## Dependencies

### Blocks
- None (F2 uses this as Suspense fallback)

### Blocked By
- None (can be developed in parallel with F3)

### Parallel With
- F3: Responsive Grid Layout (same grid structure)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-skeleton.tsx` - Skeleton loading component

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create component file**: Set up dashboard-skeleton.tsx
2. **Implement grid layout**: Match DashboardGrid responsive classes exactly
3. **Create widget skeleton**: Reusable skeleton matching Card structure
4. **Add 7 skeleton positions**: Place skeletons in correct grid positions
5. **Test loading state**: Verify skeleton displays during data fetch

### Suggested Order
1. Create component file
2. Copy grid layout from DashboardGrid
3. Create WidgetSkeleton sub-component
4. Test with slow network in dev tools

## Validation Commands
```bash
# Verify component compiles
pnpm typecheck

# Start dev server
pnpm dev

# Test loading state:
# 1. Open browser dev tools
# 2. Go to Network tab
# 3. Set throttling to "Slow 3G"
# 4. Navigate to /home
# 5. Verify skeleton displays during load
```

## Related Files
- Initiative: `../initiative.md`
- Skeleton component: `packages/ui/src/shadcn/skeleton.tsx`
- Skeleton patterns: `apps/dev-tool/app/components/components/skeleton-story.tsx`
