# Initiative: Progress Visualization

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | #1362 |
| **Initiative ID** | #1364 |
| **Status** | Draft |
| **Estimated Weeks** | 1.5-2 |
| **Priority** | 2 |

---

## Description
Integrate existing progress visualization components into the dashboard: the Course Progress Radial Chart (reusing `RadialProgress`) and the Self-Assessment Spider Diagram (reusing `RadarChart`). This initiative focuses on adapting these proven components for the dashboard card context with appropriate data loading.

## Business Value
High-value, low-effort initiative that provides immediate visual feedback on user progress:
- Motivates course completion by showing progress at a glance (Goal G3)
- Reveals assessment insights, encouraging users to improve weak areas
- Leverages existing tested components, minimizing development risk

---

## Scope

### In Scope
- [x] Course Progress Card with RadialProgress component
- [x] Data loader for course progress (lesson counts, completion percentage)
- [x] Self-Assessment Spider Card with RadarChart component
- [x] Data loader for assessment scores (category_scores from survey_responses)
- [x] Responsive sizing for chart components in dashboard cards
- [x] Empty states for users with no course/assessment data
- [x] Integration with dashboard layout from I1

### Out of Scope
- [x] Creating new chart components (reuse existing)
- [x] Quiz score visualization (tracked in activity feed instead)
- [x] Historical progress trends (v2+ consideration)
- [x] Gamification elements (badges, streaks)

---

## Dependencies

### Blocks
- None (end-node in dependency graph)

### Blocked By
- I1: Dashboard Foundation (provides dashboard layout and cards)

### Parallel With
- I3: Activity & Task Tracking (can develop in parallel once I1 complete)
- I4: Cal.com Coaching Integration (can develop in parallel once I1 complete)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Reusing existing tested components |
| External dependencies | None | Internal Supabase tables only |
| Unknowns | Low | Components already work; just need card sizing |
| Reuse potential | High | RadialProgress and RadarChart already exist |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Course Progress Card**: RadialProgress with lesson counts
2. **Assessment Spider Card**: RadarChart with category scores
3. **Progress Data Loaders**: Parallel fetch for course_progress and survey_responses

### Suggested Order
1. Progress Data Loaders (foundation for both cards)
2. Course Progress Card (simpler, single data point)
3. Assessment Spider Card (more complex, multi-category data)

---

## Technical Notes

### Existing Components
| Component | Location | Key Props |
|-----------|----------|-----------|
| RadialProgress | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | `value`, `size`, `strokeWidth` |
| RadarChart | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | `categoryScores` |

### Data Sources
| Card | Table | Fields |
|------|-------|--------|
| Course Progress | `course_progress` | `progress_percentage`, `current_lesson_id` |
| Course Progress | `lesson_progress` | Count of completed lessons |
| Assessment | `survey_responses` | `category_scores` (JSONB) |

### Component Sizing for Dashboard Cards
```typescript
// Card container approx 300-400px wide
// RadialProgress: size={120}, strokeWidth={8}
// RadarChart: height="200px" via ChartContainer
```

### Empty State CTAs
| Card | Condition | CTA |
|------|-----------|-----|
| Course Progress | No course_progress record | "Start Course" → /home/course |
| Assessment | No survey_responses record | "Take Assessment" → /home/assessment |

---

## Validation Commands
```bash
# Verify progress cards render
curl -s http://localhost:3000/home | grep -q "radial-progress" && echo "Progress card found"

# Test with no data (empty state)
# Create test user without course progress

# Run component tests
pnpm --filter web test:unit -- RadialProgress
pnpm --filter web test:unit -- RadarChart

# Visual regression (if configured)
pnpm --filter web-e2e test -- dashboard-progress
```

---

## Related Files
- Spec: `../spec.md`
- Parent Initiative: `../pending-Initiative-dashboard-foundation/initiative.md`
- RadialProgress: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- RadarChart: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Features: `./<feature-#>-<slug>/` (created in next phase)
