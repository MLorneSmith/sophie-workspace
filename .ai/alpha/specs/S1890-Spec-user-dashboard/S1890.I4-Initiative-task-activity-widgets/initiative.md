# Initiative: Task & Activity Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1890 |
| **Initiative ID** | S1890.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 4 |

---

## Description
Implement the Kanban Summary Card and Recent Activity Feed widgets for the dashboard. The Kanban Summary shows current "Doing" tasks and next queued items. The Activity Feed displays a timeline of user actions over the last 30 days including lesson completions, quiz attempts, and presentation updates.

## Business Value
These widgets drive user engagement by showing immediate next actions (Kanban) and providing a sense of accomplishment through visible activity history. The activity feed validates user effort and encourages continued learning.

---

## Scope

### In Scope
- [x] Kanban Summary Card component showing "Doing" and "Next" tasks
- [x] Recent Activity Feed component with timeline UI (30-day window)
- [x] Activity aggregation from multiple sources (lessons, quizzes, presentations)
- [x] Pagination for activity feed ("Show more" functionality)
- [x] Task status indicators and priority badges
- [x] Relative time formatting (e.g., "2 hours ago")
- [x] Links to relevant pages (kanban board, lessons, presentations)

### Out of Scope
- [ ] Empty state designs (handled by I7)
- [ ] Real-time activity updates (use refresh for v1)
- [ ] Activity filtering/search
- [ ] Task management actions (just display)

---

## Dependencies

### Blocks
- S1890.I7: Empty States & Polish (needs widget structure)

### Blocked By
- S1890.I1: Dashboard Foundation (needs grid layout)
- S1890.I2: Data Layer (needs tasks/activity data)

### Parallel With
- S1890.I3: Progress Widgets
- S1890.I5: Action Widgets
- S1890.I6: Coaching Integration

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Activity aggregation requires cross-table query with sorting |
| External dependencies | Low | All internal data sources |
| Unknowns | Medium | Activity feed UI pattern new to codebase; timeline design |
| Reuse potential | High | useTasks hook exists; Badge, Card components available |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Kanban Summary Card**: Display "Doing" task and next queued item
2. **Activity Feed Timeline**: Build timeline UI with activity items
3. **Activity Aggregation Query**: Cross-table query for unified activity stream

### Suggested Order
1. Kanban Summary Card (F1) - simpler, existing hooks available
2. Activity Aggregation Query (F2) - data foundation for feed
3. Activity Feed Timeline (F3) - UI dependent on aggregation

---

## Validation Commands
```bash
# Verify kanban summary component
test -f apps/web/app/home/\(user\)/_components/kanban-summary-card.tsx && echo "✓ Kanban summary exists"

# Verify activity feed component
test -f apps/web/app/home/\(user\)/_components/recent-activity-feed.tsx && echo "✓ Activity feed exists"

# Check for timeline UI elements
grep -rq "timeline\|activity" apps/web/app/home/\(user\)/_components/ && echo "✓ Activity UI"

# Visual verification
pnpm --filter web-e2e test:local -- -g "dashboard activity"
```

---

## Related Files
- Spec: `../spec.md`
- Existing useTasks: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`
- Badge component: `packages/ui/src/shadcn/badge.tsx`
- Features: `./<feature-#>-<slug>/` (created in next phase)

## Activity Sources
| Source | Table | Event Type |
|--------|-------|------------|
| Lesson completion | `lesson_progress` | "Completed lesson X" |
| Quiz attempt | `quiz_attempts` | "Scored X% on quiz" |
| Presentation update | `building_blocks_submissions` | "Updated presentation X" |
| Assessment completion | `survey_responses` | "Completed skills assessment" |
