# Feature: Widget Placeholder Slots

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I1 |
| **Feature ID** | S1918.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Create placeholder components for all 7 dashboard widget slots showing labeled placeholders that indicate where each widget will be implemented. These placeholders serve as visual guides during development and ensure the grid layout works correctly before actual widgets are built.

## User Story
**As a** developer working on the dashboard
**I want to** see clearly labeled placeholder slots for each widget
**So that** I can verify the grid layout works correctly and know exactly where each widget will be placed

## Acceptance Criteria

### Must Have
- [ ] 7 placeholder components created, one for each widget slot
- [ ] Each placeholder shows the widget name/purpose clearly
- [ ] Placeholders use Card component from shadcn/ui for consistent styling
- [ ] Row 1 placeholders: Course Progress, Skills Assessment, Kanban Summary
- [ ] Row 2 placeholders: Recent Activity, Quick Actions, Coaching Sessions
- [ ] Row 3 placeholder: Presentations Table (full width)
- [ ] All placeholders have minimum height to demonstrate layout
- [ ] Dark mode compatible styling
- [ ] Each placeholder exports a named component for future replacement

### Nice to Have
- [ ] Placeholders show brief description of what widget will contain
- [ ] Visual indicator of widget complexity (simple icon or badge)
- [ ] Dashed border to clearly show placeholder status

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | WidgetPlaceholder, Card | New + Existing |
| **Logic** | None (static display) | N/A |
| **Data** | None | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Create a reusable `WidgetPlaceholder` base component that accepts title and description props, then create 7 specific placeholder instances. This allows easy replacement when actual widgets are implemented while maintaining layout stability.

### Key Architectural Choices
1. Create base `WidgetPlaceholder` component with Card styling
2. Create individual widget placeholder files (can be single file with multiple exports)
3. Use dashed border and muted colors to indicate placeholder status
4. Include `data-testid` attributes for E2E testing
5. Each placeholder is in its own file for easy future replacement

### Trade-offs Accepted
- Creating individual files for placeholders (more files but cleaner replacement)
- Using static text instead of i18n (placeholders are developer-facing)

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| None required | Static placeholder components | N/A |

> No external credentials required for this feature.

## Dependencies

### Blocks
- S1918.I2: Data Layer (provides loaders that replace placeholders)
- S1918.I3: Progress Widgets (replaces Course Progress and Skills Assessment placeholders)
- S1918.I4: Activity & Task Widgets (replaces Activity, Kanban, Quick Actions placeholders)
- S1918.I5: Coaching Integration (replaces Coaching Sessions placeholder)

### Blocked By
- F2: Responsive Grid Layout (needs grid slots to place placeholders)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/widgets/widget-placeholder.tsx` - Base placeholder component
- `apps/web/app/home/(user)/_components/widgets/course-progress-placeholder.tsx` - Course Progress widget slot
- `apps/web/app/home/(user)/_components/widgets/skills-assessment-placeholder.tsx` - Skills Assessment widget slot
- `apps/web/app/home/(user)/_components/widgets/kanban-summary-placeholder.tsx` - Kanban Summary widget slot
- `apps/web/app/home/(user)/_components/widgets/recent-activity-placeholder.tsx` - Recent Activity widget slot
- `apps/web/app/home/(user)/_components/widgets/quick-actions-placeholder.tsx` - Quick Actions widget slot
- `apps/web/app/home/(user)/_components/widgets/coaching-sessions-placeholder.tsx` - Coaching Sessions widget slot
- `apps/web/app/home/(user)/_components/widgets/presentations-table-placeholder.tsx` - Presentations Table widget slot
- `apps/web/app/home/(user)/_components/widgets/index.ts` - Barrel export for all widgets

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` - Import and render placeholders
- `apps/web/app/home/(user)/page.tsx` - Import DashboardGrid with placeholders

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create base WidgetPlaceholder**: Reusable Card-based component with dashed border
2. **Create Row 1 placeholders**: Course Progress, Skills Assessment, Kanban Summary
3. **Create Row 2 placeholders**: Recent Activity, Quick Actions, Coaching Sessions
4. **Create Row 3 placeholder**: Presentations Table (full-width variant)
5. **Create barrel export**: index.ts exporting all placeholders
6. **Integrate with DashboardGrid**: Import and render all placeholders in correct positions
7. **Add data-testid attributes**: For E2E testing
8. **Verify dark mode**: Check styling in both themes

### Suggested Order
1. Base WidgetPlaceholder component
2. Row 1 placeholders (3 components)
3. Row 2 placeholders (3 components)
4. Row 3 placeholder (1 component, full-width)
5. Barrel export
6. DashboardGrid integration
7. Testing attributes and dark mode verification

## Validation Commands
```bash
# Verify widget directory exists
test -d apps/web/app/home/\(user\)/_components/widgets && echo "Widgets directory exists"

# Count placeholder files (should be 9: base + 7 widgets + index)
ls -la apps/web/app/home/\(user\)/_components/widgets/*.tsx 2>/dev/null | wc -l

# Check for Card import
grep -q "@kit/ui/card" apps/web/app/home/\(user\)/_components/widgets/widget-placeholder.tsx && echo "Card import found"

# Verify all placeholders imported in grid
grep -c "Placeholder" apps/web/app/home/\(user\)/_components/dashboard-grid.tsx

# Type check
pnpm typecheck

# Lint check
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `packages/ui/src/shadcn/card.tsx` (Card component)
- Reference: `packages/ui/src/makerkit/empty-state.tsx` (Empty state patterns)
