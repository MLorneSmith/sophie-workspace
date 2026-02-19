# Initiative: Activity & Actions Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2072 |
| **Initiative ID** | S2072.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 2 |

---

## Description

Implements three interactive dashboard widgets: Recent Activity Feed (timeline of recent learning activities), Quick Actions Panel (context-aware CTAs), and Kanban Summary Card (current "doing" tasks with count and preview). The activity feed is the highest-complexity component due to aggregating data from multiple tables.

## Business Value

Surfaces actionable information and recent progress to users. The activity feed shows what's been accomplished, quick actions reduce navigation friction, and the kanban summary keeps tasks top-of-mind. Together these drive engagement and task completion.

---

## Scope

### In Scope
- [ ] Recent Activity Feed widget (last 10 activities)
- [ ] Activity aggregation query (UNION across: lessons, quizzes, assessments, presentations)
- [ ] Quick Actions Panel widget (context-aware CTAs)
- [ ] Kanban Summary Card widget (doing tasks count + next task preview)
- [ ] Activity type icons and formatting
- [ ] Integration with dashboard grid layout

### Out of Scope
- [ ] Activity feed pagination (show last 10 only per spec)
- [ ] Real-time activity updates (polling/refresh only)
- [ ] Full kanban board (existing functionality)
- [ ] Loading skeletons (delegated to I6)
- [ ] Empty states (delegated to I6)

---

## Dependencies

### Blocks
- S2072.I6 (Empty States & Polish) - needs widgets for empty state design

### Blocked By
- S2072.I1 (Foundation & Data Layer) - requires page shell, grid, and data loader

### Parallel With
- S2072.I2 (Progress Visualization Widgets)
- S2072.I4 (Coaching Integration)
- S2072.I5 (Presentations Table)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | High | Activity aggregation requires UNION across 4+ tables |
| External dependencies | Low | Only Supabase queries |
| Unknowns | Medium | Query performance with UNION, exact activity types |
| Reuse potential | Medium | Activity pattern new, kanban patterns exist |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Activity Feed Widget**: Timeline component with activity items
2. **Activity Aggregation Query**: Server-side query combining lessons, quizzes, assessments, presentations
3. **Quick Actions Panel**: Context-aware button group
4. **Kanban Summary Widget**: Task count + next task preview

### Suggested Order
1. Activity Aggregation Query (enables activity feed data)
2. Activity Feed Widget (displays aggregated data)
3. Kanban Summary Widget (simpler, reuses task patterns)
4. Quick Actions Panel (context logic determination)

---

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification
pnpm dev
# Navigate to /home, verify all three widgets render

# Activity query performance test (should be < 500ms)
# Check Supabase logs for query execution time
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./S2072.I3.F*-Feature-*/` (created in next phase)
- Reference: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts` (task query pattern)
- Reference: `apps/web/app/home/(user)/kanban/_components/task-card.tsx` (task card pattern)
- Reference: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts` (loader pattern)
