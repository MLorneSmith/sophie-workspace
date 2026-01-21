# Feature: Course Progress Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I2 |
| **Feature ID** | S1692.I2.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Implement the Course Progress Radial widget for the user dashboard. This widget displays the user's course completion percentage using the existing RadialProgress component, shows completed/total lesson count, and includes a "Continue Course" CTA button linking to the course page.

## User Story
**As a** SlideHeroes learner
**I want to** see my course completion progress at a glance on my dashboard
**So that** I stay motivated and can quickly resume where I left off

## Acceptance Criteria

### Must Have
- [ ] Widget displays radial progress indicator with completion percentage
- [ ] Shows text like "X of Y lessons completed"
- [ ] "Continue Course" button links to `/home/course`
- [ ] Loading skeleton displays while data loads
- [ ] Widget wrapped in Card component with header

### Nice to Have
- [ ] Progress comparison to previous week (trend indicator)
- [ ] Animation on percentage change

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `CourseProgressWidget` component | New |
| **UI** | `RadialProgress` component | Existing (reuse) |
| **UI** | Card wrapper | Existing |
| **UI** | Loading skeleton | Existing |
| **Logic** | Progress calculation | New (simple) |
| **Data** | Dashboard progress loader | From F1 |
| **Database** | `course_progress` table | Existing |

## Architecture Decision

**Approach**: Pragmatic - Reuse existing RadialProgress with Card wrapper
**Rationale**: The codebase has a working RadialProgress component in the course section. Rather than creating a new chart, we reuse this component within a Card widget wrapper, following the dashboard-demo-charts.tsx patterns.

### Key Architectural Choices
1. Server component for data fetching, client component for RadialProgress
2. Reuse existing `RadialProgress.tsx` component
3. Follow Card + CardHeader + CardContent pattern from dashboard examples

### Trade-offs Accepted
- RadialProgress is a simple SVG, not a Recharts component - acceptable for consistency with existing course UI

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card wrapper | Card, CardHeader, CardContent | @kit/ui/card | Standard widget container |
| Progress circle | RadialProgress | Existing in course/ | Already proven, matches course UI |
| Continue button | Button | @kit/ui/button | Standard CTA pattern |
| Loading state | Skeleton | @kit/ui/skeleton | Standard loading pattern |

## Dependencies

### Blocks
- F4: Widget Empty States (needs this widget to add empty state)

### Blocked By
- F1: Progress & Assessment Data Loader (needs data)
- S1692.I1: Dashboard Foundation (needs grid layout)

### Parallel With
- F3: Spider Chart Widget (same data dependency, different display)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/course-progress-widget.tsx` - Main widget component
- `apps/web/app/home/(user)/_components/course-progress-widget-skeleton.tsx` - Loading skeleton

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add widget to dashboard grid
- May need to export RadialProgress from course folder or move to shared location

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create widget skeleton**: Loading state component with Card + Skeleton layout
2. **Create widget component**: Main CourseProgressWidget with RadialProgress integration
3. **Add to dashboard grid**: Import and position widget in dashboard page
4. **Wire up data**: Connect widget to loader data
5. **Style and polish**: Ensure responsive behavior, proper spacing

### Suggested Order
Skeleton → Widget component → Dashboard integration → Data wiring → Polish

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Visual verification
# 1. Start dev server: pnpm dev
# 2. Navigate to /home as logged-in user
# 3. Verify widget displays with progress data
# 4. Verify "Continue Course" link works
```

## Related Files
- Initiative: `../initiative.md`
- Data Loader: `../S1692.I2.F1-Feature-progress-assessment-data-loader/feature.md`
- Existing RadialProgress: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Dashboard patterns: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
