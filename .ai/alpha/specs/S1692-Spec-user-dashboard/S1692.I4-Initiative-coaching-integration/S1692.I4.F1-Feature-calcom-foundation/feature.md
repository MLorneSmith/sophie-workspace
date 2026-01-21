# Feature: Cal.com Foundation & Provider Setup

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I4 |
| **Feature ID** | S1692.I4.F1 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 1 |

## Description
Install and configure the @calcom/atoms package, set up the CalProvider in the user layout, configure environment variables, and implement graceful fallback behavior when Cal.com credentials are not configured.

## User Story
**As a** developer
**I want to** have Cal.com Atoms properly integrated into the application
**So that** I can build coaching features using Cal.com's React hooks and components

## Acceptance Criteria

### Must Have
- [ ] @calcom/atoms package installed and configured
- [ ] CalProvider wraps user layout content
- [ ] Environment variables documented in .env.local.example
- [ ] App loads without errors when Cal.com credentials are missing
- [ ] Console warning logged in development when credentials missing

### Nice to Have
- [ ] Type definitions exported for Cal.com booking types

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A | N/A |
| **Logic** | CalProvider wrapper | New |
| **Data** | Environment variable config | New |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Add CalProvider at layout level with graceful fallback
**Rationale**: CalProvider needs to wrap all components that use Cal.com hooks. Placing it at the (user) layout level ensures all user routes have access while keeping it isolated from marketing/admin routes.

### Key Architectural Choices
1. CalProvider at `apps/web/app/home/(user)/layout.tsx` - scoped to user routes only
2. Environment variables with NEXT_PUBLIC_ prefix for client-side access
3. Conditional rendering based on credential availability

### Trade-offs Accepted
- Cal.com CSS imported globally (small bundle impact, required by @calcom/atoms)

## Dependencies

### Blocks
- F2: Dashboard Widget (needs CalProvider for useBookings hook)
- F3: Session Actions (needs CalProvider indirectly)

### Blocked By
- None (root feature)

### Parallel With
- None (must complete first)

## Files to Create/Modify

### New Files
- None (modifications only)

### Modified Files
- `apps/web/package.json` - Add @calcom/atoms dependency
- `apps/web/app/home/(user)/layout.tsx` - Add CalProvider wrapper and CSS import
- `apps/web/.env.local.example` - Add Cal.com environment variables with documentation

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Install @calcom/atoms package**: Add dependency to package.json, run pnpm install
2. **Add environment variables**: Document CAL_OAUTH_CLIENT_ID and CAL_API_URL in .env.local.example
3. **Create CalProvider wrapper component**: Client component that conditionally wraps with CalProvider
4. **Integrate CalProvider into layout**: Import and wrap existing layout content
5. **Add Cal.com CSS import**: Import @calcom/atoms/globals.min.css

### Suggested Order
1. Install package → 2. Add env vars → 3. Create wrapper → 4. Integrate into layout → 5. Add CSS

## Validation Commands
```bash
# Verify package installed
grep "@calcom/atoms" apps/web/package.json

# Verify environment variables documented
grep "CAL_" apps/web/.env.local.example

# Type check
pnpm typecheck

# Start dev server and verify no errors
pnpm dev
# Visit /home and verify page loads without console errors (warning expected if no credentials)
```

## Related Files
- Initiative: `../initiative.md`
- Research: `../../research-library/context7-calcom.md`
- Tasks: `./tasks.json` (created in next phase)
