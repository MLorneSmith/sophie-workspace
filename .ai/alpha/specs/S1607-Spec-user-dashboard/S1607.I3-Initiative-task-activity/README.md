# Feature Overview: Task & Activity Awareness

**Parent Initiative**: S1607.I3
**Parent Spec**: S1607
**Created**: 2026-01-20
**Total Features**: 2
**Estimated Duration**: 10 days sequential / 6 days parallel

## Directory Structure

```
S1607.I3-Initiative-task-activity/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1607.I3.F1-Feature-kanban-summary-widget/
│   └── feature.md                                   # Kanban Summary Widget feature
└── S1607.I3.F2-Feature-activity-feed-widget/
    └── feature.md                                   # Activity Feed Widget feature
```

## Feature Summary

| ID | Directory | Priority | Days | Dependencies | Status |
|----|-----------|----------|------|--------------|--------|
| S1607.I3.F1 | `S1607.I3.F1-Feature-kanban-summary-widget/` | 1 | 4 | S1607.I1 | Draft |
| S1607.I3.F2 | `S1607.I3.F2-Feature-activity-feed-widget/` | 2 | 6 | S1607.I1 | Draft |

## Dependency Graph

```
                    ┌─────────────────────────────────────┐
                    │  S1607.I1 - Dashboard Foundation    │
                    │  (Prerequisite - external to I3)    │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────┴───────────────────┐
                    │                                     │
                    ▼                                     ▼
     ┌──────────────────────────────┐   ┌──────────────────────────────┐
     │  S1607.I3.F1                 │   │  S1607.I3.F2                 │
     │  Kanban Summary Widget       │   │  Activity Feed Widget        │
     │  Priority: 1 | 4 days        │   │  Priority: 2 | 6 days        │
     └──────────────────────────────┘   └──────────────────────────────┘
```

## Parallel Execution Groups

### Group 0: Prerequisite (External)
| Feature | Est. Days | Notes |
|---------|-----------|-------|
| S1607.I1 | - | Dashboard Foundation must complete first |

### Group 1: Parallel Execution
| Feature | Est. Days | Notes |
|---------|-----------|-------|
| S1607.I3.F1 - Kanban Summary Widget | 4 | Hybrid SSR + Client pattern |
| S1607.I3.F2 - Activity Feed Widget | 6 | Pure server components |

**Max Parallelism**: 2 features can execute simultaneously

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 10 days |
| Parallel Duration | 6 days |
| Time Saved | 4 days (40%) |
| Max Parallelism | 2 features |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| S1607.I3.F1 Kanban Summary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| S1607.I3.F2 Activity Feed | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Legend: **I**ndependent, **N**egotiable, **V**aluable, **E**stimable, **S**mall, **T**estable, **V**ertical

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| S1607.I3.F1 Kanban Summary | Pragmatic (Hybrid SSR + Client) | Leverages existing useTasks() hook for real-time updates while providing SSR initial state |
| S1607.I3.F2 Activity Feed | Pragmatic (Pure Server Components) | Read-only widget with no interactivity; server components provide zero JS and instant SSR |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| S1607.I3.F1 Kanban Summary | Hydration mismatch between SSR and client | Pass initial data as props to ensure consistency |
| S1607.I3.F2 Activity Feed | Multi-table query performance | Parallel queries with Promise.all(), 30-day limit, indexed columns |

## Implementation Notes

### Kanban Summary Widget (F1)
- Reuses existing `useTasks()` hook from kanban feature
- Server component wrapper fetches initial data
- Client component provides real-time updates
- ~5 files to create/modify

### Activity Feed Widget (F2)
- Pure server components (no client JavaScript)
- Aggregates data from 4 tables: building_blocks_submissions, lesson_progress, quiz_attempts, survey_responses
- Time grouping with date-fns (Today, Yesterday, This Week, Earlier)
- ~7 files to create/modify

### Shared Infrastructure
Both features:
- Integrate with user-dashboard-page.loader.ts
- Use @kit/ui/card, @kit/ui/skeleton, @kit/ui/empty-state
- Follow existing (user) route patterns

## Next Steps

1. Run `/alpha:task-decompose S1607.I3.F1` to decompose the Kanban Summary Widget feature
2. After F1 tasks created, run `/alpha:task-decompose S1607.I3.F2` for Activity Feed Widget
3. Begin implementation with Priority 1 feature once S1607.I1 (Dashboard Foundation) is complete
