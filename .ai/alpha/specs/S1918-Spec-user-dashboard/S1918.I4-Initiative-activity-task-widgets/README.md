# Feature Overview: Activity & Task Widgets

**Parent Initiative**: S1918.I4
**Parent Spec**: S1918
**Created**: 2026-02-03
**Total Features**: 4
**Estimated Duration**: 12 days sequential / 6 days parallel

## Directory Structure

```
S1918.I4-Initiative-activity-task-widgets/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1918.I4.F1-Feature-quick-actions-panel/
│   └── feature.md
├── S1918.I4.F2-Feature-kanban-summary-widget/
│   └── feature.md
├── S1918.I4.F3-Feature-presentations-table-widget/
│   └── feature.md
└── S1918.I4.F4-Feature-activity-feed-widget/
    └── feature.md
```

## Feature Summary

| ID | Directory | Priority | Days | Dependencies | Status |
|----|-----------|----------|------|--------------|--------|
| S1918.I4.F1 | `S1918.I4.F1-Feature-quick-actions-panel/` | 1 | 2 | S1918.I1.F1, S1918.I2.F1, S1918.I2.F2 | Draft |
| S1918.I4.F2 | `S1918.I4.F2-Feature-kanban-summary-widget/` | 2 | 3 | S1918.I1.F1, S1918.I2.F1, S1918.I2.F2 | Draft |
| S1918.I4.F3 | `S1918.I4.F3-Feature-presentations-table-widget/` | 3 | 3 | S1918.I1.F1, S1918.I2.F1, S1918.I2.F2 | Draft |
| S1918.I4.F4 | `S1918.I4.F4-Feature-activity-feed-widget/` | 4 | 4 | S1918.I1.F1, S1918.I2.F1, S1918.I2.F2, S1918.I2.F3 | Draft |

## Dependency Graph

```
External Dependencies (from other initiatives):
┌──────────────────────────────────────────────────────────┐
│  S1918.I1.F1 (Dashboard Grid)                            │
│  S1918.I2.F1 (Dashboard Types)                           │
│  S1918.I2.F2 (Dashboard Loader)                          │
│  S1918.I2.F3 (Activity Aggregation) ─────────────────────┼────┐
└──────────────────────────────────────────────────────────┘    │
                │                                                │
                │ (all features blocked by I1.F1, I2.F1, I2.F2) │
                ▼                                                │
┌──────────────────────────────────────────────────────────┐    │
│              I4 Features (this initiative)               │    │
│                                                          │    │
│    ┌─────────┐   ┌─────────┐   ┌─────────┐              │    │
│    │  F1     │   │  F2     │   │  F3     │              │    │
│    │ Quick   │   │ Kanban  │   │ Table   │              │    │
│    │ Actions │   │ Summary │   │ Widgets │              │    │
│    └─────────┘   └─────────┘   └─────────┘              │    │
│         │             │             │                    │    │
│         │   ┌─────────────────────────┐                 │    │
│         └───┤ Can run in parallel    │                  │    │
│             │ once deps satisfied    │                  │    │
│             └─────────────────────────┘                 │    │
│                                                          │    │
│    ┌─────────────────────────────────────────────────┐  │    │
│    │  F4 - Activity Feed                              │  │◄───┘
│    │  (additional dep: S1918.I2.F3)                   │  │
│    └─────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**ASCII (simplified):**
```
S1918.I1.F1 + S1918.I2.F1 + S1918.I2.F2
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
   F1           F2           F3
(Quick       (Kanban      (Table)
Actions)     Summary)
    │            │            │
    └────────────┼────────────┘
                 │
                 ▼
   S1918.I2.F3 ──────► F4 (Activity Feed)
```

## Parallel Execution Groups

| Group | Features | Start After | Duration |
|-------|----------|-------------|----------|
| 0 | F1, F2, F3 | S1918.I2.F2 complete | 3 days (max of F2, F3) |
| 1 | F4 | Group 0 + S1918.I2.F3 complete | 4 days |

**Note**: F1 is simplest (2 days) but starts with Group 0. F4 has additional dependency on activity aggregation feature from I2.

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 12 days (F1 + F2 + F3 + F4) |
| Parallel Duration | 6-7 days |
| Time Saved | 5-6 days (~50%) |
| Max Parallelism | 3 features (F1, F2, F3 in parallel) |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Quick Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Kanban Summary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Presentations Table | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F4: Activity Feed | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Quick Actions | Pragmatic | Simple conditional rendering, no client state |
| F2: Kanban Summary | Pragmatic | Reuse task patterns, server component with props |
| F3: Presentations Table | Pragmatic | Standard shadcn Table, server-rendered |
| F4: Activity Feed | Pragmatic | Most complex - multi-source aggregation, but normalized data from loader |

## Risk Summary

| Feature | Primary Risk | Probability | Impact | Mitigation |
|---------|--------------|-------------|--------|------------|
| F1: Quick Actions | None - straightforward | Low | Low | Follow existing patterns |
| F2: Kanban Summary | Task query performance | Low | Low | Limit to summary data |
| F3: Presentations Table | Table responsiveness on mobile | Medium | Low | Test on mobile, fallback to cards |
| F4: Activity Feed | Aggregation query complexity | Medium | Medium | In-memory merge, limit 10 items |

## Widget Grid Placement

Reference: Spec Section 5 Visual Assets

```
┌──────────────────────┬──────────────────────┬────────────────────────────────┐
│ Course Progress      │ Skills Assessment    │ Kanban Summary (F2)            │
│ (I3.F2)              │ (I3.F1)              │                                │
├──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Activity Feed (F4)   │ Quick Actions (F1)   │ Coaching Sessions (I5)         │
├──────────────────────┴──────────────────────┴────────────────────────────────┤
│ Presentations Table (F3) - Full Width                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Components Reused

| Component | Source | Used By |
|-----------|--------|---------|
| Card, CardHeader, CardContent | @kit/ui/card | All features |
| Button | @kit/ui/button | F1, F3 |
| Badge | @kit/ui/badge | F2 |
| Table, TableHeader, TableBody, etc. | @kit/ui/table | F3 |
| Link | next/link | All features |
| Lucide icons | lucide-react | All features |

## Data Dependencies

| Feature | Data Source | Query Type |
|---------|-------------|------------|
| F1: Quick Actions | course_progress, survey_responses, building_blocks_submissions | Boolean flags |
| F2: Kanban Summary | tasks | Count + limited records |
| F3: Presentations Table | building_blocks_submissions | Limited records (5) |
| F4: Activity Feed | lesson_progress, quiz_attempts, building_blocks_submissions, survey_responses | Aggregated, normalized |

## Next Steps

1. Run `/alpha:task-decompose S1918.I4.F1` for Priority 1 feature (Quick Actions Panel)
2. Continue with F2-F4 in parallel once F1 pattern is established
3. Ensure I1 and I2 features are implemented first (blocked by)
4. Update this overview as features are decomposed

---

## Decomposition Metadata

| Field | Value |
|-------|-------|
| Decomposed By | /alpha:feature-decompose |
| Date | 2026-02-03 |
| Complexity Assessment | LOW |
| Workflow Selection | Abbreviated |
