# Chore: Add E2E Tests for Critical User Paths Through Core Features

## Chore Description

Currently, the three core product features—AI Canvas (presentation creation), Course Management (learning platform), and Assessment (self-evaluation)—have zero end-to-end test coverage for critical user workflows. This chore adds comprehensive E2E tests for the most important user journeys through these features.

The goal is to ensure users can complete key tasks:
1. **AI Canvas Path**: Access workspace → create/edit presentation → save content → export
2. **Course Path**: View course → complete lessons → earn certificate → track progress
3. **Assessment Path**: Take survey → view results → track progress metrics

These tests will use existing Playwright patterns (Page Objects, pre-authenticated states, reliability patterns with `toPass()`) to create maintainable, resilient tests that catch regressions in core user workflows.

**Scope:**
- Create Page Objects for AI Canvas, Course, and Assessment pages
- Implement critical path E2E tests for each feature (5-8 tests per feature)
- Handle async operations (data loading, API calls, Suspense boundaries)
- Use pre-authenticated browser states from global-setup
- Add to existing test shards (create shard 13 for critical path tests)
- Document test purposes and any environment assumptions

## Relevant Files

**Test Infrastructure:**
- `apps/e2e/tests/user-billing/user-billing.spec.ts` - Example critical path test with Page Object pattern
  - Demonstrates billing subscription workflow
  - Shows pattern for async operations using `toPass()` with exponential backoff
  - Uses pre-authenticated browser state
  - Will serve as template for critical path tests

- `apps/e2e/tests/smoke/smoke.spec.ts` - Existing smoke tests
  - Basic page load verification patterns
  - Shows navigation and element selection with `data-testid`
  - Will be complemented by more detailed critical path tests

- `apps/e2e/playwright.config.ts` - Playwright configuration
  - Defines test execution parameters and pre-authenticated browser states
  - Will add new test shard (test:shard13) for critical path tests

- `apps/e2e/tests/utils/` - Shared test utilities
  - Contains Page Object base patterns (billing.po.ts, stripe.po.ts)
  - Contains auth helpers, wait helpers, test config
  - Will add new Page Objects for AI Canvas, Course, Assessment

**Test Utilities:**
- `apps/e2e/tests/utils/auth-helpers.ts` - Authentication utilities
- `apps/e2e/tests/utils/wait-helpers.ts` - Wait strategies for async operations
- `apps/e2e/tests/utils/test-helpers.ts` - Common test helper functions
- `apps/e2e/tests/utils/team-test-helpers.ts` - Team account test utilities

**Application Routes to Test:**
- `apps/web/app/home/(user)/ai/page.tsx` - AI workspace dashboard
- `apps/web/app/home/(user)/ai/canvas/page.tsx` - AI canvas editor (critical feature)
- `apps/web/app/home/(user)/ai/storyboard/page.tsx` - AI storyboard/outline
- `apps/web/app/home/(user)/course/page.tsx` - Course dashboard
- `apps/web/app/home/(user)/course/lessons/[slug]/page.tsx` - Lesson content
- `apps/web/app/home/(user)/course/certificate/page.tsx` - Certificate view
- `apps/web/app/home/(user)/assessment/page.tsx` - Assessment dashboard
- `apps/web/app/home/(user)/assessment/survey/page.tsx` - Survey/assessment form

**Package Configuration:**
- `apps/e2e/package.json` - Test scripts
  - Will add new `test:shard13` for critical path tests

### New Files
- `apps/e2e/tests/critical-paths/ai-canvas.spec.ts` - AI Canvas critical path tests
  - Navigate to workspace → create presentation → edit canvas → save
  - Test storyboard navigation and outline editing
  - Verify export/save functionality

- `apps/e2e/tests/critical-paths/course.spec.ts` - Course critical path tests
  - Enroll in/access course → view lessons → complete lesson → earn certificate
  - Test lesson navigation and progress tracking
  - Verify certificate generation

- `apps/e2e/tests/critical-paths/assessment.spec.ts` - Assessment critical path tests
  - Navigate to assessment → complete survey → view results
  - Test question types (text, scale, etc.)
  - Verify results calculation and display

- `apps/e2e/tests/critical-paths/ai-canvas.po.ts` - AI Canvas Page Object
  - Encapsulates selectors and interactions with AI canvas UI
  - Methods for creating, editing, saving presentations
  - Methods for exporting/publishing

