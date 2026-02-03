# Feature Overview: Progress Widgets

**Parent Initiative**: S1890.I3
**Parent Spec**: S1890
**Created**: 2026-02-02
**Total Features**: 3
**Estimated Duration**: 9 days sequential / 6 days parallel

## Directory Structure

```
S1890.I3-Initiative-progress-widgets/
├── initiative.md                                      # Initiative document
├── README.md                                          # This file - features overview
├── S1890.I3.F1-Feature-skills-spider-diagram/         # Priority 1 feature
│   └── feature.md
├── S1890.I3.F2-Feature-course-progress-radial/        # Priority 2 feature
│   └── feature.md
└── S1890.I3.F3-Feature-progress-widgets-integration/  # Priority 3 feature
    └── feature.md
```

## Feature Summary

| ID | Directory | Priority | Days | Dependencies | Status |
|----|-----------|----------|------|--------------|--------|
| S1890.I3.F1 | `S1890.I3.F1-Feature-skills-spider-diagram/` | 1 | 3 | S1890.I1.F1, S1890.I2.F2 | Draft |
| S1890.I3.F2 | `S1890.I3.F2-Feature-course-progress-radial/` | 2 | 4 | S1890.I1.F1, S1890.I2.F1 | Draft |
| S1890.I3.F3 | `S1890.I3.F3-Feature-progress-widgets-integration/` | 3 | 2 | F1, F2, S1890.I1.F1 | Draft |

## Dependency Graph

```
                    ┌─────────────────┐
                    │   S1890.I1.F1   │
                    │ Dashboard Grid  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              │
    ┌─────────────────┐  ┌─────────────────┐│
    │  S1890.I2.F2    │  │  S1890.I2.F1    ││
    │ Survey Loader   │  │ Course Loader   ││
    └────────┬────────┘  └────────┬────────┘│
             │                    │         │
             ▼                    ▼         │
    ┌─────────────────┐  ┌─────────────────┐│
    │  S1890.I3.F1    │  │  S1890.I3.F2    ││
    │ Skills Spider   │  │ Course Radial   ││
    │   (3 days)      │  │   (4 days)      ││
    └────────┬────────┘  └────────┬────────┘│
             │                    │         │
             └──────────┬─────────┘         │
                        ▼                   │
              ┌─────────────────┐           │
              │  S1890.I3.F3    │◄──────────┘
              │  Integration    │
              │    (2 days)     │
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   S1890.I7      │
              │ Empty States    │
              └─────────────────┘
```

## Parallel Execution Groups

### Group 0: Foundation Dependencies (external)
- S1890.I1.F1: Dashboard page grid layout
- S1890.I2.F1: Course progress loader
- S1890.I2.F2: Survey scores loader

> Must complete before any I3 features can start

### Group 1: Chart Components (can run in parallel)
- **S1890.I3.F1**: Skills Spider Diagram (3 days)
- **S1890.I3.F2**: Course Progress Radial Chart (4 days)

> Both features are independent and can be developed simultaneously

### Group 2: Integration
- **S1890.I3.F3**: Progress Widgets Integration (2 days)

> Requires F1 and F2 to be complete

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 9 days (3 + 4 + 2) |
| Parallel Duration | 6 days (max(3, 4) + 2) |
| Time Saved | 3 days (33%) |
| Max Parallelism | 2 features (F1 and F2) |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| S1890.I3.F1 Skills Spider | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| S1890.I3.F2 Course Radial | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| S1890.I3.F3 Integration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Validation Notes
- **Independent**: F1 and F2 can be deployed separately; F3 integrates them
- **Negotiable**: Chart styling, layout can be adjusted
- **Valuable**: Users see visual progress indicators immediately
- **Estimable**: Clear scope with existing patterns to follow
- **Small**: F1: 1 file, F2: 1 file, F3: 2 files
- **Testable**: Visual rendering, empty states, responsiveness
- **Vertical**: UI (components) → Logic (transforms) → Data (props from loader)

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| S1890.I3.F1 | Pragmatic - Adapt existing RadarChart | 95% code reuse from assessment feature |
| S1890.I3.F2 | Pragmatic - New RadialBarChart component | No existing component, but clear research docs |
| S1890.I3.F3 | Minimal - Thin container with grid layout | No business logic, just layout and prop distribution |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| S1890.I3.F1 | Low - Existing pattern | Copy and adapt radar-chart.tsx |
| S1890.I3.F2 | Medium - SSR hydration | Use initialDimension per research |
| S1890.I3.F3 | Low - Simple integration | Follow existing page patterns |

## Technology Stack

| Technology | Version | Usage |
|------------|---------|-------|
| Recharts | 3.5.1 | RadarChart, RadialBarChart |
| @kit/ui/chart | - | ChartContainer, ChartConfig theming |
| @kit/ui/card | - | Card, CardHeader, CardTitle, CardContent |
| Tailwind CSS | 4.x | Responsive grid layout |

## Files Created/Modified

### New Files (3)
- `apps/web/app/home/(user)/_components/skills-spider-diagram.tsx`
- `apps/web/app/home/(user)/_components/course-progress-chart.tsx`
- `apps/web/app/home/(user)/_components/progress-widgets.tsx`

### Modified Files (1)
- `apps/web/app/home/(user)/page.tsx`

## Next Steps

1. Run `/alpha:task-decompose S1890.I3.F1` to decompose the first feature
2. Run `/alpha:task-decompose S1890.I3.F2` in parallel (independent feature)
3. Run `/alpha:task-decompose S1890.I3.F3` after F1 and F2 tasks are defined
4. Begin implementation when I1 and I2 dependencies are ready
