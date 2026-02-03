# Feature: Responsive Grid Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I1 |
| **Feature ID** | S1918.I1.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Implement the responsive CSS Grid layout for the user dashboard with a 3-row structure (3-3-1 pattern for desktop). The grid adapts across breakpoints: single column on mobile, 2 columns on tablet, and 3 columns on desktop. This creates the structural skeleton into which all 7 widgets will be placed.

## User Story
**As a** SlideHeroes user
**I want to** see a well-organized dashboard layout that adapts to my screen size
**So that** I can easily view all dashboard widgets regardless of my device

## Acceptance Criteria

### Must Have
- [ ] CSS Grid layout with 3 rows on desktop (3-3-1 widget pattern)
- [ ] Mobile breakpoint (<768px): Single column, stacked widgets
- [ ] Tablet breakpoint (768-1024px): 2 columns for top rows, full-width for bottom
- [ ] Desktop breakpoint (>1024px): 3-3-1 grid pattern
- [ ] Row 3 (presentations table) spans full width at all breakpoints
- [ ] Proper gap spacing between grid cells (Tailwind gap-4/gap-6)
- [ ] Dark mode compatible (no layout-specific colors)
- [ ] Grid container has proper padding/margins matching team dashboard

### Nice to Have
- [ ] CSS Grid named areas for semantic widget placement
- [ ] Animation on initial render (fade-in)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | DashboardGrid component | New |
| **Logic** | Responsive breakpoint handling | CSS/Tailwind |
| **Data** | None (layout only) | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use Tailwind CSS Grid classes directly matching patterns from `dashboard-demo-charts.tsx`. Create a dedicated `DashboardGrid` component to encapsulate the grid layout logic and make it reusable.

### Key Architectural Choices
1. Create `DashboardGrid` component in `_components/dashboard-grid.tsx`
2. Use Tailwind responsive utilities: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
3. Row 3 uses `col-span-full` or separate single-column grid section
4. Children passed as props for widget slots

### Trade-offs Accepted
- Using Tailwind classes instead of CSS Grid template areas (simpler but less semantic)
- Fixed 3-row structure (not customizable by user)

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| None required | Static layout component | N/A |

> No external credentials required for this feature.

## Dependencies

### Blocks
- F3: Widget Placeholder Slots (needs grid slots defined)

### Blocked By
- F1: Dashboard Page Shell (needs container to place grid in)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` - Grid layout component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and use DashboardGrid component

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create DashboardGrid component**: New file with responsive grid classes
2. **Define grid structure**: 3-row pattern with proper spans
3. **Add responsive breakpoints**: Mobile, tablet, desktop variants
4. **Integrate into page**: Import DashboardGrid into page.tsx
5. **Add animation**: Optional fade-in on mount
6. **Test responsiveness**: Verify all breakpoints work correctly

### Suggested Order
1. Create DashboardGrid component with basic structure
2. Add responsive classes for all breakpoints
3. Import into page.tsx
4. Test and verify at each breakpoint

## Validation Commands
```bash
# Verify component exists
test -f apps/web/app/home/\(user\)/_components/dashboard-grid.tsx && echo "Grid component exists"

# Check for grid classes
grep -q "grid-cols" apps/web/app/home/\(user\)/_components/dashboard-grid.tsx && echo "Grid classes found"

# Check for responsive breakpoints
grep -E "md:|lg:|xl:" apps/web/app/home/\(user\)/_components/dashboard-grid.tsx && echo "Responsive classes found"

# Type check
pnpm typecheck

# Lint check
pnpm lint
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` (grid patterns)
