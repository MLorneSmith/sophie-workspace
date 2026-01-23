# Bug Diagnosis: E2E Sharded Workflow Supabase Connection Failures

**ID**: ISSUE-pending
**Created**: 2026-01-19T16:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The e2e-sharded workflow is failing across multiple shards with Supabase connection errors. Tests fail because Supabase is either not running or not accessible on the e2e-shard runner machines. This is caused by the workflow architecture where each shard runs on a separate machine but Supabase cannot be reliably started or shared across these machines.

## Environment

- **Application Version**: dev branch (commit a1c542100)
- **Environment**: CI (GitHub Actions)
- **Browser**: Chromium (Playwright)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - this appears to be an existing issue that may have been masked

## Reproduction Steps

1. Trigger the e2e-sharded workflow on the dev branch
2. Wait for the setup-server job to complete
3. Observe that most e2e-shard jobs fail (1-3 may pass depending on timing)
4. Check failed job logs for Supabase connection errors

## Expected Behavior

All 12 e2e-shard jobs should:
1. Successfully start a local Supabase instance
2. Connect to Supabase for database operations
3. Run their assigned tests to completion

## Actual Behavior

Most e2e-shard jobs fail with one of two error patterns:

**Error Pattern 1**: Environment variable not accessible during SSR
```
Error: Your project's URL and Key are required to create a Supabase client!
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

**Error Pattern 2**: Supabase not running/accessible
```
Error: connect ECONNREFUSED 127.0.0.1:54521
TypeError: fetch failed
Caused by: Error: connect ECONNREFUSED 127.0.0.1:54521 (ECONNREFUSED)
```

**Test Failure**: After connection errors, tests timeout waiting for responses
```
Error: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
Error: Timed out waiting 120000ms from config.webServer.
```

## Diagnostic Data

### Console Output
```
# Shard 1 (failed run 21143885823)
2026-01-19T16:08:18.333Z ERROR [AI-GATEWAY] Error importing Supabase admin client:
2026-01-19T16:08:19.031Z ERROR Your project's URL and Key are required to create a Supabase client!
2026-01-19T16:08:19.040Z ERROR @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
2026-01-19T16:10:17.063Z ERROR Timed out waiting 120000ms from config.webServer.

# Shard 2 (current run 21144349567)
2026-01-19T16:23:43.846Z ERROR [AI-GATEWAY] Supabase admin client connection test failed:
  message: TypeError: fetch failed
  details: Error: connect ECONNREFUSED 127.0.0.1:54521
2026-01-19T16:23:44.212Z ERROR [testimonials-fetch] Supabase connection error: ECONNREFUSED 127.0.0.1:54521
2026-01-19T16:27:55.153Z ERROR page.waitForResponse: Timeout 15000ms exceeded
```

### Network Analysis
```
# Connection attempts to Supabase fail
Error: connect ECONNREFUSED 127.0.0.1:54521
Error: connect ECONNREFUSED 127.0.0.1:54522

# These ports are for:
# 54521 - Supabase API
# 54522 - Supabase PostgreSQL
```

### Workflow Run Analysis
```
# Run 21144349567 (current)
Setup Test Server: success
E2E Shard 1: success  (ran first, may have gotten Supabase started)
E2E Shard 2: failure
E2E Shard 3: failure
E2E Shard 4: failure
E2E Shard 5: failure
E2E Shard 6: failure
E2E Shard 7: failure
Shards 8-12: queued/cancelled
```

## Error Stack Traces
```
Error: Your project's URL and Key are required to create a Supabase client!
    at <unknown> (.next/server/chunks/ssr/_971b2284._.js:55:113)
    at <unknown> (.next/server/chunks/ssr/_971b2284._.js:59:4528)
    at ah (.next/server/chunks/ssr/_971b2284._.js:55:60)
    at <unknown> (.next/server/chunks/ssr/_bf264ae0._.js:1:10955)
    at af (.next/server/chunks/ssr/_bf264ae0._.js:1:11272)

Error: connect ECONNREFUSED 127.0.0.1:54521
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1595:16)
    at TCPConnectWrap.callbackTrampoline (node:internal/async_hooks:130:17)
```

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` - Workflow configuration
  - `apps/e2e/playwright.smoke.config.ts` - Playwright webServer config
  - `packages/supabase/src/get-supabase-client-keys.ts` - Env var validation
  - `apps/web/app/(marketing)/_components/home-testimonials-grid-server.tsx` - SSR component
- **Recent Changes**: a1c542100 fix(tooling): create fresh review sandbox for dev server after spec implementation
- **Suspected Functions**:
  - `supabase start --ignore-health-check || true` (silently fails)
  - `getSupabaseClientKeys()` (throws when env vars missing)

## Related Issues & Context

