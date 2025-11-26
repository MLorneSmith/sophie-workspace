# Bug Diagnosis: Stale Docker Container Using Old Supabase Port

**ID**: ISSUE-710
**Created**: 2025-11-26T16:15:00Z
**Reporter**: Claude Debug Assistant
**Severity**: high
**Status**: new
**Type**: configuration

## Summary

E2E authentication tests are failing because the `slideheroes-app-test` Docker container is running with stale environment variables from before the Supabase port migration (issues #707, #709). The container has `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321` but Supabase is actually running on port `54521`.

## Environment

- **Application Version**: dev branch (commit f7cef3778)
- **Environment**: development (local Docker)
- **Container**: slideheroes-app-test (running for 2+ hours)
- **Database**: PostgreSQL via Supabase (port 54522)
- **Last Working**: N/A - container predates port migration fix

## Reproduction Steps

1. Have `slideheroes-app-test` container running (started before #709 fix)
2. Start Supabase: `pnpm supabase:web:start` (runs on port 54521)
3. Run E2E shard 2: `/test 2`
4. Observe auth-simple.spec.ts "user can sign in with valid credentials" fails
5. Check network logs - requests go to `host.docker.internal:54321` instead of `54521`
6. Verify with: `docker exec slideheroes-app-test env | grep SUPABASE_URL`

## Expected Behavior

The web app container should use `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54521` to connect to the running Supabase instance.

## Actual Behavior

The container uses `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321` because it was started before the port migration fix was applied. Auth requests timeout because no service is running on port 54321.

## Diagnostic Data

### Container Environment
```bash
$ docker exec slideheroes-app-test env | grep SUPABASE_URL
NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321  # WRONG
```

### Supabase Status
```bash
$ npx supabase status
API URL: http://127.0.0.1:54521  # CORRECT
```

### Network Analysis (from test logs)
```
[Network] Request: POST http://host.docker.internal:54321/auth/v1/token?grant_type=password
[Phase 1] ❌ Auth API timeout after 15000ms
```

### Container Status
```bash
$ docker ps --filter name=slideheroes-app-test
NAMES                    STATUS         PORTS
slideheroes-app-test     Up 2 hours     0.0.0.0:3001->3001/tcp
```

## Error Stack Traces
```
TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
  at AuthPageObject.loginAsUser (apps/e2e/tests/authentication/auth.po.ts:534)
  waiting for response from auth/v1/token
```

## Related Code
- **Affected Container**: `slideheroes-app-test` Docker container
- **Environment Source**: `docker-compose.test.yml` (has correct port 54521)
- **Stale Config**: Container was built/started before #709 fix

## Related Issues & Context

### Direct Predecessors
- #709 (CLOSED): "Bug Fix: Test Infrastructure Port Mismatch" - Fixed test scripts, container not restarted
- #707 (CLOSED): "Bug Fix: Supabase Port Configuration Drift" - Fixed docker-compose.test.yml
- #706 (CLOSED): "Bug Diagnosis: Supabase Port Configuration Drift" - Original diagnosis
- #668 (CLOSED): "Hyper-V Port Reservation" - Root cause of port change (54321 → 54521)

### Related Infrastructure Issues
- #704 (CLOSED): "auth-simple.spec.ts sign-in test navigation timeout" - Same symptom, different root cause

### Historical Context
The port migration from 54321 → 54521 was completed across all configuration files:
- Issue #707 updated docker-compose.test.yml (correct values)
- Issue #709 updated test infrastructure scripts (correct values)
- However, any **running containers** were not restarted to pick up the new values

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `slideheroes-app-test` Docker container was started before the port migration fixes (#707, #709) were applied, and is still running with stale environment variables.

**Detailed Explanation**:
1. Docker containers are immutable at runtime - environment variables are set when the container starts
2. The `docker-compose.test.yml` file was updated in #707 to use port 54521
3. However, the existing `slideheroes-app-test` container was already running
4. Running containers don't automatically pick up changes to docker-compose files
5. The container must be stopped and restarted (or rebuilt) to get the new environment

**Supporting Evidence**:
- Container env check shows: `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321`
- Container has been running for 2+ hours (predates the fix)
- Supabase is running on port 54521
- Network logs show requests going to port 54321

### How This Causes the Observed Behavior

1. E2E tests run against `http://localhost:3001` (the container)
2. Container serves web app with `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321`
3. Browser makes auth request to `host.docker.internal:54321`
4. No service on port 54321 → request hangs → timeout → test fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence: `docker exec` shows wrong environment variable
- Container uptime exceeds time since fix was applied
- Same root cause pattern as #707/#708 but at runtime level
- Port 54321 has no listener (verified via network logs)

## Fix Approach (High-Level)

**Immediate Fix**: Restart the Docker container to pick up the new environment:
```bash
docker-compose -f docker-compose.test.yml down slideheroes-app-test
docker-compose -f docker-compose.test.yml up -d slideheroes-app-test
```

**Or simply**:
```bash
docker restart slideheroes-app-test
```

Note: A full `docker-compose down && docker-compose up` may be needed if the container was built with old env vars baked in.

**Long-term Prevention**:
1. Add container restart step to the test controller when detecting port mismatches
2. Document in CI/CD that containers must be rebuilt after env changes
3. Consider using `--build` flag in docker-compose commands

## Diagnosis Determination

**Root cause confirmed**: The `slideheroes-app-test` Docker container is a stale instance running with environment variables from before the Supabase port migration. The container has `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321` while Supabase is actually running on port `54521`.

This is **NOT** a code bug - it's a runtime state issue. The configuration files are correct, but the running container predates the fixes.

## Additional Context

This issue demonstrates why Docker containers need explicit lifecycle management after configuration changes:
- Configuration files can be updated
- Running containers don't automatically pick up changes
- Container restart/rebuild is required to apply new environment variables

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (docker exec, docker ps, grep), Read (env files, test logs), GitHub CLI (issue lookup)*
