# Feature: E2E Dashboard Tests

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1815.I5 |
| **Feature ID** | S1815.I5.F4 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 4 |

## Description
Implement comprehensive Playwright E2E tests for the user dashboard. Tests cover the happy path (all widgets with data), empty state scenarios (new user), widget interactions, navigation, and accessibility compliance verification.

## User Story
**As a** developer maintaining the dashboard
**I want to** have E2E tests covering critical user flows
**So that** regressions are caught before they reach production

## Acceptance Criteria

### Must Have
- [ ] Dashboard happy path test: page loads with all 7 widgets rendering
- [ ] Widget data verification: each widget displays expected data
- [ ] Empty state scenarios: verify empty states for new users
- [ ] Navigation tests: verify all CTAs and links navigate correctly
- [ ] Presentations table interaction: edit link navigates to canvas
- [ ] Performance validation: LCP < 1.5s on desktop, < 2.5s on mobile
- [ ] Tests use pre-authenticated state (no login per test)
- [ ] Tests follow existing patterns (data-testid, toPass(), hydration waits)

### Nice to Have
- [ ] Accessibility tests integrated with hybrid-a11y
- [ ] Visual regression tests (screenshot comparison)
- [ ] Mobile viewport tests

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | N/A (testing only) | N/A |
| **Logic** | N/A (testing only) | N/A |
| **Data** | Test fixtures/seed data | Existing |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Follow established E2E patterns in the codebase. Use Page Object Model for dashboard interactions, pre-authenticated states for speed, and the existing reliability utilities (toPass, hydration waits). Structure tests to run in parallel where possible.

### Key Architectural Choices
1. Create `DashboardPageObject` class following existing PO patterns
2. Use pre-authenticated `AUTH_STATES.TEST_USER` (has course/presentation data)
3. Leverage `navigateAndWaitForHydration()` for page loads
4. Use `toPass()` pattern for data-dependent assertions
5. Organize tests in `apps/e2e/tests/dashboard/` directory

### Trade-offs Accepted
- Tests rely on seeded test data (not creating fresh data per test)
- Performance tests are approximations (not full Lighthouse runs)

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Test Framework | Playwright | @playwright/test | Project standard |
| Page Object | DashboardPageObject | New | Encapsulate dashboard interactions |
| Auth State | AUTH_STATES.TEST_USER | Existing | Pre-authenticated test user |
| Reliability | toPass(), hydration utils | Existing | CI stability |

**Components to Install**: None - using existing test infrastructure

## Required Credentials
> Environment variables required for this feature to function.

Uses existing E2E test credentials:
- `SUPABASE_URL` - Supabase API URL
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations in global-setup
- Test users defined in `apps/e2e/tests/helpers/test-users.ts`

## Dependencies

### Blocks
- None (final feature in initiative)

### Blocked By
- F1: Presentation Table Widget (needs table data-testid for tests)
- F2: Empty States Polish (needs empty state data-testid for tests)
- F3: Accessibility Compliance (needs accessible elements for a11y tests)
- All dashboard widgets must have data-testid attributes

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/e2e/tests/dashboard/dashboard.spec.ts` - Main dashboard test suite
- `apps/e2e/tests/dashboard/dashboard.po.ts` - Dashboard Page Object
- `apps/e2e/tests/dashboard/widgets.spec.ts` - Widget-specific tests (optional)

### Modified Files
- `apps/e2e/global-setup.ts` - Ensure test user has dashboard data (if needed)
- `apps/e2e/tests/helpers/test-users.ts` - Verify/add dashboard-relevant test data

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create DashboardPageObject**: Implement PO with widget locators and actions
2. **Dashboard navigation test**: Test loading /home and verifying URL
3. **Widget visibility tests**: Verify each widget is visible (data-testid)
4. **Widget content tests**: Verify widget displays expected data
5. **Empty state tests**: Create test with user having no data
6. **Presentations table test**: Verify table renders, edit link works
7. **Performance test**: Measure LCP with Playwright metrics
8. **Accessibility integration**: Run hybrid-a11y on dashboard
9. **CI integration**: Ensure tests run in E2E workflow

### Suggested Order
1. Page Object → 2. Navigation → 3. Visibility → 4. Content → 5. Empty States → 6. Table → 7. Performance → 8. A11y → 9. CI

## Validation Commands
```bash
# Run dashboard E2E tests
pnpm --filter web-e2e test -- --grep dashboard

# Run with debug
pnpm --filter web-e2e test -- --grep dashboard --debug

# Run headed (watch mode)
pnpm --filter web-e2e test -- --grep dashboard --headed

# Run specific test file
pnpm --filter web-e2e test tests/dashboard/dashboard.spec.ts

# View test report
pnpm --filter web-e2e test:report

# Check CI integration
# Verify tests pass in GitHub Actions E2E workflow
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Test Utils: `apps/e2e/tests/utils/wait-for-hydration.ts`
- Auth State: `apps/e2e/tests/utils/auth-state.ts`
- Test Users: `apps/e2e/tests/helpers/test-users.ts`
- Reference PO: `apps/e2e/tests/authentication/auth.po.ts` (pattern)
- A11y Utils: `apps/e2e/tests/accessibility/hybrid-a11y.ts`

## Test Structure Reference

```typescript
// dashboard.spec.ts
import { test, expect } from "@playwright/test";
import { AuthPageObject } from "../authentication/auth.po";
import { DashboardPageObject } from "./dashboard.po";
import { AUTH_STATES, restoreAuthStorageState } from "../utils/auth-state";
import { navigateAndWaitForHydration, CI_TIMEOUTS } from "../utils/wait-for-hydration";

test.describe("Dashboard Tests @dashboard @integration", () => {
  AuthPageObject.setupSession(AUTH_STATES.TEST_USER);

  let dashboard: DashboardPageObject;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPageObject(page);
    await restoreAuthStorageState(page, AUTH_STATES.TEST_USER);
    await navigateAndWaitForHydration(page, "/home");
  });

  test("renders all dashboard widgets", async ({ page }) => {
    await expect(async () => {
      await expect(page.getByTestId("widget-course-progress")).toBeVisible();
      await expect(page.getByTestId("widget-spider-chart")).toBeVisible();
      // ... other widgets
    }).toPass({ timeout: CI_TIMEOUTS.element });
  });

  test("presentations table shows user data", async ({ page }) => {
    const table = page.getByTestId("widget-presentations-table");
    await expect(table).toBeVisible();

    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount.toBeGreaterThan(0);
  });
});
```
