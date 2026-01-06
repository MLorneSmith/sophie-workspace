# Feature Overview: Activity & Task Tracking

**Parent Initiative**: #1365
**Parent Spec**: #1362
**Created**: 2026-01-01
**Total Features**: 4
**Estimated Duration**: 15 days sequential / 12 days parallel

## Directory Structure

```
1365-Initiative-activity-task-tracking/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── 1373-Feature-activity-database-schema/
│   └── feature.md                                   # F1: Database foundation
├── 1374-Feature-activity-recording-service/
│   └── feature.md                                   # F2: Recording service
├── 1375-Feature-activity-feed-component/
│   └── feature.md                                   # F3: Feed UI component
└── 1376-Feature-kanban-summary-card/
    └── feature.md                                   # F4: Kanban summary UI
```

## Feature Summary

| ID | Issue | Directory | Priority | Days | Dependencies | Status |
|----|-------|-----------|----------|------|--------------|--------|
| 1365-F1 | #1373 | 1373-Feature-activity-database-schema | 1 | 3 | None | Draft |
| 1365-F2 | #1374 | 1374-Feature-activity-recording-service | 2 | 4 | #1373 | Draft |
| 1365-F3 | #1375 | 1375-Feature-activity-feed-component | 3 | 5 | #1374 | Draft |
| 1365-F4 | #1376 | 1376-Feature-kanban-summary-card | 1 | 3 | None | Draft |

## Dependency Graph

```
┌─────────────────────────────────────┐
│ #1373: Activity Database Schema (3d)│ ────┐
│ Priority: 1 | Group: 0              │     │
└─────────────────────────────────────┘     │
              │                             │
              ▼                             │
┌─────────────────────────────────────┐     │
│ #1374: Activity Recording Svc (4d)  │     │
│ Priority: 2 | Group: 1              │     │
└─────────────────────────────────────┘     │
              │                             │
              ▼                             │
┌─────────────────────────────────────┐     │
│ #1375: Activity Feed Component (5d) │     │
│ Priority: 3 | Group: 2              │     │
└─────────────────────────────────────┘     │
                                            │
┌─────────────────────────────────────┐     │
│ #1376: Kanban Summary Card (3d)     │ ◄───┘ (parallel)
│ Priority: 1 | Group: 0              │
└─────────────────────────────────────┘
```

## Parallel Execution Groups

### Group 0 (Start Immediately)
| Feature | Issue | Days | Notes |
|---------|-------|------|-------|
| Activity Database Schema | #1373 | 3 | Foundation for activity tracking |
| Kanban Summary Card | #1376 | 3 | Independent - queries existing tasks table |

**Max parallelism**: 2 features

### Group 1 (After Group 0)
| Feature | Issue | Days | Notes |
|---------|-------|------|-------|
| Activity Recording Service | #1374 | 4 | Requires #1373 (user_activities table) |

### Group 2 (After Group 1)
| Feature | Issue | Days | Notes |
|---------|-------|------|-------|
| Activity Feed Component | #1375 | 5 | Requires #1374 (activities to display) |

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 15 days |
| Parallel Duration | 12 days |
| Time Saved | 3 days (20%) |
| Max Parallelism | 2 features |

### Critical Path
```
#1373 (3d) → #1374 (4d) → #1375 (5d) = 12 days
```

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| #1373: Activity Database Schema | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| #1374: Activity Recording Service | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| #1375: Activity Feed Component | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| #1376: Kanban Summary Card | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| #1373: Activity Database Schema | Pragmatic | Subquery RLS for performance; JSONB for flexibility |
| #1374: Activity Recording Service | Pragmatic (Hybrid) | Triggers for auto-events; server actions for explicit events |
| #1375: Activity Feed Component | Pragmatic | Server-first rendering; minimal client interactivity |
| #1376: Kanban Summary Card | Pragmatic | Parallel queries; leverage existing tasks table |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| #1373: Activity Database Schema | Schema changes for new types | Flexible JSONB metadata field |
| #1374: Activity Recording Service | Trigger complexity | Security invoker; graceful degradation |
| #1375: Activity Feed Component | Large activity count | Limit to 10 items; pagination later |
| #1376: Kanban Summary Card | No current task | Empty state with create task CTA |

## Next Steps

1. Run `/alpha:task-decompose 1373` to decompose the first feature (Activity Database Schema)
2. Run `/alpha:task-decompose 1376` to decompose F4 in parallel (Kanban Summary Card)
3. Begin implementation with Priority 1 / Group 0 features
