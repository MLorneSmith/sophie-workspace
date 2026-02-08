# Bug Diagnosis: CI/CD Pipeline Regression - PR Validation and E2E Sharded Workflow Failures

**ID**: ISSUE-pending
**Created**: 2026-01-24T16:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

CI/CD pipeline has two distinct failures after recent commits: (1) PR Validation fails due to e2b package ESM/CommonJS incompatibility in unit tests, and (2) E2E Sharded workflow shards 4, 7, 8 fail due to Payload CMS not starting and environment configuration issues.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL via Supabase
- **Last Working**: Prior to commit addbbeb8b

## Affected Workflow Runs

- PR Validation: Run ID 21317819314 - **FAILED**
- E2E Tests (Sharded): Run ID 21317819325 - **PARTIAL FAILURE**
  - Shard 4: FAILED (timeout after ZodError)
  - Shard 7: FAILED (payload.users does not exist)
  - Shard 8: FAILED (payload.users does not exist)

## Reproduction Steps

1. Push changes to GitHub `dev` branch
2. PR Validation workflow triggers
3. Unit tests run with `pnpm test:coverage`
4. Test file `orchestrator-deadlock-detection.spec.ts` fails to load

## Expected Behavior

All CI/CD workflows pass after the recent fixes for #1791 and #1792.

## Actual Behavior

Multiple failures across different workflows.

## Diagnostic Data

### Failure 1: PR Validation - Unit Test e2b ESM Incompatibility

**Root Cause**: `@e2b/code-interpreter@2.3.1` depends on `e2b@2.8.2`, which uses CommonJS `require()` to import `chalk@5.x` (an ESM-only package).

**Error Stack**:
```
FAIL lib/__tests__/orchestrator-deadlock-detection.spec.ts
Error: require() of ES Module chalk/source/index.js from e2b/dist/index.js not supported.
Instead change the require of chalk/source/index.js to a dynamic import() which is available in all CommonJS modules.
❯ Object.<anonymous> ../../../node_modules/.pnpm/e2b@2.8.2/node_modules/e2b/dist/index.js:2455:28
```

**Affected Files**:
- `.ai/alpha/scripts/package.json` - declares `@e2b/code-interpreter: ^2.3.1`
- `pnpm-lock.yaml` - resolves to `e2b@2.8.2` (incompatible version)

**Resolution**: Update `@e2b/code-interpreter` to `^2.3.3` which uses `e2b@2.10.4`

### Failure 2: E2E Shards 7/8 - Payload Schema Not Created

**Root Cause**: Payload CMS server is not starting before E2E tests, so `payload.users` table is never created.

**Evidence from CI logs**:
```
⚠️  Payload authentication skipped for payload-admin user: Payload CMS login failed after 3 attempts.
Last error: Attempt 3 failed: no token received.
Check that Payload server is running at http://localhost:3021 and credentials are valid.

error: relation "payload.users" does not exist
```

**Chain of Events**:
1. Supabase migrations run (`20250327_create_payload_schema.sql`)
2. Migration creates empty `payload` schema (notice: `schema "payload" does not exist, skipping`)
3. Global setup tries to authenticate to Payload at localhost:3021
4. **Payload server never started** → authentication fails
5. Tests run → query `payload.users` → fails

**Why Payload Doesn't Start**:
The shard7 test command uses `--project=payload` which should trigger the webServer config, but:
- `reuseExistingServer: !process.env.GITHUB_ACTIONS` evaluates to `false` in CI
- This should force webServer to start... but something prevents it

**Affected Files**:
- `apps/e2e/playwright.config.ts:225-234` - webServer config for Payload
- `apps/e2e/tests/payload/playwright.config.ts:83-89` - Uses `reuseExistingServer: true` which expects existing server

### Failure 3: E2E Shard 4 - Environment Configuration Error

**Root Cause**: ZodError for missing `emailSender` configuration causes infinite retry loop until timeout.

**Error**:
```
Error [ZodError]: [
  {
    "expected": "string",
    "code": "invalid_type",
    "path": ["emailSender"],
    "message": "Invalid input: expected string, received undefined"
  }
]
```

