# Initiative: Dashboard Empty States & Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2045 |
| **Initiative ID** | S2045.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 1-2 |
| **Priority** | 4 |

---

## Description
Design and implement engaging empty states for all 7 dashboard widgets, add loading skeletons, fine-tune responsive behavior across breakpoints, verify dark mode rendering, and conduct an accessibility audit. This initiative transforms the dashboard from functional to polished, ensuring new users have a welcoming first experience.

## Business Value
New users who see an empty `/home` page with no guidance will churn. Empty states with clear CTAs directly address Goal G3 (improve new user activation by +40%). Loading skeletons improve perceived performance. Accessibility compliance is a legal and ethical requirement.

---

## Scope

### In Scope
- [ ] 7 unique empty state designs using EmptyState component from `@kit/ui/empty-state`
- [ ] Course Progress empty state: grayed-out 0% ring with "Start Course" CTA
- [ ] Spider Diagram empty state: axes with dashed outline at 0 values + "Take Assessment" CTA
- [ ] Kanban Summary empty state: "No tasks yet" with "Go to Kanban Board" CTA
- [ ] Activity Feed empty state: subtle timeline skeleton + "Your activity will appear here"
- [ ] Quick Actions empty state: all 4 CTAs visible with most relevant highlighted
- [ ] Coaching empty state: booking prompt + "Book Session" CTA
- [ ] Presentations Table empty state: "No presentations yet" + "Create Your First Presentation" CTA
- [ ] Loading skeletons for all 7 widget cards (Suspense boundaries)
- [ ] Responsive layout fine-tuning (mobile stack priority order, tablet 2-column)
- [ ] Dark mode verification across all widgets and empty states
- [ ] Keyboard navigation and ARIA labels for all interactive elements
- [ ] Screen reader support for chart components (title props)

### Out of Scope
- [ ] Onboarding wizard or guided tour
- [ ] Animated illustrations or micro-interactions (v2)
- [ ] A/B testing of empty state copy
- [ ] Sample/demo data for new users

---

## Dependencies

### Blocks
- None (final initiative in the chain)

### Blocked By
- S2045.I2: Visualization widgets must exist before empty states can be added
- S2045.I3: Interactive widgets must exist before empty states can be added

### Parallel With
- None (depends on both I2 and I3 completing)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Spider diagram 0-value rendering needs Recharts conditional logic; 7 unique designs is significant scope |
| External dependencies | Low | All uses existing UI components (EmptyState, Skeleton, Button) |
| Unknowns | Low | Empty state research completed; existing EmptyState component pattern available |
| Reuse potential | High | EmptyState from `@kit/ui/empty-state`; Skeleton from `@kit/ui/skeleton`; Button CTA patterns established |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Widget Empty States — Row 1**: Empty states for Course Progress (0% ring), Spider Diagram (dashed axes), Kanban Summary ("No tasks")
2. **Widget Empty States — Row 2 & Table**: Empty states for Activity Feed (timeline skeleton), Quick Actions (all CTAs), Coaching (booking prompt), Presentations Table ("No presentations")
3. **Loading Skeletons & Suspense**: Skeleton layouts matching each widget card shape, Suspense boundaries for progressive loading
4. **Responsive & Accessibility Polish**: Mobile stack priority order, tablet 2-column refinement, dark mode verification, ARIA labels, keyboard navigation, screen reader chart titles

### Suggested Order
1. Widget Empty States — Row 1 (simpler states, chart-related)
2. Widget Empty States — Row 2 & Table (more varied designs)
3. Loading Skeletons & Suspense (depends on knowing widget shapes)
4. Responsive & Accessibility Polish (final pass)

---

## Validation Commands
```bash
# Verify empty states render (test with new user / empty data)
# Navigate to /home with a fresh user account

# Verify dark mode
# Toggle dark mode and verify all widgets render correctly

# Verify accessibility
# Run axe-core or Lighthouse accessibility audit on /home

# Verify loading states
# Throttle network and verify skeletons appear before data loads

# Verify TypeScript compiles
pnpm typecheck
pnpm lint
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- EmptyState component: `packages/ui/src/makerkit/empty-state.tsx`
- Skeleton component: `packages/ui/src/shadcn/skeleton.tsx`
- Empty state research: `../research-library/perplexity-dashboard-empty-states-ux.md`
- Recharts empty handling: `../research-library/context7-recharts-radial-radar-charts.md`
