# Chore: Add E2E Smoke Tests for AI Canvas, Courses, and Dashboard

## Chore Description

Currently, the E2E test suite has significant coverage gaps for core user-facing features. The AI Canvas, course management, and dashboard pages—which are critical to the product—have zero E2E test coverage. This chore adds smoke tests (page load verification) for these features to ensure they remain accessible and load correctly.

This is a tooling/maintenance task to improve test coverage for critical user paths without implementing full feature workflows. Smoke tests verify that:
- Pages load without 500/404 errors
- Key navigation elements are visible
- Basic layout/structure is intact
- No critical JavaScript errors occur during page load

**Scope:**
- Add smoke tests for AI canvas dashboard (`/home/(user)/ai`)
- Add smoke tests for AI canvas editor (`/home/(user)/ai/canvas`)
- Add smoke tests for course dashboard (`/home/(user)/course`)
- Add smoke tests for user dashboard (`/home/(user)`)
- Add smoke tests for team dashboard (`/home/[account]`)
- Create reusable test utilities for dashboard page verification
- Add new tests to existing shard 1 (smoke tests shard)

## Relevant Files

**Test Infrastructure:**
- `apps/e2e/tests/smoke/smoke.spec.ts` - Existing smoke tests (currently ~200 lines)
  - Defines baseline smoke test patterns using Playwright
  - Uses `data-testid` attributes for reliable element selection
  - Tests page load verification, navigation, headers, API health checks
  - Will be extended with new dashboard tests

- `apps/e2e/playwright.config.ts` - Playwright configuration
  - Defines test execution parameters (workers, timeouts, reporters)
  - Configures pre-authenticated browser states via global setup
  - Currently smoke tests run as part of shard 1

**Test Utilities & Page Objects:**
- `apps/e2e/tests/utils/` - Shared test utilities directory
  - Contains helper functions for test data, authentication
  - Will add new `dashboard.po.ts` for dashboard page object patterns

- `apps/e2e/global-setup.ts` - Global test setup
  - Creates pre-authenticated browser states for test users
  - Ensures users are logged in before tests run

**Application Routes to Test:**
- `apps/web/app/home/(user)/page.tsx` - User dashboard landing page
- `apps/web/app/home/(user)/ai/page.tsx` - AI canvas workspace dashboard
- `apps/web/app/home/(user)/ai/canvas/page.tsx` - AI canvas editor
- `apps/web/app/home/(user)/course/page.tsx` - Course dashboard
- `apps/web/app/home/[account]/page.tsx` - Team account dashboard
- `apps/web/app/home/[account]/settings/page.tsx` - Team settings page

**Package Configuration:**
- `apps/e2e/package.json` - Test scripts
  - Currently defines `test:shard1` as smoke tests
  - Will include new dashboard tests in shard 1

### New Files
- `apps/e2e/tests/smoke/dashboard.spec.ts` - New smoke tests for dashboard pages
  - Tests for `/home/(user)` (user dashboard)
  - Tests for `/home/(user)/ai` (AI workspace)
  - Tests for `/home/(user)/ai/canvas` (AI canvas editor)
  - Tests for `/home/(user)/course` (course dashboard)
  - Tests for `/home/[account]` (team dashboard)

## Impact Analysis

### Scope & Impact
- **Low-risk, isolated change**: Only adds new test files, doesn't modify existing code
- **Extends existing patterns**: Uses established Playwright patterns from `smoke.spec.ts`
- **No application changes**: Tests only verify existing pages work correctly
- **Improved visibility**: Provides early warning if dashboard pages break
- **Fast execution**: Smoke tests are quick (page load only, no complex workflows)

### Dependencies Affected
- **Playwright test infrastructure** - Uses existing setup and utilities
  - No new dependencies required
  - Uses existing pre-authenticated browser states from global-setup
- **E2E test framework** - Integrates with existing Playwright configuration
  - No changes to playwright.config.ts needed
  - Uses standard Playwright patterns

### Risk Assessment
**Low Risk** — This is a simple addition with minimal surface area:
- No changes to existing tests or application code
- Uses well-established Playwright patterns (page load verification)
- Tests are independent and don't affect other test suites
- Can be easily disabled if issues arise
- Skipped/failing tests won't impact other shards

### Backward Compatibility
- No breaking changes
- Existing tests unaffected
- New tests are purely additive
- Can be added to CI/CD without disrupting current pipeline

## Pre-Chore Checklist
Before starting implementation:
- [ ] Verify all dashboard pages load in local development
- [ ] Identify key navigation elements for each page (looking for `data-testid` attributes)
- [ ] Review existing smoke test patterns in `smoke.spec.ts`
- [ ] Confirm test user has access to all dashboards (personal + team account)
- [ ] Check if dashboard pages have loading states that need handling

## Documentation Updates Required
- Update `.ai/ai_docs/context-docs/testing-and-quality/e2e-testing.md` with smoke test examples for dashboard pages
- Add comments in new test file documenting test purpose and any environment assumptions
- Document in project README that dashboard pages have E2E coverage

## Rollback Plan
If dashboard tests fail:
1. **Immediate rollback**: Delete `apps/e2e/tests/smoke/dashboard.spec.ts`
2. **Revert package.json changes**: Remove references to new tests from test script
3. **No database changes**: No migrations or data changes made
4. **No dependencies to rollback**: New tests add no external dependencies

## Step by Step Tasks

