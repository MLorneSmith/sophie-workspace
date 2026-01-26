# Feature: Cal.com Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I4 |
| **Feature ID** | S1823.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Install the `@calcom/embed-react` package, configure environment variables for Cal.com API access, and create TypeScript type definitions for booking data. This feature establishes the foundation for all Cal.com integration without any UI changes, enabling both the booking loader and widget components.

## User Story
**As a** developer implementing the coaching dashboard widget
**I want to** have Cal.com SDK installed with proper types and configuration
**So that** I can build the bookings loader and widget components with type safety and proper API access

## Acceptance Criteria

### Must Have
- [ ] `@calcom/embed-react` package installed in web app
- [ ] Environment variable `CALCOM_API_KEY` documented in `.env.example`
- [ ] Environment variable `NEXT_PUBLIC_CALCOM_COACH_USERNAME` documented
- [ ] Environment variable `NEXT_PUBLIC_CALCOM_EVENT_SLUG` documented
- [ ] TypeScript interface `CalBooking` defined with all booking properties
- [ ] TypeScript interface `CalBookingAttendee` defined
- [ ] Type exports available from shared location for other features

### Nice to Have
- [ ] JSDoc comments on all type definitions
- [ ] Type for Cal.com API error responses

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | Type definitions | New |
| **Data** | Environment configuration | New |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Standard package installation with minimal type definitions. No over-engineering - define only the types needed for the upcoming features.

### Key Architectural Choices
1. Types defined in `_lib/types.ts` co-located with coaching feature for simplicity
2. Environment variables follow existing pattern with `.env.example` documentation

### Trade-offs Accepted
- Types are feature-local rather than in shared package (simplicity over reuse)

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| `CALCOM_API_KEY` | Cal.com V2 API key for server-side booking fetches | Cal.com Dashboard → Settings → Developer → API Keys |
| `NEXT_PUBLIC_CALCOM_COACH_USERNAME` | Coach's Cal.com username for embed links | Cal.com Dashboard → Profile |
| `NEXT_PUBLIC_CALCOM_EVENT_SLUG` | Event type slug for booking links (e.g., "30min-coaching") | Cal.com Dashboard → Event Types |

## Dependencies

### Blocks
- F2: Coaching Widget (needs types and env config)
- F3: Booking Modal (needs embed package and env config)

### Blocked By
- S1823.I1.F1: Dashboard TypeScript Types (needs base dashboard types to extend)

### Parallel With
- None (foundation must complete first)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/types/calcom.types.ts` - Cal.com type definitions

### Modified Files
- `apps/web/.env.example` - Add Cal.com environment variables with comments
- `apps/web/package.json` - Add `@calcom/embed-react` dependency

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Install embed package**: Add `@calcom/embed-react` via pnpm
2. **Create type definitions**: Define `CalBooking` and related interfaces
3. **Document env vars**: Add Cal.com variables to `.env.example` with descriptions
4. **Verify package resolution**: Ensure package installs correctly and types resolve

### Suggested Order
1. Install package (unblocks type imports)
2. Create types (core foundation)
3. Document env vars (enables configuration)
4. Verify resolution (validation)

## Validation Commands
```bash
# Verify package installed
grep -q "@calcom/embed-react" apps/web/package.json

# Verify types compile
pnpm --filter web typecheck

# Verify env vars documented
grep -q "CALCOM_API_KEY" apps/web/.env.example
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/context7-calcom.md`
- Tasks: `./tasks.json` (created in next phase)
