# Feature: Coaching Sessions Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I4 |
| **Feature ID** | S1823.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Implement the Coaching Sessions Widget as a server component that fetches upcoming bookings from Cal.com V2 API and displays them in a Card. Includes a loader function with 5-minute cache revalidation, session list display with join/reschedule links, and graceful degradation when Cal.com API is unavailable or returns errors.

## User Story
**As a** learner on the SlideHeroes platform
**I want to** see my upcoming coaching sessions directly on my dashboard
**So that** I can quickly access join links and never miss a scheduled session

## Acceptance Criteria

### Must Have
- [ ] Widget displays in dashboard grid at designated position
- [ ] Shows next 2 upcoming coaching sessions with title and date/time
- [ ] Each session displays "Join" button linking to video call
- [ ] Each session displays "Reschedule" link for rescheduling
- [ ] Empty state shows "No upcoming sessions" message
- [ ] Server-side data fetching with 5-minute cache revalidation
- [ ] Graceful degradation: shows error state if Cal.com API fails
- [ ] Widget uses Card component matching other dashboard widgets

### Nice to Have
- [ ] Relative time display ("Tomorrow at 2pm", "In 3 days")
- [ ] Session duration badge (30min, 60min)
- [ ] Loading skeleton while data fetches

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `CoachingSessionsWidget` component | New |
| **Logic** | `fetchUpcomingBookings` loader | New |
| **Data** | Cal.com V2 API fetch | New |
| **Database** | N/A (external API only) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Server component for data fetching (keeps API key secure), with standard Card UI pattern. Client component only needed for booking modal (F3).

### Key Architectural Choices
1. Server component fetches data - no client-side API key exposure
2. Use `next: { revalidate: 300 }` for 5-minute caching to reduce API calls
3. Error boundary with fallback UI for graceful degradation
4. Co-located loader in `_lib/server/calcom.loader.ts` following existing patterns

### Trade-offs Accepted
- No real-time updates (acceptable - 5-min cache is sufficient for session schedules)
- No pagination (showing max 2 sessions - acceptable for dashboard widget)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Container | Card, CardHeader, CardTitle, CardContent | @kit/ui | Matches existing dashboard widgets |
| Icons | Calendar, Video, Clock | lucide-react | Consistent with project icon library |
| Action buttons | Button | @kit/ui | Standard interactive elements |
| Date formatting | format() | date-fns | Already in project dependencies |

**Components to Install** (if not already in packages/ui):
- None required - all components already available

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| `CALCOM_API_KEY` | Cal.com V2 API key (Bearer token) | Cal.com Dashboard |

> Note: Only server-side credentials needed. Client-side env vars used in F3.

## Dependencies

### Blocks
- S1823.I5.F1: Presentation Table Widget (widget ordering/layout decisions)

### Blocked By
- F1: Cal.com Foundation (needs types and env config)
- S1823.I1.F2: Dashboard Page Shell (needs page to render widget in)
- S1823.I1.F3: Responsive Grid Layout (needs grid layout for widget placement)

### Parallel With
- F3: Booking Modal (can develop simultaneously after F1 complete)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/calcom.loader.ts` - Server-side booking fetch
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Widget component

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render widget in grid

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create loader function**: Implement `fetchUpcomingBookings()` with V2 API
2. **Create widget component**: Build `CoachingSessionsWidget` server component
3. **Add session list UI**: Render booking cards with join/reschedule actions
4. **Handle empty state**: Show "No upcoming sessions" with CTA placeholder
5. **Add error handling**: Graceful degradation for API failures
6. **Integrate with dashboard**: Add widget to page.tsx grid

### Suggested Order
1. Loader function (foundation for widget)
2. Widget component shell
3. Session list UI
4. Empty state
5. Error handling
6. Dashboard integration

## Validation Commands
```bash
# Verify loader compiles
pnpm --filter web typecheck

# Test widget renders (requires running server + Cal.com credentials)
curl -s http://localhost:3000/home | grep -q "Coaching Sessions"

# Run unit tests for loader
pnpm --filter web test:unit -- --grep "calcom"
```

## Related Files
- Initiative: `../initiative.md`
- Foundation: `../S1823.I4.F1-Feature-calcom-foundation/feature.md`
- Research: `../../research-library/context7-calcom.md`
- Tasks: `./tasks.json` (created in next phase)
