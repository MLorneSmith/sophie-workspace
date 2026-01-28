# Initiative: Activity & Task Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1864 |
| **Initiative ID** | S1864.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 3-4 |
| **Priority** | 3 |

---

## Description
Implement three interconnected widgets that provide activity awareness and task management: a Kanban summary widget showing current "Doing" tasks, an activity feed with recent user actions, and a quick actions panel with contextual CTAs. This initiative also includes creating the new `activity_logs` database table to power the activity feed.

## Business Value
Directly supports Goal G2 (Reduce time to action <15 seconds) by surfacing current tasks and next steps prominently. The quick actions panel provides one-click access to the most relevant next actions based on user state, eliminating navigation friction.

---

## Scope

### In Scope
- [ ] Kanban Summary Widget (current "Doing" tasks + next pending task)
- [ ] Activity Feed Widget with pagination (last 30 days)
- [ ] Quick Actions Panel with contextual CTAs
- [ ] NEW: `activity_logs` database table with migration
- [ ] RLS policies for activity_logs table
- [ ] Seed data for activity_logs (development)
- [ ] Data aggregation for activity feed from multiple sources
- [ ] Empty states and loading skeletons for all three widgets

### Out of Scope
- [ ] Real-time WebSocket updates for activity feed (v2)
- [ ] Activity feed filtering by type
- [ ] System events (login/logout) in activity feed (open question)
- [ ] Task creation/editing from dashboard (link to kanban page instead)

---

## Dependencies

### Blocks
- None (independent widgets once foundation is complete)

### Blocked By
- S1864.I1: Dashboard Foundation (requires grid layout, page shell, types)

### Parallel With
- S1864.I2: Progress & Assessment Widgets (can develop simultaneously)
- S1864.I4: Coaching Integration (independent track)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | New table, aggregation queries, contextual logic |
| External dependencies | Low | No external APIs |
| Unknowns | Medium | Activity data aggregation approach, optimal feed content |
| Reuse potential | Medium | Activity feed pattern could extend to team dashboards |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Kanban Summary Widget**: Display current "Doing" tasks (2-3) with progress, next pending task, link to kanban board
2. **Activity Data Aggregation**: Create activity_logs table, migration, RLS policies, aggregation function
3. **Activity Feed Widget**: Timeline of recent actions with icons, timestamps, pagination (load more)
4. **Quick Actions Panel**: Contextual CTAs based on user state (Continue Course, New Presentation, Complete Assessment, Review Storyboard)

### Suggested Order
1. Kanban Summary (uses existing tasks table)
2. Activity Data Aggregation (creates infrastructure for feed)
3. Activity Feed Widget (depends on aggregation)
4. Quick Actions Panel (depends on all data sources for context)

---

## Validation Commands
```bash
# Verify activity_logs table exists
pnpm --filter web supabase db reset && psql -c "\d activity_logs"

# Verify kanban widget renders
curl -s http://localhost:3000/home | grep -q "KanbanSummaryWidget"

# Verify activity feed renders
curl -s http://localhost:3000/home | grep -q "ActivityFeedWidget"

# Verify quick actions panel renders
curl -s http://localhost:3000/home | grep -q "QuickActionsPanel"
```

---

## Related Files
- Spec: `../spec.md`
- Existing tasks table: `apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql`
- Kanban hooks: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`
- Features: `./S1864.I3.F*-Feature-*/` (created in next phase)
