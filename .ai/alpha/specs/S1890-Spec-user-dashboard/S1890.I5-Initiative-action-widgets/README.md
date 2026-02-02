# Feature Overview: Action Widgets

**Parent Initiative**: S1890.I5
**Parent Spec**: S1890
**Created**: 2026-02-02
**Total Features**: 2
**Estimated Duration**: 8-9 days sequential / 4-5 days parallel

## Directory Structure

```
S1890.I5-Initiative-action-widgets/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1890.I5.F1-Feature-quick-actions-panel/
│   └── feature.md                                   # Quick Actions Panel feature
└── S1890.I5.F2-Feature-presentation-table/
    └── feature.md                                   # Presentation Outline Table feature
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1890.I5.F1 | Quick Actions Panel | 1 | 3-4 | S1890.I1.F1, S1890.I2.F1, S1890.I2.F2 | Draft |
| S1890.I5.F2 | Presentation Outline Table | 2 | 4-5 | S1890.I1.F1, S1890.I2.F1, S1890.I2.F2, F1 | Draft |

## Dependency Graph

```
                    ┌─────────────────┐
                    │   S1890.I1.F1   │
                    │ Dashboard Layout│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    │
┌───────────────┐    ┌───────────────┐           │
│ S1890.I2.F1   │    │ S1890.I2.F2   │           │
│ Dashboard     │    │ Dashboard     │           │
│ Types         │    │ Data Loader   │           │
└───────┬───────┘    └───────┬───────┘           │
        │                    │                    │
        └────────┬───────────┘                    │
                 │                                │
                 ▼                                │
        ┌─────────────────┐                       │
        │  S1890.I5.F1    │◄──────────────────────┘
        │ Quick Actions   │
        │     Panel       │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  S1890.I5.F2    │
        │ Presentation    │
        │    Table        │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  S1890.I7       │
        │ Empty States    │
        │ & Polish        │
        └─────────────────┘
```

## Parallel Execution Groups

### Group 0: Foundation (External Dependencies)
Features that must complete before this initiative can start:
- **S1890.I1.F1**: Dashboard Page Layout (grid container)
- **S1890.I2.F1**: Dashboard Types (type definitions)
- **S1890.I2.F2**: Dashboard Data Loader (pre-fetched data)

### Group 1: Quick Actions Panel
Can start after Group 0 completes:
- **S1890.I5.F1**: Quick Actions Panel (3-4 days)

### Group 2: Presentation Table
Can start after F1 completes (or in parallel if resources allow):
- **S1890.I5.F2**: Presentation Outline Table (4-5 days)

**Note**: F2 has a soft dependency on F1 (priority ordering) but could technically run in parallel since both depend only on the foundation features. Sequential execution recommended for code review efficiency.

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 8-9 days |
| Parallel Duration | 4-5 days (with external parallelism) |
| Time Saved | 4 days (44-50%) |
| Max Parallelism | 1-2 features (2 if ignoring priority order) |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| S1890.I5.F1 Quick Actions Panel | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S1890.I5.F2 Presentation Table | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

### Validation Details

| Criterion | F1: Quick Actions | F2: Presentation Table |
|-----------|-------------------|------------------------|
| Independent | Can deploy alone (shows buttons) | Can deploy alone (shows table) |
| Negotiable | Button logic flexible | Column order flexible |
| Valuable | User sees clear next actions | User sees all presentations |
| Estimable | 3-4 days (confident) | 4-5 days (confident) |
| Small | ~3 files, <200 LOC | ~4 files, <300 LOC |
| Testable | Buttons visible and link correctly | Table renders with correct data |
| Vertical | UI→Logic→Data (via props) | UI→Logic→Data (via props) |

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| S1890.I5.F1 | Pragmatic | Server component with conditional rendering; no complex state |
| S1890.I5.F2 | Pragmatic | Leverage existing DataTable; responsive card fallback for mobile |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| S1890.I5.F1 | Action priority logic may not match user expectations | User testing; easily adjustable conditionals |
| S1890.I5.F2 | DataTable performance with many presentations | Pagination (max 10); lazy loading if needed |

## Component Reuse

Both features leverage existing components with no new dependencies:

| Component | Source | Used By |
|-----------|--------|---------|
| Card, CardHeader, CardContent | shadcn/ui | F1, F2 |
| Button, buttonVariants | shadcn/ui | F1, F2 |
| Link | next/link | F1, F2 |
| DataTable | @kit/ui/makerkit | F2 |
| Badge | shadcn/ui | F2 |
| If | @kit/ui/if | F1 |
| Lucide icons | lucide-react | F1, F2 |

## Quick Action Logic Reference

| Condition | Action | Target | Priority |
|-----------|--------|--------|----------|
| Course not started | "Start Your Journey" | `/home/course` | 1 |
| Course in progress | "Continue Course" | `/home/course` | 1 |
| No assessment | "Take Skills Assessment" | `/home/assessment` | 2 |
| Has draft presentations | "Review Storyboard" | `/home/ai` | 3 |
| Always available | "New Presentation" | `/home/ai/new` | 4 |

## Presentation Table Columns

| Column | Field | Sortable | Notes |
|--------|-------|----------|-------|
| Title | title | No (v1) | Truncate if >50 chars |
| Last Updated | updated_at | Default DESC | Relative time format |
| Slides | derived from storyboard | No | 0 if no storyboard |
| Status | derived | No | Draft/Complete badge |
| Actions | - | - | Edit Outline button |

## Next Steps

1. Run `/alpha:task-decompose S1890.I5.F1` to decompose the Quick Actions Panel feature
2. After F1 tasks complete, run `/alpha:task-decompose S1890.I5.F2` for Presentation Table
3. Begin implementation with Priority 1 features from Group 0 dependencies
