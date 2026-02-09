# Feature: Responsive & Accessibility Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2045.I4 |
| **Feature ID** | S2045.I4.F4 |
| **Status** | Draft |
| **Estimated Days** | 3.5 |
| **Priority** | 4 |

## Description
Fine-tune the responsive layout across all breakpoints (mobile single-column stack, tablet 2-column, desktop 3-3-1 grid), verify dark mode rendering for all widgets and empty states, and conduct an accessibility audit covering keyboard navigation, ARIA labels, and screen reader support for chart components. This is the final polish pass that transforms the dashboard from functional to production-ready.

## User Story
**As a** SlideHeroes user on any device
**I want to** have a fully responsive, accessible, and visually consistent dashboard
**So that** I can use the dashboard effectively on mobile, tablet, and desktop, in light or dark mode, and with assistive technologies

## Acceptance Criteria

### Must Have
- [ ] Mobile (<768px): All 7 widgets stack in single column with priority order: Quick Actions, Course Progress, Kanban, Activity Feed, Spider Diagram, Coaching, Presentations Table
- [ ] Tablet (768-1024px): 2-column grid with Presentations Table full-width below
- [ ] Desktop (>1024px): 3-3-1 grid as designed (Row 1: Progress + Spider + Kanban, Row 2: Activity + Quick Actions + Coaching, Row 3: Table full-width)
- [ ] Dark mode: All widgets, empty states, skeletons, and CTAs render correctly with semantic color classes
- [ ] Dark mode: Charts use theme-appropriate colors (no hard-coded light-mode colors)
- [ ] Keyboard navigation: Tab key navigates through all interactive elements in logical order
- [ ] ARIA labels: All CTA buttons have descriptive `aria-label` attributes
- [ ] Screen reader: Chart components have `title` props for screen reader descriptions
- [ ] Screen reader: Empty states announce their content and available actions
- [ ] Cal.com iframe has descriptive `title` attribute for screen readers
- [ ] No accessibility violations detected by axe-core audit on `/home` page

### Nice to Have
- [ ] Mobile: Swipe gestures or horizontal scroll for chart widgets
- [ ] Reduced motion: Respect `prefers-reduced-motion` for skeleton animations
- [ ] High contrast mode: Verify chart colors maintain sufficient contrast ratios

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Responsive grid classes, ARIA attributes, dark mode classes | Modified |
| **Logic** | Media query breakpoints, focus management | Modified |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use Tailwind CSS responsive utilities (`sm:`, `md:`, `lg:`) for layout adjustments — no JavaScript-based responsive logic needed. For accessibility, add ARIA attributes directly to existing components. For dark mode, audit all custom colors and replace any hard-coded values with semantic classes. Use `order-*` Tailwind utilities for mobile priority reordering.

### Key Architectural Choices
1. Mobile priority reordering via Tailwind `order-*` classes (e.g., Quick Actions gets `order-1` on mobile, `order-4` on desktop)
2. Dark mode via semantic classes only (`bg-background`, `text-muted-foreground`, etc.) — no `dark:` prefix overrides needed if using semantic tokens correctly
3. Accessibility via ARIA attributes on existing elements, `title` props on Recharts components
4. Lighthouse accessibility audit as the final validation gate

### Trade-offs Accepted
- Mobile priority order differs from desktop layout order — requires explicit `order-*` classes but provides better mobile UX
- Some chart interactivity (hover tooltips) won't work on touch devices, but chart data is still visible

## Required Credentials
None required.

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Responsive grid | Tailwind grid utilities | tailwindcss | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| Mobile reordering | Tailwind order utilities | tailwindcss | `order-1 lg:order-4` for priority stacking |
| Dark mode | Semantic color classes | tailwindcss/shadcn | `bg-background`, `text-foreground` |
| Accessibility | ARIA attributes | native HTML | `aria-label`, `role`, `title` |

**Components to Install**: None.

## Dependencies

### Blocks
- None (final feature in the chain)

