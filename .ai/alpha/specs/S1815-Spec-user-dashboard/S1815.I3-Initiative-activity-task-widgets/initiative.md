# Initiative: Activity & Task Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1815 |
| **Initiative ID** | S1815.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 3 |

---

## Description
Implement the kanban summary widget, activity feed widget, and quick actions panel. These widgets answer "What should I do next?" and "What have I done recently?" - driving daily engagement and actionable next steps.

## Business Value
Quick actions panel provides direct reduction in navigation clicks (goal: -60% from 3+ to 1). Activity feed creates a sense of momentum and progress visibility. Kanban summary surfaces immediate tasks without navigating away from the dashboard.

---

## Scope

### In Scope
- [x] Kanban Summary Widget
  - Display tasks with status 'doing' and 'do' (prioritized)
  - Show next task from queue
  - Link to full kanban board
  - Empty state for no active tasks
- [x] Activity Feed Widget
  - Timeline of last 10 user activities
  - Activity types: presentations, lessons, quizzes, assessments
  - Timestamp formatting (relative: "2 hours ago")
  - Empty state for new users
- [x] Quick Actions Panel
  - Contextual CTAs based on user state:
    - "Continue Course" (if in progress)
    - "Start Course" (if not started)
    - "New Presentation"
    - "Complete Assessment" (if not done)
  - Maximum 3-4 action buttons
- [x] Data queries aggregating activity from multiple tables
- [x] Widget-specific loading skeletons

### Out of Scope
- [ ] Inline task editing (navigate to kanban)
- [ ] Real-time activity updates (refresh required)
- [ ] Full kanban board functionality
- [ ] Activity feed filtering

---

## Dependencies

### Blocks
- None (these widgets are leaf components)

### Blocked By
- S1815.I1: Dashboard Foundation (provides grid layout, types, and loader)

### Parallel With
- S1815.I2: Progress & Assessment Widgets (can develop simultaneously after I1)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Activity feed requires aggregating multiple tables; no existing component |
| External dependencies | Low | All internal tables; no external APIs |
| Unknowns | Medium | Activity feed data structure needs design; aggregation logic complex |
| Reuse potential | Medium | Kanban query exists; badge/card components reusable |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Kanban Summary Widget**: Query tasks, render summary card with 'doing' tasks and next 'do' task
2. **Activity Data Aggregation**: Create unified activity feed from multiple event sources
3. **Activity Feed Widget**: Timeline component with formatted timestamps and action icons
4. **Quick Actions Panel**: Contextual button rendering based on user state

### Suggested Order
1. Kanban Summary first (simpler query, existing data structure)
2. Activity Data Aggregation second (defines data contract for feed)
3. Activity Feed Widget third (uses aggregated data)
4. Quick Actions Panel fourth (depends on understanding user state from earlier widgets)

---

## Validation Commands
```bash
# Verify components build
pnpm typecheck

# Test widgets render with data
pnpm dev
# Navigate to /home as user with tasks and activity history

# Test empty states
# Create new user and verify appropriate empty states display

# Test quick actions logic
# Verify correct buttons appear based on user state:
# - No course progress → "Start Course"
# - Course in progress → "Continue Course"
# - No survey → "Complete Assessment"
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Reference: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts`
- Schema: `apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql`
- Schema: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
