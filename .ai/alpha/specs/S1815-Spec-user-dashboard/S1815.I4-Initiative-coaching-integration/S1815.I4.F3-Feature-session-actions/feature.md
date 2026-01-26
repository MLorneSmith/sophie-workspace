# Feature: Session Actions

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I4 |
| **Feature ID** | S1815.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Implement interactive actions for coaching sessions: "Join" button that opens the meeting URL in a new tab, and "Reschedule" button that opens the Cal.com rescheduling flow. Handle edge cases like sessions without meeting URLs and provide appropriate feedback for each action.

## User Story
**As a** SlideHeroes learner with a scheduled coaching session
**I want to** easily join my session or reschedule if needed
**So that** I can attend coaching sessions without friction and manage my schedule flexibly

## Acceptance Criteria

### Must Have
- [ ] "Join" button appears on sessions with a valid meetingUrl
- [ ] "Join" button opens meeting URL in new tab with proper security attributes
- [ ] "Reschedule" button appears on all upcoming sessions
- [ ] "Reschedule" button opens Cal.com Booker with rescheduleUid prop
- [ ] Reschedule modal closes and refreshes data after successful reschedule
- [ ] Disabled state for "Join" when session is not yet joinable (>30 min away)
- [ ] Error toast displays if action fails
- [ ] Loading states for async operations

### Nice to Have
- [ ] Confirmation dialog before reschedule action
- [ ] "Add to Calendar" option (ics file download)
- [ ] Copy meeting link to clipboard option

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | SessionActions component | New |
| **UI** | RescheduleDialog component | New |
| **Logic** | useReschedule hook (wraps Booker with rescheduleUid) | New |
| **Logic** | useJoinSession utility | New |
| **Data** | N/A (actions use Cal.com API via hooks) | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use Cal.com's native reschedule flow by passing `rescheduleUid` to the Booker component. This leverages Cal.com's built-in validation and UI rather than building custom reschedule logic. For the join action, simply open the meetingUrl in a new tab with appropriate window.open attributes.

### Key Architectural Choices
1. Join action uses `window.open(meetingUrl, '_blank', 'noopener,noreferrer')` for security
2. Reschedule reuses BookingDialog with rescheduleUid prop passed to Booker
3. Use `onCreateBookingSuccess` callback from Booker to close dialog and refresh bookings
4. Session joinability logic: enable Join button 30 minutes before start time

### Trade-offs Accepted
- No server-side validation of meeting URLs (trust Cal.com data)
- Reschedule flow is client-side only (no server action)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Join button | Button | @kit/ui/button | Standard action button |
| Reschedule button | Button (variant="outline") | @kit/ui/button | Secondary action styling |
| Reschedule modal | Dialog | @kit/ui/dialog | Consistent with booking dialog |
| Rescheduling form | Booker | @calcom/atoms | With rescheduleUid prop |
| Toast notifications | toast | @kit/ui/sonner | Error/success feedback |
| Loading spinner | Spinner | @kit/ui/spinner | Action loading state |

**Components to Install**:
- No new components needed

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_CAL_COACH_USERNAME` | Coach username for Booker reschedule | Environment |
| `NEXT_PUBLIC_CAL_EVENT_SLUG` | Event type slug for reschedule | Environment |

> Credentials inherited from F1 (Cal.com Foundation)

## Dependencies

### Blocks
- None (leaf feature)

### Blocked By
- F1: Cal.com Foundation (requires CalProvider and types)
- F2: Dashboard Widget (provides widget context and session data)

### Parallel With
- None (must follow F2)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/session-actions.tsx` - Join/Reschedule buttons
- `apps/web/app/home/(user)/_components/reschedule-dialog.tsx` - Reschedule modal with Booker
- `apps/web/app/home/(user)/_lib/client/use-join-session.ts` - Join action hook
- `apps/web/app/home/(user)/_lib/client/use-reschedule.ts` - Reschedule action hook

### Modified Files
- `apps/web/app/home/(user)/_components/session-card.tsx` - Add SessionActions component
- `apps/web/locales/en/common.json` - Add i18n keys for action buttons

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create useJoinSession hook**: Handle opening meeting URL with validation
2. **Create SessionActions component**: Join and Reschedule button group
3. **Create RescheduleDialog**: Dialog with Booker using rescheduleUid
4. **Create useReschedule hook**: Manage reschedule dialog state and callbacks
5. **Integrate actions into SessionCard**: Add SessionActions to session display
6. **Add joinability logic**: Enable/disable Join based on time until session
7. **Add toast notifications**: Success/error feedback for actions
8. **Add i18n translations**: Action button text and status messages
9. **Write component tests**: Test action states and interactions

### Suggested Order
1. useJoinSession → 2. SessionActions → 3. RescheduleDialog → 4. useReschedule → 5. SessionCard integration → 6. Joinability logic → 7. Toasts → 8. i18n → 9. Tests

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Unit tests
pnpm --filter web test -- --grep "session-actions"

# Manual testing
pnpm dev
# Navigate to /home with Cal.com configured

# Test Join flow:
# 1. Schedule a test session for now
# 2. Verify Join button is enabled
# 3. Click Join - should open meeting URL in new tab

# Test Reschedule flow:
# 1. Find an upcoming session
# 2. Click Reschedule - dialog should open
# 3. Select new time and confirm
# 4. Verify session updates in widget

# Test edge cases:
# - Session without meetingUrl (Join disabled)
# - Session >30 min away (Join may be disabled)
# - Cal.com API error (error toast)
```

## Related Files
- Initiative: `../initiative.md`
- Foundation: `../S1815.I4.F1-Feature-calcom-foundation/feature.md`
- Widget: `../S1815.I4.F2-Feature-dashboard-widget/feature.md`
- Research: `../../research-library/context7-calcom.md`
- Tasks: `./tasks.json` (created in next phase)
