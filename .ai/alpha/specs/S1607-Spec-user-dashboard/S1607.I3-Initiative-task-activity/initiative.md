# Initiative: Task & Activity Awareness

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1607 |
| **Initiative ID** | S1607.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 3 |

---

## Description
Implement the Kanban Summary Card and Recent Activity Feed widgets. The Kanban Summary shows the user's current "Doing" task and next "Do" task, while the Activity Feed displays a reverse-chronological timeline of the last 30 days of activity across presentations, lessons, quizzes, and assessments.

## Business Value
Task awareness keeps users focused on their current work and upcoming priorities without navigating away from the dashboard. The activity feed provides context on recent accomplishments and maintains a sense of momentum, reducing the likelihood of abandonment.

---

## Scope

### In Scope
- [x] Kanban Summary Card showing current "Doing" task and next "Do" task
- [x] Link to full kanban board from summary card
- [x] Activity Feed with last 30 days of activity
- [x] Time grouping (Today, Yesterday, This Week, Earlier)
- [x] Activity types: presentations created/updated, lessons completed, quizzes scored, assessments done
- [x] Aggregate queries across multiple tables (tasks, course_progress, quiz_attempts, survey_responses, building_blocks_submissions)
- [x] Empty states for both widgets
- [x] Loading skeletons

### Out of Scope
- [ ] Real-time activity updates (refresh on page load only)
- [ ] Activity filtering by type
- [ ] Full kanban board editing from dashboard
- [ ] Infinite scroll for activity (30-day limit)

---

## Dependencies

### Blocks
- None

### Blocked By
- S1607.I1: Dashboard Foundation & Data Layer (provides page structure and loader)

### Parallel With
- S1607.I2: Progress & Assessment Visualization
- S1607.I4: Quick Actions & Presentations
- S1607.I5: Coaching Integration

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Activity feed requires multi-table aggregation |
| External dependencies | None | Data from local database |
| Unknowns | Low | Task patterns exist; activity is custom |
| Reuse potential | Medium | Task query patterns exist; activity feed is new |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Kanban Summary Widget**: Task status display, "Doing" and "Do Next" cards
2. **Activity Feed Widget**: Timeline component with time grouping
3. **Activity Aggregation Queries**: Multi-table queries with timestamp ordering

### Suggested Order
1. Kanban Summary Widget (simpler, uses existing task patterns)
2. Activity Aggregation Queries (complex, multiple tables)
3. Activity Feed Widget (depends on aggregation)

---

## Validation Commands
```bash
# Verify Kanban Summary shows current tasks
# Manual: Create tasks in kanban, verify dashboard shows "Doing" task

# Verify Activity Feed shows recent activity
# Manual: Complete a lesson or quiz, verify it appears in feed

# Verify time grouping works
# Manual: Check "Today", "Yesterday" groups render correctly

# TypeScript validation
pnpm --filter web typecheck
```

---

## Related Files
- Spec: `../spec.md`
- Parent Initiative: `../S1607.I1-Initiative-dashboard-foundation/`
- Reference: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts`
- Research: `../research-library/perplexity-dashboard-patterns.md`