### 1. Analyze Dashboard Page Structure
- [ ] Examine user dashboard (`/home/(user)/page.tsx`) to identify key elements
- [ ] Examine AI workspace (`/home/(user)/ai/page.tsx`) structure
- [ ] Examine AI canvas editor (`/home/(user)/ai/canvas/page.tsx`) for critical elements
- [ ] Examine course dashboard (`/home/(user)/course/page.tsx`)
- [ ] Examine team dashboard (`/home/[account]/page.tsx`) and team settings
- [ ] Document which elements have `data-testid` attributes vs need selector additions
- [ ] Note any loading states or async operations to handle

### 2. Add Test IDs to Dashboard Pages (if needed)
If dashboard pages don't have sufficient `data-testid` attributes:
- [ ] Add `data-testid` to main dashboard container
- [ ] Add `data-testid` to key navigation or action elements
- [ ] Add `data-testid` to page title/header
- [ ] Ensure test IDs don't bloat component code—use sparingly for testing only

### 3. Create Dashboard Smoke Tests
- [ ] Create `apps/e2e/tests/smoke/dashboard.spec.ts`
- [ ] Implement test for user dashboard page load:
  - Navigate to `/home/(user)`
  - Verify page loads with 200 status (no errors)
  - Verify title/header is visible
  - Verify key navigation elements present
- [ ] Implement test for AI workspace dashboard load:
  - Navigate to `/home/(user)/ai`
  - Verify page loads successfully
  - Verify workspace layout elements visible
  - Handle loading states if present
- [ ] Implement test for AI canvas editor load:
  - Navigate to `/home/(user)/ai/canvas`
  - Verify editor interface loads
  - Verify toolbar/UI elements present
  - Handle potential async initialization
- [ ] Implement test for course dashboard load:
  - Navigate to `/home/(user)/course`
  - Verify course list/dashboard loads
  - Verify course navigation elements visible
- [ ] Implement test for team dashboard load:
  - Navigate to `/home/[account]` (use team account slug from test data)
  - Verify team dashboard loads
  - Verify team header/navigation present
- [ ] Implement test for team settings load:
  - Navigate to `/home/[account]/settings`
  - Verify settings page loads
  - Verify settings form elements visible

### 4. Handle Authenticated Routes
- [ ] Verify tests use pre-authenticated browser state from global-setup
- [ ] Ensure test user has team account access for team dashboard tests
- [ ] Handle redirect if user not authenticated
- [ ] Add assertions to catch redirect to login page

### 5. Implement Loading State Handling
- [ ] Check if dashboard pages use Suspense/loading states
- [ ] Use appropriate Playwright wait strategies:
  - `waitForLoadState('networkidle')` for network-dependent content
  - `waitForLoadState('domcontentloaded')` for faster page validation
  - Custom waits for specific elements if needed
- [ ] Handle skeleton loaders gracefully

### 6. Test Timeout Configuration
- [ ] Use appropriate timeouts for dashboard pages
- [ ] Consider that first dashboard load may be slower than subsequent
- [ ] Use `navigationTimeout` for page navigation
- [ ] Use `expect.timeout` for element visibility assertions

### 7. Validate Error Handling
- [ ] Verify tests fail appropriately if page returns 404/500
- [ ] Add assertions to detect JavaScript errors during load
- [ ] Check for error boundary rendering
- [ ] Validate tests catch common failure modes

### 8. Update Package Scripts
- [ ] Verify `test:shard1` includes new dashboard tests
- [ ] Confirm new tests run with other smoke tests in shard 1
- [ ] Update test script comments if `package.json` needs clarification

### 9. Execute Validation Commands
Execute all validation commands to verify implementation:
- [ ] Run `pnpm --filter e2e test:shard1` locally (should pass all smoke tests including new dashboard tests)
- [ ] Run `pnpm --filter e2e test:shard1 --headed` to visually verify tests run correctly
- [ ] Verify no existing tests broken
- [ ] Check test execution time (smoke tests should complete in <60 seconds)
- [ ] Verify dashboard tests work with both `test:shard1` and full test suite

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

```bash
# Run smoke tests locally to verify new dashboard tests pass
pnpm --filter e2e test:shard1

# Run with headed mode to see tests execute
pnpm --filter e2e test:shard1 --headed

# Verify TypeScript compilation for test files
pnpm typecheck

# Run linter to catch any formatting issues
pnpm lint --filter e2e

# Verify test count increased (should be ~15+ smoke tests)
grep -c "test(" apps/e2e/tests/smoke/dashboard.spec.ts
grep -c "test(" apps/e2e/tests/smoke/smoke.spec.ts

# Verify no test.only left in code
grep "test.only" apps/e2e/tests/smoke/dashboard.spec.ts || echo "✓ No test.only found"

# Verify new file uses correct test structure and patterns
head -20 apps/e2e/tests/smoke/dashboard.spec.ts
```

## Notes

- **Email/OTP blocking**: Dashboard smoke tests avoid email/OTP operations that plague other test suites. These are simple page load tests with no authentication flow testing.

- **Pre-authenticated state**: Tests rely on global-setup creating authenticated browser states. Verify test user has access to both personal and team accounts before tests run.

- **Navigation timeouts**: Dashboard pages may have network requests for data. Use appropriate `waitUntil` strategies:
  - `'domcontentloaded'` for quick load validation
  - `'networkidle'` if page waits for data before rendering

- **Team account slug**: Tests need a valid team account slug. This should be created in global-setup or use a known test team account.

- **Loading indicators**: Many dashboards use Suspense boundaries. Tests should account for this by waiting for actual content, not just checking for spinners.

- **Page performance**: Smoke tests should be fast. Keep assertions minimal—verify page loaded and key elements visible, don't wait for animations or secondary content.

- **Browser console errors**: Consider adding check for JavaScript errors during page load (optional enhancement for future).

- **CI execution**: Smoke tests run in shard 1 with other smoke tests. Total shard execution should remain <2 minutes.
