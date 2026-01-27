# Feature: Course Progress Radial Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I2 |
| **Feature ID** | S1864.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Create a dashboard widget displaying the user's overall course completion percentage using a radial (circular) progress indicator. The widget shows the completion percentage, completed vs total lesson count, and provides a link to continue the course. This adapts the existing `RadialProgress.tsx` component for the dashboard context with enhanced styling and larger display.

## User Story
**As a** SlideHeroes learner
**I want to** see my course progress at a glance on my dashboard
**So that** I can quickly understand how far I've progressed and stay motivated to complete the course

## Acceptance Criteria

### Must Have
- [ ] Radial progress chart showing completion percentage (0-100%)
- [ ] Large percentage display in center of radial chart
- [ ] Lesson count breakdown showing "X/Y Lessons Completed"
- [ ] Link/button to "Continue Course" that navigates to current lesson
- [ ] Empty state when user has not started the course
- [ ] Loading skeleton matching widget dimensions
- [ ] Accessible title and description for screen readers

### Nice to Have
- [ ] Animation when percentage updates
- [ ] Color gradient from amber (0%) to green (100%)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `CourseProgressWidget.tsx` | New |
| **Logic** | Dashboard loader course progress fetch | Modified (extends I1 loader) |
| **Data** | `course_progress`, `lesson_progress` tables | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Reuse the existing `RadialProgress.tsx` as inspiration, but create a new dashboard-specific widget component that can leverage larger sizing, additional metadata display (lesson counts), and Card-based layout consistent with other dashboard widgets. The existing component is compact (40px default) and lacks lesson breakdown.

### Key Architectural Choices
1. Create new `CourseProgressWidget.tsx` in dashboard `_components/` folder using Card layout pattern
2. Extend dashboard loader (from I1) to include course progress data alongside other widget data
3. Use Server Component for initial data, passing props to client widget for any interactivity

### Trade-offs Accepted
- Creating new widget rather than extracting/generalizing existing RadialProgress - keeps dashboard widgets cohesive and avoids breaking existing course page

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card container | Card, CardHeader, CardContent | @kit/ui/card | Consistent with other dashboard widgets |
| Progress indicator | Custom SVG radial | Built in widget | Larger than existing RadialProgress, more styling control |
| Percentage display | span with styling | Native | Simple text display |
| Continue CTA | Button | @kit/ui/button | Standard interactive element |
| Loading state | Skeleton | @kit/ui/skeleton | Matches widget shape |

**Components to Install**: None required - all components already in packages/ui

## Required Credentials
None required - uses only local database data via Supabase with RLS.

## Dependencies

### Blocks
- None

### Blocked By
- S1864.I1.F1: Types and Data Loader (needs DashboardData type, loader extension point)
- S1864.I1.F2: Dashboard Page Shell (needs widget placement in grid)

### Parallel With
- F2: Spider Chart Assessment Widget (can develop simultaneously once I1 deps complete)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/course-progress-widget.tsx` - Widget component
- `apps/web/app/home/(user)/_components/course-progress-widget-skeleton.tsx` - Loading skeleton

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts` - Add course progress data fetch
- `apps/web/app/home/(user)/_lib/types.ts` - Add CourseProgressData type
- `apps/web/app/home/(user)/page.tsx` - Import and place widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create CourseProgressData type**: Define TypeScript interface for course progress widget data
2. **Extend dashboard loader**: Add course_progress and lesson_progress queries with Promise.all
3. **Create CourseProgressWidget component**: Card layout with radial progress, lesson count, CTA
4. **Create widget skeleton**: Loading placeholder matching widget dimensions
5. **Create empty state**: Render when no course progress exists
6. **Integrate widget into dashboard page**: Import, pass data props, place in grid position

### Suggested Order
1. Types (foundation)
2. Loader extension (data availability)
3. Widget component (main implementation)
4. Skeleton + empty state (UX polish)
5. Page integration (final assembly)

## Validation Commands
```bash
# Verify widget component exists
ls apps/web/app/home/\(user\)/_components/course-progress-widget.tsx

# Verify types compile
pnpm --filter web typecheck

# Verify loader fetches course data
grep -r "course_progress" apps/web/app/home/\(user\)/_lib/server/dashboard-page.loader.ts

# Visual check (with dev server running)
# Navigate to http://localhost:3000/home and verify widget renders
```

## Related Files
- Initiative: `../initiative.md`
- Existing RadialProgress: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Card components: `packages/ui/src/shadcn/card.tsx`
- Database types: `apps/web/lib/database.types.ts`
