# Feature: Cal.com Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I4 |
| **Feature ID** | S1864.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 3-4 |
| **Priority** | 1 |

## Description
Set up Cal.com V2 API client infrastructure including TypeScript types for booking data, environment variable configuration with Zod validation, and webhook signature verification service. This foundation enables all other coaching integration features.

## User Story
**As a** developer
**I want to** have a well-typed, tested Cal.com API client
**So that** I can build coaching features with confidence and type safety

## Acceptance Criteria

### Must Have
- [ ] TypeScript types defined for Cal.com booking and webhook responses
- [ ] CalComApiService with `getUpcomingBookings()` method that fetches from V2 API
- [ ] Environment variables validated with Zod schema on startup
- [ ] Webhook signature verification service using HMAC-SHA256
- [ ] Error handling with graceful degradation (return empty array on API failure)
- [ ] Structured logging following existing `@kit/shared/logger` patterns

### Nice to Have
- [ ] Rate limiting awareness (detect and log 429 responses)
- [ ] Request/response caching for development

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | CalComApiService, CalComWebhookVerifier | New |
| **Data** | TypeScript types, Zod schemas | New |
| **Database** | N/A (external API) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use server-only API client following existing service factory pattern (`createCalComApiService()`). No OAuth complexity - use simple Bearer token auth with platform API key.

### Key Architectural Choices
1. **Server-only API calls**: API key must remain secret; all Cal.com API calls through server actions/loaders
2. **Factory pattern**: `createCalComApiService()` returns singleton-like service instance
3. **Graceful degradation**: Return empty array on API errors rather than throwing

### Trade-offs Accepted
- No client-side API access (acceptable - widgets use server-rendered data)
- No real-time updates without webhooks (acceptable for v1)

## Required Credentials
> Environment variables required for this feature to function. Matched to existing .env configuration.

| Variable | Description | Source |
|----------|-------------|--------|
| `CALCOM_API_KEY` | Cal.com V2 API key for server-side requests (Bearer auth) | Cal.com Settings > Security > API Keys |
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Cal.com username for embed URLs | Cal.com Account Settings |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Event type slug (e.g., "60min") | Cal.com Event Types |

**Note**: `CAL_WEBHOOK_SECRET` is optional - only needed if implementing webhook handler for activity feed integration.

## Dependencies

### Blocks
- F2: Dashboard Widget (needs types and API client)
- F3: Session Actions (needs types)
- F4: Booking Modal (needs environment config)

### Blocked By
- None (root feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/coaching/_lib/types/calcom.types.ts` - TypeScript interfaces
- `apps/web/app/home/(user)/coaching/_lib/schemas/calcom-env.schema.ts` - Zod validation schema
- `apps/web/app/home/(user)/coaching/_lib/server/calcom-api.service.ts` - API client service
- `apps/web/app/home/(user)/coaching/_lib/server/calcom-webhook-verifier.service.ts` - Webhook verifier

### Modified Files
- `apps/web/.env.example` - Add Cal.com environment variables with documentation

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create TypeScript types**: Define `CalComBooking`, `CalComAttendee`, `CalComWebhookEvent` interfaces
2. **Create environment schema**: Zod schema validating all Cal.com env vars
3. **Implement API client**: `CalComApiService` with `getUpcomingBookings()` method
4. **Implement webhook verifier**: HMAC-SHA256 signature verification service
5. **Add environment variables**: Update `.env.example` with all required vars
6. **Write unit tests**: Test API client error handling and webhook verification

### Suggested Order
1. Types → 2. Environment schema → 3. API client → 4. Webhook verifier → 5. Env vars → 6. Tests

## Validation Commands
```bash
# Verify environment variables are set
grep -q "CAL_API_KEY" apps/web/.env.local && echo "Cal.com env vars present"

# Run unit tests for Cal.com services
pnpm --filter web test:unit -- --grep "calcom"

# TypeScript type check
pnpm --filter web typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/context7-calcom.md`
- Tasks: `./tasks.json` (created in next phase)
