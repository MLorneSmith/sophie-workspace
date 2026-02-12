# Feature: Cal.com API Client

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I4 |
| **Feature ID** | S2072.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description

Creates a server-side Cal.com V2 API client with Bearer token authentication. This foundational client enables fetching bookings and other Cal.com data from server components and server actions. Follows existing server-side API client patterns from the codebase.

## User Story
**As a** developer
**I want to** have a validated, typed Cal.com API client
**So that** I can safely fetch coaching session data from server-side code

## Acceptance Criteria

### Must Have
- [ ] Server-side API client in `apps/web/_lib/server/calcom-client.ts`
- [ ] Bearer token authentication with `cal_` prefix validation
- [ ] Required headers: `Authorization: Bearer cal_<key>`, `cal-api-version: 2024-08-13`
- [ ] Environment variable validation with Zod at module level
- [ ] Structured error handling with logger integration
- [ ] TypeScript types for API responses (booking structure)

### Nice to Have
- [ ] Response caching with React `cache()` wrapper
- [ ] Retry logic for transient failures

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A (infrastructure) |
| **Logic** | `calcom-client.ts` | New |
| **Data** | Cal.com V2 API | External |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Minimal
**Rationale**: Single-purpose API client following existing patterns. No abstraction layers needed.

### Key Architectural Choices
1. Use native `fetch` API (no SDK needed for simple GET requests)
2. Zod validation at module level for fail-fast on missing config
3. Logger integration for debugging production issues

### Trade-offs Accepted
- No response caching initially (can add later if needed)
- Manual type definitions (no OpenAPI codegen)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| `CALCOM_API_KEY` | Cal.com V2 API key with `cal_` prefix | Cal.com dashboard |
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Coach username for booking URLs | Cal.com profile |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Event type slug (e.g., "60min") | Cal.com event config |

**Note**: Environment variables already exist in `.env` but are currently unused.

## Dependencies

### Blocks
- S2072.I4.F2 (Fetch Bookings Query) - requires API client
- S2072.I4.F3 (Coaching Sessions Widget) - requires booking data

### Blocked By
- None (foundation feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `apps/web/_lib/server/calcom-client.ts` - Cal.com V2 API client
- `apps/web/_lib/server/calcom-types.ts` - TypeScript types for API responses

### Modified Files
- None (new infrastructure)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Define Types**: Create TypeScript interfaces for Cal.com booking responses
2. **Create Client**: Implement `createCalcomClient()` with Bearer token auth
3. **Add Validation**: Zod schema for environment variables
4. **Add Logging**: Integrate structured logging for errors
5. **Export Functions**: Export `fetchUpcomingBookings()` function

### Suggested Order
1. Define types (no dependencies)
2. Create client with validation
3. Add logging
4. Export public functions

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Verify environment variables exist
grep -E "CALCOM_|NEXT_PUBLIC_CALCOM_" apps/web/.env

# Manual API test (in server component or action)
# Check server logs for API response
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/perplexity-calcom-nextjs-integration-post-platform.md`
- Pattern: `packages/mailers/resend/src/index.ts` (server-side API client pattern)
