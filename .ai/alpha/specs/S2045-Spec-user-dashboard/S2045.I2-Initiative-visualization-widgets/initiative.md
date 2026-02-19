# Initiative: Dashboard Visualization Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2045 |
| **Initiative ID** | S2045.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 2 |

---

## Description
Build the three visualization-focused dashboard widgets that form Row 1 of the 3-3-1 grid: Course Progress Radial Chart (Recharts PieChart donut), Self-Assessment Spider Diagram (reuse existing RadarChart pattern), and Kanban Summary Card (simple data display). These are the highest-visibility widgets users see first.

## Business Value
Delivers the "at-a-glance" progress overview that addresses the core user pain point — "I just want to log in and immediately know where I stand." The radial chart and spider diagram provide visual motivation, while the kanban summary shows actionable next tasks.

---

## Scope

### In Scope
- [ ] Course Progress Radial Chart component (PieChart with innerRadius donut pattern)
- [ ] Self-Assessment Spider Diagram component (reuse RadarChart from assessment survey)
- [ ] Kanban Summary Card component (doing/next tasks display)
- [ ] Client component wrappers for interactive Recharts rendering
- [ ] Wire widgets to dashboard data loader return values
- [ ] Card-based layout with CardHeader, CardTitle, CardContent pattern
- [ ] Dark mode support via semantic color classes
- [ ] Basic data-absent handling (null/undefined data graceful fallback)

### Out of Scope
- [ ] Empty state designs with CTAs (I4)
- [ ] Loading skeletons for individual widgets (I4)
- [ ] Activity Feed, Quick Actions, Coaching, Presentations widgets (I3)
- [ ] Mobile-specific widget reordering

---

## Dependencies

### Blocks
- S2045.I4: Empty states need these widgets to exist

### Blocked By
- S2045.I1: Needs page layout (grid), data loader, and generated TypeScript types

### Parallel With
- S2045.I3: Can run in parallel once I1 completes (no cross-dependency)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low-Medium | Recharts patterns well-documented; RadarChart component already exists to reuse |
| External dependencies | Low | Recharts 3.5.1 already installed; data from existing tables |
| Unknowns | Low | Research completed on PieChart donut pattern; RadarChart reuse confirmed |
| Reuse potential | High | Existing RadarChart at `assessment/survey/_components/radar-chart.tsx`; ChartContainer from `@kit/ui/chart`; Card components from `@kit/ui/card` |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Course Progress Radial Chart**: PieChart donut with innerRadius, percentage label, "X of Y lessons" subtitle, responsive sizing via ResponsiveContainer
2. **Self-Assessment Spider Diagram**: Reuse RadarChart pattern from assessment survey, adapt for dashboard card, handle zero-value data rendering
3. **Kanban Summary Card**: Query tasks table for `status = 'doing'` (max 3) and `status = 'do'` (next 1), display with Badge status indicators

### Suggested Order
1. Course Progress Radial Chart (single table query, simple donut chart)
2. Kanban Summary Card (simple query + display, no chart library needed)
3. Self-Assessment Spider Diagram (reuse existing component, but needs adaptation)

---

## Validation Commands
```bash
# Verify Recharts renders
pnpm typecheck

# Verify components exist
ls apps/web/app/home/(user)/_components/dashboard/

# Visual verification
# Navigate to /home and verify 3 widgets render in Row 1
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Existing RadarChart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Chart wrapper: `packages/ui/src/shadcn/chart.tsx`
- Task schema: `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`
- Recharts research: `../research-library/context7-recharts-radial-radar-charts.md`
