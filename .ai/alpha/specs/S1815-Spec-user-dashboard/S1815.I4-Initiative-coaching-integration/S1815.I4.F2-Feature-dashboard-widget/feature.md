# Feature: Dashboard Coaching Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I4 |
| **Feature ID** | S1815.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 2 |

## Description
Implement the coaching sessions widget for the user dashboard that displays upcoming coaching sessions with date, time, and coach name. When no sessions are scheduled, display an empty state with an embedded booking CTA using the Cal.com Booker component. Include a skeleton loading state during data fetch.

## User Story
**As a** SlideHeroes learner
**I want to** see my upcoming coaching sessions on my dashboard
**So that** I never miss a scheduled session and can easily book new ones

## Acceptance Criteria

### Must Have
- [ ] Widget displays next upcoming coaching session with date, time, and coach name
- [ ] Widget shows following session if one exists (secondary display)
- [ ] Empty state displays when no sessions are scheduled with "Book a Session" CTA
- [ ] Booker component renders in modal or inline when user clicks booking CTA
- [ ] Skeleton loading state displays while fetching booking data
- [ ] Graceful error state displays when Cal.com API is unavailable
- [ ] Widget fits within dashboard grid layout (same card size as other widgets)
- [ ] Responsive design works on mobile, tablet, and desktop

### Nice to Have
- [ ] Animate session card entry for visual polish
- [ ] Show countdown to next session ("Starts in 2 hours")

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CoachingSessionsWidget component | New |
| **UI** | CoachingWidgetSkeleton component | New |
| **UI** | CoachingEmptyState component | New |
| **Logic** | useUpcomingSessions hook (uses useBookings) | New |
| **Data** | N/A (data from Cal.com API) | N/A |
| **Database** | N/A (no local storage) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use Cal.com's free embed approach (iframe in Dialog) for booking rather than the deprecated `@calcom/atoms` package. This works with any free Cal.com account. The widget displays a "Book a Session" CTA that opens a popup/modal with the Cal.com embed.

### Key Architectural Choices
1. Static widget showing booking CTA (no real-time session fetching without API)
2. Use Dialog from shadcn/ui to contain Cal.com iframe embed for booking flow
3. Card-based layout matching existing dashboard widget patterns
4. Separate skeleton component for clean loading state

### Trade-offs Accepted
- No real-time session display without Cal.com API key (show booking CTA instead)
- Booking flow uses iframe embed rather than native React components

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget container | Card | @kit/ui/card | Consistent with other dashboard widgets |
| Booking CTA | Custom CoachingCTA | New | "Book a Session" button |
| Loading state | Skeleton | @kit/ui/skeleton | Consistent loading pattern |
| Booking modal | Dialog | @kit/ui/dialog | Modal container for embed |
| Booking form | Cal.com iframe | External | Free Cal.com embed |

**Components to Install**:
- No new components needed (Dialog, Card, Skeleton already available)
- No npm packages required (uses iframe embed)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_CAL_COACH_USERNAME` | Coach username for Booker component | Environment |
| `NEXT_PUBLIC_CAL_EVENT_SLUG` | Event type slug (e.g., "60min") | Environment |

> Credentials inherited from F1 (Cal.com Foundation)

## Dependencies

### Blocks
- F3: Session Actions (provides the widget that actions attach to)

### Blocked By
- F1: Cal.com Foundation (requires CalProvider and types)

### Parallel With
- None (sequential after F1)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Main widget component
- `apps/web/app/home/(user)/_components/coaching-widget-skeleton.tsx` - Loading skeleton
- `apps/web/app/home/(user)/_components/coaching-empty-state.tsx` - Empty state with booking CTA
- `apps/web/app/home/(user)/_components/session-card.tsx` - Individual session display
- `apps/web/app/home/(user)/_components/booking-dialog.tsx` - Dialog wrapper for Booker

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add CoachingSessionsWidget to dashboard grid
- `apps/web/locales/en/common.json` - Add i18n keys for coaching widget text

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create SessionCard component**: Display individual session with date, time, coach
2. **Create CoachingWidgetSkeleton**: Loading state matching widget dimensions
3. **Create CoachingEmptyState**: Empty state with "Book a Session" CTA
4. **Create BookingDialog**: Dialog wrapper containing Cal.com Booker component
5. **Create useUpcomingSessions hook**: Wrapper around useBookings with error handling
6. **Create CoachingSessionsWidget**: Main widget composing all parts
7. **Add widget to dashboard page**: Integrate into dashboard grid layout
8. **Add i18n translations**: Add coaching-related text keys
9. **Write component tests**: Test widget states (loading, empty, with data, error)

### Suggested Order
1. SessionCard → 2. Skeleton → 3. EmptyState → 4. BookingDialog → 5. Hook → 6. Widget → 7. Page integration → 8. i18n → 9. Tests

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Unit tests
pnpm --filter web test -- --grep "coaching"

# Visual validation
pnpm dev
# Navigate to /home and verify:
# - Widget appears in grid
# - Loading skeleton shows briefly
# - Sessions display correctly (or empty state)
# - Booking CTA opens dialog

# Responsive testing
# Resize browser to mobile/tablet breakpoints
```

## Related Files
- Initiative: `../initiative.md`
- Foundation: `../S1815.I4.F1-Feature-calcom-foundation/feature.md`
- Research: `../../research-library/context7-calcom.md`
- Tasks: `./tasks.json` (created in next phase)
