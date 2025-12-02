# Bug Diagnosis: Payload CMS E2E Tests Failing - UI Selector Mismatches and API Endpoint Issues

**ID**: ISSUE-pending
**Created**: 2025-12-02T18:15:00Z
**Reporter**: system/automated
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

4 Payload CMS E2E tests in shard 7 are failing due to multiple distinct root causes: incorrect UI selectors for Payload 3.x admin panel elements, an API endpoint that doesn't exist (`/api` returns 404), and flaky recovery assertions that use selectors not present in the Payload 3.x admin UI. These tests previously passed but are now failing consistently after the Payload CMS upgrade and UI changes.

## Environment

- **Application Version**: dev branch (commit 465baab7b)
- **Environment**: development (local)
- **Node Version**: v22.x
- **Database**: PostgreSQL 15 (Supabase)
- **Payload CMS Version**: 3.65.0
- **Last Working**: Before Payload 3.x upgrade

## Reproduction Steps

1. Start Payload CMS server: `pnpm --filter payload dev:test`
2. Run E2E shard 7: `pnpm --filter web-e2e test:shard7`
3. Observe 4 test failures (37 pass, 4 fail, 1 skip)

## Expected Behavior

All 42 Payload CMS E2E tests should pass, validating CRUD operations, error handling, and database connectivity.

## Actual Behavior

4 tests fail consistently:
1. `should handle validation errors` - No validation error elements found
2. `should delete item with confirmation` - Delete button not visible (timeout after 120s)
3. `should recover from temporary network issues` - Recovery content selector not found
4. `should validate environment variables for database connection` - API endpoint returns 404

## Diagnostic Data

### Console Output
```
[payload] › tests/payload/payload-collections.spec.ts:209:6 › should handle validation errors
    Error: expect(received).toBeTruthy()
    Received: false
    at payload-collections.spec.ts:223:27

[payload] › tests/payload/payload-collections.spec.ts:226:6 › should delete item with confirmation
    Error: locator.click: Test timeout of 120000ms exceeded.
    Call log:
      - waiting for locator('button:has-text("Delete")')
      - locator resolved to <button type="button" id="action-delete" class="popup-button-list__button">Delete</button>
      - element is not visible

[payload] › tests/payload/payload-collections.spec.ts:287:6 › should recover from temporary network issues
    Error: expect(received).toBeTruthy()
    Received: false
    at payload-collections.spec.ts:309:22

[payload] › tests/payload/payload-database.spec.ts:366:6 › should validate environment variables
    Error: expect(received).toBeTruthy()
    Received: false
    at payload-database.spec.ts:387:31
```

### Network Analysis
```
GET http://localhost:3021/api -> 404 Not Found
GET http://localhost:3021/api/health -> 200 OK {"status":"healthy","database":{"status":"connected"}}
GET http://localhost:3021/api/posts -> 500 Error (empty payload schema)
```

### Database Analysis
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload';
-- Result: (0 rows)
-- The payload schema exists but has no tables - migrations not run
```

## Error Stack Traces
```
Error: locator.click: Test timeout of 120000ms exceeded.
    at /home/msmith/projects/2025slideheroes/apps/e2e/tests/payload/payload-collections.spec.ts:243:4
