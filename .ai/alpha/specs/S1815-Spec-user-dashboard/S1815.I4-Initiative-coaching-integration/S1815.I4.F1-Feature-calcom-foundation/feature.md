# Feature: Cal.com Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I4 |
| **Feature ID** | S1815.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Install and configure the `@calcom/atoms` React package with CalProvider setup, environment variables for API authentication, and TypeScript types for booking data. This feature establishes the foundation for all Cal.com functionality in the dashboard.

## User Story
**As a** developer
**I want to** have a properly configured Cal.com integration
**So that** I can build coaching features with type-safe booking data and consistent API access

## Acceptance Criteria

### Must Have
- [ ] `@calcom/atoms` package installed and configured in `apps/web`
- [ ] CalProvider wrapper component created with proper client ID configuration
- [ ] Environment variables documented and validated (`CAL_OAUTH_CLIENT_ID`, `CAL_API_KEY`)
- [ ] TypeScript interfaces defined for Booking, Session, and Coach entities
- [ ] Graceful error handling when Cal.com credentials are missing or invalid
- [ ] Unit tests for provider setup and type utilities

### Nice to Have
- [ ] Feature flag to enable/disable Cal.com integration
- [ ] Debug logging for Cal.com API responses in development

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | CalProvider wrapper component | New |
| **Logic** | Configuration validation utility | New |
| **Data** | TypeScript types for Cal.com entities | New |
| **Database** | N/A (no database changes) | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use `@calcom/atoms` package as recommended by Cal.com documentation. The package provides native React components with built-in hooks (`useBookings`, `useCancelBooking`) that integrate well with Next.js. Create a thin wrapper for configuration to avoid coupling components directly to environment variables.

### Key Architectural Choices
1. Create `CalProvider` wrapper in `packages/features/coaching/` for reuse across the application
2. Use environment variables with Zod validation at startup to fail fast on misconfiguration
3. Define TypeScript types that extend Cal.com's types with our domain-specific fields

### Trade-offs Accepted
- Adding new npm dependency (`@calcom/atoms`) increases bundle size
- Tight coupling to Cal.com's component API versioning

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Provider wrapper | Custom CalProvider | New | Encapsulate configuration and provide context |
| N/A | `@calcom/atoms` package | External | Official Cal.com React integration |

**Components to Install**:
- [ ] `pnpm add @calcom/atoms` in apps/web

## Required Credentials

| Variable | Description | Source |
|----------|-------------|--------|
| `CAL_OAUTH_CLIENT_ID` | OAuth client ID for Cal.com API authentication | Cal.com Platform dashboard |
| `CAL_API_KEY` | API key for server-side Cal.com operations | Cal.com API settings |
| `NEXT_PUBLIC_CAL_COACH_USERNAME` | Username for the default coach profile | Cal.com account |
| `NEXT_PUBLIC_CAL_EVENT_SLUG` | Event type slug for coaching sessions (e.g., "60min") | Cal.com event types |

> **Note**: These credentials are required for Cal.com integration to function. Without them, the coaching widget should gracefully degrade to show an unavailable state.

## Dependencies

### Blocks
- F2: Dashboard Widget (requires CalProvider and types)
- F3: Session Actions (requires CalProvider and types)

### Blocked By
- None (this is the foundation feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- `packages/features/coaching/src/components/cal-provider.tsx` - CalProvider wrapper component
- `packages/features/coaching/src/types/booking.ts` - TypeScript types for Cal.com entities
- `packages/features/coaching/src/lib/cal-config.ts` - Configuration validation and utilities
- `packages/features/coaching/src/index.ts` - Package exports
- `packages/features/coaching/package.json` - Package configuration
- `apps/web/.env.example` - Add Cal.com environment variable examples (append)

### Modified Files
- `apps/web/package.json` - Add @calcom/atoms and @kit/coaching dependencies
- `apps/web/app/home/(user)/layout.tsx` - Wrap with CalProvider (if client-side)
- `turbo.json` - Add coaching package to pipeline (if needed)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Install @calcom/atoms package**: Add npm dependency to apps/web with correct version
2. **Create coaching package structure**: Set up packages/features/coaching with package.json and exports
3. **Define TypeScript types**: Create booking, session, and coach type definitions
4. **Create CalProvider wrapper**: Implement provider component with configuration
5. **Add environment variable validation**: Zod schema for Cal.com config with helpful error messages
6. **Update layout with provider**: Wrap user routes with CalProvider
7. **Write unit tests**: Test provider initialization and config validation
8. **Document setup in env.example**: Add variable documentation

### Suggested Order
1. Package structure → 2. Types → 3. Config validation → 4. CalProvider → 5. Layout integration → 6. Tests → 7. Documentation

## Validation Commands
```bash
# Verify package installs correctly
pnpm install
pnpm typecheck

# Run coaching package tests
pnpm --filter @kit/coaching test

# Verify provider renders without errors
pnpm dev
# Check browser console for Cal.com initialization

# Validate environment variables
pnpm --filter web build
# Should fail fast if CAL_* variables are missing in production
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/context7-calcom.md`
- Tasks: `./tasks.json` (created in next phase)
