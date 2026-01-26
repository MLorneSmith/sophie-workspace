# Feature: Booking Modal Integration

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I4 |
| **Feature ID** | S1823.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Implement the Cal.com booking modal using `@calcom/embed-react` as a client component. Creates a "Book a Session" button that opens the Cal.com popup modal for scheduling new coaching sessions. The button is rendered in the empty state of the Coaching Sessions Widget and optionally as a standalone CTA.

## User Story
**As a** learner without any upcoming coaching sessions
**I want to** easily book a new coaching session from my dashboard
**So that** I can schedule time with my coach without navigating away from the dashboard

## Acceptance Criteria

### Must Have
- [ ] "Book a Session" button renders in widget empty state
- [ ] Clicking button opens Cal.com popup modal
- [ ] Modal displays coach's available time slots
- [ ] Modal uses configured coach username and event slug
- [ ] Modal closes after successful booking
- [ ] Client component with `'use client'` directive

### Nice to Have
- [ ] Theme customization to match SlideHeroes brand colors
- [ ] Callback handling for booking success (toast notification)
- [ ] Reschedule modal opens from session "Reschedule" button

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `BookSessionButton` client component | New |
| **Logic** | Cal.com embed API initialization | New |
| **Data** | N/A (embed handles data) | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal
**Rationale**: The `@calcom/embed-react` package handles all complexity. We only need a thin wrapper component that initializes the API and opens the modal on click.

### Key Architectural Choices
1. Client component required for Cal.com embed interactivity
2. Use `getCalApi()` for programmatic modal control
3. Configuration via `NEXT_PUBLIC_` env vars (safe for client-side)
4. Single responsibility: just the booking button, not full calendar embed

### Trade-offs Accepted
- No inline calendar view (popup modal only - simpler UX for dashboard context)
- No booking confirmation callback (Cal.com handles post-booking flow)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Book button | Button | @kit/ui | Standard CTA styling |
| Icons | CalendarPlus or similar | lucide-react | Visual affordance |

**Components to Install** (if not already in packages/ui):
- None required

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Coach's Cal.com username | Cal.com Profile |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Event type slug | Cal.com Event Types |

> Note: These are NEXT_PUBLIC_ prefixed as they're used client-side in the embed.

## Dependencies

### Blocks
- None (final feature in initiative)

### Blocked By
- F1: Cal.com Foundation (needs embed package installed)
- F2: Coaching Widget (button renders in widget empty state)

### Parallel With
- Can develop button component in parallel with F2 widget after F1 complete
- Integration with widget happens after both are ready

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/book-session-button.tsx` - Client component for booking

### Modified Files
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Import and use BookSessionButton in empty state

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create button component**: Implement `BookSessionButton` client component
2. **Initialize Cal API**: Set up `getCalApi()` in useEffect
3. **Implement modal trigger**: Add click handler to open Cal.com modal
4. **Integrate with widget**: Wire button into widget empty state
5. **Add reschedule support**: Enable reschedule modal from session cards (Nice to Have)

### Suggested Order
1. Button component shell
2. Cal API initialization
3. Modal trigger implementation
4. Widget integration
5. (Optional) Reschedule support

## Validation Commands
```bash
# Verify component compiles
pnpm --filter web typecheck

# Visual verification (requires browser)
# Navigate to /home with no bookings, verify button appears and opens modal

# E2E test (if applicable)
pnpm --filter web-e2e test:shard1 -- --grep "coaching"
```

## Related Files
- Initiative: `../initiative.md`
- Foundation: `../S1823.I4.F1-Feature-calcom-foundation/feature.md`
- Widget: `../S1823.I4.F2-Feature-coaching-widget/feature.md`
- Research: `../../research-library/context7-calcom.md`
- Tasks: `./tasks.json` (created in next phase)
