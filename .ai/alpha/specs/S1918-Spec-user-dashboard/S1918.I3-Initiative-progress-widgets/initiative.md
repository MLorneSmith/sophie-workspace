# Initiative: Progress Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1918 |
| **Initiative ID** | S1918.I3 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 3 |

---

## Description
Build the Course Progress Radial widget and Skills Spider Diagram widget. These visualization components display user progress through the course and self-assessment results using Recharts RadialBarChart and RadarChart.

## Business Value
Progress visualization is the primary value proposition of the dashboard. Users can instantly see their learning journey status, driving engagement and course completion.

---

## Scope

### In Scope
- [x] Course Progress Radial widget using RadialBarChart
- [x] Skills Spider Diagram widget using RadarChart
- [x] Empty states for both widgets (0% progress, no assessment taken)
- [x] Card containers with proper headers and descriptions
- [x] Dark mode compatible chart theming
- [x] Link CTAs ("Continue Course", "Take Assessment")

### Out of Scope
- [ ] Course progress data fetching (I2)
- [ ] Survey scores data fetching (I2)
- [ ] Loading skeletons (I6)
- [ ] Animation preferences (reduced motion - I6)

---

## Dependencies

### Blocks
- S1918.I6: Polish (needs base widgets for skeletons)

### Blocked By
- S1918.I1: Dashboard Foundation (needs grid slots)
- S1918.I2: Data Layer (needs typed data props)

### Parallel With
- S1918.I4: Activity & Task Widgets (independent widgets)
- S1918.I5: Coaching Integration (independent widget)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Existing RadarChart can be adapted |
| External dependencies | Low | Recharts already installed |
| Unknowns | Low | Research doc covers Recharts patterns |
| Reuse potential | High | RadialProgress exists, RadarChart exists |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Course Progress Radial Widget**: RadialBarChart with percentage display
2. **Skills Spider Diagram Widget**: RadarChart for category scores

### Suggested Order
1. Course Progress Radial (simpler, single data point)
2. Skills Spider Diagram (more data points, existing component to adapt)

---

## Validation Commands
```bash
# Verify widget files exist
test -f apps/web/app/home/\(user\)/_components/course-progress-widget.tsx && echo "✓ Progress widget exists"
test -f apps/web/app/home/\(user\)/_components/skills-spider-widget.tsx && echo "✓ Spider widget exists"

# Type check
pnpm typecheck

# Visual verification (manual)
# pnpm dev → navigate to /home → verify charts render
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Reference: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Reference: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Reference: `.ai/alpha/specs/S1918-Spec-user-dashboard/research-library/context7-recharts-radar.md`
