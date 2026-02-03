# Feature Overview: Progress Widgets

**Parent Initiative**: S1918.I3
**Parent Spec**: S1918
**Created**: 2026-02-03
**Total Features**: 2
**Estimated Duration**: 7 days sequential / 4 days parallel

## Directory Structure

```
S1918.I3-Initiative-progress-widgets/
├── initiative.md                                    # Initiative document
├── README.md                                        # This file - features overview
├── S1918.I3.F1-Feature-course-progress-radial-widget/
│   └── feature.md                                   # Course Progress Radial Widget
└── S1918.I3.F2-Feature-skills-spider-diagram-widget/
    └── feature.md                                   # Skills Spider Diagram Widget
```

## Feature Summary

| ID | Name | Priority | Days | Dependencies | Status |
|----|------|----------|------|--------------|--------|
| S1918.I3.F1 | Course Progress Radial Widget | 1 | 3 | S1918.I1.F1, S1918.I2.F1, S1918.I2.F2 | Draft |
| S1918.I3.F2 | Skills Spider Diagram Widget | 2 | 4 | S1918.I1.F1, S1918.I2.F1, S1918.I2.F2, F1 | Draft |

## Dependency Graph

```
External Dependencies (from other initiatives):
┌─────────────────────────────────────────────────────────────────┐
│  S1918.I1 (Dashboard Foundation)                                │
│  └── S1918.I1.F1: Dashboard Page & Grid (provides grid slots)   │
│                                                                 │
│  S1918.I2 (Data Layer)                                          │
│  ├── S1918.I2.F1: Dashboard Types (provides type definitions)   │
│  └── S1918.I2.F2: Dashboard Loader (provides data props)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Internal Dependencies (this initiative):
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────────────────┐                              │
│  │ F1: Course Progress Radial   │◄─── Priority 1               │
│  │     Widget (3 days)          │     No internal blockers     │
│  └──────────────┬───────────────┘                              │
│                 │ (pattern sharing)                            │
│                 ▼                                               │
│  ┌──────────────────────────────┐                              │
│  │ F2: Skills Spider Diagram    │◄─── Priority 2               │
│  │     Widget (4 days)          │     Soft dep on F1 patterns  │
│  └──────────────────────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Parallel Execution Groups

**Group 0** (Start immediately after I1/I2 prerequisites):
- S1918.I3.F1: Course Progress Radial Widget

**Group 1** (After F1 for pattern consistency, but can overlap):
- S1918.I3.F2: Skills Spider Diagram Widget

**Note**: F1 and F2 could execute in parallel with a slight stagger. F2 depends on F1 only for establishing chart configuration patterns, not hard data dependencies. With proper coordination, both features can be worked on concurrently.

## Execution Summary

| Metric | Value |
|--------|-------|
| Sequential Duration | 7 days |
| Parallel Duration | 4 days (with overlap) |
| Time Saved | 3 days (43%) |
| Max Parallelism | 2 features (with stagger) |

## INVEST-V Validation Summary

| Feature | I | N | V | E | S | T | V |
|---------|---|---|---|---|---|---|---|
| S1918.I3.F1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| S1918.I3.F2 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Legend**: I=Independent, N=Negotiable, V=Valuable, E=Estimable, S=Small, T=Testable, V=Vertical

## Architecture Decisions Summary

| Feature | Approach | Rationale |
|---------|----------|-----------|
| S1918.I3.F1 | Pragmatic | Use RadialBarChart with ChartContainer for theming consistency |
| S1918.I3.F2 | Pragmatic - Adapt existing | Adapt proven radar-chart.tsx pattern for dashboard context |

## Risk Summary

| Feature | Primary Risk | Mitigation |
|---------|--------------|------------|
| S1918.I3.F1 | RadialBarChart SSR hydration | Use initialDimension prop; wrap in client component |
| S1918.I3.F2 | Category labels overlap on mobile | Truncate long labels; test at mobile breakpoints |

## Key Patterns from Research

### Recharts Integration (from context7-recharts-radar.md)
- Always use `ResponsiveContainer` with explicit height
- Use `initialDimension` prop for SSR/Next.js compatibility
- Apply CSS variables for dark mode: `hsl(var(--chart-1))`
- Wrap charts in `ChartContainer` from `@kit/ui/chart`

### Empty State Handling
- Check for empty/undefined data before rendering chart
- Show muted outline for spider chart (structural hint)
- Single clear CTA per empty state

### Animation
- Use `isAnimationActive={true}` with `animationDuration={1000}`
- Respect reduced motion preference via `prefers-reduced-motion`

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget container | Card | @kit/ui/card | Consistent with dashboard patterns |
| Progress chart | RadialBarChart | recharts | Research-validated, theming support |
| Spider chart | RadarChart | recharts | Existing pattern in codebase |
| Chart wrapper | ChartContainer | @kit/ui/chart | Automatic theming, accessibility |
| CTA buttons | Button | @kit/ui/button | Consistent with design system |
| Empty states | Custom | N/A | Dashboard-specific messaging |

## Files Created

| Feature | File Path |
|---------|-----------|
| F1 | `apps/web/app/home/(user)/_components/course-progress-widget.tsx` |
| F2 | `apps/web/app/home/(user)/_components/skills-spider-widget.tsx` |

## Next Steps

1. Run `/alpha:task-decompose S1918.I3.F1` to decompose the Course Progress Radial Widget
2. Begin implementation with S1918.I3.F1 after I1/I2 prerequisites complete
3. Start S1918.I3.F2 once F1 establishes chart patterns (can overlap)
