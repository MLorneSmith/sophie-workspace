# Feature: Responsive Grid Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I1 |
| **Feature ID** | S1823.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Implement the responsive CSS Grid layout system for the dashboard following a 3-3-1 pattern (3 widget rows, 3-column on desktop, 1-column on mobile). This creates named grid areas for widgets with smooth responsive transitions across mobile, tablet, and desktop breakpoints.

## User Story
**As a** user viewing my dashboard
**I want to** see widgets arranged optimally for my screen size
**So that** I can scan information quickly regardless of device

## Acceptance Criteria

### Must Have
- [ ] Grid layout with responsive breakpoints: 1-col (mobile), 2-col (tablet md:), 3-col (desktop xl:)
- [ ] Widget slots defined for: CourseProgress, Assessment, KanbanSummary, ActivityFeed, QuickActions, CoachingSessions, PresentationTable
- [ ] Consistent gap spacing between widgets (gap-4 or gap-6)
- [ ] Grid container animates in with `animate-in fade-in`
- [ ] Each slot renders a placeholder `Card` component ready for widget implementation

### Nice to Have
- [ ] Named grid areas for explicit widget placement
- [ ] Full-width row for PresentationTable at bottom

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | DashboardGrid component | New |
| **Logic** | Responsive CSS classes | New |
| **Data** | Receives props from page | Depends on F2 |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow the responsive grid pattern from `dashboard-demo-charts.tsx` using Tailwind CSS Grid utilities. Use simple CSS Grid with `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` pattern proven in codebase.

### Key Architectural Choices
1. CSS Grid with Tailwind utilities (not CSS Grid Template Areas)
2. Simple responsive classes: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
3. Widget slots as named prop receivers, not hardcoded components
4. Uses Card wrapper for each widget slot

### Trade-offs Accepted
- Simple column-based grid vs complex named areas (simpler to maintain)
- Fixed widget order in grid vs drag-and-drop (scope appropriate for MVP)

## Required Credentials

None required.

## Dependencies

### Blocks
- F4: Skeleton Loading (needs grid structure for skeleton layout)
- S1823.I2: All progress/assessment widgets (render inside grid slots)
- S1823.I3: All activity/task widgets (render inside grid slots)
- S1823.I4: Coaching widget (renders inside grid slot)
- S1823.I5.F1: Presentation table (renders in full-width slot)

### Blocked By
- F1: Types and Loader (needs types for widget props)
- F2: Dashboard Page Shell (needs page container)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` - Main grid layout component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render DashboardGrid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create DashboardGrid component**: Define component with responsive grid classes
2. **Define widget slot props**: TypeScript interface for widget slot components
3. **Implement top row**: CourseProgress + Assessment + KanbanSummary (3 widgets)
4. **Implement middle row**: ActivityFeed + QuickActions + CoachingSessions (3 widgets)
5. **Implement bottom row**: Full-width PresentationTable
6. **Add placeholder cards**: Temporary Card components for empty slots
7. **Add animation**: Include `animate-in fade-in` classes
8. **Integrate with page**: Update page.tsx to render DashboardGrid

### Suggested Order
1. Component structure with grid classes (T1)
2. Widget slot props interface (T2)
3. Row implementations with placeholders (T3-T5)
4. Animation and polish (T6-T7)
5. Page integration (T8)

## Validation Commands
```bash
# TypeScript compilation check
pnpm --filter web typecheck

# Verify component exists
ls -la apps/web/app/home/\(user\)/_components/dashboard-grid.tsx

# Visual validation (requires dev server and browser)
# Check at: http://localhost:3000/home
# Resize browser to verify responsive breakpoints
```

## Related Files
- Initiative: `../initiative.md`
- Grid reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
- Card component: `packages/ui/src/shadcn/card.tsx`
- Existing AI dashboard layout: `apps/web/app/home/(user)/ai/_components/AIWorkspaceDashboard.tsx`
