# Feature: Course Progress Card

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1364 |
| **Feature ID** | 1364-F1 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 1 |

## Description
Dashboard card displaying course completion progress using the existing RadialProgress component. Shows completion percentage as a radial chart with lesson count summary. Includes empty state with CTA for users who haven't started the course.

## User Story
**As a** SlideHeroes user
**I want to** see my course progress at a glance on my dashboard
**So that** I'm motivated to continue learning and can track my completion

## Acceptance Criteria

### Must Have
- [ ] RadialProgress chart displays completion percentage (0-100)
- [ ] Lesson count shows "X of Y lessons complete"
- [ ] Empty state displays when no course progress exists
- [ ] "Start Course" CTA button links to /home/course
- [ ] Card integrates with dashboard grid layout from I1

### Nice to Have
- [ ] Current lesson name displayed
- [ ] Animation on progress change (future enhancement)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `CourseProgressCard` component | New |
| **Logic** | `loadCourseProgress` loader | New |
| **Data** | `course_progress`, `lesson_progress` tables | Existing |
| **Database** | RLS policies on progress tables | Existing |

## Architecture Decision

**Approach**: Lightweight Card Component with Server-Side Loader
**Rationale**: Follows existing dashboard patterns (activity-log.tsx), reuses RadialProgress component (zero duplication), Server Component for performance, RLS handles authorization automatically.

### Key Architectural Choices
1. Server Component (no 'use client') - zero client JS for static display
2. Reuse existing RadialProgress from course module (size=120, strokeWidth=8)
3. Return null from loader to trigger empty state gracefully

### Trade-offs Accepted
- No real-time updates (acceptable for dashboard summary view)
- Will need client component wrapper if adding interactivity later

## Dependencies

### Blocks
- None

### Blocked By
- I1: Dashboard Foundation #1363 (provides dashboard grid layout)

### Parallel With
- F2: Assessment Spider Card (can develop simultaneously)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/course-progress-card.tsx` - Dashboard card component (~50 lines)
- `apps/web/app/home/(user)/_lib/server/load-course-progress.ts` - Data loader (~40 lines)

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add import and component to dashboard grid (~4 lines)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create data loader**: Implement `loadCourseProgress()` with Supabase query
2. **Create card component**: Build `CourseProgressCard` with RadialProgress integration
3. **Implement empty state**: Add EmptyState with "Start Course" CTA
4. **Integrate into dashboard**: Modify page.tsx to include the card
5. **Add tests**: Unit tests for loader, component rendering

### Suggested Order
1. Data loader (foundation)
2. Card component with RadialProgress
3. Empty state handling
4. Dashboard integration
5. Verification and tests

## Validation Commands
```bash
# TypeScript check
pnpm typecheck

# Lint and format
pnpm lint:fix && pnpm format:fix

# Unit tests for components
pnpm --filter web test:unit -- course-progress

# E2E test for dashboard
pnpm --filter web-e2e test -- dashboard-progress
```

## Related Files
- Initiative: `../initiative.md`
- RadialProgress: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Empty State: `packages/ui/src/shadcn/empty-state.tsx`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
