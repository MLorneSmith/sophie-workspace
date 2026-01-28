# Feature: Dashboard Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I4 |
| **Feature ID** | S1864.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 4-5 |
| **Priority** | 2 |

## Description
Display upcoming coaching sessions in a Card-based widget on the user dashboard at `/home`. Shows session details (title, date/time, meeting URL) with a sessions list, empty state when no sessions exist, and skeleton loading during data fetch. Widget integrates with the dashboard's responsive grid layout.

## User Story
**As a** SlideHeroes user
**I want to** see my upcoming coaching sessions on my dashboard
**So that** I never miss a session and can quickly access meeting links

## Acceptance Criteria

### Must Have
- [ ] CoachingSessionsWidget component renders in dashboard grid
- [ ] Sessions list displays title, formatted date/time, join button for each session
- [ ] Empty state appears when no upcoming sessions with "Book Your First Session" CTA
- [ ] Skeleton loading state matches widget dimensions during data fetch
- [ ] Widget uses `<Suspense>` boundary for streaming
- [ ] Data fetched via server-side loader using `Promise.all()` pattern
- [ ] Sessions sorted by start time (nearest first)
- [ ] Only shows accepted, future sessions (filters cancelled/past)

### Nice to Have
- [ ] Show session duration (e.g., "60 min")
- [ ] Relative time display (e.g., "Tomorrow at 2:00 PM")
- [ ] Add to calendar link

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CoachingSessionsWidget, SessionsList, EmptyState, Skeleton | New |
| **Logic** | coaching-page.loader.ts, date formatting utilities | New |
| **Data** | CalComApiService.getUpcomingBookings() | From F1 |
| **Database** | N/A (external API via F1) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Server component with client child components. Server fetches data via loader, passes to client widget for interactivity (modal triggers). Follows existing dashboard-demo-charts.tsx pattern.

### Key Architectural Choices
1. **Server-side data fetching**: Use `loadCoachingPageData()` in page component
2. **Client component for widget**: Enables modal state management for F3/F4
3. **Card-based layout**: Consistent with other dashboard widgets

### Trade-offs Accepted
- No real-time updates (acceptable - user can refresh page)
- Limited to Cal.com data (no local booking history)

## Required Credentials
> Environment variables required for this feature to function.

| Variable | Description | Source |
|----------|-------------|--------|
| `CAL_API_KEY` | Required for API calls in loader | From F1 |

## Dependencies

### Blocks
- F3: Session Actions (needs widget container for actions)
- F4: Booking Modal (needs CTA button in widget)

### Blocked By
- F1: Cal.com Foundation (needs types and API client)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Main widget component
- `apps/web/app/home/(user)/_components/coaching-sessions-list.tsx` - List of session cards
- `apps/web/app/home/(user)/_components/coaching-empty-state.tsx` - Empty state with CTA
- `apps/web/app/home/(user)/_components/coaching-sessions-skeleton.tsx` - Loading skeleton
- `apps/web/app/home/(user)/_lib/server/coaching-page.loader.ts` - Server-side data loader
- `apps/web/lib/date-utils.ts` - Date formatting utilities (formatDate, formatTime)

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add widget to dashboard with Suspense boundary

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create date utilities**: `formatDate()` and `formatTime()` functions
2. **Create data loader**: `loadCoachingPageData()` with `Promise.all()` pattern
3. **Create skeleton component**: Loading skeleton matching widget dimensions
4. **Create empty state**: Component with calendar icon and CTA button
5. **Create sessions list**: Render session cards with details
6. **Create main widget**: Container with conditional rendering (list vs empty)
7. **Integrate into dashboard**: Add to page.tsx with Suspense

### Suggested Order
1. Date utils → 2. Data loader → 3. Skeleton → 4. Empty state → 5. Sessions list → 6. Widget → 7. Integration

## Validation Commands
```bash
# Verify widget renders
pnpm dev &
sleep 5
curl -s http://localhost:3000/home | grep -q "coaching-sessions" && echo "Widget present"

# Component tests
pnpm --filter web test:unit -- --grep "CoachingSessionsWidget"

# Visual verification
npx playwright test apps/e2e/tests/dashboard-coaching.spec.ts
```

## Related Files
- Initiative: `../initiative.md`
- F1: `../S1864.I4.F1-Feature-calcom-foundation/feature.md`
- Research: `../../research-library/perplexity-dashboard-ux.md` (widget best practices)
- Tasks: `./tasks.json` (created in next phase)
