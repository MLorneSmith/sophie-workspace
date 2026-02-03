# Feature: E2E Test Suite

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I6 |
| **Feature ID** | S1918.I6.F4 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 4 |

## Description
Create comprehensive Playwright E2E tests for the user dashboard, covering page rendering, widget states (loading, empty, populated, error), responsive behavior, and user interactions. Tests ensure the dashboard works correctly across browsers and validates the complete user experience.

## User Story
**As a** developer
**I want to** have automated E2E tests for the dashboard
**So that** I can confidently deploy changes knowing the dashboard works correctly

## Acceptance Criteria

### Must Have
- [ ] Dashboard page loads successfully (authenticated user)
- [ ] All 7 widgets render without console errors
- [ ] Empty states display correctly for new users
- [ ] Loading skeletons appear during data fetch (with artificial delay)
- [ ] Error boundaries catch and display errors gracefully
- [ ] Responsive layout tests (mobile, tablet, desktop viewports)
- [ ] Quick actions navigation works (clicks lead to correct pages)
- [ ] Tests run in CI pipeline

### Nice to Have
- [ ] Visual regression tests with Percy or similar
- [ ] Accessibility audit via axe-playwright
- [ ] Performance metrics (LCP, FID) captured

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (testing existing UI) | N/A |
| **Logic** | N/A | N/A |
| **Data** | Test fixtures/mocks | New |
| **Database** | Seeded test data | Existing |

## Architecture Decision

**Approach**: Pragmatic - Page Object Model with shared fixtures
**Rationale**: Follow existing Playwright patterns in `apps/e2e`. Use Page Object Model for maintainability. Share authentication fixtures with other tests.

### Key Architectural Choices
1. Use existing `authenticated-user` fixture for auth
2. Create `DashboardPage` page object for selectors and actions
3. Test states via route interception or test data seeding
4. Use viewport presets for responsive testing

### Trade-offs Accepted
- May need test-specific data seeding for empty/populated states
- Some tests may be flaky with real data timing

## Required Credentials
> None required - uses existing test credentials

## Dependencies

### Blocks
- None

### Blocked By
- S1918.I1-I5: All widgets must be implemented before testing
- F1: Loading Skeletons (to test skeleton states)
- F2: Error Boundaries (to test error states)
- F3: Accessibility Compliance (may add a11y tests)

### Parallel With
- None (depends on F1-F3 for complete coverage)

## Files to Create/Modify

### New Files
- `apps/e2e/tests/dashboard/dashboard.spec.ts` - Main test file
- `apps/e2e/tests/dashboard/dashboard.page.ts` - Page Object Model
- `apps/e2e/fixtures/dashboard.fixtures.ts` - Test fixtures (if needed)

### Modified Files
- `apps/e2e/playwright.config.ts` - Ensure dashboard route is tested
- `apps/web/supabase/seeds/` - May need test data for dashboard scenarios

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create DashboardPage page object**: Selectors for all widgets and interactions
2. **Write page load tests**: Verify dashboard renders, no console errors
3. **Write empty state tests**: New user sees empty states with CTAs
4. **Write populated state tests**: User with data sees all widgets populated
5. **Write loading state tests**: Intercept routes to verify skeletons
6. **Write error state tests**: Force errors to verify error boundaries
7. **Write responsive layout tests**: Test mobile, tablet, desktop viewports
8. **Write navigation tests**: Quick actions lead to correct pages
9. **Integrate with CI**: Ensure tests run in GitHub Actions

### Suggested Order
1. Page object (T1 - foundation)
2. Page load tests (T2)
3. Empty state tests (T3)
4. Populated state tests (T4)
5. Loading state tests (T5)
6. Error state tests (T6)
7. Responsive tests (T7)
8. Navigation tests (T8)
9. CI integration (T9)

## Validation Commands
```bash
# Run E2E tests locally
pnpm --filter web-e2e test:e2e -- --grep "dashboard"

# Run with UI (debugging)
pnpm --filter web-e2e test:e2e --ui -- --grep "dashboard"

# Generate test report
pnpm --filter web-e2e test:e2e --reporter=html -- --grep "dashboard"

# Type check
pnpm typecheck
```

## Related Files
- Initiative: `../initiative.md`
- Pattern: `apps/e2e/tests/` - Existing E2E test patterns
- Pattern: `apps/e2e/playwright.config.ts` - Configuration
- Fixtures: `apps/e2e/fixtures/` - Existing fixtures
