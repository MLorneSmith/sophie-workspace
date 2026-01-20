# Feature: Activity Feed Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I3 |
| **Feature ID** | S1607.I3.F2 |
| **Status** | Draft |
| **Estimated Days** | 6 |
| **Priority** | 2 |

## Description
A dashboard widget that displays a reverse-chronological timeline of the user's recent activity across the platform. Shows the last 30 days of presentations created/updated, lessons completed, quizzes scored, and assessments done, grouped by time periods (Today, Yesterday, This Week, Earlier).

## User Story
**As a** SlideHeroes user
**I want to** see my recent activity on the dashboard
**So that** I can track my accomplishments and maintain momentum in my presentation learning journey

## Acceptance Criteria

### Must Have
- [ ] Display activities from the last 30 days
- [ ] Support activity types: presentations, lessons, quizzes, assessments
- [ ] Group activities by time period (Today, Yesterday, This Week, Earlier)
- [ ] Show activity type icon, title, and relative timestamp
- [ ] Show quiz scores and pass/fail status for quiz activities
- [ ] Empty state when no recent activity exists
- [ ] Loading skeleton during data fetch

### Nice to Have
- [ ] Filter by activity type
- [ ] "Show more" pagination for Earlier section
- [ ] Click-through to activity detail

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ActivityFeedWidget, ActivityFeedCard, ActivitySection, ActivityItem | New |
| **Logic** | Activity aggregation, time grouping with date-fns | New |
| **Data** | loadUserRecentActivity() loader, groupActivitiesByTime() helper | New |
| **Database** | building_blocks_submissions, lesson_progress, quiz_attempts, survey_responses | Existing |

## Architecture Decision

**Approach**: Pragmatic (Pure Server Components)
**Rationale**: Activity feed is read-only with no interactivity requirements. Server components provide optimal performance with zero client JavaScript, instant SSR, and no loading states on page navigation.

### Key Architectural Choices
1. All components are server components (no 'use client')
2. Single loader function aggregates all activity types with parallel queries
3. Time grouping logic runs server-side with date-fns
4. Static display - updates only on page refresh/navigation

### Trade-offs Accepted
- No real-time updates (acceptable - users can refresh)
- Multiple table queries (mitigated by parallel fetching)
- 30-day limit prevents unbounded result sets

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget Card | Card | @kit/ui/card | Consistent with dashboard styling |
| Time Headers | Custom styling | Tailwind | Simple section headers |
| Activity Icons | FileText, BookOpen, Award, ClipboardList | lucide-react | Activity type differentiation |
| Empty State | EmptyState | @kit/ui/empty-state | Consistent empty state pattern |
| Loading | Skeleton | @kit/ui/skeleton | Standard loading pattern |

**Components to Install**: None - all components already available

## Dependencies

### Blocks
- None

### Blocked By
- S1607.I1: Dashboard Foundation (provides page structure and loader infrastructure)

### Parallel With
- F1: Kanban Summary Widget (no dependencies between them)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/types/activity.ts` - ActivityItem and GroupedActivities types
- `apps/web/app/home/(user)/_components/activity-feed-widget.tsx` - Server component wrapper
- `apps/web/app/home/(user)/_components/activity-feed-card.tsx` - Main card with grouped display
- `apps/web/app/home/(user)/_components/activity-section.tsx` - Time period section component
- `apps/web/app/home/(user)/_components/activity-item.tsx` - Individual activity display

### Modified Files
- `apps/web/app/home/(user)/_lib/server/user-dashboard-page.loader.ts` - Add loadUserRecentActivity() and groupActivitiesByTime()
- `apps/web/app/home/(user)/page.tsx` - Add ActivityFeedWidget to grid layout

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create activity types**: Define ActivityItem, ActivityType, GroupedActivities types
2. **Implement activity loader - presentations**: Query building_blocks_submissions table
3. **Implement activity loader - lessons**: Query lesson_progress table with completed_at
4. **Implement activity loader - quizzes**: Query quiz_attempts table with score/passed
5. **Implement activity loader - assessments**: Query survey_responses table
6. **Implement aggregation function**: Combine all queries with Promise.all(), transform to ActivityItem[]
7. **Implement time grouping**: groupActivitiesByTime() with date-fns
8. **Create ActivityItem component**: Icon, title, relative time, metadata display
9. **Create ActivitySection component**: Time period header with activity list
10. **Create ActivityFeedCard component**: Layout with all sections
11. **Create ActivityFeedWidget wrapper**: Server component with loader integration
12. **Add widget to dashboard page**: Update grid layout to include widget
13. **Add loading skeleton**: Implement loading state for widget
14. **Add empty state**: Handle case when no activities exist

### Suggested Order
1. Types → 2-5. Loader queries (parallel) → 6. Aggregation → 7. Time grouping → 8. ActivityItem → 9. ActivitySection → 10. ActivityFeedCard → 11. ActivityFeedWidget → 12. Page integration → 13. Loading → 14. Empty state

## Validation Commands
```bash
# TypeScript validation
pnpm --filter web typecheck

# Verify activity feed shows presentations
# Manual: Create/update a presentation, verify it appears in feed

# Verify activity feed shows lessons
# Manual: Complete a lesson, verify it appears in feed

# Verify activity feed shows quizzes
# Manual: Complete a quiz, verify score and pass/fail shows in feed

# Verify activity feed shows assessments
# Manual: Complete a survey, verify it appears in feed

# Verify time grouping
# Manual: Check "Today", "Yesterday", "This Week", "Earlier" sections render correctly

# Verify empty state
# Manual: New user with no activity, verify empty state displays

# Verify 30-day limit
# Manual: Activities older than 30 days should not appear
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/perplexity-dashboard-patterns.md` (Activity Feed section)
- Database Tables:
  - `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
  - `apps/web/supabase/migrations/20250319104726_web_course_system.sql` (lesson_progress, quiz_attempts)
  - `apps/web/supabase/migrations/20250319104724_web_survey_system.sql` (survey_responses)
