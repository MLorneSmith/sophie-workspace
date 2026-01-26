# Feature: Activity Feed Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I3 |
| **Feature ID** | S1823.I3.F3 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 3 |

## Description
A dashboard widget that displays a chronological feed of the user's recent activities across the platform. Shows lesson completions, quiz attempts, presentation submissions, and survey responses with activity-specific icons and relative timestamps (e.g., "2 hours ago"). Provides users with a timeline of their learning journey.

## User Story
**As a** learner using SlideHeroes
**I want to** see a timeline of my recent activities on the dashboard
**So that** I can track my progress and remember what I've been working on

## Acceptance Criteria

### Must Have
- [ ] Display up to 10 recent activities in chronological order (newest first)
- [ ] Show activity-specific icons: BookOpen (lessons), CheckSquare (quizzes), Lightbulb (presentations), ClipboardCheck (surveys)
- [ ] Display activity description (e.g., "Completed Lesson 5: Story Structure")
- [ ] Show relative timestamps using `Intl.RelativeTimeFormat` (e.g., "2 hours ago", "yesterday")
- [ ] Handle empty state when no activities exist with encouraging message

### Nice to Have
- [ ] Include quiz scores in activity description where available
- [ ] "View All" link to a dedicated activity history page (future feature)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `activity-feed-widget.tsx` | New |
| **Logic** | Consumes data from `loadDashboardData()` | Existing (from F2) |
| **Data** | `ActivityItem[]` from aggregation service | Existing (from F2) |
| **Database** | N/A (data provided by F2) | N/A |

## Architecture Decision

**Approach**: Presentation-Only Client Component
**Rationale**: The Activity Feed Widget is purely presentational - it receives pre-aggregated `ActivityItem[]` data from the server loader and handles display logic (icons, formatting) on the client.

### Key Architectural Choices
1. Client component for interactive hover/focus states
2. Use `Intl.RelativeTimeFormat` for localized relative timestamps
3. Map activity types to Lucide icons via switch statement

### Trade-offs Accepted
- No pagination in v1 (capped at 10 items for simplicity)
- Timestamps not live-updating (acceptable for dashboard context)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget container | Card | @kit/ui/card | Consistent dashboard styling |
| Activity list | Native ul/li | Native | Simple semantic markup |
| Activity icons | Various | lucide-react | Visual differentiation by type |
| Timestamps | Native time | Native | Semantic HTML with relative text |

**Components to Install**: None required

## Required Credentials
None required - consumes data from internal service.

## Dependencies

### Blocks
- None

### Blocked By
- F2 (Activity Data Aggregation provides the data)
- S1823.I1.F1 (Dashboard infrastructure)

### Parallel With
- F4 (Quick Actions Panel - both consume data from F2)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/activity-feed-widget.tsx` - Widget component
- `apps/web/app/home/(user)/_lib/utils/format-relative-time.ts` - Time formatting utility

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard-widgets.tsx` - Add ActivityFeedWidget to composition

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create time formatter**: Implement `formatRelativeTime()` utility using Intl.RelativeTimeFormat
2. **Create icon mapper**: Function to map activity type to Lucide icon
3. **Build activity item component**: Single activity row with icon, description, timestamp
4. **Build widget component**: Card container with activity list
5. **Add empty state**: Message encouraging user to start learning
6. **Add unit tests**: Test time formatting and component rendering

### Suggested Order
Time Formatter → Icon Mapper → Activity Item → Widget Container → Empty State → Tests

## Validation Commands
```bash
# Type check
pnpm typecheck

# Unit tests
pnpm --filter web test:unit -- --grep "activity-feed"

# Visual verification
pnpm dev
# Navigate to http://localhost:3000/home and verify feed displays activities
# Test with user who has activity data
```

## Related Files
- Initiative: `../initiative.md`
- Time formatting pattern: `packages/features/notifications/src/components/notifications-popover.tsx`
- Activity data: F2's `loadRecentActivities()` function
- Tasks: `./tasks.json` (created in next phase)
