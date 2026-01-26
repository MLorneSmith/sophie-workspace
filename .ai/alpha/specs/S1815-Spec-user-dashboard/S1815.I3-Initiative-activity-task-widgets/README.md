# Feature Overview: Activity & Task Widgets

**Parent Initiative**: S1815.I3
**Parent Spec**: S1815
**Created**: 2026-01-26
**Total Features**: 4
**Estimated Duration**: 15 days sequential / 7 days parallel

## Directory Structure

```
S1815.I3-Initiative-activity-task-widgets/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1815.I3.F1-Feature-kanban-summary-widget/
│   └── feature.md                                   # Priority 1: Kanban summary
├── S1815.I3.F2-Feature-activity-data-aggregation/
│   └── feature.md                                   # Priority 2: Activity data layer
├── S1815.I3.F3-Feature-activity-feed-widget/
│   └── feature.md                                   # Priority 3: Activity feed UI
└── S1815.I3.F4-Feature-quick-actions-panel/
    └── feature.md                                   # Priority 4: Quick actions
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1815.I3.F1 | Kanban Summary Widget | 1 | 3 | S1815.I1 | Draft |
| S1815.I3.F2 | Activity Data Aggregation | 2 | 4 | S1815.I1 | Draft |
| S1815.I3.F3 | Activity Feed Widget | 3 | 4 | S1815.I1, F2 | Draft |
| S1815.I3.F4 | Quick Actions Panel | 4 | 4 | S1815.I1 | Draft |

## Dependency Graph

```
                     ┌─────────────────────┐
                     │     S1815.I1        │
                     │ Dashboard Foundation │
                     └──────────┬──────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ S1815.I3.F1      │ │ S1815.I3.F2      │ │ S1815.I3.F4      │
│ Kanban Summary   │ │ Activity Data    │ │ Quick Actions    │
│ Widget           │ │ Aggregation      │ │ Panel            │
└──────────────────┘ └────────┬─────────┘ └──────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │ S1815.I3.F3      │
                   │ Activity Feed    │
                   │ Widget           │
                   └──────────────────┘
```

## Parallel Execution Groups

### Group 0: No Internal Dependencies (after S1815.I1 complete)
- **F1**: Kanban Summary Widget (3 days)
- **F2**: Activity Data Aggregation (4 days)
- **F4**: Quick Actions Panel (4 days)

### Group 1: Depends on Group 0
- **F3**: Activity Feed Widget (4 days) - depends on F2

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 15 days |
| Parallel Duration | 8 days (Group 0: 4 days + Group 1: 4 days) |
| Time Saved | 7 days (47%) |
| Max Parallelism | 3 features |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Kanban Summary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Activity Aggregation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| F3: Activity Feed | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F4: Quick Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: ✅ Pass | ⚠️ Partial (F2 is data-only, but enables vertical feature)

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Kanban Summary | Pragmatic | Reuse existing task query patterns, minimal new code |
| F2: Activity Aggregation | Pragmatic | Parallel fetch + client-side merge, avoid complex DB views |
| F3: Activity Feed | Pragmatic | Simple timeline layout, date-fns for time formatting |
| F4: Quick Actions | Pragmatic | CardButton pattern, conditional rendering on state flags |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Kanban Summary | None - uses existing patterns | N/A |
| F2: Activity Aggregation | 4 parallel DB queries may impact performance | Limit each query to 20 items, verify indexes exist |
| F3: Activity Feed | Activity titles may be missing without Payload enrichment | Show generic activity type text as fallback |
| F4: Quick Actions | Current lesson link may not exist | Default to course page if current lesson unknown |

## Component Reuse

All features leverage existing @kit/ui components:

| Component | Package | Used By |
|-----------|---------|---------|
| Card | @kit/ui/card | F1, F3, F4 |
| CardButton | @kit/ui/card-button | F4 |
| Skeleton | @kit/ui/skeleton | F1, F3, F4 |
| EmptyState | @kit/ui/empty-state | F1, F3 |
| Badge | @kit/ui/badge | F1 (priority indicator) |

## Data Dependencies

| Feature | Tables Queried | Existing Queries? |
|---------|---------------|-------------------|
| F1 | `tasks` | ✅ Yes - kanban module |
| F2 | `quiz_attempts`, `lesson_progress`, `course_progress`, `building_blocks_submissions` | Patterns exist |
| F3 | N/A (consumes F2 data) | N/A |
| F4 | `course_progress`, `survey_responses` | ✅ Yes - course/assessment modules |

## Next Steps

1. Run `/alpha:task-decompose S1815.I3.F1` to decompose the first feature (Kanban Summary Widget)
2. After I1 is complete, begin parallel implementation of F1, F2, and F4
3. After F2 is complete, begin F3 implementation
