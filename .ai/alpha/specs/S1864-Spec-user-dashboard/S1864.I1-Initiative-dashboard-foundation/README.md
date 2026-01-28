# Feature Overview: Dashboard Foundation

**Parent Initiative**: S1864.I1
**Parent Spec**: S1864
**Created**: 2026-01-27
**Total Features**: 4
**Estimated Duration**: 7 days sequential / 4 days parallel

## Directory Structure

```
S1864.I1-Initiative-dashboard-foundation/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1864.I1.F1-Feature-types-and-loader/
│   └── feature.md                                   # Types and Data Loader
├── S1864.I1.F2-Feature-dashboard-page-shell/
│   └── feature.md                                   # Dashboard Page Shell
├── S1864.I1.F3-Feature-responsive-grid-layout/
│   └── feature.md                                   # Responsive Grid Layout
└── S1864.I1.F4-Feature-skeleton-loading/
    └── feature.md                                   # Skeleton Loading States
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1864.I1.F1 | Types and Data Loader | 1 | 2 | None | Draft |
| S1864.I1.F2 | Dashboard Page Shell | 2 | 2 | F1 | Draft |
| S1864.I1.F3 | Responsive Grid Layout | 3 | 2 | F1, F2 | Draft |
| S1864.I1.F4 | Skeleton Loading States | 4 | 1 | None | Draft |

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    S1864.I1 - Dashboard Foundation          │
└─────────────────────────────────────────────────────────────┘

     F1 (Types & Loader)                F4 (Skeleton)
            │                                │
            ▼                                │
     F2 (Page Shell) ◀───────────────────────┘
            │              (Suspense fallback)
            ▼
     F3 (Grid Layout)
            │
            ▼
    ┌───────────────────────────────────────────────────────┐
    │  Blocks All I2-I5 Features (widget positioning)       │
    └───────────────────────────────────────────────────────┘
```

## Parallel Execution Groups

**Group 0** (Start Immediately):
- F1: Types and Data Loader
- F4: Skeleton Loading States

**Group 1** (After F1 completes):
- F2: Dashboard Page Shell

**Group 2** (After F2 completes):
- F3: Responsive Grid Layout

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 7 days |
| Parallel Duration | 4 days |
| Time Saved | 3 days (43%) |
| Max Parallelism | 2 features |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Types & Loader | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Page Shell | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Grid Layout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F4: Skeleton Loading | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Types & Loader | Pragmatic | Follow `admin-dashboard.loader.ts` pattern with Promise.all |
| F2: Page Shell | Pragmatic | Follow existing `/home/[account]/page.tsx` pattern |
| F3: Grid Layout | Pragmatic | Follow `dashboard-demo-charts.tsx` responsive grid pattern |
| F4: Skeleton Loading | Pragmatic | Match grid structure with Skeleton components |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Types & Loader | Types may need adjustment as widgets are built | Types are extensible, can add fields without breaking changes |
| F2: Page Shell | Suspense boundary placement | Single boundary for simplicity, can split later if needed |
| F3: Grid Layout | Responsive breakpoints | Using battle-tested Tailwind breakpoints (md, xl) |
| F4: Skeleton Loading | Heights may not match final widgets | Will refine as widgets are implemented |

## Files Created/Modified

### New Files (4)
- `apps/web/app/home/(user)/_lib/server/dashboard-types.ts`
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts`
- `apps/web/app/home/(user)/_components/dashboard-grid.tsx`
- `apps/web/app/home/(user)/_components/dashboard-skeleton.tsx`

### Modified Files (1)
- `apps/web/app/home/(user)/page.tsx`

### No Database Changes
- No migrations required
- No RLS policies required
- Uses existing tables via placeholder loaders

## Cross-Initiative Dependencies

This initiative blocks features in subsequent initiatives that need:
- **Grid positions**: I2, I3, I4, I5 widgets need DashboardGrid slots
- **Data loader**: I2-I5 will implement actual loader functions
- **Types**: I2-I5 will use DashboardData type definitions

**Feature-level dependencies for downstream initiatives:**
- S1864.I2.F1 (Course Progress) blocked by: S1864.I1.F1, S1864.I1.F3
- S1864.I2.F2 (Spider Chart) blocked by: S1864.I1.F1, S1864.I1.F3
- S1864.I3.F1 (Kanban Summary) blocked by: S1864.I1.F1, S1864.I1.F3
- S1864.I3.F3 (Activity Feed) blocked by: S1864.I1.F1, S1864.I1.F3
- S1864.I3.F4 (Quick Actions) blocked by: S1864.I1.F1, S1864.I1.F3
- S1864.I4.F2 (Coaching Widget) blocked by: S1864.I1.F1, S1864.I1.F3
- S1864.I5.F1 (Presentation Table) blocked by: S1864.I1.F1, S1864.I1.F3

## Next Steps

1. Run `/alpha:task-decompose S1864.I1.F1` to decompose the Types and Loader feature
2. Begin implementation with Priority 1 / Group 0 features (F1 and F4 in parallel)
