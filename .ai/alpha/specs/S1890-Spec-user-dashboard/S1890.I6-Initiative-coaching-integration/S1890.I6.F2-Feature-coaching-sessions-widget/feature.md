# Feature: Coaching Sessions Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I6 |
| **Feature ID** | S1890.I6.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Create the Coaching Sessions Widget that displays upcoming 1-2 coaching sessions with date/time, event type, join link, and reschedule option. The widget integrates with the Cal.com API client to fetch booking data and renders session cards within the dashboard grid.

## User Story
**As a** SlideHeroes user
**I want to** see my upcoming coaching sessions on my dashboard
**So that** I can quickly access session details and join links without navigating away

## Acceptance Criteria

### Must Have
- [ ] Display up to 2 upcoming coaching sessions as cards
- [ ] Show session date/time with user-friendly formatting
- [ ] Show event type name (e.g., "60 Minute Coaching")
- [ ] Include "Join" button/link for confirmed sessions
- [ ] Include "Reschedule" link for session management
- [ ] Loading state while fetching from Cal.com API
- [ ] Error state when API fails (graceful degradation)
- [ ] Integration with dashboard grid layout

### Nice to Have
- [ ] Relative time formatting ("Tomorrow at 2pm", "In 3 days")
- [ ] Coach avatar/name display

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `coaching-sessions-widget.tsx` - Widget component | New |
| **UI** | `coaching-session-card.tsx` - Individual session card | New |
| **Logic** | Cal.com API client (from F1) | Existing |
| **Data** | Booking data from Cal.com V2 API | External |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Server component fetches data, renders session cards. Simple composition without complex state management. Follows existing widget patterns in codebase.

### Key Architectural Choices
1. Server Component for data fetching - no client-side hydration issues
2. Use Card component from shadcn/ui for consistent styling
3. Fetch bookings in page loader alongside other dashboard data
4. Limit to 2 sessions to keep widget compact

### Trade-offs Accepted
- No real-time updates - sessions refresh on page reload
- Limited to 2 sessions - users go to coaching page for full list

## Required Credentials
> Environment variables required for this feature to function.

| Variable | Description | Source |
|----------|-------------|--------|
| `CALCOM_API_KEY` | V2 API key (used by F1 API client) | Cal.com Dashboard |

> **Note**: Uses existing credentials from F1.

## Dependencies

### Blocks
- F3: Booking Embed Fallback (needs widget structure for conditional rendering)

### Blocked By
- F1: Cal.com API Client (needs API client to fetch bookings)
- S1890.I1.F1: Dashboard Page & Grid (needs grid layout container)
- S1890.I2.F2: Dashboard Data Loader (may integrate with loader)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Main widget
- `apps/web/app/home/(user)/_components/coaching-session-card.tsx` - Session card

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add widget to grid
- `apps/web/app/home/(user)/_lib/server/user-dashboard.loader.ts` - Add Cal.com data fetching (if exists)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create CoachingSessionCard component**: Card displaying single session details
2. **Create CoachingSessionsWidget component**: Container fetching and rendering sessions
3. **Add date/time formatting utilities**: User-friendly date display
4. **Integrate with dashboard page**: Add widget to grid layout
5. **Implement loading and error states**: Skeleton and error UI

### Suggested Order
T1: Session card → T2: Widget container → T3: Date formatting → T4: Dashboard integration → T5: States

## Validation Commands
```bash
# Verify widget component exists
test -f apps/web/app/home/\(user\)/_components/coaching-sessions-widget.tsx && echo "✓ Widget exists"

# Check for Card import
grep -q "@kit/ui/card" apps/web/app/home/\(user\)/_components/coaching-sessions-widget.tsx && echo "✓ Card used"

# Verify integration with dashboard
grep -q "coaching-sessions" apps/web/app/home/\(user\)/page.tsx && echo "✓ Dashboard integration"

# Run typecheck
pnpm typecheck
```

## Related Files
- Initiative: `../initiative.md`
- API Client: `apps/web/app/home/(user)/_lib/server/calcom-api.ts`
- Existing pattern: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)

## UI Component Reference
| Component | Source | Purpose |
|-----------|--------|---------|
| Card, CardContent, CardHeader, CardTitle | @kit/ui/card | Widget container |
| Button | @kit/ui/button | Join/Reschedule actions |
| Badge | @kit/ui/badge | Status indicators |
| Skeleton | @kit/ui/skeleton | Loading state |