- `apps/e2e/tests/critical-paths/course.po.ts` - Course Page Object
  - Encapsulates course dashboard and lesson interactions
  - Methods for navigating lessons, tracking progress
  - Methods for verifying certificate state

- `apps/e2e/tests/critical-paths/assessment.po.ts` - Assessment Page Object
  - Encapsulates survey form interactions
  - Methods for answering question types
  - Methods for viewing and validating results

## Impact Analysis

### Scope & Impact
- **Medium scope**: Creates 3 new test files with comprehensive workflows (vs. simple page load checks)
- **Extends existing patterns**: Uses established Playwright patterns, Page Objects, auth utilities
- **Improved visibility**: Provides early warning if critical user workflows break
- **User-centric testing**: Tests actual product usage patterns, not just infrastructure
- **Builds foundation**: Sets patterns for testing other features in future

### Dependencies Affected
- **Playwright test framework** - Uses existing infrastructure
  - No new dependencies required
  - Extends existing test configuration
- **Test utilities** - Uses existing auth/wait helpers
  - May require enhancements to wait strategies for data loading
  - No breaking changes to existing utilities
- **Database/seeding** - Tests may require specific test data
  - Uses existing test user setup from global-setup
  - May need specific courses/assessments to exist in test database

### Risk Assessment
**Medium Risk** — Comprehensive tests with some complexity:
- Tests complex workflows with async operations (API calls, data loading)
- Requires reliable wait strategies to avoid flakiness
- Depends on specific test data (courses, assessments, presentations)
- May encounter timing issues with Suspense/loading states
- Page selectors may be fragile if UI structure changes

**Mitigations:**
- Use `toPass()` with custom intervals for unreliable operations
- Rely on `data-testid` attributes (more stable than selectors)
- Comprehensive error handling and logging
- Clear documentation of test assumptions
- Gradual rollout with monitoring

### Backward Compatibility
- No breaking changes
- Existing tests unaffected
- New tests are purely additive
- Can be added to CI/CD without disrupting current pipeline
- Can be disabled via `ENABLE_CRITICAL_PATH_TESTS` environment variable if needed

## Pre-Chore Checklist
Before starting implementation:
- [ ] Verify all critical path pages load correctly in local development
- [ ] Identify `data-testid` attributes on key interactive elements
- [ ] Confirm test user has access to all required features (personal account)
- [ ] Verify test courses/assessments exist in test database or seed them
- [ ] Review existing billing test for async/wait pattern best practices
- [ ] Check if AI Canvas, Course, and Assessment pages use Suspense/loading states
- [ ] Understand expected behavior for each critical path (happy path + error cases)

## Documentation Updates Required
- Update `.ai/ai_docs/context-docs/testing-and-quality/e2e-testing.md` with critical path test examples
- Add inline comments in test files documenting assumptions and wait strategies
- Create `CRITICAL_PATHS_TEST_GUIDE.md` documenting test purposes and maintenance
- Document any required test data setup (courses, assessments, presentations)
- Update package.json scripts documentation with new test:shard13 command

## Rollback Plan
If critical path tests fail:
1. **Immediate rollback**: Delete `apps/e2e/tests/critical-paths/` directory
2. **Revert package.json**: Remove `test:shard13` script
3. **No database changes**: No migrations or data changes made
4. **No dependencies**: New tests add no external dependencies
5. **Monitor CI**: Remove shard13 from GitHub Actions workflow if causing delays

## Step by Step Tasks

### 1. Analyze Critical Path Requirements
- [ ] Map complete AI Canvas workflow (workspace → create → edit → save → export)
- [ ] Map complete Course workflow (view → lessons → progress → certificate)
- [ ] Map complete Assessment workflow (take survey → view results → track progress)
- [ ] Document expected behavior at each step
- [ ] Identify success criteria and assertions for each path

### 2. Audit Application Structure for Test Data
- [ ] Check if test database has sample courses/assessments
- [ ] Verify test user account is properly configured in global-setup
- [ ] Confirm test user has team account access if needed
- [ ] Document any missing test data that needs seeding
- [ ] Create migration/seeding strategy if needed

### 3. Identify UI Selectors & Add Test IDs
- [ ] Review AI Canvas component structure for critical interactive elements
- [ ] Audit AI Canvas for `data-testid` attributes (add if missing)
  - Canvas editor toolbar
  - Save/export buttons
  - Presentation/slide management
- [ ] Review Course pages for `data-testid` attributes (add if missing)
  - Lesson list
  - Progress indicators
  - Certificate/completion status
