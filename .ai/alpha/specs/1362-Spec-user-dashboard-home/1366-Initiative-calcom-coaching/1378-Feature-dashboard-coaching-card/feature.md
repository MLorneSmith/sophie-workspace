# Feature: Dashboard Coaching Card

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1366 |
| **Feature ID** | 1366-F2 |
| **Status** | Draft |
| **Estimated Days** | 4-5 |
| **Priority** | 2 |

## Description
A dashboard card component that displays the user's next 1-2 upcoming coaching sessions with session details, join/reschedule actions, and a booking modal for scheduling new sessions. This is the primary user-facing feature that brings Cal.com integration to the main dashboard.

## User Story
**As a** SlideHeroes user with coaching access
**I want to** see my upcoming coaching sessions on my dashboard and easily book new ones
**So that** I can manage my coaching schedule without leaving the platform

## Acceptance Criteria

### Must Have
- [ ] Card displays "Next Coaching Sessions" header on user dashboard
- [ ] Shows up to 2 upcoming sessions with date, time, and title
- [ ] "Join Session" button appears when session is within 10 minutes of start time
- [ ] "Reschedule" link for each session opens Cal.com reschedule flow
- [ ] "Book Session" button opens modal with Cal.com embed
- [ ] Empty state shows when no upcoming sessions with CTA to book
- [ ] Card integrates with dashboard grid layout (uses @kit/ui/card)
- [ ] Responsive design for mobile and desktop

### Nice to Have
- [ ] Session status badge (confirmed, pending)
- [ ] Duration display for each session
- [ ] "View All Sessions" link to full coaching page

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `coaching-sessions-card.tsx`, `session-list-item.tsx`, `book-session-modal.tsx` | New |
| **Logic** | Date formatting, session time comparison for "Join" button visibility | New |
| **Data** | Uses `loadCoachingPageData()` from F1 | Existing (F1) |
| **Database** | N/A (data from Cal.com API) | N/A |

## Architecture Decision

**Approach**: Pragmatic Component Composition
**Rationale**: Split into Server Component (card wrapper) and Client Components (interactive elements). Uses simple iframe embed for booking modal instead of Cal.com SDK to minimize dependencies.

### Key Architectural Choices
1. Card wrapper is Server Component (zero JS sent to client for static content)
2. Session list items are Client Components for interactivity (Join button, time checks)
3. Booking modal uses Dialog from @kit/ui with iframe embed
4. Date formatting with date-fns (already in project dependencies)

### Trade-offs Accepted
- Iframe modal has less native feel than Cal.com React SDK (acceptable for MVP)
- Session time check runs client-side (slight delay on button visibility)

## Dependencies

### Blocks
- None (end-user feature)

### Blocked By
- F1: Cal.com Booking Data Service (provides booking data)

### Parallel With
- F3: Coaching Page Sessions List (independent once F1 complete)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/coaching-sessions-card.tsx` - Server Component card wrapper
- `apps/web/app/home/(user)/_components/session-list-item.tsx` - Client Component for each session
- `apps/web/app/home/(user)/_components/book-session-modal.tsx` - Client Component modal with iframe

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add CoachingSessionsCard to dashboard grid
- `apps/web/app/home/(user)/coaching/_lib/server/coaching-page.loader.ts` - Ensure exports are accessible

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Session List Item Component**: Client component with date display, Join/Reschedule actions
2. **Create Book Session Modal**: Dialog component with Cal.com iframe embed
3. **Create Coaching Sessions Card**: Server component combining list items and modal trigger
4. **Integrate Card with Dashboard**: Add card to user dashboard page, fetch data via loader
5. **Implement Empty State**: Design and implement "No sessions" state with booking CTA
6. **Add Time-Based Join Button**: Logic to show Join button within 10 min of session start

### Suggested Order
1. Session List Item (core display unit)
2. Book Session Modal (booking capability)
3. Empty State (handles zero sessions case)
4. Coaching Sessions Card (combines components)
5. Dashboard Integration (makes it visible to users)
6. Join Button Logic (polish feature)

## Validation Commands
```bash
# Verify TypeScript types
pnpm typecheck

# Check component renders (start dev server)
pnpm dev
# Navigate to http://localhost:3000/home and verify card appears

# Visual regression test
pnpm --filter web-e2e test -- coaching-card

# Test empty state (with no Cal.com bookings)
# Verify "Book Session" button opens modal

# Test modal functionality
# Click "Book Session" -> modal opens -> iframe loads Cal.com
```

## Related Files
- Initiative: `../initiative.md`
- Depends on: `../pending-Feature-booking-data-service/feature.md`
- Research: `../../research-library/calcom-embed-integration.md`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
