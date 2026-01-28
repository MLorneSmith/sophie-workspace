# Initiative: Activity & Task Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1877 |
| **Initiative ID** | S1877.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 3 |

---

## Description

Implements three dashboard widgets focused on action tracking: Kanban Summary Card showing current "Doing" tasks and next pending task, Activity Feed Widget with chronological timeline of user actions, and Quick Actions Panel with contextual CTAs based on user state.

## Business Value

Helps users quickly understand what they should work on next (kanban summary, quick actions) and provides visibility into recent activity (activity feed). Reduces time-to-action by surfacing relevant CTAs without navigation.

---

## Scope

### In Scope
- [x] Kanban Summary Card (Doing tasks list, next pending task, link to kanban board)
- [x] Activity Feed Widget (chronological timeline, last 30 days, pagination)
- [x] Quick Actions Panel (contextual CTAs: Continue Course, New Presentation, Complete Assessment, Review Storyboard)
- [x] Data fetching from `tasks`, `subtasks`, and `ai_request_logs` tables
- [x] Empty states for each widget
- [x] Loading skeleton states
- [x] Integration with dashboard grid layout

### Out of Scope
- [ ] Full kanban board functionality (handled by `/home/(user)/kanban` page)
- [ ] Task creation/editing (handled by kanban page)
- [ ] Activity feed filtering/advanced search
- [ ] Real-time WebSocket updates (use polling/refetch for v1)
- [ ] Activity feed export/sharing

---

## Dependencies

### Blocks
- S1877.I4 - Presentation Table & Polish (completes dashboard visualization set)

### Blocked By
- S1877.I1 - Dashboard Foundation (requires grid container and page structure)

### Parallel With
- S1877.I2 - Progress Widgets (both depend on I1, no mutual dependencies)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Activity feed aggregation from multiple sources, pagination logic, contextual quick actions based on user state |
| External dependencies | Low | Only uses existing Supabase tables (`tasks`, `subtasks`, `ai_request_logs`) |
| Unknowns | Low | Data structures well-defined, activity feed uses existing `ai_request_logs` table |
| Reuse potential | High | Card components, Badge components, list patterns well-established |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Kanban Summary Card Widget**: Task filtering (status='doing'), task list display, next task computation, navigation to kanban board
2. **Activity Feed Widget**: Timeline component, activity type icons, date formatting, pagination controls, load more functionality
3. **Quick Actions Panel Widget**: State detection logic (course progress, assessment status, submission count), CTA buttons with navigation links
4. **Widget Loading States**: Skeleton components for all three widgets during data fetch
5. **Widget Empty States**: Contextual empty states with appropriate CTAs for each widget

### Suggested Order
1. Kanban Summary Widget (simplest, direct query on tasks table)
2. Quick Actions Panel (conditional logic based on data availability)
3. Activity Feed Widget (more complex, aggregation from multiple sources)
4. Loading and empty state integration

---

## Validation Commands
```bash
# Verify kanban summary shows correct tasks
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "Kanban"

# Verify activity feed populates from ai_request_logs
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "Activity Feed"

# Verify quick actions show contextually correct CTAs
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "Quick Actions"

# Typecheck after implementation
pnpm typecheck

# Verify pagination works correctly (check network requests)
# Open browser DevTools Network tab and verify activity feed pagination requests
```

---

## Related Files
- Spec: `../spec.md`
- Foundation: `../S1877.I1-Initiative-dashboard-foundation/`
- Data Tables: `tasks` and `subtasks` tables in `apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql`
- Activity Source: `ai_request_logs` table in `apps/web/supabase/migrations/20250416140521_web_ai_usage_cost_tracking.sql`
