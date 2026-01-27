# Feature: Activity Feed Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I3 |
| **Feature ID** | S1864.I3.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
A dashboard widget that displays a chronological timeline of the user's recent activities (lessons completed, quizzes taken, tasks finished, etc.) with type-specific icons, relative timestamps, and "Load More" pagination for browsing historical activity.

## User Story
**As a** learner using SlideHeroes
**I want to** see a timeline of my recent activities on the dashboard
**So that** I can track my progress and remember what I've accomplished recently

## Acceptance Criteria

### Must Have
- [ ] Widget displays up to 10 recent activities on initial load
- [ ] Each activity shows: type icon, entity name, relative timestamp (e.g., "5 minutes ago")
- [ ] Activity types mapped to appropriate icons (CheckCircle for lessons, Award for quizzes, etc.)
- [ ] "Load More" button fetches next 10 activities
- [ ] ScrollArea container with max height for overflow management
- [ ] Widget has skeleton loading state during data fetch
- [ ] Widget shows empty state when no activities exist

### Nice to Have
- [ ] Activity item links to related entity (e.g., lesson, task)
- [ ] Timestamp updates on hover to show exact date/time
- [ ] Visual grouping by day (e.g., "Today", "Yesterday", "January 25")

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `ActivityFeedWidget` component | New |
| **Logic** | `useActivities()` React Query hook | New |
| **Data** | `get_recent_activities()` RPC | Existing (from F2) |
| **Database** | `activity_logs` table | Existing (from F2) |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow existing notifications popover pattern for timeline UI. Use React Query for client-side data fetching with pagination. Reuse Intl.RelativeTimeFormat for timestamps.

### Key Architectural Choices
1. Client component with React Query for interactive pagination
2. RPC call to `get_recent_activities()` for efficient database queries
3. ScrollArea with fixed max-height (60vh or 400px) for overflow
4. Offset-based pagination rather than cursor (simpler, sufficient for activity logs)

### Trade-offs Accepted
- No real-time updates (user must refresh to see new activities) - WebSocket out of scope
- No filtering by activity type (v2 enhancement)
- Offset pagination may have edge cases if activities deleted during browsing

## Required Credentials
> None required - uses existing authenticated Supabase client

## Dependencies

### Blocks
- None

### Blocked By
- S1864.I3.F2: Activity Data Aggregation (requires activity_logs table and RPC)
- S1864.I1.F1: Dashboard TypeScript types
- S1864.I1.F3: Dashboard responsive grid layout

### Parallel With
- F4: Quick Actions Panel (both depend on F2)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/hooks/use-activities.ts` - React Query hook
- `apps/web/app/home/(user)/_components/activity-feed-widget.tsx` - Main widget component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and place widget in dashboard grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create useActivities hook**: React Query hook with pagination support (offset tracking)
2. **Create widget component skeleton**: Card layout with ScrollArea, loading skeleton
3. **Implement activity type icon mapping**: Map activity_type enum to Lucide icons
4. **Implement relative timestamp formatting**: Reuse Intl.RelativeTimeFormat pattern from notifications
5. **Implement "Load More" pagination**: Button that increments offset and fetches more
6. **Add empty state**: Handle no activities scenario
7. **Integrate with dashboard page**: Add widget to grid layout

### Suggested Order
1 → 2 → 3 → 4 → 5 → 6 → 7

## Validation Commands
```bash
# Verify widget renders
pnpm dev --filter web
# Visit http://localhost:3000/home and check activity feed displays

# Verify pagination
# Click "Load More" and verify more activities load

# Test by completing lessons/tasks
# Verify new activities appear in feed after refresh

# Run type check
pnpm --filter web typecheck

# Run lint
pnpm --filter web lint
```

## Related Files
- Initiative: `../initiative.md`
- Feature F2 (dependency): `../S1864.I3.F2-Feature-activity-data-aggregation/feature.md`
- Notifications popover pattern: `packages/features/notifications/src/components/notifications-popover.tsx`
- Relative time formatting: `packages/features/notifications/src/components/notifications-popover.tsx` (lines 64-110)