### Blocked By
- F1: Widget Empty States — Row 1 (empty states must exist for dark mode/a11y audit)
- F2: Widget Empty States — Row 2 & Table (empty states must exist for dark mode/a11y audit)
- F3: Loading Skeletons & Suspense (skeletons must exist for responsive/dark mode testing)

### Parallel With
- None (depends on F1, F2, F3 all completing)

## Files to Create/Modify

### New Files
- None

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Responsive grid classes, mobile order utilities
- `apps/web/app/home/(user)/_components/dashboard/course-progress-widget.tsx` - ARIA labels, `title` prop on chart, dark mode color audit
- `apps/web/app/home/(user)/_components/dashboard/spider-diagram-widget.tsx` - ARIA labels, `title` prop on RadarChart, dark mode color audit
- `apps/web/app/home/(user)/_components/dashboard/kanban-summary-widget.tsx` - ARIA labels, dark mode color audit
- `apps/web/app/home/(user)/_components/dashboard/activity-feed-widget.tsx` - ARIA labels, dark mode color audit
- `apps/web/app/home/(user)/_components/dashboard/quick-actions-widget.tsx` - ARIA labels, button descriptions, dark mode audit
- `apps/web/app/home/(user)/_components/dashboard/coaching-widget.tsx` - iframe `title`, ARIA label, dark mode audit
- `apps/web/app/home/(user)/_components/dashboard/presentations-table-widget.tsx` - ARIA labels, table a11y, dark mode audit
- `apps/web/app/home/(user)/_components/dashboard/course-progress-empty.tsx` - Dark mode verification
- `apps/web/app/home/(user)/_components/dashboard/spider-diagram-empty.tsx` - Dark mode verification
- `apps/web/app/home/(user)/_components/dashboard/kanban-summary-empty.tsx` - Dark mode verification
- `apps/web/app/home/(user)/_components/dashboard/activity-feed-empty.tsx` - Dark mode verification

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add responsive grid classes to dashboard page**: Configure `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with mobile `order-*` utilities for priority stacking
2. **Verify and fix dark mode rendering**: Audit all widget and empty state components for hard-coded colors, replace with semantic classes
3. **Add ARIA labels to all interactive elements**: CTA buttons, chart containers, navigation links
4. **Add screen reader support to chart components**: Add `title` props to PieChart and RadarChart, descriptive text for data
5. **Verify keyboard navigation flow**: Test Tab order through all interactive elements, fix any focus traps
6. **Run Lighthouse accessibility audit**: Score must be 90+ on accessibility, fix any violations
7. **Test tablet 2-column layout**: Verify 2-col grid at 768-1024px, Presentations Table full-width
8. **Test mobile single-column layout**: Verify priority ordering, touch target sizes, scrolling behavior

### Suggested Order
1. Responsive grid classes (layout foundation)
2. Mobile priority ordering
3. Tablet layout verification
4. Dark mode audit and fixes
5. ARIA labels and screen reader support
6. Keyboard navigation verification
7. Lighthouse audit and final fixes

## Validation Commands
```bash
pnpm typecheck
pnpm lint

# Responsive testing
# Chrome DevTools → Toggle device toolbar → Test at 375px (mobile), 768px (tablet), 1280px (desktop)

# Dark mode testing
# Toggle dark mode in browser/OS settings
# Verify all widgets, empty states, skeletons, charts render correctly

# Accessibility testing
# npx lighthouse http://localhost:3000/home --only-categories=accessibility --output=html
# Or: browser extension axe DevTools → Scan /home page

# Keyboard testing
# Tab through all elements, verify logical order
# Enter/Space activates all CTAs
# No focus traps

# Screen reader testing
# VoiceOver (Mac) / NVDA (Windows) → Navigate /home page
# Verify chart titles are announced
# Verify empty state content is announced
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
- Spec responsive behavior: `../../spec.md` (Section 5 - Responsive Behavior table)
- Empty states research: `../../research-library/perplexity-dashboard-empty-states-ux.md`
- Dark mode patterns: `packages/ui/CLAUDE.md` (Dark Mode Support section)
