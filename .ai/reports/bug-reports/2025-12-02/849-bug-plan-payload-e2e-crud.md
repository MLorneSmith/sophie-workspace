# Bug Fix: Payload CMS E2E Tests Failing - Missing Lexical Editor Support and Health Check Assertion

**Related Diagnosis**: #848 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: (1) `fillRequiredFields()` method only handles input/textarea elements, not Lexical contenteditable divs, (2) Test expects `"healthy"` but API returns `"connected"`
- **Fix Approach**: Add Lexical editor support to page object and update health check assertion to match actual API response
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

8 E2E tests in Payload CMS are failing due to two distinct issues:

1. **CRUD Tests (5 failures)**: The `fillRequiredFields()` method in `PayloadCollectionsPage` only fills simple input/textarea elements. It cannot interact with Lexical richText editors (which render as `contenteditable` divs). This leaves the `content` field empty, causing the Save Draft button to remain disabled and tests to fail.

2. **Database Health Tests (3 failures)**: Tests expect `database.status` to be `"healthy"` but the actual API returns `"connected"`. This is a simple test assertion mismatch.

For full details, see diagnosis issue #848.

### Solution Approaches Considered

#### Option 1: Add Lexical Editor Support to Page Object ⭐ RECOMMENDED

**Description**: Extend the `fillRequiredFields()` method to detect and fill Lexical editors by locating contenteditable divs and using Playwright's rich text input methods. Also add a dedicated `fillLexicalContent()` helper method for explicit Lexical field filling.

**Pros**:
- Surgical, minimal changes - only modifies the page object
- Follows existing patterns in the codebase
- Reusable for all tests that need to fill Lexical fields
- Low risk - doesn't change test logic, only helper method
- Easy to maintain and extend in the future

**Cons**:
- Need to verify the correct Lexical selector works reliably
- May need to handle Lexical editor initialization timing

**Risk Assessment**: low - This is adding support for an editor type, not changing core test logic

**Complexity**: simple - Basic Playwright locator and fill operations

#### Option 2: Use Keyboard Navigation for Lexical

**Description**: Instead of filling the contenteditable div, use keyboard shortcuts or Tab navigation to move to the Lexical field and type content.

**Why Not Chosen**: More fragile (keyboard shortcuts can change), less reliable, and doesn't leverage Playwright's native contenteditable support

#### Option 3: Bypass Lexical Editor via API

**Description**: Create items directly via Payload API instead of using the UI, bypassing the need to fill the Lexical editor in tests.

**Why Not Chosen**: Defeats the purpose of E2E tests (they validate the entire UI flow), and Payload's API validation might differ from form validation

### Selected Solution: Add Lexical Editor Support to Page Object

**Justification**: This approach is surgical, reusable, maintainable, and directly addresses the root cause. It extends the existing page object pattern without changing test logic, and low-risk implementation since we're only adding helper methods.

**Technical Approach**:

1. **Add `fillLexicalContent()` method** to `PayloadCollectionsPage` class:
   - Locate the first `[contenteditable="true"]` div (the Lexical editor)
   - Click to focus it
   - Use Playwright's `.fill()` or `.type()` to input content
   - Ensure editor state is updated properly

2. **Enhance `fillRequiredFields()` method** to detect and handle Lexical editors:
   - For each field, first try the standard input/textarea selector
   - If not found, check for a contenteditable div related to that field
   - Use appropriate fill method based on editor type

3. **Fix health check assertion** in `payload-database.spec.ts`:
   - Change `expect(healthData.database.status).toBe("healthy")` to `expect(healthData.database.status).toBe("connected")`

**Architecture Changes** (if any):
- No architectural changes required
- Only extending page object with new helper methods
- Maintains separation of concerns (page objects handle UI interaction details)

## Implementation Plan

### Affected Files

