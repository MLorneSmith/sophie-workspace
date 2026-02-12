# Feature: Responsive Grid Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I1 |
| **Feature ID** | S2072.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 3 |

## Description

Implement the responsive 3-3-1 grid layout for the dashboard. The grid provides three rows: Row 1 (3 columns), Row 2 (3 columns), Row 3 (1 full-width column). Each grid cell contains a placeholder Card component ready for future widgets.

## User Story

**As a** user
**I want to** see a well-organized dashboard with widgets arranged in a grid
**So that** I can easily scan and understand my progress at a glance

## Acceptance Criteria

### Must Have
- [ ] 3-3-1 grid layout implemented with Tailwind CSS
- [ ] Responsive breakpoints: mobile (1 col), tablet (2 cols), desktop (3 cols)
- [ ] 7 placeholder Card components in correct positions:
  - Row 1: Course Progress, Skills Radar, Kanban Summary
  - Row 2: Activity Feed, Quick Actions, Coaching Sessions
  - Row 3: Presentations Table (full-width)
- [ ] Each placeholder has appropriate title and height
- [ ] Grid renders correctly in PageBody

### Nice to Have
- [ ] Consistent card heights within rows
- [ ] Hover effects on cards for interactivity hints

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | DashboardGrid component | New |
| **UI** | 7 placeholder Card components | New |
| **Logic** | Tailwind responsive classes | Existing |
| **Data** | None (placeholder content) | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Client Component with Tailwind Grid
**Rationale**: The grid is purely presentational. Using Tailwind's grid utilities provides responsive design out of the box. Cards are standard Card components from the UI library.

### Key Architectural Choices

1. **DashboardGrid component**: Reusable grid layout component in `_components/`
2. **Placeholder naming**: Cards named for their future widget purpose (e.g., CourseProgressCard)
3. **Responsive strategy**: Use `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` for Row 1-2, Row 3 always full-width

### Trade-offs Accepted

- Grid is a client component - minimal impact as it's purely presentational
- Cards are empty placeholders - acceptable as this is the foundation initiative

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card container | Card, CardHeader, CardTitle | @kit/ui/card | Standard card pattern |
| Row containers | div with grid classes | Tailwind | Native grid layout |
| Loading states | Skeleton | @kit/ui/skeleton | Already available |

**Components to Install**: None (all components exist)

### Grid Layout Specification

```
Desktop (>1024px):           Tablet (768-1024px):      Mobile (<768px):
┌─────────┬─────────┬──────┐  ┌─────────┬─────────┐     ┌─────────┐
│ Course  │ Skills  │ Kan  │  │ Course  │ Skills  │     │ Course  │
├─────────┼─────────┼──────┤  ├─────────┼─────────┤     ├─────────┤
│ Activity│ Actions │Coach │  │ Kanban  │ Activity│     │ Skills  │
├─────────┴─────────┴──────┤  ├─────────┴─────────┤     ...etc...
│    Presentations Table   │  │ Quick │ Coaching │     (stacked)
└──────────────────────────┘  ├───────┴──────────┤     ┌─────────┐
                              │ Presentations    │     │ Present │
                              └──────────────────┘     └─────────┘
```

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|

> None required - this feature only creates the grid layout

## Dependencies

### Blocks
- S2072.I2 features (widgets need grid slots)
- S2072.I3 features (widgets need grid slots)
- S2072.I4 features (widgets need grid slots)
- S2072.I5 features (widgets need grid slots)

### Blocked By
- S2072.I1.F2 (Dashboard Page Shell) - needs page to render into

### Parallel With
- None (must wait for page shell)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` - Grid layout component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add DashboardGrid to PageBody

## Task Hints

### Candidate Tasks
1. **Create DashboardGrid component**: Client component with grid layout
2. **Implement Row 1**: 3-column grid with Course, Skills, Kanban placeholders
3. **Implement Row 2**: 3-column grid with Activity, Actions, Coaching placeholders
4. **Implement Row 3**: Full-width Presentations placeholder
5. **Add responsive classes**: Tailwind breakpoint classes for responsive behavior
6. **Integrate with page**: Import and render DashboardGrid in page.tsx
7. **Test responsive layout**: Verify at all breakpoints

### Suggested Order
1. Create DashboardGrid component structure
2. Add placeholder Cards for each widget slot
3. Implement responsive grid classes
4. Integrate with page.tsx
5. Test responsive behavior

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification
pnpm dev
# Navigate to /home and check:
# - Desktop: 3-3-1 layout
# - Tablet: 2-column layout
# - Mobile: single column stacked
```

## Related Files
- Initiative: `../initiative.md`
- Page Shell: `../S2072.I1.F2-Feature-dashboard-page-shell/feature.md`
- Types: `../S2072.I1.F1-Feature-dashboard-types/feature.md`
- Reference: `packages/ui/src/shadcn/card.tsx`
