# Bug Diagnosis: Payload CMS Database Port Mismatch Causes /home/course Page Failure

**ID**: ISSUE-705
**Created**: 2025-11-26T15:05:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: error

## Summary

The `/home/course` page fails to load because Payload CMS cannot connect to PostgreSQL. The root cause is a database port mismatch: Payload is configured to connect to port **54322** (`.env.development`), but the local Supabase database is running on port **54522** (as configured in `apps/web/supabase/config.toml`). This port change was made previously to avoid Windows Hyper-V port reservation conflicts, but the Payload CMS configuration was not updated accordingly.

## Environment

- **Application Version**: dev branch (commit 1fb16ffd1)
- **Environment**: development
- **Browser**: Chrome 142
- **Node Version**: 22.16.0
- **Database**: PostgreSQL 17 (via Supabase local)
- **Supabase CLI**: v2.62.5
- **Last Working**: Unknown (after Supabase port migration)

## Reproduction Steps

1. Start the development servers with `pnpm dev`
2. Navigate to `http://localhost:3000/home/course`
3. Observe error page or empty content
4. Check server logs for `ECONNREFUSED 127.0.0.1:54322` error

## Expected Behavior

The `/home/course` page should load and display published courses fetched from Payload CMS.

## Actual Behavior

The page fails to render courses. The Payload CMS server crashes with connection refused error, and the web app shows a fetch error when trying to call the Payload API.

## Diagnostic Data

### Console Output

```
payload:dev: [10:05:04] ERROR: Error: cannot connect to Postgres. Details: connect ECONNREFUSED 127.0.0.1:54322
payload:dev:     err: {
payload:dev:       "type": "Error",
payload:dev:       "message": "connect ECONNREFUSED 127.0.0.1:54322",
payload:dev:       "code": "ECONNREFUSED",
payload:dev:       "syscall": "connect",
payload:dev:       "address": "127.0.0.1",
payload:dev:       "port": 54322
payload:dev:     }
```

### Web App Error

```
web:dev: [PAYLOAD-API-ERROR] 2025-11-26T15:05:04.826Z API Error: courses?where[status][equals]=published&depth=1 {
web:dev:   error: TypeError: fetch failed
web:dev:       at async callPayloadAPI (../../packages/cms/payload/src/api/payload-api.ts:52:20)
web:dev:       at async CoursePage (app/home/(user)/course/page.tsx:41:22)
web:dev:     [cause]: Error [SocketError]: other side closed
```

### Database Configuration Analysis

**Supabase Config** (`apps/web/supabase/config.toml`):
```toml
[db]
# Port to use for the local database URL.
# Changed from 54322 to avoid Windows Hyper-V port reservation conflicts (54265-54464 range)
port = 54522
```

**Payload Development Config** (`apps/payload/.env.development`):
```
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres?schema=payload&sslmode=disable
```

**Actual Supabase Status**:
```
Database URL: postgresql://postgres:postgres@127.0.0.1:54522/postgres
```

### Port Mismatch Summary

| Component | Configured Port | Actual Port | Status |
|-----------|-----------------|-------------|--------|
| Supabase PostgreSQL | 54522 | 54522 | Running |
| Payload CMS (development) | 54322 | N/A | Connection Refused |

## Error Stack Traces

```
Error: connect ECONNREFUSED 127.0.0.1:54322
    at /home/msmith/projects/2025slideheroes/node_modules/.pnpm/pg-pool@3.10.1_pg@8.16.3/node_modules/pg-pool/index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async connectWithReconnect (file:///.../@payloadcms+db-postgres@3.64.0.../dist/connect.js:7:18)
    at async Object.connect (file:///.../@payloadcms+db-postgres@3.64.0.../dist/connect.js:46:13)
    at async BasePayload.init (file:///.../payload@3.64.0.../dist/index.js:360:13)
```

## Related Code

- **Affected Files**:
  - `apps/payload/.env.development` - Incorrect DATABASE_URI port
  - `apps/payload/.env` - Also has incorrect port (54522 vs actual)
  - `apps/web/app/home/(user)/course/page.tsx:41` - CoursePage that calls Payload API
  - `packages/cms/payload/src/api/payload-api.ts:52` - API call that fails

- **Recent Changes**:
  - Supabase port was changed from 54322 to 54522 to avoid Windows Hyper-V conflicts
  - See: `.ai/specs/diagnosis-docker-port-54322-hyperv-reservation.md`

- **Suspected Functions**:
  - `callPayloadAPI()` in `packages/cms/payload/src/api/payload-api.ts`
  - `CoursePage()` in `apps/web/app/home/(user)/course/page.tsx`

## Related Issues & Context