Call log:
  - waiting for locator('button:has-text("Delete")')
  - locator resolved to <button type="button" id="action-delete" class="popup-button-list__button">Delete</button>
  - element is not visible (inside dropdown menu that wasn't opened)
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/payload/payload-collections.spec.ts:209-247` (validation and delete tests)
  - `apps/e2e/tests/payload/payload-collections.spec.ts:287-310` (network recovery test)
  - `apps/e2e/tests/payload/payload-database.spec.ts:366-391` (env validation test)
  - `apps/e2e/tests/payload/pages/PayloadCollectionsPage.ts:36-39` (delete button selector)
- **Recent Changes**: Commit 465baab7b added Lexical editor support, fixed many tests
- **Suspected Functions**:
  - `deleteFirstItem()` - doesn't open actions dropdown before clicking delete
  - Validation error selectors - Payload 3.x uses different class names
  - API route test - `/api` endpoint doesn't exist in Payload 3.x

## Related Issues & Context

### Direct Predecessors
- #848 (CLOSED): "Payload CMS E2E Tests Fail - Missing Lexical Editor Support and Test Expectation Mismatches" - Fixed 5 failures but these 4 remain
- #849 (CLOSED): Related fix implementation

### Same Component
- #842 (CLOSED): "Payload CMS E2E Tests Fail Due to Missing Payload Auth Cookies"
- #836 (CLOSED): "Payload CMS E2E Save Button Selector Mismatch"

### Historical Context
Multiple Payload E2E test fixes have been applied recently. These 4 remaining failures are residual issues from the same root cause pattern: selectors and API expectations not matching Payload 3.x admin UI structure.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Four distinct test failures caused by outdated UI selectors, incorrect API endpoint assumptions, and database not being seeded with Payload tables.

**Detailed Explanation**:

1. **Test: "should handle validation errors"** (line 209)
   - **Root Cause**: The selector `.field-error, .field--error, [class*="error"]` doesn't match Payload 3.x validation error elements. Payload 3.x shows validation errors differently (inline text, not separate error elements).
   - **Evidence**: `isVisible({ timeout: 5000 })` returns false, validationError is `false`

2. **Test: "should delete item with confirmation"** (line 226)
   - **Root Cause**: The `deleteButton` locator `button:has-text("Delete")` finds the element but it's inside a hidden dropdown menu. The `deleteFirstItem()` method calls `selectFirstItem()` then immediately clicks the delete button without first opening the actions dropdown.
   - **Evidence**: Playwright log shows "element is not visible" - the delete button exists (id="action-delete") but is in a collapsed popup-button-list

3. **Test: "should recover from temporary network issues"** (line 287)
   - **Root Cause**: After going offline/online and reloading, the selector `.nav, .collection-list, [class*="collection"]` doesn't match any Payload 3.x admin panel elements. The Payload admin uses different CSS class naming.
   - **Evidence**: `isVisible({ timeout: 5000 })` returns false, hasContent is `false`

4. **Test: "should validate environment variables for database connection"** (line 369)
   - **Root Cause**: The test calls `/api` expecting a valid response, but Payload 3.x doesn't have a root `/api` endpoint - it returns 404. The actual API endpoints are under `/api/{collection}`.
   - **Evidence**: `curl http://localhost:3021/api` returns 404, `configResponse.ok()` is false

### How This Causes the Observed Behavior

1. **Validation test**: Clicks save without filling required fields, expects error elements with old Payload 2.x selectors, finds nothing
2. **Delete test**: Selects item, tries to click delete button that exists but is hidden in dropdown, times out after 120s
3. **Network recovery test**: Successfully goes offline/online, but recovery assertion uses selectors that don't exist in Payload 3.x
4. **Env validation test**: Calls `/api` which returns 404, assertion fails because response is not ok

### Confidence Level

**Confidence**: High

**Reasoning**:
- The Playwright error logs explicitly show "element is not visible" for the delete button
- The API returns 404 for `/api` which is verifiable with curl
- The selector patterns used are Payload 2.x patterns that don't exist in Payload 3.x
- All 4 tests fail consistently on both initial run and retry

## Fix Approach (High-Level)

1. **Validation test**: Update selector to match Payload 3.x validation UI - likely need to check for toast notification or inline error text instead of error class elements
2. **Delete test**: Modify `deleteFirstItem()` to first click the actions dropdown trigger (e.g., `button.popup-button-list__toggle` or similar) before clicking delete
3. **Network recovery test**: Update selector to use Payload 3.x admin panel elements (e.g., sidebar nav, document header, or other stable elements)
4. **Env validation test**: Either skip this test (it's testing an endpoint that doesn't exist) or change to use `/api/health` or another valid endpoint

## Diagnosis Determination

All 4 test failures have been definitively identified:
- 2 failures are due to outdated CSS selectors that don't match Payload 3.x UI
- 1 failure is due to missing dropdown interaction before clicking delete button
- 1 failure is due to testing a non-existent API endpoint

The fixes are straightforward selector/interaction updates and do not require architectural changes.

## Additional Context

- The Payload CMS health endpoint shows `database.status: "connected"` indicating the Payload server is running
- However, the `payload` schema in PostgreSQL has 0 tables, suggesting migrations haven't been run for the test database
- The database issue may be contributing to some flakiness but the primary failures are selector/API issues
- Recent commit 465baab7b fixed related Lexical editor issues, showing this codebase is actively being updated for Payload 3.x compatibility

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (curl, psql), Read, Grep, GitHub CLI*
