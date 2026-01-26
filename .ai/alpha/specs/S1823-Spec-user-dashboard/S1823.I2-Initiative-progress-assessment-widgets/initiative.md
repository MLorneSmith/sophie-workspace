# Initiative: Progress & Assessment Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1823 |
| **Initiative ID** | S1823.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 2 |

---

## Description
Implement the Course Progress Radial Widget and Self-Assessment Spider Chart Widget for the user dashboard. These widgets visualize the user's learning journey progress and competency assessment results using existing chart components adapted for the dashboard context.

## Business Value
Provides users with immediate visibility into their course completion status and self-assessment strengths/weaknesses. The radial progress indicator motivates continued learning, while the spider chart helps users identify areas for improvement. These are the highest-visibility widgets on the dashboard.

---

## Scope

### In Scope
- [x] Course Progress Radial Widget with completion percentage and lesson counts
- [x] Self-Assessment Spider Chart Widget with category scores visualization
- [x] Data loaders for `course_progress` and `survey_responses` tables
- [x] "Continue Course" CTA button on radial widget
- [x] Category labels on spider chart axes
- [x] Widget loading states (skeleton placeholders)

### Out of Scope
- [ ] Historical progress tracking (v2)
- [ ] Multiple course support (single course MVP)
- [ ] Trend indicators comparing to previous period
- [ ] Gamification elements (badges, streaks)

---

## Dependencies

### Blocks
- S1823.I5 (needs widgets for empty states)

### Blocked By
- S1823.I1 (needs grid layout and type definitions)

### Parallel With
- S1823.I3 (Activity/Task Widgets)
- S1823.I4 (Coaching Integration)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Existing RadialProgress and radar-chart components |
| External dependencies | Low | Internal DB queries only |
| Unknowns | Low | Patterns proven in course and assessment pages |
| Reuse potential | High | `RadialProgress.tsx`, `radar-chart.tsx` directly reusable |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Course Progress Radial Widget**: Adapt existing RadialProgress component, add lesson count text, CTA button
2. **Spider Chart Assessment Widget**: Adapt existing radar-chart component, connect to survey_responses data

### Suggested Order
1. Course Progress Radial Widget (simpler, existing component)
2. Spider Chart Assessment Widget (slightly more complex data mapping)

---

## Validation Commands
```bash
# Verify radial widget renders with test data
pnpm --filter web dev & sleep 10 && curl -s http://localhost:3000/home | grep -q "progress"

# TypeScript check for widget types
pnpm --filter web typecheck

# Unit tests for data transformations
pnpm --filter web test:unit -- --grep "dashboard"
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Existing RadialProgress: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Existing Radar Chart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Course Progress Table: `migrations/20250319104726_web_course_system.sql`
- Survey Responses Table: `migrations/20250319104724_web_survey_system.sql`
