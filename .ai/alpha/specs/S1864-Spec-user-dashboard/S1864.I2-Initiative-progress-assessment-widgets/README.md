# Feature Overview: Progress & Assessment Widgets

**Parent Initiative**: S1864.I2
**Parent Spec**: S1864
**Created**: 2026-01-27
**Total Features**: 2
**Estimated Duration**: 7 days sequential / 4 days parallel

## Directory Structure

```
S1864.I2-Initiative-progress-assessment-widgets/
├── initiative.md                                        # Initiative document
├── README.md                                            # This file - features overview
├── S1864.I2.F1-Feature-course-progress-radial-widget/
│   ├── feature.md                                       # Feature specification
│   └── tasks.json                                       # (Created in task decomposition)
└── S1864.I2.F2-Feature-spider-chart-assessment-widget/
    ├── feature.md                                       # Feature specification
    └── tasks.json                                       # (Created in task decomposition)
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1864.I2.F1 | Course Progress Radial Widget | 1 | 3 | S1864.I1.F1, S1864.I1.F2 | Draft |
| S1864.I2.F2 | Spider Chart Assessment Widget | 2 | 4 | S1864.I1.F1, S1864.I1.F2 | Draft |

## Dependency Graph

```
S1864.I1 (Dashboard Foundation)
├── S1864.I1.F1 (Types & Loader)
│   │
│   ├──> S1864.I2.F1 (Course Progress Widget)
│   │
│   └──> S1864.I2.F2 (Spider Chart Widget)
│
└── S1864.I1.F2 (Dashboard Page Shell)
    │
    ├──> S1864.I2.F1 (Course Progress Widget)
    │
    └──> S1864.I2.F2 (Spider Chart Widget)

Note: F1 and F2 can run in PARALLEL once I1 dependencies complete
```

## Parallel Execution Groups

| Group | Features | Start Condition | Est. Days |
|-------|----------|-----------------|-----------|
| **Group 0** | S1864.I1.F1, S1864.I1.F2 | Immediate (I1 foundation) | 3-4 |
| **Group 1** | S1864.I2.F1, S1864.I2.F2 | After S1864.I1.F1 + S1864.I1.F2 complete | 4 (max of 3, 4) |

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
| S1864.I2.F1 Course Progress Widget | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| S1864.I2.F2 Spider Chart Widget | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

### Validation Notes

**S1864.I2.F1 - Course Progress Radial Widget**
- **Independent**: Can deploy alone once I1 foundation complete; other widgets don't depend on it
- **Negotiable**: Progress display approach flexible (radial vs bar vs text)
- **Valuable**: User sees course completion at a glance - key engagement driver
- **Estimable**: 3 days - existing patterns, low complexity
- **Small**: ~6 files touched (2 new components, 3 modified files, 1 type file)
- **Testable**: Verify renders with data, handles empty state, links work
- **Vertical**: UI (widget) → Logic (loader) → Data (course_progress table)

**S1864.I2.F2 - Spider Chart Assessment Widget**
- **Independent**: Can deploy alone once I1 foundation complete; other widgets don't depend on it
- **Negotiable**: Chart style flexible (radar vs bar chart vs score cards)
- **Valuable**: User identifies skill strengths/weaknesses - drives learning focus
- **Estimable**: 4 days - Recharts integration, SSR considerations
- **Small**: ~7 files touched (2 new components, 4 modified files, 1 type file)
- **Testable**: Verify renders with data, handles empty state, tooltips work
- **Vertical**: UI (widget) → Logic (loader + transformer) → Data (survey_responses)

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| S1864.I2.F1 | Pragmatic | New widget component reusing SVG radial pattern from existing RadialProgress.tsx; Card-based layout for dashboard consistency |
| S1864.I2.F2 | Pragmatic | New widget wrapping Recharts RadarChart with ChartContainer; SSR-safe with initialDimension; Client component required for interactivity |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| S1864.I2.F1 | No course progress data for user | Empty state with "Start Course" CTA |
| S1864.I2.F2 | Recharts SSR hydration issues | Use ResponsiveContainer with initialDimension prop |

## Component Reuse Summary

| Existing Component | Location | Reuse Strategy |
|--------------------|----------|----------------|
| RadialProgress.tsx | `apps/web/app/home/(user)/course/_components/` | Pattern reference, not direct import |
| radar-chart.tsx | `apps/web/app/home/(user)/assessment/survey/_components/` | Pattern reference, not direct import |
| ChartContainer | `packages/ui/src/shadcn/chart.tsx` | Direct import |
| Card components | `packages/ui/src/shadcn/card.tsx` | Direct import |
| Skeleton | `packages/ui/src/shadcn/skeleton.tsx` | Direct import |

## Data Sources

| Widget | Table | Key Columns | RLS |
|--------|-------|-------------|-----|
| Course Progress | `course_progress` | completion_percentage, current_lesson_id | user_id = auth.uid() |
| Course Progress | `lesson_progress` | lesson_id, completed_at | user_id = auth.uid() |
| Spider Chart | `survey_responses` | category_scores (JSONB), highest_scoring_category, lowest_scoring_category | user_id = auth.uid() |

## Next Steps

1. Run `/alpha:task-decompose S1864.I2.F1` to decompose the Course Progress Widget feature
2. Run `/alpha:task-decompose S1864.I2.F2` to decompose the Spider Chart Widget feature
3. Begin implementation with both features in parallel (after I1 foundation complete)

## Related Documentation

- **Spec**: `../spec.md`
- **Initiative**: `./initiative.md`
- **Research**: `../research-library/context7-recharts-radar.md`
- **I1 Foundation**: `../S1864.I1-Initiative-dashboard-foundation/`
