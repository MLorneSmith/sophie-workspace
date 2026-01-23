# Initiative: Progress & Assessment Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1692 |
| **Initiative ID** | S1692.I2 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 2 |

---

## Description
Implement the Course Progress Radial widget and Self-Assessment Spider/Radar Chart widget. These visualization components display user achievement data and skill assessment scores, providing immediate visual feedback on learning progress.

## Business Value
Progress visualization is the #1 engagement driver according to UX research. Users immediately see their course completion status and skill strengths/weaknesses, motivating continued learning and identifying areas for improvement.

---

## Scope

### In Scope
- [x] Course Progress Radial widget (reuse existing `RadialProgress.tsx`)
- [x] Self-Assessment Spider/Radar Chart (new Recharts component)
- [x] Data fetching for `course_progress` and `survey_responses` tables
- [x] Widget Card wrappers with headers
- [x] Empty states for missing progress/assessment data
- [x] Loading skeleton states for both widgets
- [x] "Continue Course" CTA button on progress widget
- [x] Link to assessment page on spider chart

### Out of Scope
- [ ] Course content rendering
- [ ] Assessment survey implementation
- [ ] Quiz functionality
- [ ] Progress history/timeline

---

## Dependencies

### Blocks
- S1692.I5: Polish & Testing (needs widgets for E2E tests)

### Blocked By
- S1692.I1: Dashboard Foundation (needs grid layout and data loader)

### Parallel With
- S1692.I3: Activity & Task Widgets (can develop simultaneously)
- S1692.I4: Coaching Integration (can develop simultaneously)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | Spider chart is new (but Recharts documented in research) |
| External dependencies | Low | Data from existing Supabase tables |
| Unknowns | Low | RadialProgress exists, Recharts patterns researched |
| Reuse potential | High | RadialProgress should move to `@kit/ui`, spider chart reusable |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Course Progress Widget**: Integrate RadialProgress with course_progress data
2. **Spider Chart Component**: Create Recharts-based radar chart for skills
3. **Progress Data Loader**: Add course_progress to dashboard loader
4. **Assessment Data Loader**: Add survey_responses to dashboard loader
5. **Widget Empty States**: Design states for no progress/no assessment data

### Suggested Order
1. Progress Data Loader (foundation)
2. Assessment Data Loader (foundation)
3. Course Progress Widget (simpler, reuses existing component)
4. Spider Chart Component (new component)
5. Widget Empty States (polish)

---

## Validation Commands
```bash
# Verify RadialProgress exists
ls apps/web/app/home/\(user\)/course/_components/RadialProgress.tsx

# Type check
pnpm typecheck

# Visual test (manual)
# Visit /home and verify progress widgets render
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-slug>/` (created in next phase)
- RadialProgress: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Survey scores hook: `apps/web/app/home/(user)/assessment/_lib/client/hooks/use-survey-scores.ts`
- Research: `../research-library/context7-recharts-radar.md`
- Recharts patterns: `packages/ui/src/shadcn/chart.tsx`
