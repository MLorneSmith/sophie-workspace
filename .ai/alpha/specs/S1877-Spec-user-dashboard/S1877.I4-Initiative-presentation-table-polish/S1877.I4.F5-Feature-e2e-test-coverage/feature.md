# Feature: E2E Test Coverage

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I4 |
| **Feature ID** | S1877.I4.F5 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 5 |

## Description

Creates comprehensive E2E test coverage for the presentation table widget and dashboard integration. Tests verify table rendering, sorting, filtering, pagination, empty/loading states, and accessibility. Ensures confidence in functionality before launch.

## User Story

**As a** QA Engineer

**I want to** automated tests that verify presentation table functionality

**So that** I can catch regressions early and ensure the feature works as designed

## Acceptance Criteria

### Must Have
- [ ] Test for dashboard page load with presentation table visible
- [ ] Test for table displaying user's presentations (with seeded data)
- [ ] Test for sorting by all columns (title asc/desc, type asc/desc, updated asc/desc)
- [ ] Test for filtering by presentation type
- [ ] Test for pagination (next, previous, page numbers)
- [ ] Test for empty state (no presentations) displays correctly
- [ ] Test for loading state (skeleton) displays during fetch
- [ ] Test for Edit Outline button navigation to storyboard page
- [ ] Test for RLS isolation (user A cannot see user B's presentations)
- [ ] Tests use Page Object pattern following project E2E conventions

### Nice to Have
- [ ] Test for URL state persistence (sort/filter/page)
- [ ] Test for mobile responsive behavior (table scrolling)
- [ ] Performance test (table renders under 3s)

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **Testing** | PresentationTablePageObject | New |
| **Testing** | Test data fixtures | New |
| **Testing** | E2E test suite | New |

## Architecture Decision

**Approach**: Pragmatic

**Rationale**: Follow existing E2E patterns from the project (`apps/e2e/tests/`). Create Page Object for presentation table for reusable test actions. Use test fixtures to seed presentations for different scenarios (empty, populated, large dataset).

### Key Architectural Choices

1. **Page Object Pattern**: Create `PresentationTablePageObject` class with methods for sorting, filtering, pagination.
2. **Test Fixtures**: Create test data for empty state, normal state (10 items), and pagination state (15+ items).
3. **Data Seeding**: Use existing test bootstrap patterns to create test users with presentations.
4. **Assertion Strategy**: Use `expect()` for state verification, `toPass()` for flaky operations.
5. **Test Organization**: Group related tests (rendering, sorting, filtering, pagination).

### Trade-offs Accepted

- **Test data not production data**: Tests use seeded test data, not real user presentations.
- **No visual regression testing**: Focus on functional testing rather than pixel-perfect visual matching (covered by accessibility tests).

## Required Credentials

None required.

## Dependencies

### Blocks
- None

### Blocked By
- S1877.I4.F1 (Presentation Table Widget) - Requires component to test
- S1877.I4.F4 (Accessibility Audit) - Accessibility findings may inform test cases

### Parallel With
- None (depends on F1)

## Files to Create/Modify

### New Files
- `apps/e2e/tests/user/presentation-table-page-object.ts` - Page Object for presentation table
- `apps/e2e/tests/user/presentation-table.spec.ts` - Main E2E test suite
- `apps/e2e/fixtures/presentation-table-fixtures.ts` - Test data fixtures

### Modified Files
- None (test files only)

## Task Hints

### Candidate Tasks

1. **Create Page Object**: Define PresentationTablePageObject with methods for table interactions
2. **Create test fixtures**: Define presentation data for empty/normal/pagination states
3. **Write render tests**: Verify table displays correctly with seeded data
4. **Write sorting tests**: Verify all columns sort correctly in both directions
5. **Write filtering tests**: Verify type filter works (each type, "All")
6. **Write pagination tests**: Verify next/prev navigation, page numbers
7. **Write state tests**: Verify empty state and loading skeleton
8. **Write navigation tests**: Verify Edit Outline buttons navigate correctly
9. **Write RLS tests**: Verify user isolation (user A cannot see user B's data)
10. **Write mobile tests**: Verify horizontal scroll on small screens

### Suggested Order

1. Create Page Object and fixtures
2. Write rendering tests
3. Write sorting tests
4. Write filtering tests
5. Write pagination tests
6. Write state tests
7. Write navigation tests
8. Write RLS tests
9. Write mobile tests
10. Run full test suite and verify all pass

## Validation Commands

```bash
# Run presentation table E2E tests
pnpm --filter web-e2e test presentation-table

# Run specific test file
pnpm --filter web-e2e test user/presentation-table.spec.ts

# Run tests with debug mode
pnpm --filter web-e2e test presentation-table --debug

# Run tests in specific shard (if using sharding)
pnpm --filter web-e2e test:shard* presentation-table
```

## Related Files
- Initiative: `../initiative.md`
- F1-F4: All prior features in this initiative
- E2E conventions: `apps/e2e/CLAUDE.md`
- Accessibility tests: `apps/e2e/tests/accessibility/accessibility-hybrid.spec.ts` (reference)
- Tasks: `./tasks.json` (created in next phase)
