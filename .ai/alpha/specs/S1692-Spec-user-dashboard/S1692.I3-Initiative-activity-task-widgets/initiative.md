# Initiative: Activity & Task Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1692 |
| **Initiative ID** | S1692.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 3 |

---

## Description
Implement the Recent Activity Feed, Kanban Summary Card, and Quick Actions Panel widgets. These components show user engagement history, current task status, and contextual action buttons based on user state.

## Business Value
Activity feeds drive engagement through social proof and momentum tracking. The Kanban summary shows "doing" tasks for immediate context. Quick Actions reduce friction to high-value activities (continuing course, creating presentations), directly supporting conversion goals.

---

## Scope

### In Scope
- [x] Recent Activity Feed widget (last 10 items)
- [x] Activity data aggregation (lessons, quizzes, assessments, presentations)
- [x] Kanban Summary Card with "Doing" and "Next" tasks
- [x] Quick Actions Panel with contextual CTAs
- [x] CTA state logic (new user vs active user vs power user)
- [x] Empty states for all three widgets
- [x] Loading skeleton states
- [x] Links to full Kanban board and activity history

### Out of Scope
- [ ] Real-time activity updates (future enhancement)
- [ ] Team activity (team dashboard feature)
- [ ] Full activity history page
- [ ] Task creation/editing from dashboard

---

## Dependencies

### Blocks
- S1692.I5: Polish & Testing (needs widgets for E2E tests)

### Blocked By
- S1692.I1: Dashboard Foundation (needs grid layout and data loader)

### Parallel With
- S1692.I2: Progress & Assessment Widgets (can develop simultaneously)
- S1692.I4: Coaching Integration (can develop simultaneously)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Activity aggregation needs multiple table joins |
| External dependencies | Low | All data from existing Supabase tables |
| Unknowns | Medium | Activity aggregation query pattern is new |
| Reuse potential | Medium | Kanban hooks exist (`use-tasks.ts`), activity feed is custom |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Activity Feed Widget**: Timeline component with activity items
2. **Activity Data Aggregation**: Query/loader for combined activity data
3. **Kanban Summary Widget**: Display current "Doing" task with progress
4. **Quick Actions Panel**: Contextual CTAs based on user state
5. **CTA State Logic**: Determine which actions to show per user

### Suggested Order
1. Kanban Summary Widget (simpler, uses existing hooks)
2. Activity Data Aggregation (query foundation)
3. Activity Feed Widget (depends on aggregation)
4. CTA State Logic (determines quick action content)
5. Quick Actions Panel (uses CTA logic)

---

## Validation Commands
```bash
# Verify Kanban hooks exist
ls apps/web/app/home/\(user\)/kanban/_lib/hooks/use-tasks.ts

# Type check
pnpm typecheck

# Visual test (manual)
# Visit /home and verify activity/task widgets render
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-slug>/` (created in next phase)
- Kanban hooks: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`
- Tasks API: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts`
- Research: `../research-library/perplexity-dashboard-ux.md`
