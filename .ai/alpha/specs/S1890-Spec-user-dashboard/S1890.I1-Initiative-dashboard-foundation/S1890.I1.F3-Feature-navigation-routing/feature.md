# Feature: Navigation & Routing

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1890.I1 |
| **Feature ID** | S1890.I1.F3 |
| **Status** | Draft |
| **Estimated Days** | 1 |
| **Priority** | 3 |

## Description
Ensure the dashboard is properly integrated as the default landing page for authenticated personal account users. Verify routing from login redirects correctly and navigation sidebar highlights the home route.

## User Story
**As a** logged-in SlideHeroes user
**I want to** land on my dashboard after authentication
**So that** I immediately see my progress and can decide what to do next

## Acceptance Criteria

### Must Have
- [ ] Login redirects to `/home` for personal account users
- [ ] Dashboard page loads at `/home/(user)` route (already true)
- [ ] Home navigation item in sidebar is active when on dashboard
- [ ] Page title and description use correct i18n keys

### Nice to Have
- [ ] Breadcrumb shows "Home" as root (if breadcrumbs implemented)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Navigation sidebar highlight | Existing |
| **Logic** | Auth redirect logic | Existing |
| **Data** | None | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Minimal - Verify existing behavior, fix any gaps
**Rationale**: Most routing should already work. This feature ensures integration is complete.

### Key Architectural Choices
1. Use existing `pathsConfig.app.home` constant for consistency
2. Leverage existing `personal-account-navigation.config.tsx` for sidebar
3. No new routing code needed - verify existing middleware redirects

### Trade-offs Accepted
- Not adding custom redirect logic if default works (simpler)

## Required Credentials
> Environment variables required for this feature to function.

None required - uses existing auth and navigation systems.

## Dependencies

### Blocks
- None (end feature in foundation initiative)

### Blocked By
- F1: Dashboard Page & Layout (page must exist first)

### Parallel With
- F2: Widget Placeholder Grid (can run in parallel after F1)

## Files to Create/Modify

### New Files
- None expected

### Modified Files
- `apps/web/public/locales/en/common.json` - Verify/update homeTabDescription translation
- `config/paths.config.ts` - Verify app.home path (likely already correct)
- `config/personal-account-navigation.config.tsx` - Verify home item configuration

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Verify login redirect**: Test that login redirects to /home
2. **Verify sidebar highlight**: Confirm Home nav item shows active state
3. **Update i18n strings**: Enhance homeTabDescription if needed
4. **Add/verify metadata**: Ensure generateMetadata produces correct title
5. **E2E smoke test**: Create basic E2E test for dashboard load

### Suggested Order
1 → 2 → 3 → 4 → 5 (mostly verification)

## Validation Commands
```bash
# Verify paths config has home
grep -q "home:" config/paths.config.ts && echo "✓ Home path defined"

# Verify navigation config
grep -q "routes.home" config/personal-account-navigation.config.tsx && echo "✓ Nav config present"

# Verify i18n key exists
grep -q "homeTabDescription" apps/web/public/locales/en/common.json && echo "✓ i18n key exists"

# Run typecheck
pnpm typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Config: `config/paths.config.ts`
- Config: `config/personal-account-navigation.config.tsx`
- Locales: `apps/web/public/locales/en/common.json`
