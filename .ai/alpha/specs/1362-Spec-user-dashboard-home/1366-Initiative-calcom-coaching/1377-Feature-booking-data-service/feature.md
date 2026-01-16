# Feature: Cal.com Booking Data Service

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | #1366 |
| **Feature ID** | 1366-F1 |
| **Status** | Draft |
| **Estimated Days** | 3-4 |
| **Priority** | 1 |

## Description
Server-side integration with Cal.com API v2 to fetch upcoming coaching session bookings. This feature establishes the data foundation that other Cal.com features depend on, including API client, Zod schemas for type safety, and a page loader following existing codebase patterns.

## User Story
**As a** developer building coaching features
**I want to** have a reliable server-side Cal.com API integration
**So that** I can fetch and display booking data securely without exposing API keys to the client

## Acceptance Criteria

### Must Have
- [ ] Cal.com API client that fetches upcoming bookings with Bearer token auth
- [ ] Zod schema validating booking data structure (id, title, startTime, endTime, meetingUrl, status)
- [ ] Page loader function following `loadFeaturePageData()` pattern
- [ ] Environment variables documented in `.env.example`
- [ ] 15-minute cache configuration (`next: { revalidate: 900 }`)
- [ ] Graceful error handling returning empty array on API failure
- [ ] Logger integration for error tracking

### Nice to Have
- [ ] Configurable booking limit parameter
- [ ] Health check endpoint for Cal.com API status

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (infrastructure only) | N/A |
| **Logic** | `cal-api-client.ts`, `coaching-page.loader.ts` | New |
| **Data** | `booking.schema.ts` (Zod types) | New |
| **Database** | N/A (external API only) | N/A |

## Architecture Decision

**Approach**: Pragmatic Server-First
**Rationale**: Cal.com API is straightforward REST API. Using `fetch` with Next.js caching is simpler and more maintainable than adding SDK dependencies. Server-side only ensures API key security.

### Key Architectural Choices
1. Use `fetch` with `next: { revalidate: 900 }` for 15-minute caching
2. Return empty array on failure for graceful degradation (UI shows empty state)
3. Zod validation at API boundary for runtime type safety

### Trade-offs Accepted
- 15-minute cache means some stale data (acceptable for coaching bookings)
- No real-time updates (would require WebSocket/Supabase realtime, out of scope)

## Dependencies

### Blocks
- F2: Dashboard Coaching Card (requires booking data)
- F3: Coaching Page Sessions List (requires booking data)

### Blocked By
- None (foundation feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/coaching/_lib/server/cal-api-client.ts` - Cal.com API fetch wrapper
- `apps/web/app/home/(user)/coaching/_lib/schemas/booking.schema.ts` - Zod booking schema
- `apps/web/app/home/(user)/coaching/_lib/server/coaching-page.loader.ts` - Data loader function

### Modified Files
- `apps/web/.env.example` - Add CAL_COM_API_TOKEN and NEXT_PUBLIC_CAL_LINK documentation

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Booking Schema**: Define Zod schema for Cal.com booking data structure
2. **Create API Client**: Implement fetchUpcomingBookings() with auth and caching
3. **Create Page Loader**: Implement loadCoachingPageData() following project patterns
4. **Configure Environment**: Add environment variables to .env.example with documentation
5. **Add Error Logging**: Integrate pino logger for API error tracking

### Suggested Order
1. Booking Schema (defines types used everywhere)
2. API Client (implements fetch logic)
3. Page Loader (wraps client for page components)
4. Environment Config (document required secrets)
5. Error Logging (ensure visibility into failures)

## Validation Commands
```bash
# Verify TypeScript types
pnpm typecheck

# Manual API test (requires CAL_COM_API_TOKEN in env)
curl -H "Authorization: Bearer $CAL_COM_API_TOKEN" \
  -H "Cal-Api-Version: 2024-08-13" \
  https://api.cal.com/v2/bookings?status=upcoming&limit=2

# Unit test the API client
pnpm --filter web test -- cal-api-client

# Verify loader exports
grep -r "loadCoachingPageData" apps/web/app/home
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/calcom-embed-integration.md`
- Tasks: `./<task-#>-<slug>.md` (created in next phase)
