# Feature Overview: Dashboard Foundation & Data Layer

**Parent Initiative**: S2045.I1
**Parent Spec**: S2045
**Created**: 2026-02-09
**Total Features**: 3
**Estimated Duration**: 13 days sequential / 9 days parallel

## Directory Structure

```
S2045.I1-Initiative-foundation-data-layer/
├── initiative.md                                          # Initiative document
├── README.md                                              # This file - features overview
├── S2045.I1.F1-Feature-dashboard-page-shell/
│   └── feature.md                                         # Dashboard page & grid layout
├── S2045.I1.F2-Feature-activity-events-database/
│   └── feature.md                                         # Activity events table, triggers, RLS
└── S2045.I1.F3-Feature-dashboard-data-loader/
    └── feature.md                                         # Parallel data loader with 7 queries
```

## Feature Summary

| ID | Directory | Priority | Days | Dependencies | Status |
|----|-----------|----------|------|--------------|--------|
| S2045.I1.F1 | `S2045.I1.F1-Feature-dashboard-page-shell/` | 1 | 4 | None | Draft |
| S2045.I1.F2 | `S2045.I1.F2-Feature-activity-events-database/` | 2 | 5 | None | Draft |
| S2045.I1.F3 | `S2045.I1.F3-Feature-dashboard-data-loader/` | 3 | 4 | F1, F2 | Draft |

## Dependency Graph

```
┌─────────────────────┐     ┌─────────────────────────────┐
│ S2045.I1.F1         │     │ S2045.I1.F2                 │
│ Dashboard Page Shell │     │ Activity Events Database    │
│ (4 days)            │     │ (5 days)                    │
│ Priority: 1         │     │ Priority: 2                 │
└─────────┬───────────┘     └──────────────┬──────────────┘
          │                                │
          │    ┌───────────────────────┐    │
          └───►│ S2045.I1.F3           │◄───┘
               │ Dashboard Data Loader │
               │ (4 days)             │
               │ Priority: 3          │
               └───────────────────────┘
```

## Parallel Execution Groups

### Group 0: Foundation (start immediately)
| Feature | Days | Dependencies |
|---------|------|--------------|
| S2045.I1.F1: Dashboard Page Shell | 4 | None |
| S2045.I1.F2: Activity Events Database | 5 | None |

### Group 1: Integration (after Group 0 completes)
| Feature | Days | Dependencies |
|---------|------|--------------|
| S2045.I1.F3: Dashboard Data Loader | 4 | F1, F2 |

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 13 days |
| Parallel Duration | 9 days |
| Time Saved | 4 days (31%) |
| Max Parallelism | 2 features |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Dashboard Page Shell | Y | Y | Y | Y | Y | Y | Y |
| F2: Activity Events Database | Y | Y | Y | Y | Y | Y | Y |
| F3: Dashboard Data Loader | Y | Y | Y | Y | Y | Y | Y |

### Validation Notes

**F1 - Dashboard Page Shell**
- **Independent**: Can deploy alone (renders placeholder cards)
- **Valuable**: Transforms blank `/home` into visible dashboard layout
- **Estimable**: 4 days (page + grid + skeleton + i18n)
- **Small**: ~5 files touched
- **Testable**: Visual verification of grid layout at breakpoints
- **Vertical**: UI layer only, but delivers deployable value

**F2 - Activity Events Database**
- **Independent**: Can deploy alone (table + triggers exist but no UI reads them yet)
- **Valuable**: Starts recording activity events immediately for future display
- **Estimable**: 5 days (table + enum + 5 triggers + RLS + typegen)
- **Small**: ~3 files (schema, migration, types)
- **Testable**: Insert source data → verify activity_events rows created
- **Vertical**: Data layer only, but provides testable infrastructure

**F3 - Dashboard Data Loader**
- **Independent**: Can deploy with F1+F2 (shows real data in placeholder cards)
- **Valuable**: Enables real data display, proves < 2s load time
- **Estimable**: 4 days (types + loader + 7 queries + page integration)
- **Small**: ~4 files touched
- **Testable**: Page loads with real data, typecheck passes
- **Vertical**: Spans Data + Logic + UI integration

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Dashboard Page Shell | Pragmatic | Follow existing page patterns (withI18n, HomeLayoutPageHeader, PageBody). Tailwind grid matching dashboard-demo-charts.tsx |
| F2: Activity Events Database | Pragmatic | Follow existing migration patterns. AFTER INSERT triggers for non-blocking. Denormalized title for fast reads |
| F3: Dashboard Data Loader | Pragmatic | Follow billing loader pattern (server-only + cache + Promise.allSettled). Separate types per widget for clean I2/I3 integration |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Dashboard Page Shell | Grid breakpoints may need adjustment after widgets added | Use standard Tailwind responsive classes; fine-tune in I2/I3 |
| F2: Activity Events Database | Triggers could add write latency to source tables | Use AFTER INSERT (async); monitor with `EXPLAIN ANALYZE` |
| F3: Dashboard Data Loader | One query failure could break entire dashboard | Use `Promise.allSettled()` for resilience; return null for failed queries |

## Next Steps

1. Run `/alpha:task-decompose S2045.I1.F1` to decompose the first feature
2. Run `/alpha:task-decompose S2045.I1.F2` in parallel (independent of F1)
3. After F1 and F2 tasks are defined, run `/alpha:task-decompose S2045.I1.F3`
4. Begin implementation with Group 0 features (F1 + F2 in parallel)
