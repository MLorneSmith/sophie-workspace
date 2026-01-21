# Feature: Session Actions & Interactions

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I4 |
| **Feature ID** | S1692.I4.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Implement interactive actions on the coaching widget: "Join Session" button that opens the meeting URL, time-based visibility logic (show join button 15 minutes before session), "Reschedule" navigation to the full coaching calendar, and "Book Session" CTA functionality in the empty state.

## User Story
**As a** user
**I want to** join, reschedule, or book coaching sessions directly from the dashboard
**So that** I can manage my coaching schedule without navigating to multiple pages

## Acceptance Criteria

### Must Have
- [ ] "Join Session" button opens meetingUrl in new tab
- [ ] Join button only visible within 15 minutes of session start time
- [ ] "Reschedule" button navigates to /home/coaching
- [ ] "Book Session" CTA in empty state navigates to /home/coaching
- [ ] Buttons have appropriate loading/disabled states

### Nice to Have
- [ ] Reschedule pre-selects the booking in the calendar (via URL param)
- [ ] Confirmation toast when join button clicked
- [ ] Countdown timer when session is starting soon

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Action buttons in SessionCard, CTA in EmptyState | Modify |
| **Logic** | Time comparison for join visibility, navigation | New |
| **Data** | meetingUrl from booking data | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Simple button handlers with time-based visibility
**Rationale**: Actions are straightforward navigation and external link opening. No need for complex state management. Time comparison uses standard JavaScript Date APIs.

### Key Architectural Choices
1. "Join Session" opens meetingUrl in new tab using window.open()
2. Time comparison in component (re-renders handle visibility changes)
3. Navigation via Next.js Link or router.push()
4. Buttons use existing @kit/ui/button component

### Trade-offs Accepted
- Join button visibility relies on client-side time (acceptable - Cal.com handles actual access)
- No real-time countdown (would require interval, adds complexity)

## Dependencies

### Blocks
- None (final feature in initiative)

### Blocked By
- F2: Dashboard Widget (needs session cards to add buttons to)

### Parallel With
- None (sequential with F2)

## Files to Create/Modify

### New Files
- None (modifications only)

### Modified Files
- `apps/web/app/home/(user)/_components/coaching-session-card.tsx` - Add Join and Reschedule buttons with logic
- `apps/web/app/home/(user)/_components/coaching-empty-state.tsx` - Ensure Book Session CTA navigates correctly

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Add Join Session button**: Button that opens meetingUrl in new tab
2. **Implement time-based visibility**: Show join button only 15 min before session
3. **Add Reschedule button**: Navigate to /home/coaching
4. **Wire up Book Session CTA**: Ensure empty state CTA works
5. **Add button states**: Loading, disabled states for better UX
6. **Test all user flows**: Verify each action works correctly

### Suggested Order
1. Join button → 2. Time visibility → 3. Reschedule button → 4. Book CTA → 5. Button states → 6. Testing

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint and format
pnpm lint:fix
pnpm format:fix

# Manual verification:
# 1. With upcoming session >15 min away - Join button hidden
# 2. With session <15 min away - Join button visible
# 3. Click Join - opens meeting URL in new tab
# 4. Click Reschedule - navigates to /home/coaching
# 5. Empty state - Click "Book Session" - navigates to /home/coaching
```

## Related Files
- Initiative: `../initiative.md`
- F2 Feature: `../S1692.I4.F2-Feature-dashboard-widget/feature.md`
- Tasks: `./tasks.json` (created in next phase)
