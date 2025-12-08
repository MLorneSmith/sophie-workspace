# Bug Diagnosis: Payload E2E Tests Fail Due to Shell Environment Variable Override

**ID**: ISSUE-pending
**Created**: 2025-12-08T15:30:00Z
**Reporter**: Claude Debug Assistant
**Severity**: high
**Status**: new
**Type**: regression

## Summary

All Payload CMS E2E tests (shards 7 and 8) are failing because the shell environment has a stale `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020` variable that overrides the correct `.env.test` file value of `http://localhost:3021`. This causes tests to attempt connection to port 3020 where no server is running, while the actual Payload test server runs on port 3021.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development/test
- **Node Version**: v22.x
- **Database**: PostgreSQL via Supabase (port 54522)
- **Payload Server**: Running on port 3021 (Docker container `slideheroes-payload-test`)
- **Last Working**: Unknown - shell environment likely polluted over time

## Reproduction Steps

1. Have `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020` set in shell environment
2. Start Docker test environment (Payload runs on port 3021)
3. Run `/test` command or `pnpm test:shard7`
4. All 42 Payload tests fail with `ERR_CONNECTION_REFUSED at http://localhost:3020`

## Expected Behavior

Payload E2E tests should connect to `http://localhost:3021` (the test server port) and execute successfully.

## Actual Behavior

Tests attempt to connect to `http://localhost:3020`, which has no server running, causing immediate connection refused errors.

## Diagnostic Data

### Console Output
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3020/admin/login
Call log:
  - navigating to "http://localhost:3020/admin/login", waiting until "load"

   at payload/pages/PayloadLoginPage.ts:37
```

### Network Analysis
```
Port 3020: No server running (ERR_CONNECTION_REFUSED)
Port 3021: Payload CMS running and healthy
```

### Environment Variable Analysis
```bash
# Shell environment (INCORRECT - overrides .env.test):
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020

# apps/payload/.env.test (CORRECT):
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021

# dotenv configuration in playwright.config.ts:
override: false (default) - shell env takes precedence
```

### Docker Container Status
```
slideheroes-payload-test   Up 21 minutes (healthy)   0.0.0.0:3021->3021/tcp
```

## Error Stack Traces
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3020/admin/login
    at PayloadLoginPage.navigateToLogin (apps/e2e/tests/payload/pages/PayloadLoginPage.ts:37:19)
    at tests/payload/payload-auth.spec.ts:27:19
```

## Related Code
- **Affected Files**:
  - `apps/e2e/tests/payload/pages/PayloadBasePage.ts:17-18` - reads `PAYLOAD_PUBLIC_SERVER_URL`
  - `apps/e2e/playwright.config.ts:9-20` - dotenv configuration with `override: false`
  - `apps/payload/.env.test:10` - contains correct port 3021
- **Recent Changes**: No recent changes to port configuration
- **Suspected Functions**: `PayloadBasePage` constructor reading environment variable

## Related Issues & Context

### Direct Predecessors
- #370 (CLOSED): "E2E Tests: Payload CMS port mismatch causing shard 7 failures" - Same exact problem
- #376 (CLOSED): "E2E Payload Tests Failing (Shard 7) - WebServer Configuration Mismatch"
- #693 (CLOSED): "Bug Diagnosis: E2E Payload CMS Tests Failing - Server Not Running"

### Historical Context
This is a **recurring regression**. The issue has been fixed multiple times but keeps returning because:
1. Shell environment variables persist between sessions
2. Docker development port (3020) vs test port (3021) creates confusion
3. The `override: false` dotenv setting is intentional for CI but problematic for local dev when stale env vars exist

## Root Cause Analysis

### Identified Root Cause

**Summary**: Shell environment variable `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020` overrides the correct `.env.test` value because dotenv uses `override: false` by default.

**Detailed Explanation**:
The `PayloadBasePage.ts` constructor reads the URL from environment:
```typescript
this.baseURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3021";
```

The `playwright.config.ts` loads `.env.test` with `override: false`:
```typescript
dotenvConfig({
  path: [..., "../../apps/payload/.env.test"],
  override: false, // Shell env takes precedence
});
```

When the shell has `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020` (likely from a previous dev session or .bashrc/.zshrc), this value takes precedence over the `.env.test` file's `http://localhost:3021`.

**Supporting Evidence**:
- Shell environment check: `env | grep PAYLOAD` shows `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020`
- Error message explicitly shows port 3020: `net::ERR_CONNECTION_REFUSED at http://localhost:3020`
- Docker container confirms Payload runs on 3021: `slideheroes-payload-test` mapped to `3021->3021/tcp`

### How This Causes the Observed Behavior

1. User runs `/test` or `pnpm test:shard7`
2. Playwright loads `playwright.config.ts` which calls `dotenvConfig()` with `override: false`
3. `.env.test` contains `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021`
4. But shell already has `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020`
5. Since `override: false`, shell value wins
6. `PayloadBasePage` constructor reads `process.env.PAYLOAD_PUBLIC_SERVER_URL` = `http://localhost:3020`
7. Tests try to connect to port 3020
8. No server on 3020 -> `ERR_CONNECTION_REFUSED`

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from `env | grep PAYLOAD` showing wrong port
- Error message explicitly shows the wrong port being used
- Code path clearly traces from env var to failed connection
- Same issue has been diagnosed and fixed before (#370, #376, #693)

## Fix Approach (High-Level)

Two complementary fixes:

1. **Immediate fix**: Unset the stale shell environment variable:
   ```bash
   unset PAYLOAD_PUBLIC_SERVER_URL
   ```

2. **Permanent fix**: Update the test scripts to explicitly set the correct environment variable before running tests, overriding any shell pollution:
   ```json
   "test:shard7": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/..."
   ```

   Or add to the test controller's environment setup phase.

## Diagnosis Determination

The root cause is definitively identified as shell environment variable pollution overriding the correct `.env.test` configuration. This is a recurring issue that needs a more permanent fix in the test infrastructure to prevent shell environment from interfering with test configuration.

## Additional Context

- Port 3020 is the Payload **development** port
- Port 3021 is the Payload **test** port (used in Docker test environment)
- The distinction exists to allow running dev and test environments simultaneously
- This issue will recur whenever a developer has stale env vars in their shell

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (env check, grep, docker ps), Read (config files, env files), Grep (port references)*