- `apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts:137-152` - Enhance `fillRequiredFields()` and add `fillLexicalContent()`
- `apps/e2e/tests/payload/payload-collections.spec.ts:163-250` - CRUD tests will work once page object is fixed (no test changes needed)
- `apps/e2e/tests/payload/payload-database.spec.ts:18-35` - Fix health check assertion to expect `"connected"` instead of `"healthy"`

### New Files

No new files needed - only modifications to existing page object and test assertions.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add Lexical Editor Support to PayloadCollectionsPage

Modify `apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts`:

1. **Add `fillLexicalContent()` method** (after `fillRequiredFields()` method):
   - Locates the contenteditable Lexical editor div
   - Clicks to focus it
   - Uses Playwright's `.fill()` to set content
   - Can be called explicitly for Lexical fields

2. **Enhance `fillRequiredFields()` method** to detect Lexical editors:
   - For each field, first attempt to fill as input/textarea
   - If that fails (field not found), check for a contenteditable div
   - For contenteditable fields, use the `fillLexicalContent()` logic inline

**Why this step first**: Foundation work - must fix the page object before tests can pass

**Code snippet for implementation**:
```typescript
async fillLexicalContent(content: string) {
  const lexicalEditor = this.page.locator('[contenteditable="true"]').first();
  await lexicalEditor.click();
  await lexicalEditor.fill(content);
}

async fillRequiredFields(data: Record<string, any>) {
  for (const [fieldName, value] of Object.entries(data)) {
    // Try standard input/textarea first
    const field = this.page.locator(
      `input[name="${fieldName}"], textarea[name="${fieldName}"]`,
    );
    if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
      await field.fill(String(value));
      continue;
    }

    // If not found, this might be a Lexical editor
    // For 'content' field, try Lexical editor
    if (fieldName === 'content') {
      await this.fillLexicalContent(String(value));
    }
  }
}
```

#### Step 2: Fix Health Check Assertion in Database Tests

Modify `apps/e2e/tests/payload/payload-database.spec.ts` line 33:

**Change**:
```typescript
expect(healthData.database.status).toBe("healthy");
```

**To**:
```typescript
expect(healthData.database.status).toBe("connected");
```

**Why**: The actual Payload API returns `"connected"` for database status, not `"healthy"`. This is a test assertion fix to match the actual implementation.

#### Step 3: Add Regression Tests

Ensure the CRUD tests properly cover the Lexical editor scenario:

- Verify `fillRequiredFields()` with `content` field is called in at least 3 CRUD tests (already exists in tests, will now work)
- Verify health check assertions expect the correct status value
- Run tests to confirm all 8 previously failing tests now pass

#### Step 4: Validation

- Run all tests to ensure they pass
- Verify zero regressions in other test suites
- Confirm all Payload collection tests pass

## Testing Strategy

### Unit Tests

No unit tests needed - this is a page object modification. Page objects are tested through E2E tests.

### Integration Tests

Already exist and will be fixed by this change:
- CRUD tests that call `fillRequiredFields()` with content field
- Health check tests that verify database status

### E2E Tests

The following existing E2E tests in `payload-collections.spec.ts` will be fixed:

**Test files**:
- `apps/e2e/tests/payload/payload-collections.spec.ts` - Lines 163-180, 183-211, 213-228, 230-250

**Tests that will now pass**:
- ✅ "should create a new post" - Uses `fillRequiredFields()` with content
- ✅ "should edit existing item" - Uses `fillRequiredFields()`
- ✅ "should handle validation errors" - Attempts save without required fields
- ✅ "should delete item with confirmation" - Creates and deletes items
- ✅ "should verify UUID support for Supabase" - Creates post with `fillRequiredFields()`
- ✅ "should handle transaction rollback on error" - Uses `fillRequiredFields()`
- ✅ "should recover from temporary network issues" - Tests resilience
- ✅ "should verify database connection on startup" - Uses correct health status

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run test shard 7: `pnpm test:e2e -- --shard=7`
- [ ] Verify all 8 previously failing tests now pass
- [ ] Verify the "should create a new post" test completes successfully
- [ ] Verify the "should verify database connection on startup" test passes
- [ ] Check Payload CMS admin UI to confirm posts were created with content
- [ ] Verify browser console has no new errors during test execution
- [ ] Run full Payload test suite to ensure no regressions in other collections

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Lexical Editor Selector Reliability**: The contenteditable selector might match unintended elements if Payload's editor structure changes
   - **Likelihood**: low (Payload uses standard HTML contenteditable pattern)
   - **Impact**: medium (tests would fail if selector breaks)
   - **Mitigation**: Use more specific selectors if needed (e.g., `[contenteditable="true"][data-field="content"]`), add debug logging to identify elements

