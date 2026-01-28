# Feature: Widget Loading & Empty States

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I2 |
| **Feature ID** | S1877.I2.F3 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 3 |

## Description

Shared loading and empty state infrastructure for all dashboard widgets. Provides consistent Skeleton components during data fetch and contextual empty states with relevant CTAs when no data exists.

## User Story

**As a** Learning Lauren (dashboard user)
**I want to** see loading indicators and helpful empty states when data isn't available
**So that** I understand the app is working and know what actions to take when content is missing

## Acceptance Criteria

### Must Have
- [ ] Skeleton component wraps each widget during loading state
- [ ] Empty states display for each widget type (course, assessment)
- [ ] Course progress empty state shows "Start Course" CTA
- [ ] Assessment empty state shows "Complete Assessment" CTA
- [ ] Skeleton matches widget dimensions and structure
- [ ] Loading state uses fade-in animation for smooth transitions
- [ ] Empty states provide clear next actions

### Nice to Have
- [ ] Skeleton shimmer effect (not just solid gray)
- [ ] Empty state illustrations/icons
- [ ] Different empty state messages based on user context (first-time vs returning user)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | WidgetSkeleton, EmptyState | New |
| **Logic** | LoadingStateProvider | New |
| **Data** | None (state management only) | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Minimal
**Rationale**: Leverage existing Skeleton from @kit/ui. Create simple boolean loading state per widget. No complex state management needed - local state is sufficient for widget-level loading.

### Key Architectural Choices

1. **Use existing Skeleton component** - @kit/ui/skeleton provides standard loading UI
2. **Local state per widget** - Each widget manages its own loading state, no global state needed
3. **Conditional rendering pattern** - `{isLoading ? <Skeleton /> : <Widget />}` keeps components simple
4. **Empty state as separate component** - Reusable across widgets with context-specific CTAs

### Trade-offs Accepted
- No staggered loading (all widgets show skeleton simultaneously)
- Empty states are simple (no complex onboarding flows)
- Skeleton structure hardcoded per widget type

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Skeleton wrapper | `Skeleton` from `@kit/ui/skeleton` | shadcn/ui | Standard loading pattern, already installed |
| Empty state container | Custom with `Card`, `CardContent` from `@kit/ui/card` | shadcn/ui | Matches widget layout structure |
| CTA buttons | `Button` from `@kit/ui/button` | shadcn/ui | Consistent button styles |
| Icons | `ArrowRight`, `BookOpen`, `ClipboardCheck` from `lucide-react` | lucide-react | Visual context for CTAs |

**Components to Install** (if not already in packages/ui):
- None (all required components confirmed existing)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | No external APIs or services used | N/A |

## Dependencies

### Blocks
- None (foundation feature)

### Blocked By
- S1877.I1 (Dashboard Foundation - provides grid container and page structure)

### Parallel With
- S1877.I2.F1 (Course Progress Widget - consumes skeleton states)
- S1877.I2.F2 (Assessment Spider Chart - consumes skeleton states)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/widget-skeleton.tsx` - Reusable skeleton wrapper
- `apps/web/app/home/(user)/_components/dashboard/empty-course-state.tsx` - Course empty state with CTA
- `apps/web/app/home/(user)/_components/dashboard/empty-assessment-state.tsx` - Assessment empty state with CTA

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard/course-progress-widget.tsx` - Integrate skeleton and empty states
- `apps/web/app/home/(user)/_components/dashboard/assessment-spider-widget.tsx` - Integrate skeleton and empty states

## Task Hints

> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create WidgetSkeleton component**: Generic skeleton wrapper matching widget dimensions
2. **Build empty course state**: Card with "Start Course" CTA and descriptive text
3. **Build empty assessment state**: Card with "Complete Assessment" CTA and description
4. **Integrate into widgets**: Wrap both course progress and assessment spider chart widgets

### Suggested Order
1. Create reusable WidgetSkeleton first
2. Create both empty state components in parallel
3. Integrate into existing widgets

## Validation Commands

```bash
# Verify skeleton renders during loading
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "skeleton"

# Verify empty states display when no data
# Typecheck after implementation
pnpm typecheck

# Verify CTAs link to correct pages (manual testing)
```

## Related Files

- Initiative: `../initiative.md`
- Foundation: `../../S1877.I1-Initiative-dashboard-foundation/`
- Reusable Components: `Skeleton` from `packages/ui/src/shadcn/skeleton.tsx`
