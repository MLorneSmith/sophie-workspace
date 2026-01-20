# Feature: Upcoming Sessions Display

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1607.I5 |
| **Feature ID** | S1607.I5.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Fetch and display upcoming coaching sessions from Cal.com API. Show the next 1-2 sessions with date, time, duration, join link, and reschedule option. Includes server-side data fetching, caching for performance, and graceful error handling when Cal.com is unavailable.

## User Story
**As a** SlideHeroes user
**I want to** see my upcoming coaching sessions on my dashboard
**So that** I can quickly access meeting details and never miss a session

## Acceptance Criteria

### Must Have
- [ ] Display next 1-2 upcoming sessions from Cal.com
- [ ] Each session shows: date, time, duration, title
- [ ] "Join" button links to meeting URL (Zoom/Meet/etc.)
- [ ] "Reschedule" button links to Cal.com reschedule page
- [ ] Loading skeleton while fetching data
- [ ] Graceful fallback UI if Cal.com API is unavailable
- [ ] Data cached per-request to avoid redundant API calls

### Nice to Have
- [ ] Relative time display ("Tomorrow at 2pm", "In 3 days")
- [ ] Session time shown in user's timezone
- [ ] "Add to Calendar" button with webcal/ics link

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CoachingSessionItem component | New |
| **UI** | SessionActionButtons component | New |
| **Logic** | Cal.com service (fetch bookings) | New |
| **Logic** | Session data transformation | New |
| **Data** | Coaching sessions loader | New |
| **Database** | N/A (external API) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use server-side data fetching with Cal.com API v2. Service layer pattern for API calls (following existing patterns from Stripe/PDF.co integrations). React `cache()` for per-request memoization. Fallback to empty state with error message on API failure.

### Key Architectural Choices
1. Server-side Cal.com API calls in loader (never expose API key to client)
2. Service pattern: `apps/web/lib/calcom/calcom.service.ts` for API calls
3. Cache booking list for per-request deduplication using React `cache()`
4. Transform Cal.com response to simplified session type for UI
5. Error boundary with fallback UI showing "Book a Session" CTA

### Trade-offs Accepted
- No real-time updates (polling/webhooks out of scope for this feature)
- Limited to 2 sessions to keep widget compact
- No session history/past sessions (out of scope per initiative)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Session item card | div with Tailwind | Custom | Simple layout, no need for Card overhead |
| Date/time display | formatted string | date-fns | Relative time formatting |
| Join button | Button | @kit/ui/button | `variant="default"` primary action |
| Reschedule button | Button | @kit/ui/button | `variant="outline"` secondary |
| Avatar/icon | Avatar or Calendar icon | @kit/ui/avatar | Visual session indicator |
| Badge | Badge | @kit/ui/badge | Session status if needed |

**Components to Install**: None - all required components exist

## Dependencies

### Blocks
- None (final feature in initiative)

### Blocked By
- F1: Coaching Widget Foundation (provides card container and types)
- F2: Session Booking CTA (establishes Cal.com config patterns)

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/web/lib/calcom/calcom.service.ts` - Cal.com API service (fetch bookings)
- `apps/web/app/home/(user)/_components/coaching-session-item.tsx` - Single session display
- `apps/web/app/home/(user)/_components/session-action-buttons.tsx` - Join/Reschedule buttons
- `apps/web/app/home/(user)/_lib/server/coaching.loader.ts` - Coaching data loader

### Modified Files
- `apps/web/app/home/(user)/_components/coaching-sessions-card.tsx` - Render session list
- `apps/web/app/home/(user)/_lib/server/dashboard.loader.ts` - Include coaching data
- `apps/web/app/home/(user)/page.tsx` - Pass coaching data to card
- `apps/web/.env.example` - Add CALCOM_API_KEY variable
- `apps/web/.env.development` - Add Cal.com API key (test mode)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Cal.com service**: API service following existing patterns (Stripe, PDF.co)
2. **Add environment config**: CALCOM_API_KEY and version config
3. **Create coaching loader**: Server-side loader with caching
4. **Build CoachingSessionItem**: Session display component
5. **Build SessionActionButtons**: Join and Reschedule buttons
6. **Update CoachingSessionsCard**: Integrate session list rendering
7. **Add error handling**: Fallback UI for API failures
8. **Update dashboard loader**: Include coaching data in parallel fetch
9. **Write tests**: Unit tests for service, integration tests for UI

### Suggested Order
1. Env config → 2. Cal.com service → 3. Loader → 4. SessionItem → 5. ActionButtons → 6. Update Card → 7. Error handling → 8. Dashboard integration → 9. Tests

## Validation Commands
```bash
# TypeScript validation
pnpm --filter web typecheck

# Test Cal.com API connection
# Manual: Check server logs for successful Cal.com API call

# Verify sessions display
# Manual: With booked sessions, verify they appear on dashboard

# Verify Join button
# Manual: Click "Join", verify meeting URL opens

# Verify Reschedule button
# Manual: Click "Reschedule", verify Cal.com reschedule page opens

# Verify error fallback
# Manual: Invalid API key, verify fallback UI shows

# Run unit tests
pnpm --filter web test:unit -- --grep "calcom"
```

## Related Files
- Initiative: `../initiative.md`
- Cal.com API Research: `.ai/alpha/specs/S1606-Spec-user-dashboard/research-library/context7-calcom-api.md`
- Service pattern example: `apps/web/lib/certificates/certificate-service.ts`
- Stripe integration: `packages/billing/stripe/src/services/stripe-billing-strategy.service.ts`
- F1 Types: `../S1607.I5.F1-Feature-coaching-widget-foundation/feature.md`