- [ ] Review Assessment pages for `data-testid` attributes (add if missing)
  - Survey form fields
  - Submit button
  - Results display
- [ ] Document any fragile selectors that may need future updates

### 4. Create AI Canvas Page Object
- [ ] Create `apps/e2e/tests/critical-paths/ai-canvas.po.ts`
- [ ] Implement methods for:
  - Navigate to AI workspace
  - Create new presentation
  - Open AI canvas editor
  - Add/edit slide content
  - Save presentation
  - Access export/publish features
  - Handle loading states and Suspense boundaries
- [ ] Use `toPass()` for unreliable operations (API calls, async state updates)
- [ ] Document assumptions about test data and timing

### 5. Create Course Page Object
- [ ] Create `apps/e2e/tests/critical-paths/course.po.ts`
- [ ] Implement methods for:
  - Navigate to course dashboard
  - View course details
  - Access lesson list
  - Navigate to specific lesson
  - Track progress/completion status
  - View certificate
  - Handle loading states for lesson content
- [ ] Support different course states (not started, in progress, completed)
- [ ] Document certificate generation expectations

### 6. Create Assessment Page Object
- [ ] Create `apps/e2e/tests/critical-paths/assessment.po.ts`
- [ ] Implement methods for:
  - Navigate to assessment dashboard
  - Start survey/assessment
  - Answer different question types (text, scale, multiple choice)
  - Submit survey
  - View results summary
  - Handle validation errors
  - Support progress saving if applicable
- [ ] Account for different question types and responses
- [ ] Document expected results calculation

### 7. Implement AI Canvas Critical Path Tests
- [ ] Create `apps/e2e/tests/critical-paths/ai-canvas.spec.ts`
- [ ] Test 1: User can navigate to AI workspace
  - Verify workspace dashboard loads
  - Verify presentation list visible
  - Verify create presentation option available
- [ ] Test 2: User can create a new presentation
  - Create presentation with title
  - Verify presentation appears in workspace
  - Verify navigation to canvas editor
- [ ] Test 3: User can edit canvas content
  - Open presentation
  - Edit slide content
  - Verify changes persist (check in editor state)
- [ ] Test 4: User can save presentation
  - Make changes to presentation
  - Trigger save
  - Verify save success (via `toPass()` for async confirmation)
- [ ] Test 5: User can access export/publish features
  - Navigate to export functionality
  - Verify export options visible
  - Verify export button is enabled
- [ ] Handle async operations with `toPass()` and appropriate wait intervals
- [ ] Include error handling for network failures

### 8. Implement Course Critical Path Tests
- [ ] Create `apps/e2e/tests/critical-paths/course.spec.ts`
- [ ] Test 1: User can access course dashboard
  - Navigate to course section
  - Verify course list visible
  - Verify course cards with metadata
- [ ] Test 2: User can view course details
  - Select a course
  - Verify course header/title
  - Verify lesson list visible
- [ ] Test 3: User can navigate through lessons
  - Select first lesson
  - Verify lesson content loads
  - Navigate to next lesson
  - Verify lesson progress indicator updates
- [ ] Test 4: User can track progress through course
  - Complete multiple lessons
  - Verify progress bar/completion status updates
  - Check cumulative progress display
- [ ] Test 5: User can view certificate upon completion
  - Complete all course requirements
  - Navigate to certificate view
  - Verify certificate displays with user name and course title
- [ ] Handle lesson content loading with appropriate waits
- [ ] Account for potential course/lesson loading states

### 9. Implement Assessment Critical Path Tests
- [ ] Create `apps/e2e/tests/critical-paths/assessment.spec.ts`
- [ ] Test 1: User can access assessment/survey
  - Navigate to assessment section
  - Verify assessment available
  - Verify start button/link
- [ ] Test 2: User can answer different question types
  - Answer text field question
  - Answer scale/rating question
  - Verify responses are captured
- [ ] Test 3: User can submit survey
  - Complete all required questions
  - Submit survey
  - Verify submission success (via `toPass()` with async confirmation)
- [ ] Test 4: User can view assessment results
  - After submission, navigate to results
  - Verify results summary displays
  - Verify results match submitted answers
- [ ] Test 5: User can track assessment progress/metrics
  - Verify progress tracking visible
  - Verify metrics display correctly
  - Check comparison to previous results if applicable
- [ ] Handle form validation and error states
- [ ] Account for results calculation and display delays

