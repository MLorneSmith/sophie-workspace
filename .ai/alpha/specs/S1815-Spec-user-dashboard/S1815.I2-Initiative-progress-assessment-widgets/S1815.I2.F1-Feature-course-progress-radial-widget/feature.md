# Feature: Course Progress Radial Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I2 |
| **Feature ID** | S1815.I2.F1 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 1 |

## Description
Implement a circular/radial progress widget showing course completion percentage with current lesson context. This is the primary "Where am I?" indicator on the dashboard, giving users immediate feedback on their learning progress.

## User Story
**As a** SlideHeroes learner
**I want to** see my course progress at a glance on my dashboard
**So that** I know how far I've come and feel motivated to continue

## Acceptance Criteria

### Must Have
- [ ] Radial progress indicator showing completion percentage (0-100%)
- [ ] Current lesson context displayed (e.g., "Module 3 of 8")
- [ ] Empty state when no course started with CTA to begin course
- [ ] Skeleton loading state while data loads
- [ ] Responsive sizing (smaller on mobile)

### Nice to Have
- [ ] Animated progress fill on load
- [ ] Link to continue course from widget

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CourseProgressWidget component | New |
| **UI** | CourseProgressEmptyState component | New |
| **UI** | Widget skeleton | New |
| **Logic** | loadCourseProgress loader function | New |
| **Data** | course_progress table query | Existing (RLS protected) |
| **Database** | course_progress table | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Adapt existing `RadialProgress.tsx` component with larger size and additional context. Use server-side data fetching for optimal performance.

### Key Architectural Choices
1. **Server Component data fetching** - Query course_progress in page-level loader, pass to client widget
2. **Adapt existing RadialProgress** - Scale up to 120px, add lesson context below
3. **Card wrapper** - Use shadcn Card for consistent dashboard styling

### Trade-offs Accepted
- Custom larger radial vs. third-party chart library (simpler, lighter)
- No historical trend line (out of scope per initiative)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Progress circle | RadialProgress (adapted) | Existing codebase | Already styled, SVG-based |
| Widget container | Card | @kit/ui/card | Consistent with dashboard |
| Empty state CTA | Button | @kit/ui/button | Standard action |
| Loading skeleton | Skeleton | @kit/ui/skeleton | Standard loading pattern |

**Components to Install**: None - all exist

## Required Credentials
> Environment variables required for this feature to function.

None required - queries internal database tables only.

## Dependencies

### Blocks
- None (leaf widget)

### Blocked By
- S1815.I1: Dashboard Foundation (provides page shell and grid layout)

### Parallel With
- F2: Spider Chart Assessment Widget (can develop simultaneously)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/course-progress-widget.tsx` - Main widget component
- `apps/web/app/home/(user)/_components/course-progress-empty-state.tsx` - Empty state component
- `apps/web/app/home/(user)/_lib/server/loaders/course-progress.loader.ts` - Data loader

### Modified Files
- `apps/web/app/home/(user)/_lib/server/user-dashboard.loader.ts` - Add course progress to parallel fetch
- `apps/web/app/home/(user)/page.tsx` - Integrate widget into grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create course progress loader function**: Query course_progress table with user ID, return completion_percentage and current_lesson_id
2. **Integrate loader into dashboard**: Add to Promise.all() in user-dashboard.loader.ts
3. **Create CourseProgressWidget component**: Adapt RadialProgress with 120px size, add lesson context text
4. **Create empty state component**: Card with message and "Start Course" CTA button
5. **Add skeleton loading state**: Circular skeleton matching widget dimensions
6. **Integrate widget into dashboard grid**: Add to page.tsx in first widget slot
7. **Add responsive styling**: Smaller size on mobile breakpoints
8. **Visual validation**: Use agent-browser to verify rendering

### Suggested Order
1. Loader function first (enables data access)
2. Widget component second (core functionality)
3. Empty state third (handles no-data case)
4. Integration fourth (places in dashboard)
5. Polish last (skeleton, responsive)

## Validation Commands
```bash
# Verify types compile
pnpm typecheck

# Test widget renders with data
pnpm dev
# Navigate to /home as user with course progress

# Test empty state
# Create new user account without course progress

# Visual validation
agent-browser open http://localhost:3000/home
agent-browser wait 2000
agent-browser screenshot .ai/alpha/specs/S1815-Spec-user-dashboard/S1815.I2-Initiative-progress-assessment-widgets/S1815.I2.F1-Feature-course-progress-radial-widget/validation-screenshot.png
```

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Schema: `apps/web/supabase/migrations/20250319104726_web_course_system.sql`
- Tasks: `./tasks.json` (created in next phase)