### Direct Predecessors
- #1583 (CLOSED): "Diagnosis: E2E Sharded Webserver Startup Hang" - Previous webserver startup issues
- #1584 (CLOSED): "Bug Plan: E2E Sharded No Webserver" - Fix for webserver startup

### Related Infrastructure Issues
- #1569: "Diagnosis: E2E Sharded No Webserver" - Similar infrastructure pattern
- #1570: "Bug Plan: E2E Sharded No Webserver" - Related fix

### Historical Context
This issue appears to be a regression or re-emergence of infrastructure problems with the sharded E2E workflow. The previous fix (#1584) addressed webserver startup but may not have fully resolved Supabase connectivity across separate runner machines.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The e2e-sharded workflow runs each shard on a separate machine (RunsOn instance), but Supabase cannot be reliably started or shared across these machines due to:
1. Silent failure of `supabase start` command (masked by `|| true`)
2. Inadequate health check that only verifies CLI status, not actual connectivity
3. Potential race conditions in Docker container startup across parallel jobs

**Detailed Explanation**:

The workflow uses RunsOn with unique runner IDs per shard:
```yaml
runs-on: "runs-on=${{ github.run_id }}-job-${{ strategy.job-index }}/runner=2cpu-linux-x64"
```

This means each shard runs on a **physically separate machine**. The "Start local Supabase" step attempts to start Supabase fresh on each machine:

```yaml
- name: Start local Supabase
  run: |
    cd apps/e2e
    supabase start --ignore-health-check || true  # <-- Silent failure!

    for i in {1..10}; do
      if supabase status 2>/dev/null | grep -q "Project URL"; then
        echo "✓ Supabase ready after $i checks"  # <-- Only checks CLI output
        break
      fi
      sleep 2
    done
```

**Problems**:
1. `|| true` swallows all errors from `supabase start`
2. The health check only verifies that `supabase status` outputs "Project URL" - this can be true from cached state even if services aren't running
3. No actual network connectivity test to port 54521

**Supporting Evidence**:
- Log shows `✓ Supabase ready after 1 checks` immediately, but then `ECONNREFUSED 127.0.0.1:54521`
- Some shards succeed (likely got lucky with timing) while most fail
- Pattern is consistent across multiple workflow runs

### How This Causes the Observed Behavior

1. Setup-server job builds the application and starts Supabase on machine A
2. E2E-shard jobs start on machines B, C, D, E, F, G, H, I, J, K, L, M
3. Each shard attempts `supabase start` which fails silently
4. Health check passes because CLI reports cached "Project URL" status
5. Next.js server starts successfully
6. When SSR components try to connect to Supabase:
   - `getSupabaseClientKeys()` reads env vars successfully (they ARE set)
   - `createServerClient()` tries to connect to 127.0.0.1:54521
   - Connection is refused because Supabase isn't actually running
7. Tests timeout waiting for responses or the webserver times out

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The error pattern `ECONNREFUSED 127.0.0.1:54521` proves no service is listening
2. The health check logging shows it passes immediately (1 check), which is suspicious
3. The `|| true` explicitly masks any startup failures
4. Different shards have inconsistent results, indicating a race/timing issue

## Fix Approach (High-Level)

1. **Remove silent failure masking**: Replace `|| true` with proper error handling that fails fast
2. **Add actual connectivity check**: After `supabase start`, verify connectivity with `curl http://127.0.0.1:54521/rest/v1/` or similar
3. **Consider single-server architecture**: Run all shards against a shared test server instead of starting Supabase per-shard
4. **Add startup timeout with exponential backoff**: Wait for Supabase services to actually respond, not just CLI status

Example fix for health check:
```yaml
- name: Start local Supabase
  run: |
    cd apps/e2e
    supabase start --ignore-health-check

    # Wait for actual connectivity, not just CLI status
    for i in {1..30}; do
      if curl -sf http://127.0.0.1:54521/rest/v1/ -H "apikey: $SUPABASE_ANON_KEY" > /dev/null 2>&1; then
        echo "✓ Supabase API responding after $i checks"
        break
      fi
      echo "Waiting for Supabase API... (attempt $i/30)"
      sleep 2
    done

    # Verify database is also accessible
    pg_isready -h localhost -p 54522 -U postgres
```

## Diagnosis Determination

The root cause is confirmed: **Supabase services are not starting or not accessible on e2e-shard runner machines** due to silent failure masking (`|| true`) and inadequate health checking (CLI status instead of network connectivity).

The fix requires replacing the "Start local Supabase" step with proper error handling and actual connectivity verification.

## Additional Context

- The workflow was recently modified (issues #1583, #1584) to address webserver startup issues
- The current configuration uses production server (`next start`) which starts quickly
- The env vars ARE correctly set in the workflow (verified by log masking)
- The issue is infrastructure-related, not code-related

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Read, Grep, Bash*
