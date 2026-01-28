# Initiative: Progress & Assessment Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1864 |
| **Initiative ID** | S1864.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 2 |

---

## Description
Implement the two core progress visualization widgets: a radial progress chart showing overall course completion, and a spider/radar chart displaying self-assessment scores across presentation skill categories. These widgets leverage existing chart components (RadialProgress.tsx, radar-chart.tsx) with dashboard-specific adaptations.

## Business Value
Directly supports Goal G3 (Improve course completion +25%) by making progress visible and motivating. The radial chart provides instant gratification for completed work, while the spider chart helps users identify skill gaps to prioritize. Research shows visible progress increases completion rates.

---

## Scope

### In Scope
- [ ] Course Progress Radial Widget with lesson count breakdown
- [ ] Adaptation of existing RadialProgress.tsx for dashboard context
- [ ] Assessment Spider Chart Widget with category scores
- [ ] Adaptation of existing radar-chart.tsx for dashboard context
- [ ] Data fetching for course_progress, lesson_progress tables
- [ ] Data fetching for survey_responses.category_scores
- [ ] Empty states for both widgets (no data scenarios)
- [ ] Loading skeletons for both widgets

### Out of Scope
- [ ] Real-time progress updates (v2 feature)
- [ ] Historical progress tracking/trends
- [ ] Multiple course support (single course for v1)
- [ ] Detailed lesson-by-lesson breakdown (link to course page instead)

---

## Dependencies

### Blocks
- None (independent widgets once foundation is complete)

### Blocked By
- S1864.I1: Dashboard Foundation (requires grid layout, page shell, types)

### Parallel With
- S1864.I3: Activity & Task Widgets (can develop simultaneously after I1)
- S1864.I4: Coaching Integration (independent track)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Radar chart needs SSR-safe responsive sizing |
| External dependencies | Low | Uses existing Recharts library |
| Unknowns | Low | Existing implementations to reference |
| Reuse potential | High | RadialProgress exists, radar-chart.tsx exists |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Course Progress Radial Widget**: Circular progress with percentage, lesson count (X/Y completed), link to course page
2. **Spider Chart Assessment Widget**: RadarChart with 5-7 category axes, overall score display, link to assessment page

### Suggested Order
1. Course Progress Widget (simpler, existing component)
2. Spider Chart Widget (more complex, needs adaptation)

---

## Validation Commands
```bash
# Verify radial widget renders
curl -s http://localhost:3000/home | grep -q "CourseProgressWidget"

# Verify spider chart renders
curl -s http://localhost:3000/home | grep -q "AssessmentSpiderWidget"

# Check chart data fetching
grep -r "course_progress" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts
```

---

## Related Files
- Spec: `../spec.md`
- Existing RadialProgress: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Existing RadarChart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Chart primitives: `packages/ui/src/shadcn/chart.tsx`
- Features: `./S1864.I2.F*-Feature-*/` (created in next phase)
