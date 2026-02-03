# Initiative: Activity & Task Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1918 |
| **Initiative ID** | S1918.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 4 |

---

## Description
Build the Kanban Summary, Recent Activity Feed, Quick Actions Panel, and Presentations Table widgets. These components display task status, user activity timeline, contextual CTAs, and a full-width presentation list.

## Business Value
These widgets drive engagement by showing users what to do next (Quick Actions), what they're working on (Kanban), what they've accomplished (Activity), and their created content (Presentations).

---

## Scope

### In Scope
- [x] Kanban Summary widget (task counts by status, next task preview)
- [x] Recent Activity Feed widget (timeline of last 5-8 activities)
- [x] Quick Actions Panel widget (contextual CTAs based on user state)
- [x] Presentations Table widget (full-width table with edit links)
- [x] Empty states for all widgets
- [x] Link CTAs to relevant pages

### Out of Scope
- [ ] Data fetching logic (I2)
- [ ] Loading skeletons (I6)
- [ ] Real-time updates (out of spec scope)
- [ ] Task creation/editing (existing kanban feature)

---

## Dependencies

### Blocks
- S1918.I6: Polish (needs base widgets)

### Blocked By
- S1918.I1: Dashboard Foundation (needs grid slots)
- S1918.I2: Data Layer (needs typed data props)

### Parallel With
- S1918.I3: Progress Widgets (independent widgets)
- S1918.I5: Coaching Integration (independent widget)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Activity feed aggregates multiple sources |
| External dependencies | Low | All internal data |
| Unknowns | Medium | Activity timeline format to be defined |
| Reuse potential | High | useTasks hook exists for kanban data |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Kanban Summary Widget**: Card showing task counts and next task
2. **Activity Feed Widget**: Timeline of recent activities
3. **Quick Actions Panel Widget**: Contextual CTA buttons
4. **Presentations Table Widget**: Full-width data table

### Suggested Order
1. Quick Actions Panel (simplest, conditional rendering)
2. Kanban Summary (reuses existing hook)
3. Presentations Table (standard table pattern)
4. Activity Feed (most complex, needs aggregation)

---

## Validation Commands
```bash
# Verify widget files exist
test -f apps/web/app/home/\(user\)/_components/kanban-summary-widget.tsx && echo "✓ Kanban widget exists"
test -f apps/web/app/home/\(user\)/_components/activity-feed-widget.tsx && echo "✓ Activity widget exists"
test -f apps/web/app/home/\(user\)/_components/quick-actions-widget.tsx && echo "✓ Quick actions exists"
test -f apps/web/app/home/\(user\)/_components/presentations-table-widget.tsx && echo "✓ Presentations table exists"

# Type check
pnpm typecheck
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Reference: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` (table example)
