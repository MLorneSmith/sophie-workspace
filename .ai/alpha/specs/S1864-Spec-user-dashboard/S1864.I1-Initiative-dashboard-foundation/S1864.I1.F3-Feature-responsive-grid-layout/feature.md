# Feature: Responsive Grid Layout

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I1 |
| **Feature ID** | S1864.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 3 |

## Description
Create a responsive 3-3-1 grid layout component that arranges 7 widget positions across three rows. The grid adapts from single-column on mobile to 2-column on tablet to 3-column on desktop, with the final widget spanning full width.

## User Story
**As a** user viewing my dashboard on different devices
**I want to** see widgets arranged appropriately for my screen size
**So that** I can access all information comfortably on any device

## Acceptance Criteria

### Must Have
- [ ] Grid shows 1 column on mobile (<768px)
- [ ] Grid shows 2 columns on tablet (768-1024px)
- [ ] Grid shows 3 columns on desktop (>1024px)
- [ ] 7th widget (Presentation Table) spans full width on all breakpoints
- [ ] Gap spacing is consistent (gap-4 = 1rem)
- [ ] Grid accepts `DashboardData` prop for widget data
- [ ] Placeholder widgets rendered in each position (labeled for future replacement)

### Nice to Have
- [ ] Smooth transitions between breakpoints
- [ ] Consistent card heights within rows

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `dashboard-grid.tsx` | New |
| **Logic** | Props typing with DashboardData | New |
| **Data** | Receives data from page | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use standard Tailwind responsive grid classes matching `dashboard-demo-charts.tsx` pattern. Simple CSS grid, no JavaScript breakpoint detection.

### Key Architectural Choices
1. Use Tailwind's `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` pattern
2. Use `col-span-full` for full-width widget
3. Card components for each widget position
4. Placeholder content indicating future widget purpose

### Trade-offs Accepted
- Static grid (no drag-and-drop or customization) - keeps complexity low

## Required Credentials
> None required - this is a UI component

## Dependencies

### Blocks
- S1864.I2.F1: Course Progress Radial Widget (needs grid position)
- S1864.I2.F2: Spider Chart Assessment Widget (needs grid position)
- S1864.I3.F1: Kanban Summary Widget (needs grid position)
- S1864.I3.F3: Activity Feed Widget (needs grid position)
- S1864.I3.F4: Quick Actions Panel (needs grid position)
- S1864.I4.F2: Coaching Widget (needs grid position)
- S1864.I5.F1: Presentation Table Widget (needs grid position)

### Blocked By
- F1: Types and Data Loader (needs DashboardData type for props)
- F2: Dashboard Page Shell (needs page to render in)

### Parallel With
- F4: Skeleton Loading (can develop simultaneously)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx` - Grid layout component

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create component file**: Set up dashboard-grid.tsx with basic structure
2. **Define props interface**: Accept DashboardData prop with proper typing
3. **Implement grid layout**: Add responsive Tailwind classes
4. **Create placeholder widget**: Reusable placeholder with title/description
5. **Add 7 widget positions**: Place placeholders in correct grid positions
6. **Test responsiveness**: Verify breakpoints in browser dev tools

### Suggested Order
1. Create component file with props
2. Implement grid layout
3. Add placeholder widgets
4. Test at all breakpoints

## Validation Commands
```bash
# Verify component compiles
pnpm typecheck

# Start dev server
pnpm dev

# Test responsive breakpoints in browser:
# - Mobile: 375px width
# - Tablet: 768px width
# - Desktop: 1280px width
```

## Related Files
- Initiative: `../initiative.md`
- Pattern reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
- Card component: `packages/ui/src/shadcn/card.tsx`
