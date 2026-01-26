# Feature Overview: Progress & Assessment Widgets

**Parent Initiative**: S1815.I2
**Parent Spec**: S1815
**Created**: 2026-01-26
**Total Features**: 2
**Estimated Duration**: 7 days sequential / 4 days parallel

## Directory Structure

```
S1815.I2-Initiative-progress-assessment-widgets/
├── initiative.md                                           # Initiative document
├── README.md                                               # This file - features overview
├── S1815.I2.F1-Feature-course-progress-radial-widget/
│   └── feature.md                                          # Course progress widget spec
└── S1815.I2.F2-Feature-spider-chart-assessment-widget/
    └── feature.md                                          # Spider chart widget spec
```

## Feature Summary

| ID | Directory | Priority | Days | Dependencies | Status |
|----|-----------|----------|------|--------------|--------|
| S1815.I2.F1 | course-progress-radial-widget | 1 | 4 | S1815.I1 | Draft |
| S1815.I2.F2 | spider-chart-assessment-widget | 2 | 3 | S1815.I1 | Draft |

## Dependency Graph

```
        ┌───────────────────────────┐
        │    S1815.I1 (Foundation)  │
        │   Dashboard page & grid   │
        └─────────────┬─────────────┘
                      │
          ┌───────────┴───────────┐
          │ provides layout       │
          │                       │
    ┌─────▼─────┐           ┌─────▼─────┐
    │ S1815.I2  │           │ S1815.I2  │
    │    .F1    │           │    .F2    │
    │  Course   │           │  Spider   │
    │ Progress  │           │  Chart    │
    └───────────┘           └───────────┘

    (F1 and F2 are INDEPENDENT - can run in parallel)
```

## Parallel Execution Groups

| Group | Features | Trigger | Max Days |
|-------|----------|---------|----------|
| 0 | F1, F2 | After S1815.I1 complete | 4 days |

**Parallelization Strategy**: Both features query different tables and create independent components. They share the dashboard page but don't depend on each other's code. Maximum parallelization.

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
| F1: Course Progress | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| F2: Spider Chart | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| F1: Course Progress | Pragmatic | Adapt existing RadialProgress with larger size, add context text |
| F2: Spider Chart | Minimal | Direct reuse of existing radar-chart.tsx with wrapper |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| F1: Course Progress | Radial needs scaling adjustments | Existing SVG implementation is parameterized |
| F2: Spider Chart | Recharts responsive behavior | Use ResponsiveContainer with fixed aspect |

## Key Design Decisions

### Data Fetching Strategy
Both features use server-side data fetching via the dashboard loader:
```typescript
// user-dashboard.loader.ts
return Promise.all([
  loadCourseProgress(client, userId),
  loadSurveyScores(client, userId),
]);
```

### Component Reuse
- **F1**: Adapts `RadialProgress.tsx` (40px → 120px, adds context)
- **F2**: Wraps `radar-chart.tsx` (existing Recharts implementation)

### Empty State Handling
Each widget has a dedicated empty state component with appropriate CTA:
- F1: "Start your learning journey" → Link to course
- F2: "Discover your strengths" → Link to assessment

## Next Steps

1. Run `/alpha:task-decompose S1815.I2.F1` to decompose the Course Progress widget
2. Run `/alpha:task-decompose S1815.I2.F2` to decompose the Spider Chart widget
3. Begin implementation after S1815.I1 (Dashboard Foundation) is complete

## Related Files

- Spec: `../spec.md`
- Initiative: `./initiative.md`
- Research: `../research-library/` (Recharts, Cal.com, Dashboard UX)
