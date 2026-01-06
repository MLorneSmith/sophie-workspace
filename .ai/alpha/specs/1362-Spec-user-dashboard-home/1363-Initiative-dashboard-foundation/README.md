# Feature Overview: Dashboard Foundation

**Parent Initiative**: #1363
**Parent Spec**: #1362
**Created**: 2026-01-01
**Total Features**: 4
**Estimated Duration**: 12 days sequential / 7 days parallel

## Directory Structure

```
1363-Initiative-dashboard-foundation/
├── initiative.md                              # Initiative document
├── README.md                                  # This file - features overview
├── 1367-Feature-dashboard-page-grid/          # F1: Foundation (Priority 1)
│   └── feature.md
├── 1368-Feature-presentation-table/           # F2: Table (Priority 2)
│   └── feature.md
├── 1369-Feature-quick-actions-panel/          # F3: Actions (Priority 3)
│   └── feature.md
└── 1370-Feature-empty-state-system/           # F4: Empty States (Priority 4)
    └── feature.md
```

## Feature Summary

| ID | Issue | Directory | Priority | Days | Dependencies | Status |
|----|-------|-----------|----------|------|--------------|--------|
| 1363-F1 | #1367 | 1367-Feature-dashboard-page-grid | 1 | 4 | None | Draft |
| 1363-F2 | #1368 | 1368-Feature-presentation-table | 2 | 3 | #1367 | Draft |
| 1363-F3 | #1369 | 1369-Feature-quick-actions-panel | 3 | 3 | #1367 | Draft |
| 1363-F4 | #1370 | 1370-Feature-empty-state-system | 4 | 2 | #1367 | Draft |

## Dependency Graph

```
                    ┌─────────────────────────────┐
                    │  F1: Dashboard Page & Grid  │
                    │  (Foundation - 4 days)      │
                    └─────────────┬───────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
           ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ F2: Presentation │  │ F3: Quick        │  │ F4: Empty State  │
│ Outline Table    │  │ Actions Panel    │  │ System           │
│ (3 days)         │  │ (3 days)         │  │ (2 days)         │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Parallel Execution Groups

### Group 0 (No Dependencies)
| Feature | Days | Status |
|---------|------|--------|
| F1: Dashboard Page & Grid | 4 | Draft |

### Group 1 (After Group 0)
| Feature | Days | Status |
|---------|------|--------|
| F2: Presentation Outline Table | 3 | Draft |
| F3: Quick Actions Panel | 3 | Draft |
| F4: Empty State System | 2 | Draft |

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 12 days |
| Parallel Duration | 7 days |
| Time Saved | 5 days (42%) |
| Max Parallelism | 3 features (Group 1) |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Dashboard Page & Grid | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Presentation Table | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F3: Quick Actions Panel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F4: Empty State System | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Dashboard Page & Grid | Pragmatic | Reuse existing loader patterns, Tailwind grid |
| F2: Presentation Table | Pragmatic | Use @kit/ui/table, no sorting/pagination in v1 |
| F3: Quick Actions Panel | Pragmatic | Static action config with dynamic stats |
| F4: Empty State System | Pragmatic | Extend @kit/ui/empty-state with variant config |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Dashboard Page & Grid | Loader performance with many queries | Parallel fetching, caching |
| F2: Presentation Table | No presentations table exists | Use building_blocks_submissions |
| F3: Quick Actions Panel | Stats calculation complexity | Derive from existing loader data |
| F4: Empty State System | Maintaining consistency | Single component, config-driven |

## Technical Notes

### Existing Patterns to Follow
- **Loader**: `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts`
- **Page structure**: `apps/web/app/home/[account]/page.tsx`
- **Table component**: `@kit/ui/table`
- **Empty state**: `@kit/ui/empty-state`
- **Card component**: `@kit/ui/card`

### Data Sources
| Feature | Tables Used |
|---------|-------------|
| F1 | All (aggregated) |
| F2 | building_blocks_submissions |
| F3 | course_progress, building_blocks_submissions, survey_responses |
| F4 | None (stateless) |

### Layout Specifications
```
Desktop (>=1024px): 3-3-1 grid layout
Tablet (>=768px):   2-2-1 grid layout
Mobile (<768px):    1-1-1 stack layout
Gap: 16px (md:24px)
```

## Next Steps

1. Run `/alpha:task-decompose 1367` to decompose the first feature
2. Begin implementation with Priority 1 / Group 0 features
3. After #1367 completes, parallelize #1368, #1369, #1370
