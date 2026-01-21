# Feature: Coaching Sessions Dashboard Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I4 |
| **Feature ID** | S1692.I4.F2 |
| **Status** | Draft |
| **Estimated Days** | 5 |
| **Priority** | 2 |

## Description
Build the Coaching Sessions widget for the main dashboard that displays upcoming coaching sessions using the Cal.com useBookings hook. Includes loading skeleton, empty state with booking CTA, session cards with time formatting, and error handling.

## User Story
**As a** user
**I want to** see my upcoming coaching sessions on the dashboard
**So that** I can quickly view when my next session is and prepare accordingly

## Acceptance Criteria

### Must Have
- [ ] Widget displays on main dashboard (/home)
- [ ] Shows loading skeleton while fetching data
- [ ] Displays up to 3 upcoming sessions with title, date, and time
- [ ] Shows empty state when no sessions booked
- [ ] Empty state includes "Book Session" CTA linking to /home/coaching
- [ ] Time displayed in relative format ("in 2 hours", "tomorrow at 3pm")
- [ ] Error state shows fallback with link to /home/coaching

### Nice to Have
- [ ] Shows coach name if available from booking data
- [ ] Animated skeleton loading

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CoachingSessionsWidget, SessionCard, EmptyState, Skeleton | New |
| **Logic** | useBookings hook integration, time formatting | New |
| **Data** | Cal.com API via useBookings({ status: ['upcoming'], take: 3 }) | New |
| **Database** | N/A (Cal.com is source of truth) | N/A |

## Architecture Decision

**Approach**: Pragmatic - Client-side data fetching with Cal.com Atoms hooks
**Rationale**: Cal.com Atoms provides useBookings hook that handles caching, loading states, and error handling internally. No need for server-side fetching since data is user-specific and Cal.com handles OAuth.

### Key Architectural Choices
1. Client component with 'use client' directive - required for hooks
2. useBookings hook from @calcom/atoms for data fetching
3. date-fns for relative time formatting (already installed)
4. Card-based UI matching existing dashboard patterns

### Trade-offs Accepted
- No server-side rendering for sessions (acceptable - personalized data)
- Relies on Cal.com API availability (fallback to /home/coaching if errors)

## Dependencies

### Blocks
- F3: Session Actions (needs widget and session cards for buttons)

### Blocked By
- F1: Cal.com Foundation (needs CalProvider for useBookings hook)

### Parallel With
- None (sequential with F1)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Main widget component
- `apps/web/app/home/(user)/_components/coaching-session-card.tsx` - Individual session card
- `apps/web/app/home/(user)/_components/coaching-empty-state.tsx` - Empty state component
- `apps/web/app/home/(user)/_components/coaching-widget-skeleton.tsx` - Loading skeleton

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add widget to dashboard PageBody

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create widget skeleton component**: Loading state matching widget layout
2. **Create empty state component**: Icon, message, and CTA button
3. **Create session card component**: Title, time, placeholder for actions
4. **Create main widget component**: Shell that orchestrates loading/empty/data states
5. **Integrate useBookings hook**: Fetch upcoming sessions from Cal.com
6. **Add time formatting**: Use date-fns for relative time display
7. **Add widget to dashboard page**: Import and render in PageBody
8. **Add error handling**: Fallback UI when Cal.com API fails

### Suggested Order
1. Skeleton → 2. Empty state → 3. Session card → 4. Main widget → 5. useBookings → 6. Time formatting → 7. Dashboard integration → 8. Error handling

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Start dev server
pnpm dev

# Manual verification:
# 1. Visit /home - widget should appear
# 2. Without Cal.com credentials - shows empty state
# 3. With credentials but no bookings - shows empty state with CTA
# 4. With bookings - shows session cards with formatted times
# 5. If API error - shows fallback with link to /home/coaching
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/context7-calcom.md`
- Research: `../../research-library/perplexity-dashboard-ux.md`
- Tasks: `./tasks.json` (created in next phase)
