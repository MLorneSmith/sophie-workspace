# Dependency Graph: User Dashboard Feature Set

## Visual Dependency Map

```
                    ┌─────────────────────────────────────┐
                    │  Feature 1: Dashboard Layout &      │
                    │  Data Loading (Foundation)          │
                    │  Phase: 1 | Effort: M | Deps: None  │
                    └─────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  Feature 2: Course  │   │  Feature 3: Spider  │   │  Feature 4: Kanban  │
│  Progress Card      │   │  Diagram            │   │  Summary Card       │
│  Phase: 1 | S       │   │  Phase: 2 | S       │   │  Phase: 2 | S       │
│  Deps: [1]          │   │  Deps: [1]          │   │  Deps: [1]          │
└─────────────────────┘   └─────────────────────┘   └──────────┬──────────┘
                                                               │
          ┌───────────────────────────┼───────────────────────┐│
          │                           │                       ││
          ▼                           ▼                       ▼▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  Feature 5:         │   │  Feature 6:         │   │  Feature 7:         │
│  Activity Feed &    │   │  Coaching Sessions  │   │  Presentation       │
│  Quick Actions      │   │  Card               │   │  Outline Table      │
│  Phase: 2 | M       │   │  Phase: 3 | S       │   │  Phase: 3 | M       │
│  Deps: [1]          │   │  Deps: [1]          │   │  Deps: [1, 4]       │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

## Dependency Matrix

| Feature | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---------|---|---|---|---|---|---|---|
| **1** Dashboard Layout | - | | | | | | |
| **2** Course Progress | X | - | | | | | |
| **3** Assessment Spider | X | | - | | | | |
| **4** Kanban Summary | X | | | - | | | |
| **5** Activity/Actions | X | | | | - | | |
| **6** Coaching Sessions | X | | | | | - | |
| **7** Presentation Table | X | | | X | | | - |

**Legend:** X = depends on

## Phase Breakdown

### Phase 1: Foundation
| Feature | Can Start | Blocked By |
|---------|-----------|------------|
| Feature 1: Dashboard Layout | Immediately | Nothing |
| Feature 2: Course Progress | After Feature 1 | Feature 1 |

### Phase 2: Core Components
| Feature | Can Start | Blocked By |
|---------|-----------|------------|
| Feature 3: Assessment Spider | After Feature 1 | Feature 1 |
| Feature 4: Kanban Summary | After Feature 1 | Feature 1 |
| Feature 5: Activity/Actions | After Feature 1 | Feature 1 |

### Phase 3: Integration
| Feature | Can Start | Blocked By |
|---------|-----------|------------|
| Feature 6: Coaching Sessions | After Feature 1 | Feature 1 |
| Feature 7: Presentation Table | After Features 1 & 4 | Features 1, 4 |

## Parallel Execution Opportunities

### Maximum Parallelism (after Phase 1 completion)
```
Time →
──────────────────────────────────────────────────────────────►
│
│  [Feature 1] ████████
│                      │
│                      ├─ [Feature 2] ████
│                      │
│                      ├─ [Feature 3] ████
│                      │
│                      ├─ [Feature 4] ████ ─┐
│                      │                    │
│                      ├─ [Feature 5] ██████│
│                      │                    │
│                      ├─ [Feature 6] ████  │
│                      │                    │
│                      └───────────────────►│─ [Feature 7] ██████
```

### Recommended Execution Order

1. **Sprint 1:** Feature 1 (Dashboard Layout)
2. **Sprint 2:** Features 2, 3, 4, 5, 6 (parallel)
3. **Sprint 3:** Feature 7 (depends on Feature 4)

## Critical Path

The critical path determines the minimum time to completion:

```
Feature 1 → Feature 4 → Feature 7
   (M)         (S)         (M)
```

**Critical path duration:** M + S + M = ~4-6 story points

## Risk Dependencies

| Dependency | Risk Level | Notes |
|------------|------------|-------|
| Feature 1 → All | High | Single point of failure; all features blocked if delayed |
| Feature 4 → Feature 7 | Medium | Table needs kanban data structure understanding |

## Integration Points

### Data Flow Dependencies

```
┌────────────────┐
│ Supabase RLS   │
│ (all queries)  │
└───────┬────────┘
        │
        ▼
┌────────────────┐     ┌────────────────┐
│ user-dashboard │────►│ All dashboard  │
│ .loader.ts     │     │ cards          │
└────────────────┘     └────────────────┘
        │
        ▼
┌────────────────┐
│ React cache()  │
│ deduplication  │
└────────────────┘
```

### Component Sharing

| Component | Source | Used By |
|-----------|--------|---------|
| RadialProgress | Feature 2 source | Course Progress Card |
| RadarChart | Feature 3 source | Assessment Spider |
| Card, CardHeader, CardContent | @kit/ui | All features |
| ChartContainer, ChartConfig | @kit/ui/chart | Features 2, 3 |

## Completion Checklist

- [ ] Feature 1 complete → Unblocks 2, 3, 4, 5, 6
- [ ] Feature 2 complete → No downstream dependencies
- [ ] Feature 3 complete → No downstream dependencies
- [ ] Feature 4 complete → Unblocks 7
- [ ] Feature 5 complete → No downstream dependencies
- [ ] Feature 6 complete → No downstream dependencies
- [ ] Feature 7 complete → Dashboard complete