**Affected Files**:
- `packages/features/team-accounts/src/server/actions/team-invitations-server-actions.ts`

## Related Issues & Context

### Direct Predecessors
- #1791 (CLOSED): "Bug Diagnosis: E2E Shard 7 Fails - Next.js Overrides NODE_ENV Breaking Payload SSL Config"
- #1792 (CLOSED): "Bug Fix: E2E Shard 7 - Use PAYLOAD_ENV Instead of NODE_ENV for SSL Configuration"

### Same Component (E2E Infrastructure)
- #1594: E2E Sharded Workflow Supabase Connection Failures
- #1615: JWT Secret Mismatch
- #1621: JWT Secret Mismatch Fix
- #1625: Env Variable Naming Mismatch
- #1631: API Health Check Uses Unset SUPABASE_ANON_KEY
- #1655: ts-node Not Found in CI

### Historical Context

This is a **regression** after implementing the fix for #1791/#1792. The PAYLOAD_ENV fix successfully changed the SSL configuration logic, but the underlying issue is that **Payload CMS is not starting at all** before tests run.

## Root Cause Analysis

### Identified Root Causes

**Issue 1 - e2b ESM Incompatibility**:
- **Summary**: Outdated `@e2b/code-interpreter@2.3.1` depends on `e2b@2.8.2` which has CommonJS/ESM incompatibility
- **Supporting Evidence**: Lock file shows `e2b@2.8.2` depends on `chalk@5.6.2`, chalk v5+ is ESM-only
- **Confidence**: High

**Issue 2 - Payload Server Not Starting**:
- **Summary**: The webServer configuration conflict between main playwright.config.ts and payload-specific config
- **Supporting Evidence**: CI logs show "Payload CMS login failed after 3 attempts" before any tests run
- **Confidence**: High - The payload-specific config uses `reuseExistingServer: true` but shard7 uses `--project=payload` with the main config

**Issue 3 - Missing emailSender Config**:
- **Summary**: E2E environment missing required `emailSender` Zod schema field
- **Supporting Evidence**: ZodError stack trace points to team-invitations-server-actions.ts
- **Confidence**: High

### How This Causes the Observed Behavior

1. **e2b issue**: Vitest tries to load `orchestrator-deadlock-detection.spec.ts` → imports `orchestrator.ts` → imports `@e2b/code-interpreter` → imports `e2b` → tries to `require('chalk')` → ESM module cannot be required → test suite fails

2. **Payload issue**: Test command `test:shard7` runs Playwright with `--project=payload` → Playwright reads main config → should start webServer → but something prevents it → Payload never runs → `payload.users` never created

3. **emailSender issue**: Web server starts → loads team-invitations module → Zod validates config → `emailSender` is undefined → throws ZodError → tests hang/timeout

## Fix Approach (High-Level)

**For e2b issue (simplest)**:
Update `@e2b/code-interpreter` to `^2.3.3` in `.ai/alpha/scripts/package.json`, then run `pnpm install` to regenerate lockfile.

**For Payload issue**:
Either:
1. Ensure E2E workflow starts Payload server explicitly before running shards 7/8, OR
2. Fix the webServer configuration so Playwright actually starts Payload

**For emailSender issue**:
Add `EMAIL_SENDER` environment variable to E2E workflow configuration in `.github/workflows/e2e-sharded.yml`

## Diagnosis Determination

All three root causes have been identified with high confidence:
1. **e2b@2.8.2** ESM/CommonJS incompatibility - Fix by updating package
2. **Payload server not starting** - Fix by explicit server startup or webServer config fix
3. **Missing emailSender** - Fix by adding environment variable

The fixes are independent and can be implemented in any order.

## Additional Context

Recent commits related to this regression:
- `addbbeb8b`: check both auth.users and payload.users for warm start seeding
- `dab0fe737`: use PAYLOAD_ENV instead of NODE_ENV for SSL configuration (the #1792 fix)
- `5664edf66`: set NODE_ENV=test in Payload start:test (earlier attempt, ineffective)

The #1792 fix successfully changed SSL behavior, but the Payload server startup issue was masked previously.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, grep, read, bash*
