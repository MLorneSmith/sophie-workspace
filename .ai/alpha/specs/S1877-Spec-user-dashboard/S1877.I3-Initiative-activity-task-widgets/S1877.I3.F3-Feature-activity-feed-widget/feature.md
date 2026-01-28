# Feature: Activity Feed Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I3 |
| **Feature ID** | S1877.I3.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description

A dashboard widget displaying a chronological timeline of user's AI-related activity from the `ai_request_logs` table over the last 30 days. Features activity type icons, relative time formatting ("2 hours ago"), and client-side pagination (10 items per page) with a "Load More" button.

## User Story

**As a** user using AI features across the platform
**I want to see a chronological timeline of my recent activity
**So that** I can understand what I've been working on and track my AI feature usage over time

## Acceptance Criteria

### Must Have
- [ ] Queries ai_request_logs for last 30 days by user_id
- [ ] Displays activity items with type icon, description, and relative timestamp
- [ ] Maps `feature` column values to activity type icons (canvas, outline-generator, storyboard, quiz, etc.)
- [ ] Uses `Intl.RelativeTimeFormat` for "X minutes/hours/days ago" formatting
- [ ] Client-side pagination shows 10 items per page
- [ ] "Load More" button appears when additional activities exist
- [ ] Loading skeleton state displays during data fetch
- [ ] Empty state shows message when no activity in 30-day window
- [ ] Activity items use color-coded icons based on feature type

### Nice to Have
- [ ] Click on activity item navigates to related feature (canvas, presentation, etc.)
- [ ] Filter by activity type (canvas, outline, storyboard, quiz)
- [ ] Hover effect shows additional activity details (model, tokens used, cost)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ActivityFeedWidget | New |
| **UI** | ActivityItem | New |
| **UI** | ActivityFeedWidgetSkeleton | New |
| **UI** | Card, ScrollArea, Skeleton, EmptyState | Existing |
| **Logic** | useActivityFeed hook | New |
| **Logic** | activity-feed.loader.ts (server-side) | New |
| **Logic** | timeAgo utility, activity type config | New |
| **Data** | ai_request_logs table query | Existing |
| **Database** | ai_request_logs (existing table) | Existing |

## Architecture Decision

**Approach**: Client Component with React Query and Simple Pagination
**Rationale**:
1. **30-day window limits dataset** - Typical user activity is <100 entries, fits comfortably in memory
2. **Fast iteration** - Simple `useState` for pagination enables instant page switching
3. **Reactive** - React Query handles caching and revalidation automatically
4. **UX advantage** - Instant "Load More" without server round-trips
5. **Pattern reuse** - Follows notifications-popover pattern for scrollable lists and relative time formatting

### Key Architectural Choices
1. Server-side loader fetches initial data with 30-day time window
2. Client-side React Query hook (`useActivityFeed`) manages state, loading, and errors
3. `ACTIVITY_TYPE_CONFIG` maps feature values to icons, labels, and colors
4. Client-side pagination using `useState` and array slicing (10 items per page)
5. `Intl.RelativeTimeFormat` handles time localization automatically

### Trade-offs Accepted
- Client-side pagination (not cursor-based) - sufficient for 30-day window, simpler implementation
- Initial server fetch + client query - acceptable pattern matching existing codebase

## Required Credentials

> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| None required | Uses existing Supabase tables with RLS | No external services |

## Dependencies

### Blocks
- None (widget is self-contained, feeds from existing data)

### Blocked By
- S1877.I1.F1 - Dashboard Page & Grid Layout (requires grid container)

### Parallel With
- S1877.I3.F1 - Kanban Summary Widget
- S1877.I3.F2 - Quick Actions Panel

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/dashboard/_components/activity-feed-widget.tsx` - Main widget with pagination state
- `apps/web/app/home/(user)/dashboard/_components/activity-item.tsx` - Single activity row with icon, description, timestamp
- `apps/web/app/home/(user)/dashboard/_components/activity-feed-widget-skeleton.tsx` - Loading skeleton with placeholder items
- `apps/web/app/home/(user)/dashboard/_lib/hooks/use-activity-feed.ts` - React Query hook for data fetching
- `apps/web/app/home/(user)/dashboard/_lib/server/activity-feed.loader.ts` - Server-side initial data fetch
- `apps/web/app/home/(user)/dashboard/_lib/types/activity-feed.types.ts` - TypeScript interfaces for Activity and ActivityTypeConfig
- `apps/web/app/home/(user)/dashboard/_lib/utils/activity-config.ts` - Activity type icon and color mapping configuration
- `apps/web/app/home/(user)/dashboard/_lib/utils/time-ago.ts` - Relative time formatting utility

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render `ActivityFeedWidget`

## Task Hints

> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create type definitions**: Define `Activity` type (pick from ai_request_logs) and `ActivityTypeConfig` interface
2. **Build activity config**: Create `ACTIVITY_TYPE_CONFIG` mapping feature values to icons (Layout, FileText, Film, CheckCircle2, Sparkles, etc.)
3. **Create time utility**: Implement `timeAgo()` function using `Intl.RelativeTimeFormat` for "X ago" formatting
4. **Build activity item component**: Create `ActivityItem` with icon, description, and timestamp display
5. **Implement React Query hook**: Create `useActivityFeed()` with query key, stale time (5 min), and 30-day window filter
6. **Create server loader**: Implement `loadActivityFeedData()` function with time-based filtering and ordering
7. **Build main widget**: Create `ActivityFeedWidget` with ScrollArea, pagination state, and "Load More" button
8. **Add loading skeleton**: Create `ActivityFeedWidgetSkeleton` with placeholder activity items
9. **Integrate into dashboard**: Import and render widget in page.tsx
10. **Add i18n translations**: Add keys for activity descriptions, widget title, empty state, and "Load More" button

### Suggested Order
1. Create type definitions and activity config utility
2. Implement time-ago utility with Intl.RelativeTimeFormat
3. Build activity item component and test with mock data
4. Implement server loader and verify query returns correct structure
5. Create React Query hook and test fetching
6. Build main widget component with pagination state
7. Create skeleton and empty states
8. Integrate into dashboard page
9. Add translations and accessibility refinements

## Validation Commands
```bash
# Verify activity feed displays
pnpm dev:web && curl -s http://localhost:3000/home | grep -q "Activity Feed\|Recent Activity"

# Verify pagination works (check browser DevTools Network tab)
# Navigate to dashboard and click "Load More" multiple times

# Typecheck after implementation
pnpm typecheck

# Run linter
pnpm lint:fix

# Format code
pnpm format:fix
```

## Related Files
- Initiative: `../initiative.md`
- Foundation: `../../S1877.I1-Initiative-dashboard-foundation/`
- AI Usage: `apps/web/app/home/(user)/admin/ai-usage/_actions/fetch-usage-data.ts` (ai_request_logs query pattern)
- Notifications: `packages/features/notifications/src/components/notifications-popover.tsx` (time formatting and scrollable list patterns)
- EmptyState: `packages/ui/src/makerkit/empty-state.tsx`
- ScrollArea: `packages/ui/src/shadcn/scroll-area.tsx`
