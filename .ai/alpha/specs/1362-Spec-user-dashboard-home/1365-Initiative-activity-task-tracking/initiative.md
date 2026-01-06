# Initiative: Activity & Task Tracking

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | #1362 |
| **Initiative ID** | #1365 |
| **Status** | Draft |
| **Estimated Weeks** | 2.5-3 |
| **Priority** | 3 |

---

## Description
Build the activity tracking infrastructure and display components for the dashboard. This includes creating a new `user_activities` database table, implementing activity recording triggers/services, building the Activity Feed Timeline component, and integrating the Kanban Summary Card that shows current and next tasks.

## Business Value
Drives user engagement by providing visibility into recent actions and pending tasks:
- Activity feed shows momentum and encourages continued progress
- Kanban summary reduces context-switching by surfacing current work
- Activity tracking enables future analytics and personalization
- Supports Goal G1 (increase engagement) and G2 (reduce navigation friction)

---

## Scope

### In Scope
- [x] `user_activities` table with RLS policies (schema design)
- [x] Activity recording service for common events
- [x] Database triggers for automatic activity logging (lesson complete, quiz submit, etc.)
- [x] Activity Feed Timeline component (10 most recent items)
- [x] Kanban Summary Card (current "Doing" task + next "To Do" task)
- [x] Data loaders for activity feed and kanban summary
- [x] Empty states for both components
- [x] Unit tests for activity service

### Out of Scope
- [x] Real-time activity updates (WebSocket) - use refresh instead
- [x] Activity retention policy implementation (future maintenance task)
- [x] Activity analytics/reporting dashboard
- [x] Email notifications for activity
- [x] Full Kanban board functionality (exists at /home/kanban)

---

## Dependencies

### Blocks
- None (end-node in dependency graph)

### Blocked By
- I1: Dashboard Foundation (provides dashboard layout and cards)

### Parallel With
- I2: Progress Visualization (can develop in parallel once I1 complete)
- I4: Cal.com Coaching Integration (can develop in parallel once I1 complete)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | New table + triggers + service |
| External dependencies | None | Internal Supabase only |
| Unknowns | Medium | Activity schema design needs validation; trigger complexity |
| Reuse potential | High | Activity tracking reusable across app |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Activity Database Schema**: Table, RLS, triggers, indexes
2. **Activity Recording Service**: TypeScript service for recording activities
3. **Activity Feed Component**: Timeline UI with icons, timestamps, links
4. **Kanban Summary Card**: Current task display with status and link

### Suggested Order
1. Activity Database Schema (foundation for all activity features)
2. Activity Recording Service (required before feed can show data)
3. Activity Feed Component (primary engagement driver)
4. Kanban Summary Card (simpler, queries existing tasks table)

---

## Technical Notes

### Proposed Activity Table Schema
```sql
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'lesson_complete', 'quiz_submit', 'presentation_create', etc.
  entity_type TEXT, -- 'lesson', 'quiz', 'presentation', 'assessment'
  entity_id UUID,
  metadata JSONB DEFAULT '{}', -- Flexible data (score, title, etc.)
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_activities_account ON user_activities(account_id);
CREATE INDEX idx_user_activities_user ON user_activities(user_id);
CREATE INDEX idx_user_activities_created ON user_activities(created_at DESC);

-- RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON user_activities FOR SELECT
  USING (user_id = auth.uid());
```

### Activity Types
| Type | Entity | Metadata |
|------|--------|----------|
| `lesson_complete` | lesson | `{title, module}` |
| `quiz_submit` | quiz | `{score, passed, title}` |
| `presentation_create` | presentation | `{title}` |
| `presentation_update` | presentation | `{title}` |
| `assessment_complete` | assessment | `{category_scores}` |
| `coaching_booked` | booking | `{datetime, title}` |

### Kanban Data Source
| Table | Query |
|-------|-------|
| `tasks` | WHERE status = 'doing' LIMIT 1 |
| `tasks` | WHERE status = 'todo' ORDER BY priority LIMIT 1 |

### Activity Feed Design
- Timeline layout with icons per activity type
- Relative timestamps ("2 hours ago")
- Links to relevant entity where applicable
- Paginated (10 items default, load more on scroll)

---

## Risk Considerations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Activity table grows large | Medium | Low | Add retention policy (90 days), pagination |
| Triggers slow down operations | Low | Medium | Keep triggers lightweight, async if needed |
| Schema changes needed | Low | Medium | Design flexible JSONB metadata field |

---

## Validation Commands
```bash
# Verify activity table exists
pnpm --filter web supabase status | grep user_activities

# Test activity recording
curl -X POST http://localhost:3000/api/test/activity \
  -H "Content-Type: application/json" \
  -d '{"type": "lesson_complete", "entity_id": "uuid"}'

# Verify activity feed loads
curl http://localhost:3000/home | grep -q "activity-feed"

# Run unit tests
pnpm --filter web test:unit -- activity
pnpm --filter web test:unit -- kanban-summary

# Verify RLS
# Test that users cannot see other users' activities
```

---

## Related Files
- Spec: `../spec.md`
- Parent Initiative: `../pending-Initiative-dashboard-foundation/initiative.md`
- Existing tasks table: `apps/web/supabase/schemas/` (find tasks schema)
- Research: `../research-library/perplexity-dashboard-design-patterns.md` (activity feed patterns)
- Features: `./<feature-#>-<slug>/` (created in next phase)
