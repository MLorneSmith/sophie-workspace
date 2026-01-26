# Feature Overview: Activity & Task Widgets

**Parent Initiative**: S1823.I3
**Parent Spec**: S1823
**Created**: 2026-01-26
**Total Features**: 4
**Estimated Duration**: 9 days sequential / 5 days parallel

## Directory Structure

```
S1823.I3-Initiative-activity-task-widgets/
├── initiative.md                         # Initiative document
├── README.md                             # This file - features overview
├── S1823.I3.F1-Feature-kanban-summary-widget/
│   └── feature.md
├── S1823.I3.F2-Feature-activity-data-aggregation/
│   └── feature.md
├── S1823.I3.F3-Feature-activity-feed-widget/
│   └── feature.md
└── S1823.I3.F4-Feature-quick-actions-panel/
    └── feature.md
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1823.I3.F1 | Kanban Summary Widget | 1 | 2 | S1823.I1.F1 | Draft |
| S1823.I3.F2 | Activity Data Aggregation | 2 | 3 | F1 | Draft |
| S1823.I3.F3 | Activity Feed Widget | 3 | 2 | F2 | Draft |
| S1823.I3.F4 | Quick Actions Panel | 4 | 2 | F2 | Draft |

## Dependency Graph

```
S1823.I1.F1 (Dashboard Foundation - Types & Loader)
     │
     ▼
S1823.I3.F1 (Kanban Summary Widget)
     │
     │ establishes loader patterns
     ▼
S1823.I3.F2 (Activity Data Aggregation)
     │
     ├────────────────┐
     ▼                ▼
S1823.I3.F3       S1823.I3.F4
(Activity Feed)   (Quick Actions)
     │                │
     └────────────────┘
           │
           ▼
      [Integration]
```

## Parallel Execution Groups

### Group 0: Foundation Dependency
**Features**: None (blocked by S1823.I1.F1)
**Wait for**: S1823.I1.F1 (Dashboard types and loader infrastructure)

### Group 1: Kanban Widget
**Features**: S1823.I3.F1
**Duration**: 2 days
**Parallelism**: 1 feature

### Group 2: Activity Aggregation Service
**Features**: S1823.I3.F2
**Duration**: 3 days
**Parallelism**: 1 feature (depends on F1's loader patterns)

### Group 3: Presentation Widgets
**Features**: S1823.I3.F3, S1823.I3.F4
**Duration**: 2 days
**Parallelism**: 2 features (both consume F2 data)

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 9 days |
| Parallel Duration | 5 days (2 + 3 + 2 accounting for groups) |
| Time Saved | 4 days (44%) |
| Max Parallelism | 2 features (Group 3) |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Kanban Summary Widget | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Activity Data Aggregation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Activity Feed Widget | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F4: Quick Actions Panel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

### Validation Notes
- **F2 (Activity Data Aggregation)**: Service layer feature, "vertical" interpreted as data-to-presentation path
- All features are within 3-day estimate threshold
- All features touch fewer than 10 files

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Kanban Summary | Pragmatic | Reuse existing `getTasksByStatus()` pattern from Kanban API |
| F2: Activity Aggregation | Pragmatic | Server-side union query for performance, single data source |
| F3: Activity Feed | Pragmatic | Presentation-only component consuming pre-aggregated data |
| F4: Quick Actions | Pragmatic | Conditional rendering with priority-ordered action list |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1 | Tasks table empty for new users | Handle empty state gracefully |
| F2 | Union query performance | Limit to 10 items, add indexes if needed |
| F3 | Relative time localization | Use `Intl.RelativeTimeFormat` for i18n |
| F4 | Too many/few actions shown | Cap at 3-4 with priority ordering |

## Technical Highlights

### Shared Components
- All widgets use `@kit/ui/card` for consistent styling
- All icons from `lucide-react` for visual consistency
- Shared `DashboardData` type defined in `_lib/types/dashboard.types.ts`

### Data Flow
```
loadDashboardData() [cached, server-side]
├── loadTasksSummary() → F1 (Kanban Summary)
├── loadRecentActivities() → F3 (Activity Feed)
└── loadUserState() → F4 (Quick Actions)
```

### Key Patterns Used
- React `cache()` for per-request memoization
- `Promise.all()` for parallel data fetching
- Server Components for data loading, Client Components for interactivity
- RLS automatically enforces user data isolation

## Next Steps

1. Run `/alpha:task-decompose S1823.I3.F1` to decompose the first feature
2. Begin implementation with Priority 1 feature (Kanban Summary Widget)
3. After F1 completes, decompose and implement F2 (Activity Data Aggregation)
4. F3 and F4 can be decomposed and implemented in parallel after F2
