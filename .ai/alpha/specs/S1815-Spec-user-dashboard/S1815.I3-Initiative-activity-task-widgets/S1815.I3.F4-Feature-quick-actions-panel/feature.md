# Feature: Quick Actions Panel

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I3 |
| **Feature ID** | S1815.I3.F4 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 4 |

## Description
A dashboard widget that displays contextual call-to-action buttons based on the user's current state in the learning journey. Shows 3-4 relevant actions like "Continue Course", "Start Course", "New Presentation", or "Complete Assessment" to guide users to their most valuable next step.

## User Story
**As a** presentation learner using SlideHeroes
**I want to** see relevant action buttons based on where I am in my learning journey
**So that** I can quickly take the most valuable next step without searching for it

## Acceptance Criteria

### Must Have
- [ ] "Continue Course" button if user has course in progress (links to current lesson)
- [ ] "Start Course" button if user hasn't started the course (links to course page)
- [ ] "New Presentation" button always visible (links to storyboard/AI)
- [ ] "Complete Assessment" button if user hasn't completed survey (links to survey)
- [ ] Maximum 3-4 action buttons displayed based on user state
- [ ] Widget skeleton loading state during data fetch
- [ ] Button priority order: Continue Course > Complete Assessment > New Presentation > Start Course

### Nice to Have
- [ ] "View Coaching" button if user has upcoming session (links to coaching widget)
- [ ] Brief description text under each button explaining the action

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `QuickActionsWidget` component | New |
| **Logic** | User state evaluation for button visibility | New |
| **Data** | `loadUserQuickActionState()` loader | New |
| **Database** | Queries to `course_progress`, `survey_responses` | Existing |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use CardButton components from @kit/ui for consistent CTA styling. Server Component with state derived from dashboard loader data. Simple conditional rendering based on boolean flags.

### Key Architectural Choices
1. Derive action visibility from existing dashboard loader data (course progress, survey responses)
2. Use CardButton component with asChild + Link pattern for navigation
3. Prioritized button order defined in constant array, filtered by visibility
4. Server Component for initial render

### Trade-offs Accepted
- Fixed action set (not user-configurable in v1)
- Simple binary state (started/not started) rather than granular progress

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget card | Card | @kit/ui/card | Consistent dashboard card pattern |
| Action buttons | CardButton | @kit/ui/card-button | Established CTA pattern in codebase |
| Navigation | Link | next/link | Standard Next.js navigation |
| Empty state | N/A | N/A | Always shows at least "New Presentation" |
| Loading | Skeleton | @kit/ui/skeleton | Consistent loading pattern |
| Icons | Lucide icons | lucide-react | Play (continue), BookOpen (start), Plus (new), ClipboardCheck (assessment) |

## Required Credentials
None required - all data from internal Supabase tables with RLS protection.

## Dependencies

### Blocks
- None

### Blocked By
- S1815.I1: Dashboard Foundation (provides grid layout, dashboard loader with user state)

### Parallel With
- F1: Kanban Summary Widget
- F2: Activity Data Aggregation
- F3: Activity Feed Widget

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/widgets/quick-actions-widget.tsx` - Widget component
- `apps/web/app/home/(user)/_components/widgets/quick-actions-skeleton.tsx` - Loading skeleton
- `apps/web/app/home/(user)/_lib/types/quick-actions.types.ts` - Action state types
- `apps/web/app/home/(user)/_lib/server/loaders/quick-actions.loader.ts` - User state loader

### Modified Files
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Add quick action state to parallel fetch
- `apps/web/app/home/(user)/page.tsx` - Include widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define quick action types**: TypeScript types for action state and config
2. **Create user state loader**: Fetch course progress and survey completion status
3. **Create action visibility logic**: Determine which actions to show based on state
4. **Create quick actions skeleton**: Loading state component
5. **Create quick action button**: Individual action button component
6. **Create quick actions widget**: Main widget with button grid
7. **Integrate into dashboard**: Add to dashboard loader and grid

### Suggested Order
1. Types first (action configuration)
2. User state loader
3. Visibility logic (can be part of loader or widget)
4. Skeleton component
5. Action button component
6. Main widget
7. Dashboard integration

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Manual testing
pnpm dev
# Test as user with course in progress - should see "Continue Course"
# Test as user who hasn't started course - should see "Start Course"
# Test as user who hasn't completed survey - should see "Complete Assessment"
# Verify "New Presentation" always visible
# Verify buttons navigate to correct pages
```

## Action Configuration Reference

| Action | Visible When | Link Target | Icon | Priority |
|--------|-------------|-------------|------|----------|
| Continue Course | Course in progress | `/home/course/lessons/{current-lesson}` | Play | 1 |
| Complete Assessment | Survey not completed | `/home/assessment/survey` | ClipboardCheck | 2 |
| New Presentation | Always | `/home/ai/storyboard` | Plus | 3 |
| Start Course | Course not started | `/home/course` | BookOpen | 4 |

## Related Files
- Initiative: `../initiative.md`
- Reference: `apps/web/app/home/(user)/_components/home-accounts-list.tsx` - CardButton pattern
- Reference: `apps/web/app/home/(user)/course/page.tsx` - Course progress queries
- Reference: `apps/web/app/home/(user)/assessment/page.tsx` - Survey status queries
- Tasks: `./tasks.json` (created in next phase)
