# Bug Fix: Payload E2E Transaction Rollback Test Selector Mismatch

**Related Diagnosis**: #856 (REQUIRED)
**Severity**: medium
**Bug Type**: testing
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Playwright text locator uses exact string match but Payload 3.x renders error message with trailing period
- **Fix Approach**: Update text selector to use regex or partial match to account for punctuation variations
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2E test `should handle transaction rollback on error` in `payload-database.spec.ts:177-181` fails despite the expected error message being visible on the screen. The test uses exact-match Playwright text selectors that don't account for Payload 3.x's actual error message formatting.

**Specific Issue**:
- Selector expects: `"A user with the given email is already registered"`
- Payload renders: `"A user with the given email is already registered."` (WITH trailing period)
- Playwright `text=` with exact quotes performs strict string matching, causing the selector to fail

For full details, see diagnosis issue #856.

### Solution Approaches Considered

#### Option 1: Use Regex Match Pattern ⭐ RECOMMENDED

**Description**: Replace exact-match text locator with regex pattern that ignores trailing punctuation

```typescript
page.locator('text=/A user with the given email is already registered/')
```

**Pros**:
- Robust to punctuation variations (periods, exclamation marks)
- Single source of truth for error message text
- Handles internationalization punctuation differences
- Clearest intent: "find text containing this message"

**Cons**:
- Regex escaping needed for special characters (handled by `/` delimiters)

**Risk Assessment**: Low - Regex is well-supported in Playwright, no side effects

**Complexity**: Simple - Single character change

#### Option 2: Use Partial String Match with `getByText`

**Description**: Use Playwright's `getByText()` method with `exact: false` for partial matching

```typescript
page.getByText('already registered', { exact: false })
```

**Pros**:
- More concise than regex
- Doesn't require escaping special characters
- Playwright's recommended approach for user-visible text

**Cons**:
- Partial match could match unrelated text containing the substring
- Less specific than regex

**Why Not Chosen**: Less precise - could accidentally match similar error messages containing "already registered" from other parts of the application

#### Option 3: Use CSS Class Selectors Only

**Description**: Remove text selector entirely, rely on CSS class selector `[class*="error"]`

```typescript
// Only keep: page.locator('[class*="error"]')
```

**Why Not Chosen**: Too generic - would match any element with "error" in class name, not validating specific error message content

### Selected Solution: Regex Match Pattern (Option 1)

**Justification**: This approach is robust, explicit, and exactly solves the root cause. Regex patterns are the idiomatic way to handle punctuation variations in Playwright. The `.../` delimiters make the intent clear and don't require escaping in this case.

**Technical Approach**:
- Replace exact-match text locator with regex pattern
- Use `/pattern/` syntax to match text containing the pattern (ignores punctuation)
- Keep fallback selectors for robustness
- Maintain the loop structure for trying multiple error messages

**Architecture Changes**: None - purely local test fix

**Migration Strategy**: N/A - no data or code migration needed

## Implementation Plan

### Affected Files

- `apps/e2e/tests/payload/payload-database.spec.ts` - Update line 178 to use regex pattern for error message matching

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Error Message Selector

Update the Playwright text locator to use regex pattern that tolerates punctuation:

- Change line 178 from exact match to regex pattern
- Use `text=/pattern/` syntax for regex matching
- Keep existing fallback selectors intact

**Why this step first**: This is the core fix that directly addresses the root cause identified in the diagnosis.

#### Step 2: Verify Test Execution

Run the E2E test to confirm the fix resolves the issue:

- Execute E2E shard 7: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 7`
- Verify the transaction rollback test passes
- Verify all other tests in shard 7 still pass (no regressions)

#### Step 3: Add Comment for Future Maintainers

Add a brief inline comment explaining the regex pattern choice:

- Document why regex is used (punctuation tolerance)
- Reference the diagnosis issue for context
- Keep comment concise (1-2 lines)

#### Step 4: Validation

- Run full E2E test suite to ensure no regressions
- Verify linting passes
- Confirm test passes consistently across multiple runs

## Testing Strategy

### Unit Tests

Not applicable - this is a test file fix, not production code.

### Integration Tests

Not applicable.

### E2E Tests

The test itself validates the fix:
- **Test**: `should handle transaction rollback on error` in `payload-database.spec.ts`
- **Validates**: Error message appears when duplicate email is submitted
- **Validates**: Duplicate user is not created in database

**Test file**: `apps/e2e/tests/payload/payload-database.spec.ts` (lines 160-199)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run E2E shard 7: `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 7`
- [ ] Verify the transaction rollback test passes (previously failing, now passing)
- [ ] Verify all 43 tests in the shard pass
- [ ] Run the full E2E test suite: `pnpm test:e2e`
- [ ] Verify no new test failures
- [ ] Verify linting passes: `pnpm lint`
- [ ] Verify formatting is correct: `pnpm format`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Regex Matching Too Broad**: Regex pattern could match similar error messages from other parts of system
   - **Likelihood**: low
   - **Impact**: low - test would pass when it shouldn't
   - **Mitigation**: Keep fallback CSS selector and test continues to next option if regex doesn't match; review other error messages in Payload CMS to ensure uniqueness

2. **Playwright Regex Syntax**: Incorrect regex syntax breaks the selector
   - **Likelihood**: very low - simple regex pattern, no special characters needed
   - **Impact**: low - test fails immediately, easy to debug
   - **Mitigation**: Test immediately after change; validate regex syntax in Playwright documentation

**Rollback Plan**:

If this fix causes issues:
1. Revert to the original exact-match selector
2. Consider using CSS class selector only as fallback
3. Investigate alternative punctuation handling approaches

**Monitoring**: None needed - this is a test fix with immediate validation

## Performance Impact

**Expected Impact**: none

No performance implications - this is a test selector update with no impact on production code.

## Security Considerations

**Security Impact**: none

No security implications - purely a test fix.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run E2E shard 7 to reproduce the failing test
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 7
```

**Expected Result**: Test `should handle transaction rollback on error` fails with error about selector not finding the element

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run E2E shard 7
bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 7

# Run full E2E test suite
pnpm test:e2e
```

**Expected Result**: All commands succeed, transaction rollback test passes, zero regressions in other tests.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:e2e

# Run shard 7 multiple times to ensure no flakiness
for i in {1..3}; do
  bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh 7
  echo "Run $i completed"
done
```

## Dependencies

### New Dependencies

No new dependencies required.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

This is a test fix only - no impact on production deployment.

**Backwards compatibility**: maintained - no breaking changes

## Success Criteria

The fix is complete when:
- [ ] Line 178 in `payload-database.spec.ts` uses regex pattern
- [ ] E2E shard 7 passes (all 43 tests)
- [ ] Full E2E test suite passes
- [ ] Zero regressions detected
- [ ] Test passes consistently on multiple runs
- [ ] Code is properly formatted and linted

## Notes

This is a straightforward fix addressing a common issue with E2E test selectors: exact-match text locators breaking when UI content has minor formatting variations. The regex approach is idiomatic in Playwright and provides robust matching without being overly permissive.

**Similar patterns in codebase**: Review other exact-match text selectors in E2E tests for similar issues (see #854 for related selector mismatches).

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #856*
