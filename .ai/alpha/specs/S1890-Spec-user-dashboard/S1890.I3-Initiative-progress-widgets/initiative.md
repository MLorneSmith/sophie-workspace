# Initiative: Progress Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1890 |
| **Initiative ID** | S1890.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 3 |

---

## Description
Implement the Course Progress Radial Chart and Self-Assessment Spider Diagram widgets for the dashboard. These visualizations show the user's learning progress as a circular progress indicator and their skills across the 5S framework as a radar chart.

## Business Value
These are the highest-impact visual widgets that immediately communicate progress to users. The radial chart shows course completion at a glance, while the spider diagram reveals strengths and weaknesses across presentation skills dimensions.

---

## Scope

### In Scope
- [x] Course Progress Radial Chart component using Recharts RadialBarChart
- [x] Self-Assessment Spider Diagram component using existing RadarChart pattern
- [x] Widget card wrappers with consistent styling
- [x] Data transformation from loader to chart format
- [x] Responsive chart sizing with ResponsiveContainer
- [x] SSR support with `initialDimension` for charts
- [x] Percentage/count display labels

### Out of Scope
- [ ] Empty state designs (handled by I7)
- [ ] Data fetching (handled by I2)
- [ ] Animation/interaction polish (handled by I7)
- [ ] Tooltip customization beyond basic

---

## Dependencies

### Blocks
- S1890.I7: Empty States & Polish (needs widget structure)

### Blocked By
- S1890.I1: Dashboard Foundation (needs grid layout)
- S1890.I2: Data Layer (needs course/survey data)

### Parallel With
- S1890.I4: Task & Activity Widgets
- S1890.I5: Action Widgets
- S1890.I6: Coaching Integration

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | RadialBarChart new build; RadarChart exists in assessment feature |
| External dependencies | Low | Recharts already installed (v3.5.1) |
| Unknowns | Medium | Recharts SSR behavior; chart sizing in responsive grid |
| Reuse potential | High | Can reuse RadarChart from `assessment/survey/_components/radar-chart.tsx` |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Course Progress Radial Chart**: Build RadialBarChart with completion segments
2. **Self-Assessment Spider Diagram**: Adapt existing RadarChart for 5S dimensions
3. **Progress Widget Cards**: Card wrappers with titles and CTAs

### Suggested Order
1. Self-Assessment Spider Diagram (F1) - lower complexity, existing component
2. Course Progress Radial Chart (F2) - new component build
3. Progress Widget Cards (F3) - integration with layout

---

## Validation Commands
```bash
# Verify radial chart component
test -f apps/web/app/home/\(user\)/_components/course-progress-chart.tsx && echo "✓ Radial chart exists"

# Verify spider diagram component
test -f apps/web/app/home/\(user\)/_components/skills-spider-diagram.tsx && echo "✓ Spider diagram exists"

# Check Recharts imports
grep -rq "RadialBarChart\|RadarChart" apps/web/app/home/\(user\)/_components/ && echo "✓ Recharts usage"

# Visual verification - navigate to /home and verify charts render
# Run E2E test
pnpm --filter web-e2e test:local -- -g "dashboard progress"
```

---

## Related Files
- Spec: `../spec.md`
- Existing RadarChart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Existing RadialProgress: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Chart system: `packages/ui/src/shadcn/chart.tsx`
- Features: `./<feature-#>-<slug>/` (created in next phase)

## Research References
- Recharts RadialBarChart: Context7 research in `research-library/context7-recharts-radial-radar.md`
- SSR support: Use `initialDimension={{ width: 300, height: 300 }}` for ResponsiveContainer
