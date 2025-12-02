# Bug Diagnosis: Payload CMS E2E Tests Fail Due to Missing Required Fields and Test Expectation Mismatches

**ID**: ISSUE-pending
**Created**: 2025-12-02T16:45:00Z
**Reporter**: system
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

8 E2E tests in Payload CMS shard 7 are failing due to two distinct root causes:

1. **CRUD operation tests (5 failures)**: Tests attempt to save posts without filling the required `content` (Lexical richText) field. The `fillRequiredFields()` method only fills simple input/textarea elements but cannot interact with Lexical editors, leaving the content field empty and the Save Draft button disabled.

2. **Database tests (3 failures)**: Tests expect `database.status` to be `"healthy"` but the actual API returns `"connected"`. This is a test expectation mismatch.

## Environment

- **Application Version**: Payload CMS 3.65.0
- **Environment**: development (localhost:3021)
- **Node Version**: v20+
- **Database**: PostgreSQL via Supabase
- **Last Working**: Unknown (tests may have always had these issues)

## Reproduction Steps

1. Run `/test --shard 7`
2. Observe 8 test failures across `payload-collections.spec.ts` and `payload-database.spec.ts`

## Expected Behavior

- CRUD tests should fill all required fields and successfully save posts
- Database tests should validate actual API response values

## Actual Behavior

- CRUD tests timeout waiting for disabled "Save Draft" button to become clickable
- Database tests fail assertion expecting "healthy" but receiving "connected"

## Diagnostic Data

### Console Output
```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('#action-save-draft')
    - locator resolved to <button disabled type="button" aria-disabled="true" id="action-save-draft">
  - attempting click action
    - element is not enabled
```

### Health API Response
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",  // Test expects "healthy"
    "lastCheck": "2025-12-02T13:58:53.105Z"
  }
}
```

### Screenshots
- Edit test failure: Shows form with empty Content field, Save Draft button greyed out
- Validation test: Shows "[Untitled]" post with all required fields empty

## Error Stack Traces
```
at PayloadCollectionsPage.saveItem (apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts:150:25)
  148 |
  149 | async saveItem() {
> 150 |   await this.saveButton.click();
```

## Related Code

### Affected Files
- `apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts:137-152` - `fillRequiredFields()` and `saveItem()` methods
- `apps/e2e/tests/payload/payload-collections.spec.ts:183-250` - CRUD tests
- `apps/e2e/tests/payload/payload-database.spec.ts:18-35` - Database connection test
- `apps/payload/src/collections/Posts.ts:65-79` - Content field definition (richText, required)

### Recent Changes
- Commit `9ee094895`: Fixed strict mode violation for save button selector (separate issue, now resolved)

### Suspected Functions
- `fillRequiredFields()` - Cannot handle Lexical editor fields
- Database test assertion - Expects wrong status string

## Related Issues & Context

### Direct Predecessors
- #847 (CLOSED): Strict mode violation for save button selector - **Now Fixed**
- #846 (CLOSED): Diagnosis that led to #847

### Historical Context
These failures were masked by the strict mode violation in #847. After fixing the selector issue, the underlying test problems are now visible.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two distinct bugs - (1) `fillRequiredFields()` cannot fill Lexical richText editors, leaving required `content` field empty which keeps Save Draft button disabled; (2) Database test asserts wrong expected value for `database.status`.

**Detailed Explanation**:

**Issue 1 - Lexical Editor Support**:
The `Posts` collection requires 3 fields: `title`, `slug`, and `content`. The `slug` auto-generates from `title`, so tests only need to fill `title` and `content`. However:

```typescript
// PayloadCollectionsPage.ts:137-146
async fillRequiredFields(data: Record<string, any>) {
  for (const [fieldName, value] of Object.entries(data)) {
    const field = this.page.locator(
      `input[name="${fieldName}"], textarea[name="${fieldName}"]`  // Only handles input/textarea
    );
    if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
      await field.fill(String(value));
    }
  }
}
```

The `content` field is a Lexical richText editor rendered as a `contenteditable` div, not an input/textarea. The selector never matches it, so content is never filled.

In Payload CMS with `versions.drafts: true`, the "Save Draft" button remains disabled until there are actual changes to save. With no content entered, there's nothing to save.

**Issue 2 - Wrong Expected Value**:
```typescript
// payload-database.spec.ts:33
expect(healthData.database.status).toBe("healthy");  // Expects "healthy"
// But API returns: { "database": { "status": "connected" } }
```

**Supporting Evidence**:
- Screenshot shows Save Draft button with `disabled` and `aria-disabled="true"` attributes
- Screenshot shows empty Content field with placeholder "Start typing, or press '/' for commands..."
- Health API curl confirms `database.status: "connected"` (not "healthy")
- Error logs show 223 retry attempts waiting for button to become enabled

### How This Causes the Observed Behavior

1. Test calls `fillRequiredFields({ title: "..." })`
2. Only `title` input is filled; `content` (Lexical editor) is ignored
3. Payload form has unfilled required field, keeps Save Draft disabled
4. Test calls `saveItem()` which clicks disabled button
5. Playwright waits 120 seconds for button to become enabled, then times out

### Confidence Level

**Confidence**: High

**Reasoning**:
- Screenshots directly show empty Content field and disabled Save Draft button
- Lexical editor uses contenteditable div, not input/textarea (confirmed in Posts.ts config)
- Health API response confirms "connected" vs "healthy" mismatch
- All evidence aligns with the identified root causes

## Fix Approach (High-Level)

### Issue 1 - CRUD Tests (5 failures)
Add Lexical editor support to `fillRequiredFields()` or create a separate `fillLexicalEditor()` method:

```typescript
// Option A: Add Lexical support
async fillLexicalContent(content: string) {
  const lexicalEditor = this.page.locator('[contenteditable="true"]').first();
  await lexicalEditor.click();
  await lexicalEditor.fill(content);
}

// Then in tests, call both:
await collectionsPage.fillRequiredFields({ title: "Test" });
await collectionsPage.fillLexicalContent("Test content");
```

### Issue 2 - Database Tests (3 failures)
Update test expectation to match actual API response:

```typescript
// Before
expect(healthData.database.status).toBe("healthy");

// After
expect(healthData.database.status).toBe("connected");
```

Or update the health endpoint to return "healthy" for consistency.

## Diagnosis Determination

Root causes identified with high confidence:

| Test Category | Count | Root Cause | Fix Complexity |
|--------------|-------|------------|----------------|
| CRUD Operations | 5 | Missing Lexical editor support in `fillRequiredFields()` | Medium |
| Database Tests | 3 | Test expectation mismatch ("healthy" vs "connected") | Simple |

Both issues are test-side bugs, not application bugs. The Payload CMS application is functioning correctly.

## Additional Context

### Failing Tests List
1. `should edit existing item` - Needs Lexical content
2. `should handle validation errors` - Needs Lexical content
3. `should delete item with confirmation` - Needs Lexical content (in setup)
4. `should recover from temporary network issues` - Cascading from above
5. `should verify database connection on startup` - Wrong expected value
6. `should verify UUID support for Supabase` - Needs Lexical content
7. `should handle transaction rollback on error` - Needs Lexical content
8. `should validate environment variables for database connection` - Related to health check

### Passing Tests (33)
Tests that don't require saving posts or use different collections pass successfully.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Glob, screenshot analysis*
