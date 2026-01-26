# Initiative: Activity & Task Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1823 |
| **Initiative ID** | S1823.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 3 |

---

## Description
Implement the Kanban Summary Card, Recent Activity Feed, and Quick Actions Panel widgets. These widgets provide users with task visibility, activity history, and contextual navigation to key actions. The activity feed requires aggregating data from multiple tables (lessons, quizzes, presentations, assessments).

## Business Value
Enables users to track their current work (kanban tasks), see recent platform activity, and quickly navigate to relevant actions. The quick actions panel provides contextual CTAs that adapt based on user state, reducing navigation friction and increasing engagement.

---

## Scope

### In Scope
- [x] Kanban Summary Card showing "Doing" tasks and next "Do" task
- [x] Recent Activity Feed aggregating lessons, quizzes, presentations, assessments
- [x] Quick Actions Panel with contextual CTAs
- [x] Activity feed data aggregation service (union of 4+ tables)
- [x] Activity item type icons and relative timestamps
- [x] "View Board" link on Kanban widget
- [x] Widget loading states

### Out of Scope
- [ ] Real-time activity updates (polling/subscriptions)
- [ ] Team activity (personal only for v1)
- [ ] Activity filtering/search
- [ ] Pagination beyond 8 items (simple "View All" link)

---

## Dependencies

### Blocks
- S1823.I5 (needs widgets for empty states)

### Blocked By
- S1823.I1 (needs grid layout and type definitions)

### Parallel With
- S1823.I2 (Progress/Assessment Widgets)
- S1823.I4 (Coaching Integration)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Activity feed requires aggregating 4+ tables |
| External dependencies | Low | Internal DB queries only |
| Unknowns | Medium | Activity aggregation query performance |
| Reuse potential | Medium | Kanban API exists, activity feed is new |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Kanban Summary Widget**: Query tasks by status, display "Doing" and next "Do" items
2. **Activity Data Aggregation**: Create service to union lesson_progress, quiz_attempts, building_blocks_submissions, survey_responses with timestamps
3. **Activity Feed Widget**: Display chronological activity with icons and relative time
4. **Quick Actions Panel**: Conditional CTAs based on user state (course status, assessment completion, etc.)

### Suggested Order
1. Kanban Summary Widget (simplest, existing API)
2. Activity Data Aggregation (service layer, needed by feed)
3. Activity Feed Widget (depends on aggregation)
4. Quick Actions Panel (depends on knowing user state)

---

## Validation Commands
```bash
# Verify kanban widget displays tasks
curl -s http://localhost:3000/home | grep -q "kanban\|Doing"

# Verify activity feed renders
curl -s http://localhost:3000/home | grep -q "activity\|Recent"

# Performance check for activity aggregation
pnpm --filter web test:unit -- --grep "activity"
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Tasks API: `apps/web/app/home/(user)/kanban/_lib/api/tasks.ts`
- Tasks Table: `migrations/20250221144500_web_create_kanban_tables.sql`
- Lesson Progress: `migrations/20250319104726_web_course_system.sql`
- Quiz Attempts: `migrations/20250319104726_web_course_system.sql`
- Presentations: `migrations/20250211000000_web_create_building_blocks_submissions.sql`
