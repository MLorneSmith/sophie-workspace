# Initiative: Progress & Assessment Visualization

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1607 |
| **Initiative ID** | S1607.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 2 |

---

## Description
Implement the two visualization widgets that show user progress: a RadialBarChart for course completion percentage and a RadarChart (spider diagram) for self-assessment category scores. These widgets provide at-a-glance visibility into the user's learning journey and skill development.

## Business Value
Progress visualization is the primary driver of user engagement and motivation. Showing course completion percentage encourages continued learning, while the spider diagram highlights strengths and areas for improvement, guiding users toward comprehensive skill development.

---

## Scope

### In Scope
- [x] Course Progress Radial Chart component using Recharts RadialBarChart
- [x] Center label showing percentage with "Continue Course" CTA
- [x] Query course_progress table for completion_percentage
- [x] Spider Diagram (RadarChart) for self-assessment category scores
- [x] Reuse/adapt existing RadarChart from assessment/survey/_components/
- [x] Query survey_responses table for category_scores JSONB
- [x] Empty states for both widgets (no course started, no assessment taken)
- [x] Loading skeletons for chart placeholders

### Out of Scope
- [ ] Detailed course progress breakdown (lesson-by-lesson)
- [ ] Historical assessment comparisons
- [ ] Multiple course support (v2)
- [ ] Assessment retake functionality

---

## Dependencies

### Blocks
- None

### Blocked By
- S1607.I1: Dashboard Foundation & Data Layer (provides page structure and loader)

### Parallel With
- S1607.I3: Task & Activity Awareness
- S1607.I4: Quick Actions & Presentations
- S1607.I5: Coaching Integration

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | RadialBarChart documented in research; RadarChart exists |
| External dependencies | None | Data from local database |
| Unknowns | Low | Recharts patterns well-researched |
| Reuse potential | High | Existing RadarChart component reusable |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Course Progress Radial Widget**: RadialBarChart with center label, empty state
2. **Spider Diagram Widget**: RadarChart with category_scores, reuse existing component
3. **Progress Data Queries**: Loader functions for course_progress, survey_responses

### Suggested Order
1. Progress Data Queries (provides data)
2. Course Progress Radial Widget (simpler, new component)
3. Spider Diagram Widget (adapts existing component)

---

## Validation Commands
```bash
# Verify RadialBarChart renders with data
# Manual: Navigate to /home, verify progress widget shows percentage

# Verify RadarChart renders with assessment data
# Manual: Complete assessment, verify spider diagram updates

# Verify empty states
# Manual: New user (no course/assessment), verify helpful empty states

# TypeScript validation
pnpm --filter web typecheck
```

---

## Related Files
- Spec: `../spec.md`
- Parent Initiative: `../S1607.I1-Initiative-dashboard-foundation/`
- Reference: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Research: `../research-library/context7-recharts-radial.md`
