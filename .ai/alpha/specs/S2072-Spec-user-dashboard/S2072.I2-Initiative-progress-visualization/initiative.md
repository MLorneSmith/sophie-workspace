# Initiative: Progress Visualization Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S2072 |
| **Initiative ID** | S2072.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 2 |

---

## Description

Implements the two progress visualization widgets for the dashboard: Course Progress Radial Chart (donut chart showing completion percentage) and Skills Spider Diagram (radar chart displaying self-assessment category scores). Both leverage existing Recharts patterns from the codebase.

## Business Value

Provides visual motivation for users to continue their learning journey. The radial chart shows course progress at a glance, while the spider diagram reveals skill gaps and strengths. These are key engagement drivers on the dashboard.

---

## Scope

### In Scope
- [ ] Course Progress Radial Chart widget
- [ ] Skills Spider Diagram widget
- [ ] Card wrapper components with headers
- [ ] Data transformation from database types to chart format
- [ ] Zero-progress handling (0% complete state)
- [ ] Integration with dashboard grid layout

### Out of Scope
- [ ] Loading skeletons (delegated to I6)
- [ ] Empty states for no data (delegated to I6)
- [ ] Course detail page navigation (existing functionality)
- [ ] Assessment taking flow (existing functionality)

---

## Dependencies

### Blocks
- S2072.I6 (Empty States & Polish) - needs widgets for empty state design

### Blocked By
- S2072.I1 (Foundation & Data Layer) - requires page shell, grid, and data loader

### Parallel With
- S2072.I3 (Activity & Actions Widgets)
- S2072.I4 (Coaching Integration)
- S2072.I5 (Presentations Table)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Existing RadarChart and RadialProgress patterns |
| External dependencies | Low | Only Recharts (already in project) |
| Unknowns | Low | Chart patterns well-documented in research |
| Reuse potential | High | Direct reuse of existing chart components |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Course Progress Radial Widget**: Donut chart with percentage, lessons count
2. **Skills Spider Diagram Widget**: Radar chart with 5 skill categories
3. **Widget Data Adapters**: Transform loader data to chart format

### Suggested Order
1. Course Progress Radial Widget (simpler, establishes pattern)
2. Skills Spider Diagram Widget (reuse RadarChart pattern)
3. Widget Data Adapters (connect to loader)

---

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Visual verification
pnpm dev
# Navigate to /home, verify charts render

# Chart rendering tests
pnpm --filter web test -- --grep "radial\|radar\|chart"
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./S2072.I2.F*-Feature-*/` (created in next phase)
- Reference: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Reference: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Reference: `packages/ui/src/shadcn/chart.tsx` (ChartContainer)
- Research: `../research-library/context7-recharts-radial-radar.md`
