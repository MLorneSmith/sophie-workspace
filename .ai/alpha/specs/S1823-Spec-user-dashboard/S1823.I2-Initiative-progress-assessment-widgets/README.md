# Feature Overview: Progress & Assessment Widgets

**Parent Initiative**: S1823.I2
**Parent Spec**: S1823
**Created**: 2026-01-26
**Total Features**: 2
**Estimated Duration**: 7 days sequential / 4 days parallel

## Directory Structure

```
S1823.I2-Initiative-progress-assessment-widgets/
├── initiative.md                                           # Initiative document
├── README.md                                               # This file - features overview
├── decomposition-state.json                                # Decomposition tracking
├── S1823.I2.F1-Feature-course-progress-radial-widget/     # Priority 1 feature
│   └── feature.md
└── S1823.I2.F2-Feature-spider-chart-assessment-widget/    # Priority 2 feature
    └── feature.md
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1823.I2.F1 | Course Progress Radial Widget | 1 | 3 | S1823.I1.F1, S1823.I1.F3 | Draft |
| S1823.I2.F2 | Spider Chart Assessment Widget | 2 | 4 | S1823.I1.F1, S1823.I1.F3, F1 | Draft |

## Dependency Graph

```
                    ┌──────────────────────┐
                    │ S1823.I1.F1          │
                    │ (Types & Loader)     │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │                      │
                    ▼                      ▼
        ┌───────────────────┐    ┌───────────────────┐
        │ S1823.I1.F3       │    │ S1823.I2.F1       │
        │ (Grid Layout)     │    │ (Course Progress) │
        └─────────┬─────────┘    └─────────┬─────────┘
                  │                        │
                  │        ┌───────────────┘
                  │        │
                  ▼        ▼
        ┌───────────────────┐
        │ S1823.I2.F2       │
        │ (Spider Chart)    │
        └───────────────────┘
```

**Key Dependencies:**
- Both features depend on S1823.I1.F1 (TypeScript types and dashboard loader infrastructure)
- Both features depend on S1823.I1.F3 (Grid layout for widget placement)
- F2 depends on F1 (widget patterns established by F1)

## Parallel Execution Groups

### Group 0 (After I1 dependencies met)
| Feature | Days | Notes |
|---------|------|-------|
| S1823.I2.F1 | 3 | Can start once I1.F1 and I1.F3 complete |

### Group 1 (After F1)
| Feature | Days | Notes |
|---------|------|-------|
| S1823.I2.F2 | 4 | Starts after F1 completes (uses widget patterns) |

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 7 days |
| Parallel Duration | 7 days |
| Time Saved | 0 days (0%) |
| Max Parallelism | 1 feature |

**Note**: This initiative has sequential dependencies (F2 depends on F1), so no parallelism within the initiative. However, this entire initiative can run in parallel with S1823.I3 and S1823.I4.

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| S1823.I2.F1 Course Progress Radial Widget | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S1823.I2.F2 Spider Chart Assessment Widget | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Validation Details

**S1823.I2.F1 - Course Progress Radial Widget**
- **Independent**: Can deploy alone (with I1 foundation)
- **Negotiable**: Could use linear progress instead of radial
- **Valuable**: User sees course progress at a glance
- **Estimable**: 3 days - reuses existing RadialProgress component
- **Small**: ~5-6 files
- **Testable**: Widget renders with progress percentage, CTA works
- **Vertical**: UI (widget) → Logic (data transform) → Data (loader) → DB (course_progress)

**S1823.I2.F2 - Spider Chart Assessment Widget**
- **Independent**: Can deploy alone (with I1 foundation + F1 patterns)
- **Negotiable**: Could use bar chart or table instead
- **Valuable**: User sees assessment strengths/weaknesses
- **Estimable**: 4 days - reuses existing radar-chart, slightly more complex data
- **Small**: ~5-6 files
- **Testable**: Widget renders with category scores, empty state works
- **Vertical**: UI (widget) → Logic (JSONB mapping) → Data (loader) → DB (survey_responses)

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| S1823.I2.F1 | Pragmatic - Wrap existing RadialProgress | Component is 75% ready, minimal work needed |
| S1823.I2.F2 | Pragmatic - Adapt existing radar-chart | Component already implements Recharts correctly |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| S1823.I2.F1 | RadialProgress component needs customization | Create wrapper that passes custom props |
| S1823.I2.F2 | Radar chart sizing in dashboard grid cell | Test responsive behavior, adjust ChartContainer constraints |

## Codebase Patterns Leveraged

### Existing Components
| Component | Location | Reuse Level |
|-----------|----------|-------------|
| RadialProgress | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | 75% |
| radar-chart | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | 90% |
| Card/CardHeader | `@kit/ui/card` | 100% |
| Skeleton | `@kit/ui/skeleton` | 100% |

### Data Patterns
| Table | Query Pattern | Existing Example |
|-------|--------------|------------------|
| course_progress | Direct select by user_id | `apps/web/app/home/(user)/course/page.tsx` |
| lesson_progress | Count completed lessons | `apps/web/app/home/(user)/course/page.tsx` |
| survey_responses | Select category_scores JSONB | `apps/web/app/home/(user)/assessment/_lib/client/hooks/use-survey-scores.ts` |

## Next Steps

1. Run `/alpha:task-decompose S1823.I2.F1` to decompose the Course Progress Radial Widget feature
2. After F1 tasks complete, run `/alpha:task-decompose S1823.I2.F2` for Spider Chart
3. Begin implementation with `/alpha:implement S1823.I2.F1`
