# Feature: E2E Dashboard Tests

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I5 |
| **Feature ID** | S1692.I5.F4 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 4 |

## Description
Create comprehensive E2E test coverage for the user dashboard, including the Presentation Table widget, empty states, navigation flows, and loading states. Use Page Object pattern for maintainability and reliability.

## User Story
**As a** developer
**I want to** have E2E tests for the dashboard
**So that** regressions are caught before deployment

## Acceptance Criteria

### Must Have
- [ ] Dashboard page loads successfully for authenticated user
- [ ] Presentations table renders with user's data
- [ ] Empty state renders when user has no presentations
- [ ] Row click navigates to presentation editor
- [ ] "Create Presentation" CTA navigates to blocks form
- [ ] Loading skeleton shown during data fetch
- [ ] Tests pass in CI pipeline

### Nice to Have
- [ ] Test table sorting functionality
- [ ] Test pagination (if implemented)
- [ ] Performance assertions (LCP < 2s)
- [ ] Visual regression tests

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **Testing** | Dashboard E2E test suite | New |
| **Testing** | Dashboard Page Object | New |
| **Testing** | Test data seeding helpers | Modified |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow existing E2E patterns in the codebase. Use Page Object pattern for reusable interactions. Wrap flaky operations in `toPass()` for reliability. Seed test data for deterministic results.

### Key Architectural Choices
1. Page Object pattern for dashboard interactions
2. Test data seeding via Supabase admin client
3. `toPass()` wrapper for eventually-consistent operations
4. Parallel test execution where possible

### Trade-offs Accepted
- No visual regression testing initially (requires baseline setup)
- Performance testing limited to basic LCP check
- Tests run sequentially to avoid data conflicts

## Dependencies

### Blocks
- None (final feature in initiative)

### Blocked By
- F1: Presentation Table Widget (needs table to test)
- F2: Empty States Polish (tests verify empty states)
- F3: Accessibility Compliance (tests include accessibility assertions)

### Parallel With
- None (runs after F2 and F3)

## Files to Create/Modify

### New Files
- `apps/e2e/tests/dashboard/dashboard.spec.ts` - E2E test suite
- `apps/e2e/tests/dashboard/dashboard.po.ts` - Page Object

### Modified Files
- `apps/e2e/tests/utils/seed-helpers.ts` - Add `seedPresentations()` helper (if needed)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create Page Object**: Define `DashboardPageObject` with common interactions
2. **Create seed helper**: Implement `seedPresentations()` for test data
3. **Write happy path test**: Dashboard loads, table renders with data
4. **Write empty state test**: No presentations shows empty state
5. **Write navigation test**: Row click navigates to editor
6. **Write CTA test**: Button click navigates to blocks form
7. **Write loading test**: Skeleton shown during fetch
8. **Add reliability improvements**: Wrap flaky checks in `toPass()`

### Suggested Order
1. Page Object → 2. Seed helper → 3. Happy path → 4. Empty state → 5. Navigation → 6. CTA → 7. Loading → 8. Reliability

## Validation Commands
```bash
# Run dashboard E2E tests
pnpm --filter web-e2e test:e2e -- --grep "dashboard"

# Run with debug mode
pnpm --filter web-e2e test:e2e -- --grep "dashboard" --debug

# Run in headed mode for debugging
pnpm --filter web-e2e test:e2e -- --grep "dashboard" --headed

# Run all E2E tests
pnpm --filter web-e2e test:e2e
```

## Related Files
- Initiative: `../initiative.md`
- E2E patterns: `apps/e2e/tests/account/account.spec.ts`
- Page Object example: `apps/e2e/tests/account/account.po.ts`
- Auth setup: `apps/e2e/tests/utils/auth.ts`
- Test utilities: `apps/e2e/tests/utils/base-test.ts`
