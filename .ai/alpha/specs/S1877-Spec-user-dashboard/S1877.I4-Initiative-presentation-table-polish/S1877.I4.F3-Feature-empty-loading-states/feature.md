# Feature: Empty and Loading States

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I4 |
| **Feature ID** | S1877.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 3 |

## Description

Provides polished empty states and loading skeletons for the presentation table widget. When users have no presentations, they see a helpful empty state with a "Create First Presentation" call-to-action. During data fetching, skeleton rows provide visual feedback and reduce perceived load time.

## User Story

**As a** Learning Lauren (new user starting fresh)

**I want to** see a clear empty state with guidance when I have no presentations

**So that** I understand I can create presentations and know how to get started

## Acceptance Criteria

### Must Have
- [ ] Empty state displays when presentation list is empty (zero results)
- [ ] Empty state includes "No presentations yet" heading
- [ ] Empty state includes "Create First Presentation" button linking to `/home/(user)/ai/blocks`
- [ ] Skeleton rows display during initial data fetch (3-5 skeleton rows)
- [ ] Skeleton matches table column structure (title, type, updated, actions)
- [ ] Skeleton uses `Skeleton` component from `@kit/ui/shadcn`
- [ ] Loading state shows skeleton only, not partial content
- [ ] Empty state disappears when presentations are loaded

### Nice to Have
- [ ] Empty state includes illustration/icon for visual interest
- [ ] Empty state includes helpful text: "Create your first presentation to get started with AI-powered outline generation"

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `EmptyState` from `@kit/ui/makerkit` | Existing |
| **UI** | `Skeleton` from `@kit/ui/shadcn` | Existing |
| **UI** | `TableSkeletonRows` | New (wraps Skeleton) |
| **UI** | `PresentationEmptyState` | New (EmptyState + content) |
| **Logic** | Loading state management | New (isLoading flag) |
| **Logic** | Empty state condition | New (data.length === 0) |

## Architecture Decision

**Approach**: Minimal

**Rationale**: Leverage existing `EmptyState` and `Skeleton` components with minimal custom wrapper. Empty state is a conditional render based on data length, loading state is controlled by an `isLoading` flag passed from parent.

### Key Architectural Choices

1. **Conditional Rendering**: Use ternary operator or `If` component to switch between loading skeleton, empty state, and data table.
2. **Skeleton Structure**: Match table column layout (4 columns) for smooth loading-to-content transition.
3. **EmptyState Component**: Use existing `@kit/ui/makerkit/empty-state.tsx` with custom heading, text, and button.
4. **Loading State**: Parent widget manages `isLoading` state from fetch operation, passes down to table component.

### Trade-offs Accepted

- **No animation transition**: Simple state switch without cross-fade animation. Future could add fade-in for smoother experience.

## Required Credentials

None required.

## Dependencies

### Blocks
- None

### Blocked By
- S1877.I4.F1 (Presentation Table Widget) - Requires base table component to add states

### Parallel With
- None (depends on F1)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/presentation-empty-state.tsx` - Empty state with CTA
- `apps/web/app/home/(user)/_components/table-skeleton-rows.tsx` - Loading skeleton matching table structure

### Modified Files
- `apps/web/app/home/(user)/_components/presentation-table-widget.tsx` - Add loading/empty state rendering logic

## Task Hints

### Candidate Tasks

1. **Create skeleton rows component**: 4-column skeleton matching table structure
2. **Create empty state component**: EmptyState with "Create First Presentation" button
3. **Add loading state**: Update widget to conditionally render skeleton when isLoading=true
4. **Add empty state**: Update widget to conditionally render empty state when data.length===0
5. **Test loading flow**: Verify skeleton shows on initial load, then transitions to data
6. **Test empty flow**: Verify empty state shows when no presentations exist

### Suggested Order

1. Create TableSkeletonRows component
2. Create PresentationEmptyState component
3. Update widget to handle loading state
4. Update widget to handle empty state
5. Test loading transition
6. Test empty state display

## Validation Commands

```bash
# Typecheck after implementation
pnpm typecheck

# Test empty state - via browser
# 1. Clear user's presentations (via DB or use test user with no data)
# 2. Navigate to /home
# 3. Verify empty state displays
# 4. Verify "Create First Presentation" button navigates to /home/(user)/ai/blocks

# Test loading state - via browser
# 1. Open Network tab in DevTools
# 2. Navigate to /home
# 3. Verify skeleton rows display before data loads
# 4. Verify skeleton rows match table column structure
```

## Related Files
- Initiative: `../initiative.md`
- F1 Presentation Table Widget: `../S1877.I4.F1-Feature-presentation-table-widget/feature.md`
- F2 Table Features: `../S1877.I4.F2-Feature-table-features-sorting-filtering-pagination/feature.md`
- Tasks: `./tasks.json` (created in next phase)
