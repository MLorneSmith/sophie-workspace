# Feature Overview: Activity & Actions Widgets

**Parent Initiative**: S2072.I3
**Parent Spec**: S2072
**Created**: 2026-02-12
**Total Features**: 4
**Estimated Duration**: 9 days sequential / 5 days parallel

## Directory Structure

```
S2072.I3-Initiative-activity-task-widgets/
├── initiative.md                         # Initiative document
├── README.md                             # This file - features overview
├── S2072.I3.F1-Feature-activity-aggregation-query/
│   └── feature.md                        # Activity loader and types
├── S2072.I3.F2-Feature-activity-feed-widget/
│   └── feature.md                        # Timeline activity feed component
├── S2072.I3.F3-Feature-kanban-summary-widget/
│   └── feature.md                        # Kanban task summary card
└── S2072.I3.F4-Feature-quick-actions-panel/
    └── feature.md                        # Context-aware CTA buttons
```

## Feature Summary

| ID | Directory | Priority | Days | Dependencies | Status |
|----|-----------|----------|------|--------------|--------|
| S2072.I3.F1 | activity-aggregation-query | 1 | 3 | S2072.I1.F2, S2072.I1.F3 | Draft |
| S2072.I3.F2 | activity-feed-widget | 2 | 3 | F1, S2072.I1.F2, S2072.I1.F3 | Draft |
| S2072.I3.F3 | kanban-summary-widget | 3 | 2 | S2072.I1.F2, S2072.I1.F3 | Draft |
| S2072.I3.F4 | quick-actions-panel | 4 | 1 | S2072.I1.F2, S2072.I1.F3 | Draft |

## Dependency Graph

```
                    S2072.I1 (Foundation)
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    S2072.I1.F2    S2072.I1.F3    S2072.I1.F4
    (Types)        (Loader)       (Grid)
          │              │              │
          └──────────────┼──────────────┘
                         │
          ┌──────────────┼──────────────┬──────────────┐
          ▼              ▼              ▼              ▼
    S2072.I3.F1    S2072.I3.F3    S2072.I3.F4    (I2 features)
    (Activity      (Kanban        (Quick
     Aggregation)   Summary)       Actions)
          │
          ▼
    S2072.I3.F2
    (Activity
     Feed Widget)
```

## Parallel Execution Groups

**Group 0** (depends only on I1 foundation):
- S2072.I3.F1: Activity Aggregation Query (3 days)
- S2072.I3.F3: Kanban Summary Widget (2 days)
- S2072.I3.F4: Quick Actions Panel (1 day)

**Group 1** (depends on F1):
- S2072.I3.F2: Activity Feed Widget (3 days)

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 9 days |
| Parallel Duration | 6 days (F1 max + F2) |
| Time Saved | 3 days (33%) |
| Max Parallelism | 3 features (Group 0) |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V | Notes |
|---------|---|---|---|---|---|---|---|-------|
| S2072.I3.F1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Data layer, enables F2 |
| S2072.I3.F2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | User-visible widget |
| S2072.I3.F3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Independent of F1, F2 |
| S2072.I3.F4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Independent of F1, F2, F3 |

### Validation Details

**F1 - Activity Aggregation Query**:
- Independent: Can be tested in isolation via loader tests
- Negotiable: UNION pattern can be replaced with RPC if needed
- Valuable: Enables activity feed, critical for dashboard value
- Estimable: 3 days - well-documented pattern
- Small: 2 new files, 1 modified
- Testable: Unit tests for loader, integration tests for query
- Vertical: Data layer complete end-to-end

**F2 - Activity Feed Widget**:
- Independent: Can deploy alone (displays data or empty state)
- Negotiable: Timeline visual styling can vary
- Valuable: User sees recent activity at a glance
- Estimable: 3 days - component + integration
- Small: 2 new files, 1 modified
- Testable: Component tests, E2E tests for rendering
- Vertical: UI complete with data binding

**F3 - Kanban Summary Widget**:
- Independent: Standalone widget with own data source
- Negotiable: Preview format can vary
- Valuable: Keeps tasks top-of-mind
- Estimable: 2 days - reuses existing patterns heavily
- Small: 1 new file, 2 modified
- Testable: Component tests, visual verification
- Vertical: UI complete end-to-end

**F4 - Quick Actions Panel**:
- Independent: Standalone widget
- Negotiable: CTA order/priority can vary
- Valuable: Reduces navigation friction
- Estimable: 1 day - simple conditional rendering
- Small: 1 new file, 2 modified
- Testable: Component tests, context verification
- Vertical: UI complete with navigation

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1 | Pragmatic | Reuse UNION ALL pattern from RLS benchmarks |
| F2 | Pragmatic | Client component with server-fetched data |
| F3 | Minimal | Thin wrapper around existing kanban patterns |
| F4 | Pragmatic | Server component for zero client overhead |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1 | UNION query performance | Per-source LIMIT before union, add indexes |
| F2 | Empty state feels sparse | Follow UX research patterns, add illustration |
| F3 | Task data not in loader | Add tasks to dashboard loader in I1 |
| F4 | Context determination complex | Server-side props from loader, explicit flags |

## Next Steps

1. Run `/alpha:task-decompose S2072.I3.F1` to decompose the activity aggregation query feature
2. Begin implementation with Group 0 features (F1, F3, F4 can run in parallel)
3. F2 (Activity Feed Widget) starts after F1 completes
