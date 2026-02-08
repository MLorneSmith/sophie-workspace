# Feature Overview: Task & Activity Widgets

**Parent Initiative**: S1890.I4
**Parent Spec**: S1890
**Created**: 2026-02-02
**Total Features**: 3
**Estimated Duration**: 12 days sequential / 8 days parallel

---

## Directory Structure

```
S1890.I4-Initiative-task-activity-widgets/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1890.I4.F1-Feature-kanban-summary-card/         # Feature 1 (Priority 1)
│   └── feature.md
├── S1890.I4.F2-Feature-activity-aggregation-query/  # Feature 2 (Priority 2)
│   └── feature.md
└── S1890.I4.F3-Feature-activity-feed-timeline/      # Feature 3 (Priority 3)
    └── feature.md
```

---

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1890.I4.F1 | Kanban Summary Card | 1 | 3 | S1890.I1.F1, S1890.I2.F1 | Draft |
| S1890.I4.F2 | Activity Aggregation Query | 2 | 4 | S1890.I2.F1 | Draft |
| S1890.I4.F3 | Activity Feed Timeline | 3 | 5 | F2, S1890.I1.F1 | Draft |

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    External Dependencies                     │
│  ┌─────────────────┐           ┌─────────────────┐          │
│  │ S1890.I1.F1     │           │ S1890.I2.F1     │          │
│  │ Dashboard Grid  │           │ Data Layer      │          │
│  └────────┬────────┘           └────────┬────────┘          │
│           │                              │                   │
└───────────┼──────────────────────────────┼───────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Initiative S1890.I4                       │
│                                                              │
│  ┌─────────────────┐           ┌─────────────────┐          │
│  │ F1: Kanban      │           │ F2: Activity    │          │
│  │ Summary Card    │           │ Aggregation     │          │
│  │ (3 days)        │           │ Query (4 days)  │          │
│  └─────────────────┘           └────────┬────────┘          │
│                                          │                   │
│                                          ▼                   │
│                                ┌─────────────────┐          │
│                                │ F3: Activity    │          │
│                                │ Feed Timeline   │          │
│                                │ (5 days)        │          │
│                                └────────┬────────┘          │
│                                          │                   │
└──────────────────────────────────────────┼───────────────────┘
                                           │
                                           ▼
                               ┌─────────────────┐
                               │ S1890.I7        │
                               │ Empty States    │
                               └─────────────────┘
```

---

## Parallel Execution Groups

### Group 0: Features with Cross-Initiative Dependencies Only
**Can start**: After S1890.I1.F1 and S1890.I2.F1 complete
**Duration**: Max of F1, F2 = 4 days

| Feature | Days | Notes |
|---------|------|-------|
| F1: Kanban Summary Card | 3 | Can run parallel with F2 |
| F2: Activity Aggregation Query | 4 | Can run parallel with F1 |

### Group 1: Features Blocked by Group 0
**Can start**: After F2 completes
**Duration**: 5 days

| Feature | Days | Notes |
|---------|------|-------|
| F3: Activity Feed Timeline | 5 | Blocked by F2 |

---

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 12 days |
| Parallel Duration | 9 days (F1 & F2 parallel, then F3) |
| Time Saved | 3 days (25%) |
| Max Parallelism | 2 features (F1 + F2) |

**Critical Path**: F2 (4 days) → F3 (5 days) = 9 days

---

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| F1: Kanban Summary Card | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| F2: Activity Aggregation Query | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| F3: Activity Feed Timeline | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

---

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Kanban Summary Card | Pragmatic | Reuse existing useTasks() hook; client-side filtering |
| F2: Activity Aggregation Query | Pragmatic | Server-side loader with Promise.all() for parallel fetching |
| F3: Activity Feed Timeline | Pragmatic | Server Component initial render; client pagination |

---

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Kanban Summary Card | Low - all infrastructure exists | Reuse useTasks hook patterns |
| F2: Activity Aggregation Query | Medium - cross-table query performance | Parallel fetching; limit to 30 days |
| F3: Activity Feed Timeline | Medium - UI complexity | Follow established card/feed patterns |

---

## Technical Notes

### Data Sources
All features consume data from existing Supabase tables with RLS:
- `tasks` (F1) - Kanban board tasks
- `lesson_progress` (F2, F3) - Course lesson completions
- `quiz_attempts` (F2, F3) - Quiz scores and attempts
- `building_blocks_submissions` (F2, F3) - Presentation updates
- `survey_responses` (F2, F3) - Assessment completions

### Reusable Patterns
- `useTasks()` hook from kanban feature (F1)
- `timeAgo()` utility from notifications (F3)
- Card, Badge, ScrollArea from @kit/ui
- Priority color classes from task-card.tsx

### No External Dependencies
All features use internal data sources. No API keys or external services required.

---

## Next Steps

1. Run `/alpha:task-decompose S1890.I4.F1` to decompose the first feature (Kanban Summary Card)
2. Run `/alpha:task-decompose S1890.I4.F2` in parallel for Activity Aggregation Query
3. After F2 completes, run `/alpha:task-decompose S1890.I4.F3` for Activity Feed Timeline
4. Update this overview as features are decomposed

---

## Related Documentation

- **Spec**: `../spec.md`
- **Initiative**: `initiative.md`
- **Hierarchical ID System**: `.ai/alpha/docs/hierarchical-ids.md`
- **Research Library**: `../research-library/`
  - `perplexity-dashboard-empty-states.md` - Empty state best practices
  - `context7-recharts-radial-radar.md` - Chart patterns (for related widgets)
