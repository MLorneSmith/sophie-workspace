# Feature: Coaching Sessions Widget

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I5 |
| **Feature ID** | S1918.I5.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description
Create a dashboard widget that displays upcoming coaching sessions with session details (date/time, coach name, join link) and a "Book a Session" CTA. The widget handles loading, empty, and populated states with graceful error fallback.

## User Story
**As a** SlideHeroes user visiting my dashboard
**I want to** see my upcoming coaching sessions at a glance
**So that** I can join sessions easily and know when my next session is scheduled

## Acceptance Criteria

### Must Have
- [ ] Widget component at `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx`
- [ ] Display next 1-2 upcoming sessions with date, time, coach name
- [ ] "Join" button linking to session join URL
- [ ] "Reschedule" link to Cal.com reschedule page
- [ ] "Book a Session" CTA when no sessions scheduled
- [ ] Loading skeleton state while fetching data
- [ ] Error state with fallback message and "Check booking page" link
- [ ] Responsive design (stacks gracefully on mobile)
- [ ] Dark mode support via CSS variables

### Nice to Have
- [ ] Animation on session card hover
- [ ] Countdown timer for sessions within 24 hours

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | `coaching-sessions-widget.tsx` - Dashboard widget | New |
| **Logic** | Uses `fetchUpcomingBookings()` from F1 | Existing (from F1) |
| **Data** | `CoachingSession` type from F1 schemas | Existing (from F1) |
| **Database** | N/A (external API only) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Server Component with async data fetching. Widget is self-contained, uses Card component from UI library, and follows existing dashboard widget patterns.

### Key Architectural Choices
1. Server Component for initial data fetch (no client-side React Query needed)
2. Reuse Card, Badge, Button, Skeleton from `@kit/ui`
3. Use existing Cal.com iframe embed URL pattern for booking link
4. Follow grid slot convention from dashboard layout (col-span-1 on md+)

### Trade-offs Accepted
- No real-time session updates (acceptable - refresh on page load)
- Links to Cal.com for reschedule rather than in-app modal (per scope)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget container | Card | @kit/ui/card | Consistent with other dashboard widgets |
| Session time | Badge | @kit/ui/badge | Visual distinction for time |
| Actions | Button | @kit/ui/button | Primary/secondary action buttons |
| Loading state | Skeleton | @kit/ui/skeleton | Consistent loading pattern |
| Empty state | Custom | Inline | Simple centered text with CTA |

**Components Already Available** (no installation needed):
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Badge
- Button
- Skeleton

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Cal.com username for booking page URL | Cal.com profile |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Event type slug (e.g., `60min`) | Cal.com event types |

> Note: These are public variables for constructing the booking page URL. API key from F1 is used for data fetching.

## Dependencies

### Blocks
- S1918.I6: Polish (needs base widget for accessibility/UX refinements)

### Blocked By
- F1: Cal.com API Client (needs data source)
- S1918.I1.F1: Dashboard Page & Grid Layout (needs grid slot to render in)

### Parallel With
- S1918.I3: Progress Widgets (independent widget)
- S1918.I4: Activity & Task Widgets (independent widget)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Main widget component
- `apps/web/app/home/(user)/_components/session-card.tsx` - Individual session card (optional - may inline)

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Import and render widget in grid slot
- `apps/web/.env.local.example` - Add NEXT_PUBLIC_CALCOM_* variables

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create widget component**: Build `coaching-sessions-widget.tsx` with Card layout
2. **Implement loading state**: Skeleton matching final layout dimensions
3. **Implement empty state**: "No sessions scheduled" with "Book a Session" button
4. **Implement populated state**: Display 1-2 sessions with Join/Reschedule actions
5. **Implement error state**: Graceful fallback with "Check booking page" link
6. **Add environment variables**: Document NEXT_PUBLIC_CALCOM_* in .env.local.example
7. **Integrate with dashboard**: Add widget to dashboard page grid

### Suggested Order
1. Widget structure (empty Card shell)
2. Loading state skeleton
3. Empty state with CTA
4. Environment variables
5. Populated state with session cards
6. Error handling
7. Dashboard integration

## Validation Commands
```bash
# Verify widget exists
test -f apps/web/app/home/\(user\)/_components/coaching-sessions-widget.tsx && echo "Pass: Widget exists"

# Verify widget imported in dashboard
grep -q "coaching-sessions-widget" apps/web/app/home/\(user\)/page.tsx && echo "Pass: Widget imported"

# Verify env vars documented
grep -q "NEXT_PUBLIC_CALCOM_COACH_USERNAME" apps/web/.env.local.example && echo "Pass: Coach username documented"
grep -q "NEXT_PUBLIC_CALCOM_EVENT_SLUG" apps/web/.env.local.example && echo "Pass: Event slug documented"

# Type check
pnpm typecheck

# Visual verification
# Start dev server and verify widget renders in dashboard grid
```

## Related Files
- Initiative: `../initiative.md`
- API Client: `../S1918.I5.F1-Feature-calcom-api-client/feature.md`
- Research: `../../research-library/perplexity-dashboard-ux.md` (empty state patterns)
- Existing calendar component: `apps/web/app/home/(user)/coaching/_components/calendar.tsx`
