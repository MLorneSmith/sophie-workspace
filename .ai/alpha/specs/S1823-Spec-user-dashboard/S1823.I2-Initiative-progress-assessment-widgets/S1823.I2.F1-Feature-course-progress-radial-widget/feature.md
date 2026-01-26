# Feature: Course Progress Radial Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I2 |
| **Feature ID** | S1823.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Create a dashboard widget that displays the user's course completion progress using a radial (circular) progress indicator. The widget shows completion percentage, lesson counts, and provides a "Continue Course" CTA button. This adapts the existing `RadialProgress` component for the dashboard context.

## User Story
**As a** learner on the SlideHeroes platform
**I want to** see my course completion progress at a glance on my dashboard
**So that** I can quickly understand how far I've progressed and be motivated to continue

## Acceptance Criteria

### Must Have
- [ ] Widget displays radial progress circle showing completion percentage (0-100%)
- [ ] Widget shows lesson count text (e.g., "17 of 23 lessons")
- [ ] Widget includes "Continue Course" CTA button that navigates to current lesson
- [ ] Widget handles empty state (no course progress) with enrollment CTA
- [ ] Widget uses skeleton loading state during data fetch
- [ ] Widget is accessible (WCAG 2.1 AA) with proper ARIA labels

### Nice to Have
- [ ] Smooth animation on progress value change
- [ ] Tooltip showing detailed progress breakdown on hover

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `CourseProgressWidget.tsx` (card wrapper + enhanced RadialProgress) | New |
| **Logic** | Data transformation from course_progress to widget props | New |
| **Data** | `loadCourseProgressForWidget()` loader function | New |
| **Database** | `course_progress`, `lesson_progress` tables (existing) | Existing |

## Architecture Decision

**Approach**: Pragmatic - Wrap existing `RadialProgress` component in a Card widget

**Rationale**: The existing `RadialProgress.tsx` component at `/course/_components/` provides 75% of the needed functionality. We'll create a thin wrapper widget that:
1. Adds Card container with header
2. Adds lesson count text below radial
3. Adds "Continue Course" CTA button
4. Handles empty/loading states

### Key Architectural Choices
1. **Reuse RadialProgress**: Import existing component rather than recreating SVG logic
2. **Server Component widget**: Widget is data-driven, no client interactivity needed except CTA
3. **Parallel data fetching**: Widget loader runs in parallel with other dashboard loaders

### Trade-offs Accepted
- RadialProgress title is course-specific ("Course Progress") - acceptable for v1
- No color customization - uses theme primary color

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Card container | Card/CardHeader/CardContent | shadcn/ui | Standard dashboard pattern |
| Progress circle | RadialProgress | Existing `/course/_components/` | Proven SVG implementation |
| CTA button | Button | shadcn/ui | Standard interactive element |
| Loading state | Skeleton | shadcn/ui | Consistent loading UX |

**Components to Install** (if not already in packages/ui):
- [x] Card (already exists)
- [x] Button (already exists)
- [x] Skeleton (already exists)

## Required Credentials
> None required - Uses internal Supabase queries only

## Dependencies

### Blocks
- F2: Spider Chart Assessment Widget (provides widget patterns)

### Blocked By
- S1823.I1.F1: Types and Dashboard Loader (provides `DashboardData` type and loader infrastructure)
- S1823.I1.F3: Responsive Grid Layout (provides grid cell placement)

### Parallel With
- None within this initiative

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/widgets/course-progress-widget.tsx` - Widget component
- `apps/web/app/home/(user)/_lib/server/loaders/course-progress.loader.ts` - Data loader

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Import and call course progress loader
- `apps/web/app/home/(user)/_lib/types/dashboard.types.ts` - Add CourseProgressWidgetData type

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create CourseProgressWidgetData type**: Define TypeScript interface for widget data
2. **Create course progress loader**: Fetch from course_progress and lesson_progress tables
3. **Create CourseProgressWidget component**: Server component with Card, RadialProgress, CTA
4. **Create widget skeleton**: Loading state component
5. **Handle empty state**: Design for users without course progress
6. **Integrate with dashboard**: Add to grid layout

### Suggested Order
1. Types first (provides contracts)
2. Loader (provides data)
3. Skeleton (loading state)
4. Widget component (consumes data)
5. Empty state handling
6. Dashboard integration

## Validation Commands
```bash
# TypeScript check
pnpm --filter web typecheck

# Lint check
pnpm --filter web lint

# Unit tests (if added)
pnpm --filter web test:unit -- --grep "CourseProgressWidget"

# Visual validation
pnpm dev # Navigate to /home, verify widget renders
```

## Related Files
- Initiative: `../initiative.md`
- Existing RadialProgress: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Course Progress Table: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Tasks: `./tasks.json` (created in next phase)
