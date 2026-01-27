# Feature: Session Actions

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I4 |
| **Feature ID** | S1864.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 3-4 |
| **Priority** | 3 |

## Description
Add interactive actions to coaching sessions: "Join Meeting" button that opens video call URL in new tab, and "Reschedule" link that opens Cal.com embed in a modal dialog with the session's `rescheduleUid` pre-configured. Uses Cal.com embed script for the reschedule flow.

## User Story
**As a** SlideHeroes user
**I want to** join meetings with one click and reschedule sessions without leaving the dashboard
**So that** I can manage my coaching sessions efficiently

## Acceptance Criteria

### Must Have
- [ ] "Join" button appears for sessions with a meeting URL
- [ ] "Join" opens meeting URL in new tab (`target="_blank"`)
- [ ] "Reschedule" button appears for all upcoming sessions
- [ ] Clicking "Reschedule" opens a modal dialog
- [ ] Modal loads Cal.com embed script dynamically (not blocking page load)
- [ ] Embed initialized with `rescheduleUid` config for selected session
- [ ] Modal closes cleanly when user completes or cancels reschedule

### Nice to Have
- [ ] Success toast when reschedule completes
- [ ] Auto-refresh sessions list after reschedule
- [ ] Loading spinner while embed initializes

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | SessionCardActions, RescheduleModal | New |
| **Logic** | Cal.com embed script integration | New |
| **Data** | Session booking UID passed from widget | From F2 |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use Cal.com vanilla embed script (`Cal("inline", {...})`) rather than deprecated @calcom/atoms. Script loaded dynamically only when modal opens to avoid blocking initial page load.

### Key Architectural Choices
1. **Dynamic script loading**: Load embed script only when reschedule modal opens
2. **Dialog-based modal**: Use Shadcn Dialog for consistent UX
3. **Client-side only**: No server actions needed - Cal.com handles reschedule

### Trade-offs Accepted
- Less customization than @calcom/atoms (acceptable for v1)
- Cal.com embed styling may differ slightly from app theme

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
- F2: Dashboard Widget (needs widget container)

### Parallel With
- F4: Booking Modal (can develop simultaneously after F1, F2)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/session-card-actions.tsx` - Join + Reschedule buttons
- `apps/web/app/home/(user)/_components/reschedule-modal.tsx` - Modal with Cal.com embed

### Modified Files
- `apps/web/app/home/(user)/_components/coaching-sessions-list.tsx` - Use SessionCardActions
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Add reschedule modal state

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create session card actions**: Component with Join and Reschedule buttons
2. **Create reschedule modal**: Dialog with container for Cal.com embed
3. **Implement embed script loader**: Dynamic script loading utility
4. **Initialize embed with rescheduleUid**: Configure embed on modal open
5. **Update sessions list**: Replace inline buttons with SessionCardActions
6. **Add modal state to widget**: Manage which session is being rescheduled
7. **Test reschedule flow**: E2E test for complete reschedule journey

### Suggested Order
1. Session card actions → 2. Reschedule modal → 3. Embed loader → 4. Embed config → 5. Update list → 6. Modal state → 7. E2E test

## Validation Commands
```bash
# Verify buttons render
pnpm dev &
curl -s http://localhost:3000/home | grep -q "Reschedule" && echo "Reschedule button present"

# E2E test for reschedule flow
npx playwright test apps/e2e/tests/coaching-reschedule.spec.ts

# Component tests
pnpm --filter web test:unit -- --grep "SessionCardActions"
```

## Related Files
- Initiative: `../initiative.md`
- F1: `../S1864.I4.F1-Feature-calcom-foundation/feature.md`
- F2: `../S1864.I4.F2-Feature-dashboard-widget/feature.md`
- Research: `../../research-library/context7-calcom.md` (embed script docs)
- Tasks: `./tasks.json` (created in next phase)
