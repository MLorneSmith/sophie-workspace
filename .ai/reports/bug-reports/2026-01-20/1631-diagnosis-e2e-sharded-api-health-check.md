# Bug Diagnosis: E2E Sharded Workflow API Health Check Uses Unset SUPABASE_ANON_KEY

**ID**: ISSUE-1631
**Created**: 2026-01-20T16:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The E2E sharded workflow fails because the Supabase API health check in the "Start local Supabase" step uses `${SUPABASE_ANON_KEY}` before this variable is set. The variable is only extracted and exported in the subsequent "Extract Supabase JWT keys" step, causing all API authentication attempts to fail with empty credentials.

## Environment

- **Application Version**: Current dev branch
- **Environment**: CI (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Never (regression introduced by Issue #1626 fix)

## Reproduction Steps

1. Trigger the e2e-sharded workflow (push to dev or PR)
2. Observe shards 1, 2, 3 (and likely others) fail at "Start local Supabase" step
3. Check logs for "Supabase API failed to respond after 30 attempts"

## Expected Behavior

The Supabase API health check should successfully authenticate and verify the API is responsive before proceeding to migrations and tests.

## Actual Behavior

The health check fails with 30 consecutive timeout attempts because:
1. `${SUPABASE_ANON_KEY}` is unset at the time of the health check
2. Curl sends requests with empty authentication headers
3. Supabase rejects all requests with invalid API keys
4. The step fails after 60 seconds (30 attempts × 2 second sleep)

## Diagnostic Data

### Console Output
```
⏳ Waiting for Supabase API to become responsive...
⏳ Waiting for Supabase API... (attempt 1/30)
⏳ Waiting for Supabase API... (attempt 2/30)
...
⏳ Waiting for Supabase API... (attempt 29/30)
❌ Supabase API failed to respond after 30 attempts (60 seconds)
Last status output:
Stopped services: [supabase_imgproxy_2025slideheroes-db supabase_pooler_2025slideheroes-db]
supabase local development setup is running.
```

### Network Analysis
The curl command on lines 233-235:
```bash
curl -sf http://127.0.0.1:54521/rest/v1/ \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" > /dev/null 2>&1
```

With `${SUPABASE_ANON_KEY}` unset, this becomes:
```bash
curl -sf http://127.0.0.1:54521/rest/v1/ \
  -H "apikey: " \
  -H "Authorization: Bearer " > /dev/null 2>&1
```

Supabase requires a valid API key for all REST API requests, so this always fails.

### Docker Status
All Supabase containers report healthy:
```
9e08eafea011   ghcr.io/supabase/studio:2026.01.12   Up About a minute (healthy)
ff030ee70398   ghcr.io/supabase/kong:2.8.1          Up About a minute (healthy)
e45b0463df27   ghcr.io/supabase/postgres:17.6.1     Up About a minute (healthy)
```

The infrastructure is actually healthy - only the API authentication fails.

## Error Stack Traces

No stack trace - this is a shell script logic error, not a code exception.

## Related Code
- **Affected Files**:
  - `.github/workflows/e2e-sharded.yml` (lines 223-269, 271-300)
- **Recent Changes**: Issue #1626 fix added the API health check but used the wrong variable ordering
- **Suspected Functions**: "Start local Supabase" step (API health check loop)

## Related Issues & Context

### Direct Predecessors
- #1626 (CLOSED): "Bug Fix: E2E Sharded Workflow Fails Due to Environment Variable Naming Mismatch" - Added `E2E_` prefixed variables but introduced this ordering bug
- #1621 (CLOSED): "Bug Fix: E2E Sharded Workflow JWT Secret Mismatch" - Added JWT key extraction step

### Related Infrastructure Issues
- #1609 (CLOSED): "Bug Fix: E2E Auth Config Missing globalSetup" - Part of the E2E fix chain
- #1615 (CLOSED): JWT mismatch diagnosis that led to #1621

### Historical Context
This is a regression from the #1626 fix. The API health check was added to ensure Supabase is ready before running migrations, but it was placed BEFORE the JWT key extraction step that sets `SUPABASE_ANON_KEY`. The tests work locally because local development uses `.env` files that have these keys pre-configured.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The API health check in "Start local Supabase" step uses `${SUPABASE_ANON_KEY}` before this variable is set by the subsequent "Extract Supabase JWT keys" step.

**Detailed Explanation**:
In the e2e-shards job, the step order is:
1. Checkout, setup, etc.
2. **"Start local Supabase"** (lines 223-269) - Contains API health check using `${SUPABASE_ANON_KEY}`
3. **"Extract Supabase JWT keys"** (lines 271-300) - Sets `SUPABASE_ANON_KEY` via `$GITHUB_ENV`

The env section (lines 153-184) explicitly does NOT set `SUPABASE_ANON_KEY`:
```yaml
# JWT keys (SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
# are extracted dynamically from Supabase after startup in the "Extract Supabase JWT keys" step.
```

This means at the time of the health check, `${SUPABASE_ANON_KEY}` expands to an empty string.

**Supporting Evidence**:
- Workflow file lines 157-160 explicitly state keys are extracted dynamically AFTER startup
- Line 234 uses `${SUPABASE_ANON_KEY}` in curl command
- Lines 291-295 set the variable AFTER the health check already ran
- CI logs show 30 failed attempts with all containers healthy

### How This Causes the Observed Behavior

1. Shard job starts, `SUPABASE_ANON_KEY` is unset (empty)
2. `supabase start` completes successfully, containers are healthy
3. Health check loop starts, curl uses empty API key
4. Supabase REST API rejects requests with empty/invalid API key
5. All 30 attempts fail (2s × 30 = 60 seconds timeout)
6. Step fails with exit code 1
7. Shard marked as failed

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The workflow file explicitly documents that keys are set dynamically AFTER startup
2. The health check uses the variable BEFORE the extraction step
3. Docker containers are healthy, proving the issue is authentication, not infrastructure
4. The pattern matches exactly: empty variable → invalid auth → rejected requests → timeout

## Fix Approach (High-Level)

Move the JWT key extraction to happen BEFORE the API health check, OR modify the health check to not require authentication. Two options:

**Option A (Recommended)**: Extract JWT keys immediately after `supabase start`, before the health check:
```yaml
- name: Start local Supabase
  run: |
    cd apps/web
    supabase start --ignore-health-check

    # Extract keys IMMEDIATELY after start
    eval "$(supabase status -o env)"
    echo "SUPABASE_ANON_KEY=$ANON_KEY" >> $GITHUB_ENV

    # Now health check can use the keys
    for i in {1..30}; do
      if curl -sf http://127.0.0.1:54521/rest/v1/ \
        -H "apikey: $ANON_KEY" ...
```

**Option B**: Use an unauthenticated health check endpoint (if one exists) or check Docker container health directly instead of the REST API.

## Diagnosis Determination

The root cause is confirmed: the API health check uses `${SUPABASE_ANON_KEY}` before the variable is set. This is a step ordering bug in the workflow introduced when the health check was added without accounting for the dynamic key extraction architecture.

## Additional Context

- This explains why tests work locally but fail in CI: local `.env` files have the keys pre-configured
- The fix in Issue #1626 added the environment variable naming fixes but introduced this ordering regression
- Shards 1, 2, and 3 all failed at the same step, confirming this is a systemic issue not a flaky test

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (workflow logs, issue views), grep, file reads*