### 10. Add Test Data Seeding (if needed)
- [ ] If test courses/assessments don't exist, create seeding strategy:
  - Add to global-setup.ts OR
  - Create separate seed script OR
  - Use API endpoints to create test data
- [ ] Verify test data is consistent across test runs
- [ ] Document seeding approach in test comments

### 11. Update Test Configuration
- [ ] Add `test:shard13` script to `apps/e2e/package.json`
- [ ] Ensure critical path tests are organized in `tests/critical-paths/` directory
- [ ] Update playwright.config.ts if needed to support new test shard
- [ ] Verify test timeout and worker settings are appropriate
- [ ] Add environment variable flag to optionally disable tests if needed

### 12. Implement Logging & Error Handling
- [ ] Add console logging at critical steps (navigation, form submission, results)
- [ ] Capture page state on test failure (screenshot already enabled in config)
- [ ] Log timing information for async operations
- [ ] Document expected vs. actual state on assertion failures
- [ ] Consider adding custom error messages for assertion failures

### 13. Test Reliability & Flakiness Fixes
- [ ] Run tests locally 5+ times to verify stability
- [ ] Use `toPass()` with exponential backoff for any unreliable assertions
- [ ] Adjust `navigationTimeout` and `expect.timeout` if tests are timing out
- [ ] Review wait strategies for loading states
- [ ] Document any known flakiness and mitigation strategies

### 14. Execute Validation Commands
Execute all validation commands to verify implementation:
- [ ] Run `pnpm --filter e2e test:shard13` locally (should pass all critical path tests)
- [ ] Run tests multiple times to verify stability
- [ ] Run `pnpm typecheck` to verify no TypeScript errors
- [ ] Run `pnpm lint --filter e2e` to verify code quality
- [ ] Verify no console errors during test execution
- [ ] Check test execution time (should be <3 minutes for all critical path tests)

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

```bash
# Run critical path tests locally
pnpm --filter e2e test:shard13

# Run with headed mode to watch tests execute
pnpm --filter e2e test:shard13 --headed

# Run tests multiple times for stability verification
for i in {1..3}; do echo "Run $i"; pnpm --filter e2e test:shard13 --quiet || break; done

# Verify TypeScript compilation for new test files
pnpm typecheck

# Run linter on test files
pnpm lint --filter e2e apps/e2e/tests/critical-paths

# Count total tests across critical path files
echo "AI Canvas tests: $(grep -c "test(" apps/e2e/tests/critical-paths/ai-canvas.spec.ts)"
echo "Course tests: $(grep -c "test(" apps/e2e/tests/critical-paths/course.spec.ts)"
echo "Assessment tests: $(grep -c "test(" apps/e2e/tests/critical-paths/assessment.spec.ts)"

# Verify no test.only left in code
grep -r "test.only" apps/e2e/tests/critical-paths/ || echo "✓ No test.only found"

# Check Page Objects are properly structured
grep -l "class.*PageObject" apps/e2e/tests/critical-paths/*.po.ts

# Run complete E2E suite including new tests (if needed)
pnpm --filter e2e test

# Verify tests don't leave stale state for other tests
# (run other shards to ensure no crosstalk)
pnpm --filter e2e test:shard1
```

## Notes

- **Test data dependencies**: Critical path tests require specific test data (courses, assessments, presentations) to exist. If test environment lacks this data, create seeding strategy in global-setup or separate seed script.

- **Async operations**: AI Canvas, Course lessons, and Assessment results may have async data loading. Use `toPass()` with custom intervals (e.g., `[1000, 2000, 4000, 8000]`) to handle timing variations.

- **Suspense boundaries**: Course and Assessment pages may use React Suspense. Use `waitForLoadState('networkidle')` or wait for specific content elements rather than spinners.

- **Pre-authenticated state**: Tests rely on global-setup creating authenticated browser state. Verify test user is properly logged in before each test.

- **Error recovery**: Some operations may fail transiently (network, server lag). Use `toPass()` to retry with exponential backoff rather than immediate failure.

- **CI considerations**: Critical path tests are more time-intensive than smoke tests. Consider adding to separate shard for parallel execution in CI.

- **Maintenance**: Keep Page Objects updated when UI structure changes. Lean on `data-testid` attributes for stability.

- **Documentation**: Each test should document its purpose, assumptions, and any known timing issues or environment dependencies.

- **Performance**: Monitor test execution time. If tests are slow, consider breaking into smaller test cases or running in parallel shards.

- **Monitoring**: After merge, monitor test success rate in CI. If flakiness appears, adjust wait strategies and timing intervals.
