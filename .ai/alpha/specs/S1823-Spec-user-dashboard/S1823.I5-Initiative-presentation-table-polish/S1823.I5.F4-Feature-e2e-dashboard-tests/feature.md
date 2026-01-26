# Feature: E2E Dashboard Tests

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I5 |
| **Feature ID** | S1823.I5.F4 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 4 |

## Description
Implement comprehensive Playwright E2E tests covering dashboard happy path flows, empty states, responsive behavior, and widget interactions. These tests provide regression protection and confidence for future changes to the dashboard.

## User Story
**As a** developer maintaining the dashboard
**I want to** have comprehensive E2E test coverage
**So that** I can confidently make changes without breaking existing functionality

## Acceptance Criteria

### Must Have
- [ ] Test: Dashboard page loads successfully for authenticated user
- [ ] Test: All 7 widgets render with data (happy path)
- [ ] Test: Empty states display correctly for new user
- [ ] Test: Presentation table shows user's presentations
- [ ] Test: Quick action CTAs navigate to correct pages
- [ ] Test: Coaching widget shows upcoming sessions or booking CTA
- [ ] Test: Performance validation (LCP < 1.5s, CLS < 0.1)
- [ ] Test: Responsive layout at mobile, tablet, desktop breakpoints
- [ ] Page Object Model for dashboard test reusability
- [ ] Integration with existing E2E test infrastructure

### Nice to Have
- [ ] Visual regression tests (screenshot comparison)
- [ ] Test coverage report for dashboard routes

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | data-testid attributes on widgets | Modified |
| **Logic** | N/A | N/A |
| **Data** | Test fixtures for seeded data | New |
| **Database** | Test data seeding | New/Modified |

## Architecture Decision

**Approach**: Pragmatic - Follow established Playwright patterns
**Rationale**: Use existing E2E test infrastructure including Page Object Model, pre-authenticated states, and HybridAccessibilityTester. Leverage `toPass()` pattern for reliability.

### Key Architectural Choices
1. Create `DashboardPageObject` following existing PO patterns
2. Use pre-authenticated `AUTH_STATES.TEST_USER` from global-setup
3. Use `navigateAndWaitForHydration` and `CI_TIMEOUTS` for reliability
4. Seed test data using Supabase admin client in test setup
5. Use `toPass()` pattern for flaky operations

### Trade-offs Accepted
- No visual regression testing in v1 (can add Argos/Percy later)
- Test data seeding may slow down test setup
- Focus on critical paths, not exhaustive coverage

## Component Strategy

| Test Type | Approach | Tools |
|-----------|----------|-------|
| Smoke tests | Page loads, widgets visible | Playwright assertions |
| Functional tests | Widget interactions, navigation | Page Object Model |
| Empty state tests | New user scenario | Test data isolation |
| Performance tests | Web Vitals metrics | Lighthouse/Playwright |
| Responsive tests | Breakpoint testing | Playwright viewports |

**Packages Used**:
- `@playwright/test` - Test runner
- Existing test utilities from `apps/e2e/tests/utils/`

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

| Variable | Description | Source |
|----------|-------------|--------|
| `E2E_TEST_USER_EMAIL` | Test user email | `.env.test` |
| `E2E_TEST_USER_PASSWORD` | Test user password | `.env.test` |
| `SUPABASE_SERVICE_ROLE_KEY` | For test data seeding | `.env.test` |

## Dependencies

### Blocks
- None (final feature in initiative)

### Blocked By
- F1: Presentation table with data-testid attributes
- F2: Empty states with data-testid attributes
- F3: Accessibility compliance (test IDs, ARIA)
- All dashboard widgets must be implemented and working

### Parallel With
- None (depends on all prior features)

## Files to Create/Modify

### New Files
- `apps/e2e/tests/dashboard/dashboard.po.ts` - Dashboard Page Object
- `apps/e2e/tests/dashboard/dashboard.spec.ts` - Main dashboard tests
- `apps/e2e/tests/dashboard/dashboard-empty-states.spec.ts` - Empty state tests
- `apps/e2e/tests/dashboard/dashboard-responsive.spec.ts` - Responsive tests
- `apps/e2e/tests/dashboard/dashboard-performance.spec.ts` - Performance tests
- `apps/e2e/tests/fixtures/dashboard-test-data.ts` - Test data factory

### Modified Files
- `apps/e2e/playwright.config.ts` - Add dashboard test project if needed
- Widget components - Add `data-testid` attributes (coordinated with F3)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create DashboardPageObject**: Page object with widget selectors and interactions
2. **Create test data factory**: Functions to seed/clean dashboard test data
3. **Write dashboard smoke test**: Basic page load and widget visibility
4. **Write happy path tests**: Full user journey with populated data
5. **Write empty state tests**: New user scenario with no data
6. **Write responsive tests**: Mobile, tablet, desktop breakpoints
7. **Write performance tests**: LCP and CLS validation
8. **Add data-testid attributes**: Coordinate with F3 accessibility work
9. **Create CI configuration**: Add to GitHub Actions workflow
10. **Document test patterns**: Update E2E README

### Suggested Order
1. Page Object → 2. Test data → 3. Smoke tests → 4. Happy path → 5. Empty states → 6. Responsive → 7. Performance → 8. CI

## Test Specifications

### Happy Path Test Flow
```
1. Authenticate as test user (pre-authenticated state)
2. Navigate to /home with hydration wait
3. Verify dashboard container visible
4. Verify all 7 widgets render
5. Verify course progress shows percentage
6. Verify assessment spider chart renders
7. Verify kanban summary shows tasks
8. Verify activity feed has items
9. Verify quick actions panel present
10. Verify coaching widget shows sessions or CTA
11. Verify presentation table shows presentations
12. Click "Edit" on a presentation
13. Verify navigation to /home/ai/canvas/[id]
```

### Empty State Test Flow
```
1. Create new test user with no data
2. Navigate to /home
3. Verify course progress empty state with CTA
4. Verify assessment empty state with CTA
5. Verify kanban empty state with CTA
6. Verify activity feed empty state
7. Verify presentation table empty state with CTA
8. Click "Start Course" CTA
9. Verify navigation to /home/course
```

### Responsive Breakpoints
- Mobile: 375px width
- Tablet: 768px width
- Desktop: 1280px width

### Performance Targets
- LCP: < 1.5s
- CLS: < 0.1
- FID: < 100ms (if measurable)

## Validation Commands
```bash
# Run dashboard E2E tests
pnpm --filter web-e2e test -- --grep "dashboard"

# Run specific test file
pnpm --filter web-e2e test tests/dashboard/dashboard.spec.ts

# Run with debug mode
pnpm --filter web-e2e test:debug -- --grep "dashboard"

# Run with UI mode
pnpm --filter web-e2e test:ui -- --grep "dashboard"

# Generate test report
pnpm --filter web-e2e test -- --grep "dashboard" --reporter=html
```

## Related Files
- Initiative: `../initiative.md`
- E2E Base Test: `apps/e2e/tests/utils/base-test.ts`
- Hydration Utils: `apps/e2e/tests/utils/wait-for-hydration.ts`
- Auth States: `apps/e2e/tests/utils/auth-state.ts`
- Example PO: `apps/e2e/tests/account/account.po.ts`
- A11y Tester: `apps/e2e/tests/accessibility/hybrid-a11y.ts`
