# Feature: Course Progress Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I2 |
| **Feature ID** | S1877.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description

Circular progress indicator showing overall course completion percentage with a lesson breakdown list. Displays progress visually using SVG-based radial progress component and shows individual lesson completion status.

## User Story

**As a** Learning Lauren (active course participant)
**I want to** see my overall course progress and which lessons I've completed
**So that** I understand where I am in my learning journey and what to work on next

## Acceptance Criteria

### Must Have
- [ ] Radial progress displays overall completion percentage (e.g., "65%")
- [ ] Progress value is computed from `course_progress.completion_percentage` table
- [ ] Lesson list displays below progress with completion status indicators
- [ ] Each lesson shows status (completed/in-progress/not started)
- [ ] Links to course pages for continuing learning
- [ ] Responsive layout (stacks vertically on mobile, side-by-side with other widgets on desktop)
- [ ] Loading skeleton shows during data fetch
- [ ] Empty state displays when user has no course progress

### Nice to Have
- [ ] Hover tooltip showing lesson details
- [ ] Animated progress arc on load
- [ ] Lesson group headers by module

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CourseProgressWidget | New |
| **Logic** | CourseProgressLoader | New |
| **Data** | course_progress, lesson_progress tables | Existing |
| **Database** | None (existing tables only) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Leverage existing `RadialProgress.tsx` component with minimal adaptation. Build lesson list as simple UL with status indicators. No external dependencies beyond existing UI components.

### Key Architectural Choices

1. **Extract and adapt RadialProgress** - Copy existing component from course page to dashboard widgets directory, ensure reusability
2. **Server component for data loading** - Use Supabase server client in loader, pass data to client component for interactivity
3. **Lesson status derived from lesson_progress** - Query lesson_progress table for individual lesson completion states
4. **Sequential color palette** - Use single-hue progression (light-to-dark primary color) for accessibility, avoid red-green combos

### Trade-offs Accepted
- Lesson list limited to 10 most recent lessons for performance (users with 100+ lessons)
- No drill-down to lesson content (handled by course pages, not dashboard)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Radial progress | Adapted from `RadialProgress.tsx` | Existing course page | SVG-based, clean, simple API |
| Widget container | `Card`, `CardHeader`, `CardContent` from `@kit/ui/card` | shadcn/ui | Standard card pattern across dashboard |
| Lesson status indicators | Custom with `Badge` from `@kit/ui/badge` | shadcn/ui | Visual distinction for completed/in-progress/pending |
| Loading state | `Skeleton` from `@kit/ui/skeleton` | shadcn/ui | Consistent loading patterns |
| Empty state | Custom with Trans | Custom | Contextual CTA to start course |

**Components to Install** (if not already in packages/ui):
- None (all required components confirmed existing)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| None required | No external APIs or services used | N/A |

## Dependencies

### Blocks
- None (foundation feature)

### Blocked By
- S1877.I1 (Dashboard Foundation - provides grid container and page structure)

### Parallel With
- S1877.I2.F2 (Assessment Spider Chart - both use loader states)
- S1877.I2.F3 (Widget States - provides shared patterns)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/course-progress-widget.tsx` - Main widget component
- `apps/web/app/home/(user)/_lib/server/course-progress.loader.ts` - Data loader for course and lesson progress

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render CourseProgressWidget

## Task Hints

> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create course progress loader**: Query course_progress and lesson_progress tables, compute completion metrics
2. **Build CourseProgressWidget component**: Integrate RadialProgress with lesson list, add status indicators
3. **Implement lesson list rendering**: Display lessons with status badges, add click handlers for navigation
4. **Add loading and empty states**: Integrate Skeleton and EmptyState patterns from @kit/ui

### Suggested Order
1. Create loader function first (data dependencies)
2. Build UI component with placeholder data
3. Connect real data via loader
4. Add loading/empty states

## Validation Commands

```bash
# Verify course progress renders with correct percentage
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "Course Progress"

# Verify lesson list displays
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "lesson"

# Typecheck after implementation
pnpm typecheck

# Verify color contrast for accessibility (use axe DevTools)
# Verify sequential color palette usage (avoid red-green combos)
```

## Related Files

- Initiative: `../initiative.md`
- Foundation: `../../S1877.I1-Initiative-dashboard-foundation/`
- Reusable Components: `RadialProgress` at `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
