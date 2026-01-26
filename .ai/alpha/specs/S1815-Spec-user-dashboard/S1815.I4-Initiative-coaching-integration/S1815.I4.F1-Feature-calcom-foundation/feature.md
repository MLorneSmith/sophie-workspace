# Feature: Cal.com Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I4 |
| **Feature ID** | S1815.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 2 |
| **Priority** | 1 |

## Description
Configure Cal.com free embed integration with environment variables, TypeScript types for booking data, and embed utilities. This feature establishes the foundation for all Cal.com functionality in the dashboard using the free embed approach (iframe/popup) rather than the deprecated Platform API.

## User Story
**As a** developer
**I want to** have a properly configured Cal.com embed integration
**So that** I can build coaching features with type-safe booking data and consistent embed access

## Acceptance Criteria

### Must Have
- [ ] Environment variables documented and validated (`NEXT_PUBLIC_CAL_COACH_USERNAME`, `NEXT_PUBLIC_CAL_EVENT_SLUG`)
- [ ] TypeScript interfaces defined for Booking, Session, and Coach entities
- [ ] Cal.com embed utility functions created (generateBookingUrl, generateRescheduleUrl)
- [ ] Graceful error handling when Cal.com credentials are missing or invalid
- [ ] Unit tests for embed utilities and type utilities

### Nice to Have
- [ ] Feature flag to enable/disable Cal.com integration
- [ ] Debug logging for Cal.com embed events in development

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (embeds handled in F2) | N/A |
| **Logic** | Configuration validation utility | New |
| **Logic** | Embed URL generation utilities | New |
| **Data** | TypeScript types for Cal.com entities | New |
| **Database** | N/A (no database changes) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use Cal.com's free embed approach (iframe/popup) instead of the deprecated `@calcom/atoms` Platform package. This requires no paid subscription and works with any Cal.com account. Embed URLs are constructed from username and event slug.

### Key Architectural Choices
1. Create embed utilities in `packages/features/coaching/` for URL generation
2. Use environment variables with Zod validation at startup to fail fast on misconfiguration
3. Define TypeScript types for our domain needs (not dependent on Cal.com package types)
4. Use iframe embed for inline booking, popup for modal booking

### Trade-offs Accepted
- No real-time booking data sync (must rely on embed callbacks or polling)
- Less integrated UX compared to @calcom/atoms (but free and not deprecated)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Embed utilities | Custom functions | New | Generate Cal.com embed URLs |
| N/A | Cal.com free embed | External | Free iframe/popup embed (no package needed) |

**Components to Install**:
- None (free embed requires no npm packages)

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_CAL_COACH_USERNAME` | Username for the default coach profile | Cal.com account (from cal.com/your-username) |
| `NEXT_PUBLIC_CAL_EVENT_SLUG` | Event type slug for coaching sessions (e.g., "60min") | Cal.com event types |

> **Note**: Only 2 environment variables are required for the free embed approach. No OAuth client ID or API key needed.

## Dependencies

### Blocks
- F2: Dashboard Widget (requires types and embed utilities)
- F3: Session Actions (requires types and embed utilities)

### Blocked By
- None (this is the foundation feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `packages/features/coaching/src/types/booking.ts` - TypeScript types for Cal.com entities
- `packages/features/coaching/src/lib/cal-config.ts` - Configuration validation and utilities
- `packages/features/coaching/src/lib/cal-embed.ts` - Embed URL generation utilities
- `packages/features/coaching/src/index.ts` - Package exports
- `packages/features/coaching/package.json` - Package configuration
- `apps/web/.env.example` - Add Cal.com environment variable examples (append)

### Modified Files
- `apps/web/package.json` - Add @kit/coaching workspace dependency
- `turbo.json` - Add coaching package to pipeline (if needed)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create coaching package structure**: Set up packages/features/coaching with package.json and exports
2. **Define TypeScript types**: Create booking, session, and coach type definitions
3. **Add environment variable validation**: Zod schema for Cal.com config with helpful error messages
4. **Create embed URL utilities**: Functions to generate booking and reschedule URLs
5. **Write unit tests**: Test config validation and URL generation
6. **Document setup in env.example**: Add variable documentation

### Suggested Order
1. Package structure → 2. Types → 3. Config validation → 4. Embed utilities → 5. Tests → 6. Documentation

## Validation Commands
```bash
# Verify package installs correctly
pnpm install
pnpm typecheck

# Run coaching package tests
pnpm --filter @kit/coaching test

# Verify embed URLs generate correctly
# Example: https://cal.com/username/event-slug?embed=true

# Validate environment variables
pnpm --filter web build
# Should fail fast if NEXT_PUBLIC_CAL_* variables are missing
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/context7-calcom.md`
- Tasks: `./tasks.json` (created in next phase)
