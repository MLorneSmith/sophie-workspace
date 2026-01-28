# Feature Overview: Activity & Task Widgets

**Parent Initiative**: S1864.I3
**Parent Spec**: S1864
**Created**: 2026-01-27
**Total Features**: 4
**Estimated Duration**: 15 days sequential / 8 days parallel

## Directory Structure

```
S1864.I3-Initiative-activity-task-widgets/
├── initiative.md                                        # Initiative document
├── README.md                                            # This file - features overview
├── S1864.I3.F1-Feature-kanban-summary-widget/
│   └── feature.md
├── S1864.I3.F2-Feature-activity-data-aggregation/
│   └── feature.md
├── S1864.I3.F3-Feature-activity-feed-widget/
│   └── feature.md
└── S1864.I3.F4-Feature-quick-actions-panel/
    └── feature.md
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1864.I3.F1 | Kanban Summary Widget | 1 | 3 | S1864.I1.F1, S1864.I1.F3 | Draft |
| S1864.I3.F2 | Activity Data Aggregation | 2 | 4 | S1864.I1.F1 | Draft |
| S1864.I3.F3 | Activity Feed Widget | 3 | 4 | F2, S1864.I1.F1, S1864.I1.F3 | Draft |
| S1864.I3.F4 | Quick Actions Panel | 4 | 4 | S1864.I1.F1, S1864.I1.F3 | Draft |

## Dependency Graph

```
                    ┌─────────────────────────────┐
                    │      S1864.I1.F1            │
                    │  (Dashboard Types/Loader)   │
                    └─────────────┬───────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   S1864.I3.F1   │     │   S1864.I3.F2   │     │   S1864.I3.F4   │
│ Kanban Summary  │     │ Activity Data   │     │ Quick Actions   │
│     Widget      │     │  Aggregation    │     │     Panel       │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   S1864.I3.F3   │
                        │ Activity Feed   │
                        │     Widget      │
                        └─────────────────┘
```

**Note**: F1, F2, and F4 also depend on S1864.I1.F3 (Dashboard Grid Layout) for integration.

## Parallel Execution Groups

### Group 0: Foundation Dependencies (from I1)
- S1864.I1.F1: Dashboard TypeScript types and loader skeleton
- S1864.I1.F3: Dashboard responsive grid layout

### Group 1: Independent Features (can start after Group 0)
- **S1864.I3.F1**: Kanban Summary Widget (3 days)
- **S1864.I3.F2**: Activity Data Aggregation (4 days) - **critical path**
- **S1864.I3.F4**: Quick Actions Panel (4 days)

### Group 2: Dependent Feature (after F2 completes)
- **S1864.I3.F3**: Activity Feed Widget (4 days)

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 15 days |
| Parallel Duration | 8 days |
| Time Saved | 7 days (47%) |
| Max Parallelism | 3 features (F1, F2, F4 in parallel) |

**Critical Path**: I1.F1 → I3.F2 → I3.F3 (4 + 4 = 8 days from I3 start)

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Kanban Summary | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Activity Data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Activity Feed | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F4: Quick Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Validation Notes**:
- **Independent**: F1, F2, F4 have no dependencies on each other; F3 depends only on F2
- **Negotiable**: All approaches are flexible (e.g., could use server components instead of client)
- **Valuable**: Each widget delivers visible user value on the dashboard
- **Estimable**: Based on similar patterns in codebase (3-4 days each)
- **Small**: Each feature touches 3-6 files
- **Testable**: Clear acceptance criteria with validation commands
- **Vertical**: Each spans UI → Logic → Data layers

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Kanban Summary | Pragmatic | Reuse existing `useTasks()` hook, client-side filtering |
| F2: Activity Data | Pragmatic | Simple append-only table with RPC, integrate into existing server actions |
| F3: Activity Feed | Pragmatic | Follow notifications popover pattern, React Query with pagination |
| F4: Quick Actions | Pragmatic | Parallel data fetching, CardButton grid, derived actions |

**Overall Approach**: Pragmatic balance - maximize reuse of existing patterns while keeping code simple and maintainable.

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Kanban Summary | None - uses existing infrastructure | N/A |
| F2: Activity Data | Requires modifying existing server actions | Careful testing, rollback plan |
| F3: Activity Feed | Performance with large activity history | Pagination, indexed queries |
| F4: Quick Actions | Multiple parallel queries on page load | React Query caching, parallel fetch |

## Research Utilized

| Research File | Features Affected | Key Insights Applied |
|---------------|-------------------|----------------------|
| `perplexity-dashboard-ux.md` | All | Infinite scroll for feeds, 3-6 widgets max, <3s load target |
| `context7-recharts-radar.md` | N/A | Not applicable to I3 (used in I2) |
| `context7-calcom.md` | N/A | Not applicable to I3 (used in I4) |

## Code Reuse Summary

| Existing Asset | Used By | Type |
|----------------|---------|------|
| `useTasks()` hook | F1 | Direct reuse |
| `task.schema.ts` | F1 | Types |
| Notifications popover pattern | F3 | Pattern reference |
| `Intl.RelativeTimeFormat` pattern | F3 | Code pattern |
| `CardButton` component | F4 | Direct reuse |
| `ScrollArea` component | F3 | Direct reuse |
| `Card` components | F1, F3, F4 | Direct reuse |
| `Skeleton` component | F1, F3, F4 | Direct reuse |
| `EmptyState` component | F1, F3, F4 | Direct reuse |

## Next Steps

1. Run `/alpha:task-decompose S1864.I3.F1` to decompose Priority 1 feature (Kanban Summary Widget)
2. After F1 tasks created, can decompose F2 in parallel
3. Begin implementation with Group 1 features once I1 foundation is complete

## Cross-Initiative Dependencies

This initiative (I3) depends on:
- **S1864.I1.F1**: Dashboard TypeScript types and loader skeleton (foundation)
- **S1864.I1.F3**: Dashboard responsive grid layout (integration point)

This initiative can run **in parallel with**:
- **S1864.I2**: Progress & Assessment Widgets
- **S1864.I4**: Coaching Integration
