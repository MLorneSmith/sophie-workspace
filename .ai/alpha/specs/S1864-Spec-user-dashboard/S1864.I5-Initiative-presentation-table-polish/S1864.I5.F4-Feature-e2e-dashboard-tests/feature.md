# Feature: E2E Dashboard Tests

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I5 |
| **Feature ID** | S1864.I5.F4 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 4 |

## Description
Create comprehensive E2E test suite for the user dashboard covering page load, widget rendering, user interactions, empty states, loading states, and performance assertions. Tests ensure the dashboard works correctly across user states and provide regression protection.

## User Story
**As a** developer
**I want to** have automated E2E tests for the dashboard
**So that** I can confidently deploy changes knowing the dashboard functionality is verified

## Acceptance Criteria

### Must Have
- [ ] Dashboard page load test (verifies page renders without errors)
- [ ] Widget rendering tests (all 7 widgets render when data exists)
- [ ] Empty state tests (all 7 widgets show empty states when no data)
- [ ] Interaction tests (sorting, pagination, CTA clicks)
- [ ] Navigation tests (widget CTAs navigate to correct pages)
- [ ] Loading skeleton tests (skeletons appear during load)
- [ ] Authentication tests (dashboard requires login)
- [ ] Performance assertions (LCP <3s, FCP <1.5s on desktop)
- [ ] Tests pass in CI pipeline
- [ ] Tests use existing Page Object pattern

### Nice to Have
- [ ] Visual regression tests (screenshot comparison)
- [ ] Mobile viewport tests
- [ ] Performance budget assertions

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | None (testing existing UI) | N/A |
| **Logic** | None | N/A |
| **Data** | Test fixtures/seed data | New |
| **Database** | Test user with dashboard data | Existing |

## Architecture Decision

**Approach**: Pragmatic - Follow existing E2E patterns with Page Objects
**Rationale**: E2E infrastructure is mature with established patterns. Create DashboardPageObject following existing patterns from auth.po.ts and account.po.ts.

### Key Architectural Choices
1. Use existing pre-authenticated browser states (test1@slideheroes.com)
2. Create DashboardPageObject for reusable selectors and actions
3. Use `waitForHydration` utility for React hydration
4. Use `toPass()` for flaky network operations
5. Add tests to new shard (shard16) for dashboard

### Trade-offs Accepted
- No visual regression (manual review sufficient for MVP)
- Performance tests may be flaky in CI (add retry intervals)
- Limited mobile testing (responsive verified manually)

## Required Credentials
> None required - uses existing test user credentials from global-setup.ts

## Dependencies

### Blocks
- None (final feature in initiative)

### Blocked By
- S1864.I1 through S1864.I4 - needs all widgets implemented to test
- S1864.I5.F1 (Presentation Table) - needs table to test
- S1864.I5.F2 (Empty States) - needs empty states to test
- S1864.I5.F3 (Accessibility) - needs ARIA attributes for selectors

### Parallel With
- None

## Files to Create/Modify

### New Files
- `apps/e2e/tests/dashboard/dashboard.spec.ts` - Dashboard test spec
- `apps/e2e/tests/dashboard/dashboard.po.ts` - Dashboard Page Object
- `apps/e2e/tests/dashboard/dashboard-fixtures.ts` - Test data helpers (optional)

### Modified Files
- `apps/e2e/package.json` - Add test:shard16 script for dashboard tests
- `apps/e2e/playwright.config.ts` - Add dashboard to test matching (if needed)

## Component Strategy

| Test Category | Pattern | Reference |
|---------------|---------|-----------|
| Page load | navigateAndWaitForHydration | wait-for-hydration.ts |
| Authentication | setupSession with AUTH_STATES | auth.po.ts |
| Element visibility | expect(locator).toBeVisible() | Standard Playwright |
| User interaction | Page Object methods | account.po.ts |
| Network reliability | toPass() with retry intervals | auth.spec.ts |
| Performance | Lighthouse integration (optional) | hybrid-a11y.ts |

## Test Specifications

### 1. Dashboard Load Tests
```typescript
test.describe("Dashboard Load", () => {
  test("should render dashboard page", async ({ page }) => {
    await dashboard.navigateToDashboard();
    await expect(page.getByTestId("dashboard-container")).toBeVisible();
  });

  test("should require authentication", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
```

### 2. Widget Rendering Tests
```typescript
test.describe("Widget Rendering", () => {
  const widgets = [
    "course-progress-widget",
    "assessment-spider-widget",
    "kanban-summary-widget",
    "activity-feed-widget",
    "quick-actions-panel",
    "coaching-sessions-widget",
    "presentations-table-widget"
  ];

  for (const widget of widgets) {
    test(`should render ${widget}`, async ({ page }) => {
      await dashboard.navigateToDashboard();
      await expect(page.getByTestId(widget)).toBeVisible();
    });
  }
});
```

### 3. Empty State Tests
```typescript
test.describe("Empty States", () => {
  // Use test user with no data
  test("should show empty state when no presentations", async ({ page }) => {
    await dashboard.navigateToDashboard();
    await expect(page.getByText("No presentations yet")).toBeVisible();
    await expect(page.getByRole("link", { name: "New Presentation" })).toBeVisible();
  });
});
```

### 4. Interaction Tests
```typescript
test.describe("Interactions", () => {
  test("should sort presentations table", async ({ page }) => {
    await dashboard.navigateToDashboard();
    await dashboard.clickTableHeader("Last Updated");
    // Verify sort indicator or order change
  });

  test("should navigate to canvas on Edit Outline click", async ({ page }) => {
    await dashboard.navigateToDashboard();
    await dashboard.clickEditOutline(0); // First row
    await expect(page).toHaveURL(/.*\/ai\/canvas\?id=/);
  });
});
```

### 5. Performance Tests
```typescript
test.describe("Performance", () => {
  test("should load within performance budget", async ({ page }) => {
    const startTime = Date.now();
    await dashboard.navigateToDashboard();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000); // LCP <3s
  });
});
```

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create DashboardPageObject**: Page object with selectors and methods
2. **Create dashboard.spec.ts skeleton**: Test file structure with describe blocks
3. **Implement page load tests**: Basic rendering and auth tests
4. **Implement widget rendering tests**: Verify all 7 widgets render
5. **Implement empty state tests**: Verify empty states with new user
6. **Implement interaction tests**: Sorting, pagination, navigation
7. **Implement loading state tests**: Verify skeletons during load
8. **Add performance assertions**: LCP/FCP budget tests
9. **Add to CI pipeline**: Configure shard16 in package.json
10. **Verify CI passes**: Ensure tests pass in GitHub Actions

### Suggested Order
1. Page Object → 2. Spec skeleton → 3. Load tests → 4. Widget tests → 5. Empty states → 6. Interactions → 7. Loading → 8. Performance → 9. CI config → 10. Verify

## Validation Commands
```bash
# Run dashboard tests locally
pnpm --filter web-e2e test:dashboard

# Run with UI (debugging)
pnpm --filter web-e2e test:dashboard --ui

# Run specific test
pnpm --filter web-e2e test:dashboard -g "should render dashboard page"

# Run in CI mode
CI=true pnpm --filter web-e2e test:dashboard
```

## Related Files
- Initiative: `../initiative.md`
- E2E test patterns: `apps/e2e/tests/account/account.spec.ts`
- Page Object example: `apps/e2e/tests/authentication/auth.po.ts`
- Test utilities: `apps/e2e/tests/utils/`
- Playwright config: `apps/e2e/playwright.config.ts`
- CI workflow: `.github/workflows/e2e.yml`
