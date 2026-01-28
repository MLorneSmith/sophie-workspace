# Feature: Skeleton & Empty State Infrastructure

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I1 |
| **Feature ID** | S1877.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 3 |

## Description

Creates widget placeholder components with Skeleton loading states and empty state handlers for all 6 widget positions. This ensures consistent loading and no-data experiences across all dashboard widgets.

## User Story

**As a** Learning Lauren (active user seeking presentation skills)
**I want to** see loading skeletons when dashboard is loading and helpful empty states when I have no data
**So that** I understand the app is working (not broken) and know what actions to take when starting fresh

## Acceptance Criteria

### Must Have

- [ ] Skeleton loading components for all 6 widget positions created
- [ ] Empty state components for each widget type with contextual messaging
- [ ] Skeletons use existing `Skeleton` component from `@kit/ui/skeleton`
- [ ] Empty states use existing `EmptyState` component from `@kit/ui/empty-state`
- [ ] Each skeleton matches expected widget dimensions and layout
- [ ] Empty states include contextual CTAs (e.g., "Start Course", "Create First Presentation")

### Nice to Have

- [ ] Skeleton animation matches system pulse speed
- [ ] Empty state variations for different scenarios (new user vs. no recent activity)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Skeletons, Empty states | New (using existing primitives) |
| **Logic** | Loading state management (via page prop) | New |
| **Data** | None (no data fetching) | N/A |
| **Database** | None (no DB changes) | N/A |

## Architecture Decision

**Approach**: Pragmatic - Reuse existing UI primitives, create widget-specific skeleton/empty wrappers
**Rationale**: `Skeleton` and `EmptyState` components already exist and are production-ready. Creating wrapper components for each widget ensures consistent experience without duplicating code.

### Key Architectural Choices

1. **Reuse Existing Primitives**: Use `@kit/ui/skeleton` and `@kit/ui/empty-state` directly
2. **Widget-Specific Wrappers**: Create separate skeleton/empty components for each widget type
3. **Loading Prop**: Each wrapper accepts `isLoading` prop to toggle between skeleton and content
4. **Empty State Context**: Empty states include widget-specific messaging and CTAs
5. **Dimension Matching**: Skeletons approximate final widget dimensions for smooth transitions

### Trade-offs Accepted

- Initial implementation creates 6 separate skeleton/empty components (some duplication acceptable for clarity)
- Skeletons are static (no complex placeholder animations beyond pulse)

## Required Credentials

> Environment variables required for this feature to function. Extracted from research files.

None required - uses only internal UI components.

## Dependencies

### Blocks
- S1877.I2 - Progress Widgets (requires course/assessment skeleton/empty states)
- S1877.I3 - Activity & Task Widgets (requires activity/task skeleton/empty states)
- S1877.I4 - Presentation Table & Polish (requires presentation table skeleton/empty states)

### Blocked By
- S1877.I1.F1 - Dashboard Page & Grid (needs widget containers from grid)

### Parallel With
- S1877.I1.F2 - Dashboard Data Loader (can develop simultaneously after F1)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/skeletons/course-progress-skeleton.tsx` - Course progress skeleton
- `apps/web/app/home/(user)/_components/dashboard/skeletons/assessment-spider-skeleton.tsx` - Assessment chart skeleton
- `apps/web/app/home/(user)/_components/dashboard/skeletons/kanban-summary-skeleton.tsx` - Kanban card skeleton
- `apps/web/app/home/(user)/_components/dashboard/skeletons/activity-feed-skeleton.tsx` - Activity feed skeleton
- `apps/web/app/home/(user)/_components/dashboard/skeletons/quick-actions-skeleton.tsx` - Quick actions panel skeleton
- `apps/web/app/home/(user)/_components/dashboard/empty-states/course-progress-empty.tsx` - Course progress empty
- `apps/web/app/home/(user)/_components/dashboard/empty-states/assessment-spider-empty.tsx` - Assessment chart empty
- `apps/web/app/home/(user)/_components/dashboard/empty-states/kanban-summary-empty.tsx` - Kanban card empty
- `apps/web/app/home/(user)/_components/dashboard/empty-states/activity-feed-empty.tsx` - Activity feed empty
- `apps/web/app/home/(user)/_components/dashboard/empty-states/quick-actions-empty.tsx` - Quick actions empty

### Modified Files
- None (new file additions only)

## Task Hints

> Guidance for the next decomposition phase

### Candidate Tasks

1. **Create skeleton components**: 6 skeleton components matching widget dimensions
2. **Create empty state components**: 6 empty state components with contextual CTAs
3. **Export from index**: Create `_components/dashboard/index.ts` to export all skeleton/empty components
4. **Integrate with page**: Update F1 page component to use skeletons when loading
5. **Add loading prop to page**: Pass `isLoading` state from data loading to trigger skeleton display

### Suggested Order

1. Create skeleton components for all 6 widget positions
2. Create empty state components for all 6 widget positions
3. Create barrel export file for easy imports
4. Integrate with page component from F1
5. Test loading state transitions

## Validation Commands

```bash
# Typecheck
pnpm typecheck

# Verify skeleton components render
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "skeleton\|loading"

# Visual test: verify skeleton animations and transitions
```

## Related Files

- Initiative: `../initiative.md`
- Spec: `../../spec.md`
- Tasks: `./S1877.I1.F3.T*-<slug>.md` (created in next phase)
