# Feature: Activity Feed Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I3 |
| **Feature ID** | S1692.I3.F3 |
| **Status** | Draft |
| **Estimated Days** | 3-4 |
| **Priority** | 3 |

## Description
A timeline-style widget displaying the user's recent activities (completed lessons, quiz scores, course completions, storyboard submissions, assessment completions). Shows relative timestamps, activity-specific icons, and contextual metadata.

## User Story
**As a** SlideHeroes user
**I want to** see my recent learning activities at a glance
**So that** I can track my progress and feel motivated by my accomplishments

## Acceptance Criteria

### Must Have
- [ ] Display last 10-15 activities in timeline format
- [ ] Show activity type icon (lesson, quiz, course, storyboard, assessment)
- [ ] Display relative timestamps ("2 hours ago", "yesterday")
- [ ] Show activity-specific details (quiz score, completion %, category)
- [ ] Empty state for users with no activity
- [ ] Loading skeleton state

### Nice to Have
- [ ] "View All" link to full activity history (future page)
- [ ] Activity type badge with color coding
- [ ] Animate new activities appearing

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `activity-feed-widget.tsx` (Server) | New |
| **UI** | `activity-feed-list.tsx` (Client) | New |
| **Logic** | `loadUserActivities()` loader | From F2 |
| **Data** | `user_activities` view | From F2 |
| **Database** | Activity source tables | Existing |

## Architecture Decision

**Approach**: Server Component + Client Rendering
**Rationale**: Server component fetches data (RLS enforced, cached), passes to client component for rendering with relative timestamps. This hybrid approach optimizes initial load while enabling client-side interactivity.

### Key Architectural Choices
1. Server component calls `loadUserActivities()` from F2
2. Client component renders timeline with `date-fns` for relative times
3. Icon mapping based on activity_type enum
4. Activity descriptions derived from metadata JSON

### Trade-offs Accepted
- Two components (server + client) adds slight complexity but necessary for timestamps

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | Card | @kit/ui/card | Standard widget container |
| List | Custom timeline | Custom | Specific timeline layout |
| Badge | Badge | @kit/ui/badge | Activity type indicator |
| Icons | Lucide | lucide-react | Activity type icons |
| Empty | EmptyState | @kit/ui/empty-state | No activities message |

**Components to Install**: None - all components already available

## Dependencies

### Blocks
- None

### Blocked By
- F2: Activity Data Aggregation (requires `loadUserActivities()` and view)

### Parallel With
- F1: Kanban Summary Widget (after F2 complete)
- F4: Quick Actions Panel (after F2 complete)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/activity-feed-widget.tsx` - Server component wrapper
- `apps/web/app/home/(user)/_components/activity-feed-list.tsx` - Client timeline renderer

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create server component**: Fetch activities via loader
2. **Create client list component**: Timeline rendering with icons
3. **Implement icon mapping**: Map activity_type to Lucide icons
4. **Add relative timestamps**: Use date-fns formatDistanceToNow
5. **Create activity descriptions**: Build descriptive text from metadata
6. **Add empty state**: Handle no activities gracefully
7. **Add loading skeleton**: Show placeholder while loading
8. **Style timeline**: Match dashboard design system

### Suggested Order
1. Create server component skeleton
2. Create client list component with basic rendering
3. Add icon mapping and activity descriptions
4. Implement relative timestamps
5. Add empty state and loading skeleton
6. Style and polish

## Activity Types and Icons

| Activity Type | Icon | Description Template |
|---------------|------|---------------------|
| `lesson_completed` | BookOpen | "Completed lesson • {percentage}%" |
| `quiz_completed` | CheckCircle2 | "Quiz {passed ? 'passed' : 'completed'} • Score: {score}%" |
| `course_completed` | Award | "Course completed" |
| `storyboard_submitted` | FileText | "Storyboard submitted • {type}" |
| `survey_completed` | ClipboardCheck | "Assessment completed • {category}" |

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Visual test (manual)
# 1. Visit /home and verify activity feed renders
# 2. Complete a lesson, verify it appears
# 3. Test empty state (new user)
# 4. Verify relative timestamps update
```

## Related Files
- Initiative: `../initiative.md`
- Activity loader: `apps/web/app/home/(user)/_lib/server/user-activity.loader.ts` (from F2)
- Depends on: `../S1692.I3.F2-Feature-activity-data-aggregation/feature.md`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