2. **Timing Issues with Lexical**: The Lexical editor might need additional time to initialize before accepting input
   - **Likelihood**: low (Payload editor initializes quickly)
   - **Impact**: medium (tests could become flaky)
   - **Mitigation**: Add explicit wait for editor to be editable, use `.toPass()` wrapper for reliability

3. **Health Check API Behavior Change**: Future Payload versions might change the health status value again
   - **Likelihood**: very low (health status is stable API contract)
   - **Impact**: low (easy to update test)
   - **Mitigation**: Add comment explaining the expected value, monitor Payload changelog

**Rollback Plan**:

If this fix causes issues in test execution:

1. Revert the page object changes in `PayloadCollectionsPage.ts`
2. Revert the assertion change in `payload-database.spec.ts`
3. Run tests to confirm they return to original state
4. Investigate alternative Lexical selector or timing issue

**Monitoring** (if needed):

- Monitor test execution logs for contenteditable selector issues
- Track if health check status changes in future Payload versions
- Monitor test flakiness rate for Lexical-dependent tests

## Performance Impact

**Expected Impact**: none

The changes only affect test helper methods and assertions. No performance impact on the application itself.

## Security Considerations

No security implications. This is purely a test infrastructure change.

**Security Impact**: none

## Validation Commands

### Before Fix (Bugs Should Reproduce)

```bash
# Run test shard 7 to see all 8 failures
pnpm test:e2e -- --shard=7

# Expected Result: 8 failing tests related to Lexical content and health check
```

### After Fix (Bugs Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run test shard 7 specifically
pnpm test:e2e -- --shard=7

# Run full E2E test suite for Payload
pnpm test:e2e -- apps/e2e/tests/payload/

# Build to verify no type errors
pnpm build
```

**Expected Result**: All commands succeed, all 8 tests pass, zero regressions.

## Dependencies

**No new dependencies required** - Only uses Playwright's built-in APIs.

## Database Changes

**No database changes required** - This is purely a test infrastructure fix.

## Deployment Considerations

**Deployment Risk**: none

This is a test-only change. No code changes to production application.

**Backwards compatibility**: maintained (no public API changes)

## Success Criteria

The fix is complete when:

- [ ] `PayloadCollectionsPage.ts` has `fillLexicalContent()` method
- [ ] `fillRequiredFields()` method handles both input/textarea and Lexical editors
- [ ] `payload-database.spec.ts` assertion expects `"connected"` instead of `"healthy"`
- [ ] All 8 previously failing tests now pass
- [ ] `pnpm test:e2e -- --shard=7` shows 0 failures
- [ ] No new test failures introduced in other test suites
- [ ] Code passes lint and type checking
- [ ] All validation commands complete successfully

## Notes

- The diagnosis issue #848 identified that Lexical editors render as `contenteditable="true"` divs, not input/textarea elements
- The Posts collection requires `title`, `slug` (auto-generated), and `content` fields
- Tests at lines 163-180, 183-211, 230-250 in payload-collections.spec.ts will be fixed by this change
- Database health check is a Payload API feature that provides status: `"connected"` (not `"healthy"`)
- See apps/e2e/CLAUDE.md for E2E testing patterns and the Page Object pattern used in this project

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #848*
