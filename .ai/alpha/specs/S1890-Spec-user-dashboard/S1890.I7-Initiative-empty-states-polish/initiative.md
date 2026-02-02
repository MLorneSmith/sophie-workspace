# Initiative: Empty States & Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1890 |
| **Initiative ID** | S1890.I7 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 7 |

---

## Description
Design and implement engaging empty states for all 7 dashboard widgets, loading skeleton animations, error boundaries, and accessibility polish. This initiative transforms the dashboard from functional to delightful, particularly for new users who have no data to display.

## Business Value
Research shows 50% churn reduction with well-designed empty states (Autopilot case study). New users encountering empty dashboards need guidance and motivation, not blank screens. This initiative directly impacts user activation and retention.

---

## Scope

### In Scope
- [x] 7 unique empty state designs (one per widget)
- [x] Custom illustrations or icons for each empty state
- [x] Single focused CTA per empty state
- [x] Skeleton loading animations for all widgets
- [x] Error boundary with retry capability
- [x] Accessibility audit (WCAG 2.1 AA compliance)
- [x] Dark mode verification for all states
- [x] Onboarding checklist for new users (optional enhancement)

### Out of Scope
- [ ] Widget implementation (handled by I3-I6)
- [ ] Data fetching (handled by I2)
- [ ] Page structure (handled by I1)
- [ ] Animation library additions (use Tailwind animate)

---

## Dependencies

### Blocks
- None (final polish initiative)

### Blocked By
- S1890.I1: Dashboard Foundation (needs page structure)
- S1890.I3: Progress Widgets (needs widget components)
- S1890.I4: Task & Activity Widgets (needs widget components)
- S1890.I5: Action Widgets (needs widget components)
- S1890.I6: Coaching Integration (needs widget component)

### Parallel With
- None (must wait for all widgets to be structurally complete)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Using existing EmptyState component from @kit/ui |
| External dependencies | Low | No external services |
| Unknowns | Medium | Design decisions for illustrations; copy refinement |
| Reuse potential | High | EmptyState, Skeleton components available |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Progress Widget Empty States**: Radial chart outline + spider web grid with CTAs
2. **Task/Activity Empty States**: Timeline placeholder + onboarding checklist
3. **Action Widget Empty States**: Presentation table placeholder
4. **Coaching Widget Empty State**: Book session CTA with value proposition
5. **Loading Skeletons**: Skeleton variants for each widget type
6. **Error Boundaries**: Error UI with retry actions

### Suggested Order
1. Loading Skeletons (F1) - enables development testing
2. Progress Widget Empty States (F2)
3. Task/Activity Empty States (F3)
4. Action Widget Empty States (F4)
5. Coaching Widget Empty State (F5)
6. Error Boundaries (F6) - final safety net

---

## Validation Commands
```bash
# Verify empty state components
ls apps/web/app/home/\(user\)/_components/*-empty-state.tsx 2>/dev/null | wc -l | xargs -I {} test {} -ge 4 && echo "✓ Empty states exist"

# Check for skeleton loading
grep -rq "Skeleton" apps/web/app/home/\(user\)/_components/ && echo "✓ Skeleton loading"

# Accessibility audit
pnpm --filter web-e2e test:local -- -g "dashboard accessibility"

# Dark mode visual check
# Manual: Toggle dark mode and verify all empty states render correctly
```

---

## Related Files
- Spec: `../spec.md`
- EmptyState component: `packages/ui/src/makerkit/empty-state.tsx`
- Skeleton component: `packages/ui/src/shadcn/skeleton.tsx`
- Research: `research-library/perplexity-dashboard-empty-states.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)

## Empty State Design Principles (from research)
| Principle | Application |
|-----------|-------------|
| Single focused CTA | One button per empty state, not multiple |
| Contextual messaging | Different copy for new user vs. cleared data |
| Educational context | Brief explanation of what will appear |
| Visual engagement | Illustration or icon relevant to the widget |
| Progressive disclosure | Essential info first, docs link for details |

## Widget Empty States Summary
| Widget | Empty State Message | CTA |
|--------|--------------------|----|
| Course Progress | "Start your learning journey" | "Begin Course" |
| Skills Spider | "Discover your presentation strengths" | "Take Assessment" |
| Kanban Summary | "Track your learning tasks" | "View Task Board" |
| Activity Feed | "Your activity will appear here" | (No CTA - informational) |
| Quick Actions | N/A (always shows actions) | - |
| Coaching | "Accelerate your learning with coaching" | "Book Session" |
| Presentations | "Create your first presentation" | "New Presentation" |
