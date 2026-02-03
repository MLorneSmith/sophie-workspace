# Feature: Cal.com API Client

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I5 |
| **Feature ID** | S1918.I5.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Create a server-side Cal.com V2 API client to fetch upcoming coaching session bookings. The client uses Bearer token authentication with the API key and fetches bookings for display on the user dashboard widget.

## User Story
**As a** SlideHeroes user with booked coaching sessions
**I want to** see my upcoming sessions on my dashboard
**So that** I can quickly access session details and join links without navigating away

## Acceptance Criteria

### Must Have
- [ ] Server-side API client module at `apps/web/app/home/(user)/_lib/server/calcom-api.ts`
- [ ] Fetch upcoming bookings using Cal.com V2 API with Bearer token auth
- [ ] Filter bookings by status (accepted/pending) and future dates
- [ ] Return typed `CoachingSession` objects with date, time, coach name, and join link
- [ ] Handle API errors gracefully with fallback messaging
- [ ] Environment variable `CALCOM_API_KEY` documented in `.env.local.example`

### Nice to Have
- [ ] Caching layer with 5-minute TTL to reduce API calls
- [ ] Rate limiting protection

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (this feature is data layer only) | N/A |
| **Logic** | `calcom-api.ts` - API client module | New |
| **Data** | `coaching.schema.ts` - Zod types | New |
| **Database** | N/A (external API only) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Simple server-side fetch with Zod validation. No need for complex caching initially - can add in I6 Polish if needed.

### Key Architectural Choices
1. Server-side only using `import 'server-only'` to prevent client bundle inclusion
2. Direct fetch to Cal.com V2 API (not using @calcom/atoms which requires deprecated Platform OAuth)
3. Zod schema for type-safe API response parsing

### Trade-offs Accepted
- No real-time updates (acceptable per scope - refresh on page load)
- No caching in v1 (can add 5-min TTL in polish phase if API calls become problematic)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| `CALCOM_API_KEY` | Cal.com V2 API key (prefixed with `cal_`) | Cal.com Dashboard > Settings > API Keys |

> **Note**: API key authenticates as the account owner (coach perspective). Returns bookings where the key owner is the host.

## Dependencies

### Blocks
- F2: Coaching Sessions Widget (needs API client for data)

### Blocked By
- S1918.I1.F1: Dashboard Page & Grid (needs dashboard structure to exist, but API client itself is standalone)

### Parallel With
- None (foundational feature)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/server/calcom-api.ts` - Cal.com V2 API client
- `apps/web/app/home/(user)/_lib/schema/coaching.schema.ts` - Zod schemas for bookings

### Modified Files
- `apps/web/.env.local.example` - Add CALCOM_API_KEY documentation

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Zod schemas**: Define `CalcomBookingSchema`, `CoachingSessionSchema` for type-safe API response parsing
2. **Create API client**: Implement `fetchUpcomingBookings()` function with Bearer token auth
3. **Add environment variable**: Document `CALCOM_API_KEY` in `.env.local.example`
4. **Add error handling**: Wrap API calls in try/catch with typed error responses

### Suggested Order
1. Zod schemas (types first)
2. Environment variable documentation
3. API client implementation
4. Error handling refinement

## Validation Commands
```bash
# Verify API client exists
test -f apps/web/app/home/\(user\)/_lib/server/calcom-api.ts && echo "Pass: Cal.com client exists"

# Verify schemas exist
test -f apps/web/app/home/\(user\)/_lib/schema/coaching.schema.ts && echo "Pass: Coaching schemas exist"

# Verify env var documented
grep -q "CALCOM_API_KEY" apps/web/.env.local.example && echo "Pass: Env var documented"

# Type check
pnpm typecheck

# Verify server-only import
grep -q "import 'server-only'" apps/web/app/home/\(user\)/_lib/server/calcom-api.ts && echo "Pass: server-only directive"
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/perplexity-calcom-nextjs-integration-post-platform.md`
- Existing calendar: `apps/web/app/home/(user)/coaching/_components/calendar.tsx`
