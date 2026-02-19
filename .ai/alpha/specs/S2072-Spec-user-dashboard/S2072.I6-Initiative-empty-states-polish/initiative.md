# Initiative: Empty States & Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2072 |
| **Initiative ID** | S2072.I6 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 4 |

---

## Description

Adds production-ready polish to the dashboard including loading skeleton states for all 7 widgets, engaging empty states that encourage action rather than appearing depressing, and accessibility compliance. This initiative transforms functional widgets into a delightful user experience.

## Business Value

First impressions matter - new users see engaging empty states that motivate action rather than blank screens. Loading states provide feedback during data fetch. Accessibility ensures all users can use the dashboard. These polish items directly impact user retention and satisfaction.

---

## Scope

### In Scope
- [ ] Loading skeleton for Course Progress Radial
- [ ] Loading skeleton for Skills Spider Diagram
- [ ] Loading skeleton for Kanban Summary Card
- [ ] Loading skeleton for Activity Feed
- [ ] Loading skeleton for Quick Actions Panel
- [ ] Loading skeleton for Coaching Sessions Card
- [ ] Loading skeleton for Presentations Table
- [ ] Empty state for Course Progress (0% or no enrollment)
- [ ] Empty state for Skills Spider (no assessment taken)
- [ ] Empty state for Kanban Summary (no tasks)
- [ ] Empty state for Activity Feed (no activity yet)
- [ ] Empty state for Coaching Sessions (booking CTA)
- [ ] Empty state for Presentations Table (no presentations)
- [ ] Accessibility audit and fixes (ARIA labels, keyboard nav)
- [ ] Responsive verification (mobile, tablet, desktop)

### Out of Scope
- [ ] Real-time updates (future v2)
- [ ] Widget customization/reordering (future v2)
- [ ] Team dashboard variant (future v2)
- [ ] Gamification badges (future v2)

---

## Dependencies

### Blocks
- None (this is the final initiative)

### Blocked By
- S2072.I2 (Progress Visualization Widgets) - needs widgets for empty state design
- S2072.I3 (Activity & Actions Widgets) - needs widgets for empty state design
- S2072.I4 (Coaching Integration) - needs widget for empty state design
- S2072.I5 (Presentations Table) - needs widget for empty state design

### Parallel With
- None (depends on all widget implementations)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | 7 different empty states, 7 loading skeletons |
| External dependencies | Low | Only UI components |
| Unknowns | Low | Patterns well-documented in research |
| Reuse potential | Medium | Empty state patterns reusable |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Loading Skeleton Components**: Skeleton wrapper for each widget type
2. **Empty State Components**: Engaging empty states with CTAs for each widget
3. **Accessibility Compliance**: ARIA labels, keyboard navigation, focus management
4. **Responsive Verification**: Mobile/tablet/desktop testing and fixes

### Suggested Order
1. Loading Skeleton Components (enables loading states during data fetch)
2. Empty State Components (transforms empty into engaging)
3. Accessibility Compliance (production requirement)
4. Responsive Verification (cross-device quality)

---

## Empty State Design Principles

From research (`perplexity-dashboard-empty-states-ux.md`):

1. **Explain why it's empty** - Plain language, no generic "No data"
2. **Single prominent CTA** - One clear next step
3. **Positive framing** - "Start by adding" vs "You don't have"
4. **Ghost visualizations** - Show chart structure (axes, grid) even when empty
5. **Contextual to widget** - Each empty state specific to its widget

---

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification - loading states
pnpm dev
# Navigate to /home with slow network, verify skeletons

# Visual verification - empty states
# Use fresh user account with no data, verify engaging empty states

# Accessibility audit
pnpm --filter web test:e2e -- --grep "accessibility"

# Responsive testing
# Test at 375px, 768px, 1024px, 1440px widths
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./S2072.I6.F*-Feature-*/` (created in next phase)
- Reference: `packages/ui/src/makerkit/empty-state.tsx` (EmptyState component)
- Reference: `packages/ui/src/shadcn/skeleton.tsx` (Skeleton component)
- Research: `../research-library/perplexity-dashboard-empty-states-ux.md`
