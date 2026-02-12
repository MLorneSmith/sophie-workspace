# Feature: Dashboard Loading Orchestrator

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I6 |
| **Feature ID** | S2072.I6.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description

Implements page-level loading orchestration for the dashboard using React Suspense boundaries and skeleton layouts. Provides a cohesive loading experience during initial page load, coordinating the transition from loading state to populated widgets. Widget-level loading states are handled by individual widgets (I2-I5); this feature handles the page-level shell.

## User Story
**As a** user navigating to the dashboard
**I want to** see a structured loading skeleton that matches the final layout
**So that** I understand what's coming and experience minimal layout shift

## Acceptance Criteria

### Must Have
- [ ] Dashboard page wrapped in Suspense boundary with loading fallback
- [ ] Loading fallback shows 3-3-1 grid layout with skeleton cards
- [ ] Skeleton cards use `Skeleton` component from `@kit/ui/skeleton`
- [ ] Loading skeleton matches actual widget dimensions (no layout shift)
- [ ] Smooth transition when content loads (no flash)
- [ ] Dark mode support for skeleton elements
- [ ] `prefers-reduced-motion` respected (no animation for users who prefer)

### Nice to Have
- [ ] Staggered reveal animation for widgets (after data loads)
- [ ] Loading progress indicator if data fetch takes >2s

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `DashboardLoadingSkeleton` (full grid skeleton) | New |
| **UI** | `WidgetSkeletonCard` (reusable skeleton card) | New |
| **Logic** | Suspense boundary wrapping in page.tsx | New |
| **Data** | N/A - Pure UI loading state | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal - Leverage existing Skeleton component with grid layout

**Rationale**:
- Use existing `Skeleton` component from `@kit/ui/skeleton` (already has pulse animation)
- Create a `DashboardLoadingSkeleton` component that renders the 3-3-1 grid with placeholder cards
- Wrap dashboard content in Next.js Suspense boundary
- Individual widgets (I2-I5) handle their own loading states with streaming

### Key Architectural Choices
1. Page-level Suspense in `page.tsx` with `loading.tsx` fallback pattern (Next.js convention)
2. Skeleton cards sized to match actual widgets to prevent CLS (Cumulative Layout Shift)
3. Widget skeletons do NOT replicate individual widget logic - generic placeholder only

### Trade-offs Accepted
- Generic skeleton shapes may not perfectly match each widget's content
- No staggered animation in MVP (can add later)

## Required Credentials
> No external credentials required for this feature.

| Variable | Description | Source |
|----------|-------------|--------|
| N/A | This feature is pure UI with no data dependencies | N/A |

## Dependencies

### Blocks
- S2072.I6.F2 (Accessibility Compliance) - needs loading skeleton for ARIA labels
- S2072.I6.F3 (Dashboard Integration Verification) - needs loading state to verify

### Blocked By
- S2072.I1.F2 (Responsive Grid Layout) - requires grid structure to match
- S2072.I1.F3 (Widget Placeholder Slots) - requires slot dimensions

### Parallel With
- None - this is the foundation for I6

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/dashboard-loading-skeleton.tsx` - Full grid skeleton component
- `apps/web/app/home/(user)/_components/dashboard/widget-skeleton-card.tsx` - Reusable skeleton card

### Modified Files
- `apps/web/app/home/(user)/loading.tsx` - Update to use DashboardLoadingSkeleton
- `apps/web/app/home/(user)/page.tsx` - Add Suspense boundaries around async widgets

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create WidgetSkeletonCard component**: Reusable skeleton card with configurable height
2. **Create DashboardLoadingSkeleton component**: 3-3-1 grid with skeleton cards
3. **Update loading.tsx**: Use DashboardLoadingSkeleton
4. **Add Suspense boundaries**: Wrap async widget components
5. **Test reduced motion**: Verify `prefers-reduced-motion` disables animation

### Suggested Order
1. Create WidgetSkeletonCard component
2. Create DashboardLoadingSkeleton
3. Update loading.tsx to use skeleton
4. Add Suspense boundaries to page.tsx
5. Test accessibility and reduced motion

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification - loading state
pnpm dev
# Navigate to /home with throttled network, verify skeleton appears

# Verify no layout shift (CLS)
# Use Chrome DevTools Performance panel, measure CLS

# Test reduced motion
# Enable "Reduce motion" in OS settings, verify no animation
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `packages/ui/src/shadcn/skeleton.tsx`
- Reference: `apps/web/app/home/(user)/loading.tsx` (existing)
- Research: `../../research-library/perplexity-dashboard-empty-states-ux.md`