### Direct Predecessors

- `.ai/specs/diagnosis-docker-port-54322-hyperv-reservation.md` - Documents the original Hyper-V port conflict that led to port changes

### Infrastructure Issues

- Windows Hyper-V reserves ports 54265-54464, requiring Supabase to use ports outside this range

### Historical Context

The Supabase configuration was migrated from ports 54321/54322 to 54521/54522 to resolve Windows Hyper-V conflicts. However, the Payload CMS development configuration files were not updated to reflect this change.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Payload CMS `.env.development` file references the old PostgreSQL port (54322) while Supabase is running on the new port (54522).

**Detailed Explanation**:
When Supabase was migrated to avoid Windows Hyper-V port conflicts, the `apps/web/supabase/config.toml` was updated to use port 54522 for PostgreSQL. However, the `apps/payload/.env.development` file still contains:
```
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres?schema=payload&sslmode=disable
```

When `pnpm dev` starts the Payload server, it reads this configuration and attempts to connect to port 54322, which has nothing listening. This causes the `ECONNREFUSED` error, Payload crashes, and any pages that depend on Payload API (like `/home/course`) fail.

**Supporting Evidence**:
- Stack trace explicitly shows `connect ECONNREFUSED 127.0.0.1:54322`
- `npx supabase status` confirms database is on port 54522
- `apps/payload/.env.development:7` shows `DATABASE_URI=...localhost:54322...`
- `apps/web/supabase/config.toml:21` shows `port = 54522`

### How This Causes the Observed Behavior

1. User runs `pnpm dev` which starts both web and payload apps
2. Payload CMS loads `.env.development` with port 54322
3. Payload's `@payloadcms/db-postgres` adapter tries to connect to 127.0.0.1:54322
4. Connection refused because Supabase PostgreSQL is on port 54522
5. Payload server crashes with exit code 1
6. Web app's `/home/course` page calls Payload API at `http://localhost:3020/api/courses`
7. Since Payload is down, the fetch fails with "other side closed" socket error
8. Page fails to render course data

### Confidence Level

**Confidence**: High

**Reasoning**: The error message explicitly states the exact port (54322) and the exact error (ECONNREFUSED). The configuration files clearly show the mismatch. This is not a symptom of a deeper issue - it's a direct cause-and-effect configuration problem.

## Fix Approach (High-Level)

Update `apps/payload/.env.development` (line 7) to use port 54522 instead of 54322:
```
DATABASE_URI=postgresql://postgres:postgres@localhost:54522/postgres?schema=payload&sslmode=disable
```

Also verify and update any other `.env*` files in `apps/payload/` that may have the incorrect port.

## Tests That Should Fail

The following E2E tests access `/home/course` and should fail when this bug is present:

1. **`apps/e2e/tests/accessibility/accessibility-hybrid.spec.ts`** - Line 98-99:
   ```typescript
   test("Course pages accessibility", async ({ page }) => {
     await page.goto("/home/course");
   ```

2. **`apps/e2e/tests/payload/payload-collections.spec.ts`** - Tests Payload course collections

3. **`apps/e2e/tests/payload/seeding.spec.ts`** - Tests Payload seeding including courses

Note: These tests require Payload CMS to be running, which it cannot do with the port mismatch.

## Visual Inspection Tools for Claude Code

To enable Claude Code to visually inspect web pages during debugging:

### Option 1: Use the webapp-testing Skill (Recommended)

```bash
# Available in your project via example-skills plugin
/example-skills:webapp-testing
```

This skill provides:
- Playwright-based browser automation
- Screenshot capture for visual verification
- Console log capture
- Element discovery

### Option 2: Enable Playwright MCP Server

The project has Playwright MCP configured but may need activation:

```bash
# Add to Claude Code
claude mcp add-json "playwright-mcp" '{"command":"uvx","args":["playwright-mcp"]}'
```

### Option 3: Manual Screenshot in Tests

Add screenshot capture to failing tests:
```typescript
await page.screenshot({ path: '/tmp/course-page-debug.png' });
```

## Diagnosis Determination

This is a **configuration drift bug** caused by incomplete propagation of infrastructure changes. When the Supabase ports were migrated to avoid Hyper-V conflicts, the Payload CMS configuration was not updated.

The fix is straightforward: update the DATABASE_URI in `apps/payload/.env.development` to use port 54522.

## Additional Context

- This is NOT a database schema issue as initially suspected by the user
- Supabase (auth, storage, etc.) is working correctly on ports 54521/54522
- Only Payload CMS is affected due to its separate configuration file
- A similar issue might exist in `.env.production` or other environment files

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (supabase status), TodoWrite*
