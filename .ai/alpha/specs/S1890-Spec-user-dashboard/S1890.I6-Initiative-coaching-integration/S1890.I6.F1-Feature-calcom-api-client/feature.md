# Feature: Cal.com API Client

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I6 |
| **Feature ID** | S1890.I6.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Create a server-side API client wrapper for Cal.com V2 API with Bearer token authentication, error handling, caching, and TypeScript types. This provides the foundation for fetching upcoming coaching sessions and handling API failures gracefully.

## User Story
**As a** developer
**I want to** have a reliable Cal.com API client
**So that** I can fetch booking data securely with proper error handling and caching

## Acceptance Criteria

### Must Have
- [ ] Server-side API client using `fetch` with proper headers
- [ ] Bearer token authentication with `cal_`-prefixed API key
- [ ] V2 API version header (`cal-api-version: 2024-08-13`)
- [ ] TypeScript types for booking responses
- [ ] 5-minute cache using Next.js fetch caching
- [ ] Error handling with graceful degradation

### Nice to Have
- [ ] Retry logic for transient failures

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | `calcom-api.ts` - API client wrapper | New |
| **Data** | TypeScript types for bookings | New |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Single-purpose API client with built-in caching. No need for complex abstractions - this is a focused integration with one external service.

### Key Architectural Choices
1. Use Next.js `fetch` with `next: { revalidate: 300 }` for 5-minute caching instead of manual cache management
2. Return `null` on API errors to enable graceful degradation in widget (fallback to booking CTA)

### Trade-offs Accepted
- No retry logic in v1 - rely on caching to reduce API calls
- No real-time updates - cache invalidation happens on 5-minute intervals

## Required Credentials
> Environment variables required for this feature to function.

| Variable | Description | Source |
|----------|-------------|--------|
| `CALCOM_API_KEY` | V2 API key prefixed with `cal_` | Cal.com Dashboard → API Keys |
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Coach username for booking links | Cal.com account |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Event type slug (e.g., "60min") | Cal.com event settings |

> **Validation Status**: All credentials exist in `.env` - no new variables needed.

## Dependencies

### Blocks
- F2: Coaching Sessions Widget (needs API client to fetch bookings)
- F3: Booking Embed Fallback (needs to know when no sessions exist)

### Blocked By
- S1890.I1.F1: Dashboard Page & Grid (provides page structure)
- S1890.I2.F1: Dashboard Types (may provide context types)

### Parallel With
- None (foundation for other features in this initiative)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/calcom-api.ts` - API client wrapper
- `apps/web/app/home/(user)/_lib/server/calcom-types.ts` - TypeScript types

### Modified Files
- None

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create CalcomBooking TypeScript types**: Define interfaces for booking response from V2 API
2. **Implement fetchUpcomingBookings function**: Server-side API call with auth and caching
3. **Add error handling and graceful degradation**: Return null on failures, log errors
4. **Write unit tests**: Test API client with mocked responses

### Suggested Order
T1: Types → T2: API client → T3: Error handling → T4: Tests

## Validation Commands
```bash
# Verify API client exists
test -f apps/web/app/home/\(user\)/_lib/server/calcom-api.ts && echo "✓ API client exists"

# Check for server-only directive
grep -q "import 'server-only'" apps/web/app/home/\(user\)/_lib/server/calcom-api.ts && echo "✓ Server-only"

# Check for V2 API headers
grep -q "cal-api-version" apps/web/app/home/\(user\)/_lib/server/calcom-api.ts && echo "✓ V2 headers"

# Run typecheck
pnpm typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/perplexity-calcom-nextjs-integration-post-platform.md`
- Existing pattern: `apps/web/app/home/(user)/billing/_lib/server/personal-account-billing-page.loader.ts`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)

## Cal.com V2 API Reference
| Endpoint | Purpose |
|----------|---------|
| GET /v2/bookings?status=accepted | Fetch confirmed upcoming sessions |
| GET /v2/bookings?status=pending | Fetch pending sessions |

| Header | Value |
|--------|-------|
| Authorization | Bearer cal_<api_key> |
| cal-api-version | 2024-08-13 |
