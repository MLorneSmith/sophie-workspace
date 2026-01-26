# Feature Overview: Dashboard Foundation

**Parent Initiative**: S1823.I1
**Parent Spec**: S1823
**Created**: 2026-01-26
**Total Features**: 4
**Estimated Duration**: 10 days sequential / 5 days parallel

## Directory Structure

```
S1823.I1-Initiative-dashboard-foundation/
├── initiative.md                              # Initiative document
├── README.md                                  # This file - features overview
├── S1823.I1.F1-Feature-types-and-loader/
│   └── feature.md                            # TypeScript types & data loader
├── S1823.I1.F2-Feature-dashboard-page-shell/
│   └── feature.md                            # Page component structure
├── S1823.I1.F3-Feature-responsive-grid-layout/
│   └── feature.md                            # CSS Grid widget layout
└── S1823.I1.F4-Feature-skeleton-loading/
    └── feature.md                            # Loading state components
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1823.I1.F1 | Types and Loader | 1 | 3 | None | Draft |
| S1823.I1.F2 | Dashboard Page Shell | 2 | 2 | F1 | Draft |
| S1823.I1.F3 | Responsive Grid Layout | 3 | 3 | F1, F2 | Draft |
| S1823.I1.F4 | Skeleton Loading | 4 | 2 | F3 | Draft |

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   S1823.I1.F1 (Types & Loader)                             │
│   ────────────────────────────                             │
│         │                                                   │
│         │ blocks                                           │
│         ▼                                                   │
│   S1823.I1.F2 (Page Shell)                                 │
│   ────────────────────────                                 │
│         │                                                   │
│         │ blocks                                           │
│         ▼                                                   │
│   S1823.I1.F3 (Grid Layout)                                │
│   ─────────────────────────                                │
│         │                                                   │
│         │ blocks                                           │
│         ▼                                                   │
│   S1823.I1.F4 (Skeleton Loading)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Cross-Initiative Dependencies (F1 blocks):
├── S1823.I2.F1 (Course Progress Widget)
├── S1823.I2.F2 (Assessment Spider Widget)
├── S1823.I3.F1 (Kanban Summary Widget)
├── S1823.I3.F3 (Activity Feed Widget)
└── S1823.I5.F1 (Presentation Table Widget)

Cross-Initiative Dependencies (F3 blocks):
├── S1823.I2 (All progress/assessment widgets)
├── S1823.I3 (All activity/task widgets)
├── S1823.I4 (Coaching widget)
└── S1823.I5.F1 (Presentation table)
```

## Parallel Execution Groups

**Group 0 (No Dependencies)**:
- S1823.I1.F1: Types and Loader (3 days)

**Group 1 (Depends on Group 0)**:
- S1823.I1.F2: Dashboard Page Shell (2 days)

**Group 2 (Depends on Group 1)**:
- S1823.I1.F3: Responsive Grid Layout (3 days)

**Group 3 (Depends on Group 2)**:
- S1823.I1.F4: Skeleton Loading (2 days)

*Note*: This initiative has a sequential dependency chain. No parallel execution within initiative.

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 10 days |
| Parallel Duration | 10 days |
| Time Saved | 0 days (0%) |
| Max Parallelism | 1 feature (linear dependency chain) |

*Note*: This foundation initiative is intentionally sequential - each feature builds on the previous. The parallelism benefits come at the cross-initiative level, where I2/I3/I4 can start in parallel once I1 completes.

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Types & Loader | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| F2: Page Shell | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| F3: Grid Layout | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| F4: Skeleton Loading | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

### Validation Notes
- **F1**: Vertical slice spans Logic + Data layers (types + loader)
- **F2**: Vertical slice spans UI + Logic + Data layers (page + loader integration)
- **F3**: Vertical slice spans UI layer (grid layout with placeholder cards)
- **F4**: Vertical slice spans UI layer (skeleton components matching grid)

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Types & Loader | Pragmatic | Follow existing `load-user-workspace.ts` pattern with `Promise.all()` |
| F2: Page Shell | Pragmatic | Follow existing `course/page.tsx` pattern exactly |
| F3: Grid Layout | Pragmatic | Follow `dashboard-demo-charts.tsx` grid pattern |
| F4: Skeleton Loading | Pragmatic | Follow `skeleton-story.tsx` examples from dev-tool |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Types & Loader | Schema changes in source tables | Use existing table schemas, verify with typegen |
| F2: Page Shell | Route conflicts with existing page | Intentional upgrade of minimal `/home` page |
| F3: Grid Layout | Responsive breakpoint issues | Test at all breakpoints, follow proven pattern |
| F4: Skeleton Loading | Mismatch with final layout | Create skeleton after grid is finalized |

## Next Steps

1. Run `/alpha:task-decompose S1823.I1.F1` to decompose the first feature (Types and Loader)
2. Begin implementation with F1 as it has no dependencies
3. After F1 completes, features in I2/I3/I4/I5 that only depend on F1 can start in parallel
