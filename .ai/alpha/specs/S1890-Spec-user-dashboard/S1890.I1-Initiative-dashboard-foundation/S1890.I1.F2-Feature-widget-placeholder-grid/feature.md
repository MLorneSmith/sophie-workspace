# Feature: Widget Placeholder Grid

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I1 |
| **Feature ID** | S1890.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 2 |

## Description
Implement skeleton loading placeholders for all 7 dashboard widget positions. These placeholders enable parallel widget development across I3-I6 initiatives and provide visual feedback during data loading.

## User Story
**As a** developer working on dashboard widgets
**I want to** see clearly defined placeholder positions for each widget
**So that** I can develop and test widgets independently while maintaining layout consistency

## Acceptance Criteria

### Must Have
- [ ] 7 skeleton placeholder components match planned widget dimensions
- [ ] Placeholders animate with Tailwind `animate-pulse` or shadcn Skeleton
- [ ] Each placeholder has unique data-testid for E2E targeting
- [ ] Placeholders display descriptive labels (dev mode only)
- [ ] Responsive behavior matches final widget layout

### Nice to Have
- [ ] Placeholder height matches expected widget content height
- [ ] Subtle border or shadow distinguishes placeholder from empty space

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | DashboardWidgetPlaceholder component | New |
| **Logic** | None (static placeholders) | N/A |
| **Data** | None | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Minimal - Single reusable placeholder component with size variants
**Rationale**: Placeholders are temporary; minimal code is appropriate. Will be replaced by actual widgets.

### Key Architectural Choices
1. Create single `DashboardWidgetPlaceholder` component with `size` prop for height variants
2. Use shadcn `Skeleton` component inside Card for consistent styling
3. Label only in development mode via `process.env.NODE_ENV`

### Trade-offs Accepted
- Fixed heights rather than content-driven (simpler, acceptable for placeholders)
- Labels hidden in production to avoid confusing users

## Required Credentials
> Environment variables required for this feature to function.

None required - this is a static UI component feature.

## Dependencies

### Blocks
- S1890.I3: Progress Widgets (needs placeholder structure)
- S1890.I4: Task & Activity Widgets (needs placeholder structure)
- S1890.I5: Action Widgets (needs placeholder structure)
- S1890.I6: Coaching Integration (needs placeholder structure)

### Blocked By
- F1: Dashboard Page & Layout (needs grid structure)

### Parallel With
- F3: Navigation & Routing (independent once F1 completes)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-widget-placeholder.tsx` - Reusable placeholder component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Replace placeholder divs with DashboardWidgetPlaceholder components

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create placeholder component**: DashboardWidgetPlaceholder with Card + Skeleton
2. **Add size variants**: small (200px), medium (280px), large (320px)
3. **Add dev mode labels**: Show widget name in dev mode only
4. **Integrate into page**: Replace placeholder divs with component instances
5. **Add data-testid attributes**: For E2E test targeting
6. **Verify animations**: Test pulse animation in light/dark mode

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6 (sequential)

## Validation Commands
```bash
# Verify placeholder component exists
test -f apps/web/app/home/\(user\)/_components/dashboard-widget-placeholder.tsx && echo "✓ Placeholder component exists"

# Verify 7 placeholders in page
grep -c "DashboardWidgetPlaceholder" apps/web/app/home/\(user\)/page.tsx | grep -q "7" && echo "✓ 7 placeholders"

# Verify data-testid attributes
grep -q 'data-testid="dashboard-widget-' apps/web/app/home/\(user\)/page.tsx && echo "✓ Test IDs present"

# Run typecheck
pnpm typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `packages/ui/src/shadcn/skeleton.tsx`
- Reference: `packages/ui/src/shadcn/card.tsx`
