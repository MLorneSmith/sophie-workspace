# Initiative: Progress Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1877 |
| **Initiative ID** | S1877.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 2 |

---

## Description

Implements the two progress visualization widgets: Course Progress Radial Widget showing overall course completion with lesson breakdown, and Assessment Spider Chart Widget visualizing self-assessment scores across presentation skill categories.

## Business Value

Provides users with immediate visual feedback on their learning progress and skill assessment, increasing motivation and engagement with the course content. Helps users identify strengths and areas for improvement.

---

## Scope

### In Scope
- [x] Course Progress Radial Widget (circular progress with lesson list)
- [x] Assessment Spider Chart Widget (radar/spider diagram with category scores)
- [x] Empty states for both widgets when no data exists
- [x] Loading skeleton states
- [x] Data fetching from `course_progress`, `lesson_progress`, and `survey_responses` tables
- [x] Integration with dashboard grid layout

### Out of Scope
- [ ] Course navigation/lesson content editing (handled by course pages)
- [ ] Assessment re-taking/survey editing (handled by assessment pages)
- [ ] Historical progress tracking (only current state shown)
- [ ] Comparative progress with other users

---

## Dependencies

### Blocks
- S1877.I4 - Presentation Table & Polish (completes dashboard visualization set)

### Blocked By
- S1877.I1 - Dashboard Foundation (requires grid container and page structure)

### Parallel With
- S1877.I3 - Activity & Task Widgets (both depend on I1, no mutual dependencies)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Recharts RadarChart adaptation, radial progress SVG customization, sequential color palettes for accessibility |
| External dependencies | Low | Uses existing `@kit/ui/chart` (Recharts wrapper), no new external APIs |
| Unknowns | Low | Existing `RadarChart` and `RadialProgress` components provide clear patterns to follow |
| Reuse potential | High | Reuse existing `RadarChart` from `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` and `RadialProgress` from `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Course Progress Widget**: Circular progress indicator, lesson list display, lesson status indicators
2. **Assessment Spider Chart Widget**: Recharts RadarChart adaptation, category score extraction, empty state with "Complete Assessment" CTA
3. **Widget Loading States**: Skeleton components for both widgets during data fetch
4. **Widget Empty States**: Contextual empty states with appropriate CTAs

### Suggested Order
1. Course Progress Widget (builds on existing `RadialProgress.tsx` pattern)
2. Assessment Spider Chart Widget (adapts existing `radar-chart.tsx`)
3. Loading and empty state integration

---

## Validation Commands
```bash
# Verify radial progress renders with correct percentage
pnpm dev:web && grep -q "RadialProgress" apps/web/app/home/(user)/page.tsx

# Verify spider chart displays category scores
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "Radar"

# Typecheck after implementation
pnpm typecheck

# Verify color contrast for accessibility (use axe DevTools)
# Verify sequential color palette usage (avoid red-green combos)
```

---

## Related Files
- Spec: `../spec.md`
- Foundation: `../S1877.I1-Initiative-dashboard-foundation/`
- Reusable Components: `RadialProgress` at `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`, `RadarChart` at `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
