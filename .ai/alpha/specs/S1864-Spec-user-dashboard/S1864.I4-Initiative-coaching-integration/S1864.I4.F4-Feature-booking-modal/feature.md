# Feature: Booking Modal

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I4 |
| **Feature ID** | S1864.I4.F4 |
| **Status** | Draft |
| **Estimated Days** | 3-4 |
| **Priority** | 4 |

## Description
Integrate Cal.com booking embed for creating new coaching sessions. The "Book New Session" CTA opens a modal dialog with inline Cal.com embed, pre-filled with user's email and name. Modal listens for booking success events and optionally refreshes the sessions list on completion.

## User Story
**As a** SlideHeroes user
**I want to** book a new coaching session directly from my dashboard
**So that** I can schedule help without navigating away from my home base

## Acceptance Criteria

### Must Have
- [ ] "Book New Session" button visible in widget (and in empty state)
- [ ] Clicking button opens modal dialog with Cal.com inline embed
- [ ] Embed pre-fills user's email and name from session context
- [ ] Cal.com embed script loaded dynamically (shared loader with F3)
- [ ] Modal closes when user completes booking or clicks outside
- [ ] Cal.com `bookingSuccessful` event triggers modal close

### Nice to Have
- [ ] Success toast notification after booking
- [ ] Auto-refresh sessions list after successful booking
- [ ] Loading indicator while embed initializes
- [ ] Error state if embed fails to load

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | BookingModal, CTA buttons | New |
| **Logic** | Cal.com embed script, event listeners | New |
| **Data** | User email/name from session | Existing (workspace context) |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Share embed script loader with F3 (reschedule modal) to avoid duplicate loading. Use Cal.com's event system to detect booking completion rather than polling.

### Key Architectural Choices
1. **Shared script loader**: `calcom-embed-loader.ts` utility used by both F3 and F4
2. **Pre-fill user context**: Extract email/name from workspace context, pass to embed
3. **Event-driven completion**: Listen for `bookingSuccessful` Cal.com event

### Trade-offs Accepted
- Can't guarantee booking success (Cal.com handles payment if any)
- Embed appearance controlled by Cal.com, not app theme

## Required Credentials
> Environment variables required for this feature to function.

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_CAL_USERNAME` | Cal.com username for embed URL | From F1 |
| `NEXT_PUBLIC_CAL_EVENT_SLUG` | Event type slug for embed URL | From F1 |

## Dependencies

### Blocks
- None

### Blocked By
- F1: Cal.com Foundation (needs environment config)

### Parallel With
- F3: Session Actions (can develop simultaneously, share script loader)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/booking-modal.tsx` - Modal with Cal.com inline embed
- `apps/web/lib/calcom-embed-loader.ts` - Shared script loader utility (if not created in F3)

### Modified Files
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Add booking modal state + trigger
- `apps/web/app/home/(user)/_components/coaching-empty-state.tsx` - Wire up CTA to open modal

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create script loader utility**: Shared `loadCalEmbed()` function (if not done in F3)
2. **Create booking modal**: Dialog with container for Cal.com inline embed
3. **Implement embed initialization**: Configure with username, eventSlug, user context
4. **Add booking success listener**: Handle `bookingSuccessful` event
5. **Add modal state to widget**: Track open/closed state
6. **Wire up CTAs**: Connect "Book New Session" buttons to modal
7. **Test booking flow**: E2E test for complete booking journey

### Suggested Order
1. Script loader → 2. Booking modal → 3. Embed init → 4. Success listener → 5. Modal state → 6. CTA wiring → 7. E2E test

## Validation Commands
```bash
# Verify CTA renders
pnpm dev &
curl -s http://localhost:3000/home | grep -q "Book.*Session" && echo "Book button present"

# E2E test for booking flow
npx playwright test apps/e2e/tests/coaching-booking.spec.ts

# Component tests
pnpm --filter web test:unit -- --grep "BookingModal"
```

## Related Files
- Initiative: `../initiative.md`
- F1: `../S1864.I4.F1-Feature-calcom-foundation/feature.md`
- F3: `../S1864.I4.F3-Feature-session-actions/feature.md` (shares script loader)
- Research: `../../research-library/context7-calcom.md` (embed script docs)
- Tasks: `./tasks.json` (created in next phase)
