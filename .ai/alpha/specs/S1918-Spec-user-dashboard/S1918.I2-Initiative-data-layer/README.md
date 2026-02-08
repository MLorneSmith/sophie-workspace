# Feature Overview: Data Layer

**Parent Initiative**: S1918.I2
**Parent Spec**: S1918
**Created**: 2026-02-03
**Total Features**: 3
**Estimated Duration**: 9 days sequential / 6 days parallel

## Directory Structure

```
S1918.I2-Initiative-data-layer/
├── initiative.md                              # Initiative document
├── README.md                                  # This file - features overview
├── S1918.I2.F1-Feature-dashboard-types/       # Priority 1: Type definitions
│   └── feature.md
├── S1918.I2.F2-Feature-dashboard-loader/      # Priority 2: Main loader
│   └── feature.md
└── S1918.I2.F3-Feature-activity-aggregation/  # Priority 3: Activity feed data
    └── feature.md
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1918.I2.F1 | Dashboard Types | 1 | 2 | None | Draft |
| S1918.I2.F2 | Dashboard Loader | 2 | 4 | F1 | Draft |
| S1918.I2.F3 | Activity Aggregation | 3 | 3 | F1 | Draft |

## Dependency Graph

```
┌─────────────────────────┐
│  S1918.I2.F1            │
│  Dashboard Types        │
│  (2 days)               │
│  No dependencies        │
└───────────┬─────────────┘
            │
            ▼
┌───────────┴─────────────┬─────────────────────────┐
│                         │                         │
▼                         ▼                         │
┌─────────────────────────┐   ┌─────────────────────┐
│  S1918.I2.F2            │   │  S1918.I2.F3        │
│  Dashboard Loader       │   │  Activity           │
│  (4 days)               │   │  Aggregation        │
│  Blocked by: F1         │   │  (3 days)           │
└─────────────────────────┘   │  Blocked by: F1     │
            │                 └─────────────────────┘
            │                           │
            └───────────┬───────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │  Integration        │
              │  (F3 into F2)       │
              │  Final assembly     │
              └─────────────────────┘
```

## Parallel Execution Groups

**Group 0** (No dependencies - start immediately):
- S1918.I2.F1: Dashboard Types (2 days)

**Group 1** (Blocked by F1 - can run in parallel after F1):
- S1918.I2.F2: Dashboard Loader (4 days)
- S1918.I2.F3: Activity Aggregation (3 days)

**Integration Step** (After Group 1):
- Wire F3's `loadRecentActivity()` into F2's `loadDashboardPageData()`

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 9 days (F1→F2→F3) |
| Parallel Duration | 6 days (F1: 2 + max(F2: 4, F3: 3)) |
| Time Saved | 3 days (33%) |
| Max Parallelism | 2 features (F2 + F3) |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Dashboard Types | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* |
| F2: Dashboard Loader | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| F3: Activity Aggregation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

*F1 is types-only (no UI), but enables testable downstream features.

### INVEST-V Notes

**F1 - Dashboard Types**:
- **Independent**: Can be developed and merged alone
- **Negotiable**: Type structure flexible based on implementation needs
- **Valuable**: Enables type-safe development for all widgets
- **Estimable**: Straightforward type definitions
- **Small**: Single file, ~100-150 lines
- **Testable**: TypeScript compiler validates types
- **Vertical**: Data layer only (appropriate for types)

**F2 - Dashboard Loader**:
- **Independent**: Complete loader, usable by dashboard page
- **Negotiable**: Query details flexible
- **Valuable**: 60-80% page load improvement from parallel fetching
- **Estimable**: Following established patterns
- **Small**: ~8-10 files (1 loader + helper functions)
- **Testable**: Unit tests for each query function
- **Vertical**: Data + Logic layers complete

**F3 - Activity Aggregation**:
- **Independent**: Can be deployed separately
- **Negotiable**: Activity sources and merge strategy flexible
- **Valuable**: Users see complete activity history
- **Estimable**: 4 queries + merge logic
- **Small**: ~150-200 lines
- **Testable**: Unit tests with mock data
- **Vertical**: Data + Logic layers complete

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Dashboard Types | Pragmatic | Single types file, manual definitions, Zod only if needed |
| F2: Dashboard Loader | Pragmatic | Follow existing loader patterns, Promise.all, cache() wrapper |
| F3: Activity Aggregation | Pragmatic | Parallel fetches + client-side merge (simpler than UNION) |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Dashboard Types | Types don't match actual data | Define types from migration schemas, validate with queries |
| F2: Dashboard Loader | Query performance issues | Index verification, query optimization, limit result sets |
| F3: Activity Aggregation | Slow aggregation from 4 tables | 10-item limit, parallel fetches, consider caching |

## Cross-Initiative Dependencies

This initiative (S1918.I2) blocks multiple downstream initiatives:

| Downstream Initiative | Dependency | Specific Features Needed |
|-----------------------|------------|-------------------------|
| S1918.I3: Progress Widgets | Data for widgets | F1 types, F2 loader (course progress, survey scores) |
| S1918.I4: Activity & Task Widgets | Data for widgets | F1 types, F2 loader (tasks), F3 (activity feed) |
| S1918.I6: Polish | Error/empty states | F2 loader (for detecting empty data) |

## Next Steps

1. Run `/alpha:task-decompose S1918.I2.F1` to decompose the first feature (Dashboard Types)
2. After F1 tasks complete, decompose F2 and F3 in parallel
3. Begin implementation with Priority 1 / Group 0 feature
