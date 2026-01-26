# Initiative: Progress & Assessment Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1815 |
| **Initiative ID** | S1815.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 2 |

---

## Description
Implement the course progress radial widget and skill assessment spider chart widget. These are the primary "glanceable" metrics that users see immediately upon landing on the dashboard, answering "Where am I?" and "What skills need work?".

## Business Value
Directly addresses the core user need: "I want to log in and immediately know what I should focus on today." Progress visualization is proven to increase engagement (40-50% higher retention per research). These widgets deliver immediate value on first dashboard load.

---

## Scope

### In Scope
- [x] Course Progress Radial Widget
  - Circular progress indicator showing completion percentage
  - Current lesson context (module X of Y)
  - Empty state when no course started
- [x] Spider Chart Assessment Widget
  - Radar chart from `survey_responses.category_scores`
  - Category labels around perimeter
  - Empty state with CTA to complete assessment
- [x] Data queries for course_progress and survey_responses tables
- [x] Widget-specific loading skeletons
- [x] Responsive sizing (smaller on mobile)

### Out of Scope
- [ ] Historical trend lines or comparison charts
- [ ] Multiple course support
- [ ] Benchmark comparison on spider chart
- [ ] Interactive drill-down to course details

---

## Dependencies

### Blocks
- None (these widgets are leaf components)

### Blocked By
- S1815.I1: Dashboard Foundation (provides grid layout, types, and loader)

### Parallel With
- S1815.I3: Activity & Task Widgets (can develop simultaneously after I1)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Radial progress needs custom component; spider chart has existing pattern |
| External dependencies | Low | No external APIs; queries internal tables only |
| Unknowns | Low | Existing radar-chart.tsx in assessment; Recharts configured |
| Reuse potential | High | Spider chart reuses existing pattern; radial can use shadcn progress variant |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Progress/Assessment Data Loader**: Add course_progress and survey_responses queries to dashboard loader
2. **Course Progress Radial Widget**: Implement circular progress with lesson context
3. **Spider Chart Assessment Widget**: Adapt existing radar-chart.tsx pattern for dashboard
4. **Widget Empty States**: Empty state components with CTAs for both widgets

### Suggested Order
1. Data Loader first (provides data for widgets)
2. Spider Chart second (can adapt existing radar-chart.tsx quickly)
3. Course Progress Radial third (may need custom component)
4. Empty States fourth (polish after core functionality)

---

## Validation Commands
```bash
# Verify components build
pnpm typecheck

# Test widgets render with data
pnpm dev
# Navigate to /home as user with course progress and survey data

# Test empty states
# Create new user account and verify CTAs display

# Visual validation
# Use agent-browser to capture screenshots of both widgets
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Reference: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Reference: `packages/ui/src/shadcn/progress.tsx`
- Schema: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Schema: `apps/web/supabase/migrations/20250319104724_web_survey_system.sql`
