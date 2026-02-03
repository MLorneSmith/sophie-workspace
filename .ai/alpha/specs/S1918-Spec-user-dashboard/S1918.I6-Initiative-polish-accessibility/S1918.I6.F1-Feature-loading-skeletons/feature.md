# Feature: Loading Skeletons

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I6 |
| **Feature ID** | S1918.I6.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Create skeleton loading states for all 7 dashboard widgets that match their final layouts. Skeletons provide visual feedback during async data loading, reducing perceived latency and preventing layout shift.

## User Story
**As a** dashboard user
**I want to** see loading skeletons that match widget layouts while data loads
**So that** I understand content is loading and experience a smooth, professional interface

## Acceptance Criteria

### Must Have
- [ ] Skeleton component for Course Progress Radial widget (circular shape)
- [ ] Skeleton component for Skills Spider Diagram widget (radar shape outline)
- [ ] Skeleton component for Quick Actions Panel widget (4 button placeholders)
- [ ] Skeleton component for Kanban Summary widget (card with task placeholders)
- [ ] Skeleton component for Presentations Table widget (table rows)
- [ ] Skeleton component for Activity Feed widget (timeline items)
- [ ] Skeleton component for Coaching Sessions widget (session cards)
- [ ] All skeletons use `animate-pulse` from Tailwind
- [ ] Skeletons match exact dimensions of populated widgets
- [ ] Dark mode support for all skeleton backgrounds

### Nice to Have
- [ ] Staggered animation delays for visual interest
- [ ] Skeleton wrapper component for consistent patterns

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | 7 skeleton components (`*-skeleton.tsx`) | New |
| **Logic** | Conditional rendering in widget wrappers | Modify |
| **Data** | N/A (skeletons show during loading) | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Create dedicated skeleton components per widget
**Rationale**: Each widget has unique layout; dedicated skeletons ensure accurate representation. Matches existing Kanban skeleton pattern from codebase exploration.

### Key Architectural Choices
1. Use existing `Skeleton` component from `@kit/ui/skeleton` as base
2. Compose skeletons to match each widget's grid/flex layout exactly
3. Export from widget's `_components/` directory for co-location

### Trade-offs Accepted
- 7 separate files vs. one generic skeleton (better accuracy, slightly more code)

## Required Credentials
> None required - purely UI components

## Dependencies

### Blocks
- None

### Blocked By
- S1918.I3.F1: Course Progress Radial widget (need layout to match)
- S1918.I3.F2: Skills Spider Diagram widget (need layout to match)
- S1918.I4.F1: Quick Actions Panel widget (need layout to match)
- S1918.I4.F2: Kanban Summary widget (need layout to match)
- S1918.I4.F3: Presentations Table widget (need layout to match)
- S1918.I4.F4: Activity Feed widget (need layout to match)
- S1918.I5.F2: Coaching Sessions widget (need layout to match)

### Parallel With
- F2: Error Boundaries (independent)
- F3: Accessibility Compliance (independent)
- F4: E2E Test Suite (independent)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/skeletons/course-progress-skeleton.tsx`
- `apps/web/app/home/(user)/_components/skeletons/skills-spider-skeleton.tsx`
- `apps/web/app/home/(user)/_components/skeletons/quick-actions-skeleton.tsx`
- `apps/web/app/home/(user)/_components/skeletons/kanban-summary-skeleton.tsx`
- `apps/web/app/home/(user)/_components/skeletons/presentations-table-skeleton.tsx`
- `apps/web/app/home/(user)/_components/skeletons/activity-feed-skeleton.tsx`
- `apps/web/app/home/(user)/_components/skeletons/coaching-sessions-skeleton.tsx`
- `apps/web/app/home/(user)/_components/skeletons/index.ts` (barrel export)

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and use skeletons in Suspense boundaries

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create circular skeleton for course progress**: Circular shape matching RadialBarChart
2. **Create radar skeleton for skills spider**: Hexagonal/circular outline shape
3. **Create quick actions skeleton**: 4 button placeholders in 2x2 grid
4. **Create kanban summary skeleton**: Card with header + task line placeholders
5. **Create table skeleton**: Header row + 3-5 row placeholders
6. **Create activity feed skeleton**: Timeline with 5 item placeholders
7. **Create coaching sessions skeleton**: 1-2 session card placeholders
8. **Create barrel export file**: Export all skeletons from index.ts
9. **Integrate skeletons with dashboard**: Add Suspense boundaries with skeleton fallbacks

### Suggested Order
1. Barrel export file (T8 - foundation)
2. Individual skeleton components (T1-T7 - parallel)
3. Dashboard integration (T9 - final)

## Validation Commands
```bash
# Verify skeleton files exist
ls -la apps/web/app/home/(user)/_components/skeletons/

# Type check
pnpm typecheck

# Lint
pnpm lint

# Visual verification (manual)
# 1. Start dev server: pnpm dev
# 2. Add artificial delay to loader
# 3. Verify skeletons render correctly
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `packages/ui/src/shadcn/skeleton.tsx`
- Pattern: `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` (loading state)
