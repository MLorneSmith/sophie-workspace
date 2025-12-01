# Bug Diagnosis: /test 7 fails to detect Payload running in Docker container

**ID**: ISSUE-pending
**Created**: 2025-12-01T17:15:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `/test 7` command fails because `healthCheckPayloadServer()` uses `lsof` to detect if Payload is running, but `lsof` cannot see Docker-forwarded ports. When Payload runs in a Docker container (slideheroes-payload-test), `lsof -ti:3021` returns 'none' even though the server is healthy and responding on port 3021. This causes the test controller to attempt starting a second Payload instance, which fails with `EADDRINUSE`.

## Environment

- **Application Version**: dev branch
- **Environment**: development (WSL2)
- **Node Version**: v20+
- **Database**: PostgreSQL (via Supabase)
- **Last Working**: Unknown - issue may have existed since Docker-based Payload was introduced

## Reproduction Steps

1. Ensure Payload CMS is running in Docker container `slideheroes-payload-test` on port 3021
2. Verify Payload is healthy: `curl http://localhost:3021/api/health` returns 200
3. Run `/test 7` command
4. Observe failure: "Payload CMS server failed to start within timeout"
5. Check logs: `Error: listen EADDRINUSE: address already in use :::3021`

## Expected Behavior

- Test controller should detect that Payload is already running and healthy
- `healthCheckPayloadServer()` should return "healthy"
- No attempt should be made to start a second Payload instance
- Shard 7 tests should execute against the running Payload server

## Actual Behavior

- `healthCheckPayloadServer()` returns "not_running" despite Payload being healthy
- Test controller attempts to start a new Payload instance
- Startup fails with `EADDRINUSE` because port 3021 is already in use by Docker
- Shard 7 tests are skipped

## Diagnostic Data

### Console Output
```
[2025-12-01T17:10:22.098Z] INFO: 🚀 Starting Payload CMS server on port 3021...
[2025-12-01T17:10:23.193Z] INFO: ⏳ Waiting for Payload CMS to be ready...
[2025-12-01T17:10:23.719Z] INFO:   📦 Payload stderr: [31m[1m⨯[22m[39m Failed to start server
[2025-12-01T17:10:23.727Z] INFO:   📦 Payload stderr: Error: listen EADDRINUSE: address already in use :::3021
```

### Port Detection Analysis
```bash
# lsof doesn't see Docker-forwarded ports
$ lsof -ti:3021 2>/dev/null || echo 'none'
none

# But ss sees the port is in use
$ ss -tlnp | grep 3021
LISTEN 0      4096                *:3021             *:*

# Docker is using the port
$ docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 3021
slideheroes-payload-test   0.0.0.0:3021->3021/tcp, [::]:3021->3021/tcp

# HTTP health check WORKS
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:3021/api/health
200
```

### Network Analysis
```
Port 3021: Docker container forwarding (not visible to lsof on host)
Port 3001: Web server (visible to lsof)
```

## Error Stack Traces
```
Error: listen EADDRINUSE: address already in use :::3021
    at <unknown> (Error: listen EADDRINUSE: address already in use :::3021)
    at new Promise (<anonymous>) {
  code: 'EADDRINUSE',
```

## Related Code
- **Affected Files**:
  - `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs`
- **Recent Changes**: Issue #804/#805 fixed unhandled pkill rejections but didn't address Docker detection
- **Suspected Functions**:
  - `healthCheckPayloadServer()` (lines 664-713)
  - `setupPayloadServer()` (lines 719-809)

## Related Issues & Context

### Direct Predecessors
- #804 (CLOSED): "Bug Diagnosis: /test 7 fails due to unhandled pkill rejection" - Different root cause (pkill rejection)
- #805 (CLOSED): "Bug Fix: Wrap unhandled process killing commands in try-catch" - Fixed pkill but didn't address Docker detection

### Similar Symptoms
- #693 (CLOSED): "Bug Diagnosis: E2E Payload CMS Tests Failing - Server Not Running"
- #694 (CLOSED): "Bug Fix: Payload CMS Server Not Running During E2E Tests"
- #370 (CLOSED): "E2E Tests: Payload CMS port mismatch causing shard 7 failures"
- #376 (CLOSED): "E2E Payload Tests Failing (Shard 7) - WebServer Configuration Mismatch"

### Historical Context
Shard 7 has had multiple issues over time related to Payload server detection. Previous fixes focused on port mismatches, pkill rejections, and process timeouts. This is a new failure mode introduced when Payload started running in Docker instead of directly on the host.

## Root Cause Analysis

### Identified Root Cause

**Summary**: `healthCheckPayloadServer()` uses `lsof` as a gate before HTTP health checks, but `lsof` cannot detect Docker-forwarded ports, causing false "not_running" results.

**Detailed Explanation**:
The function at lines 664-713 in `infrastructure-manager.cjs` has this logic:

```javascript
// Line 670-677 - THE BUG
const { stdout: portCheck } = await execAsync(
    `lsof -ti:${payloadPort} 2>/dev/null || echo 'none'`,
    { timeout: 1000 },
);

if (portCheck.trim() === "none") {
    return "not_running";  // <-- EARLY RETURN, never tries HTTP check!
}

// Lines 680-693 - NEVER REACHED when lsof returns 'none'
const response = await fetch(`${payloadUrl}/api/health`, ...);
if (response.ok) {
    return "healthy";  // This would succeed!
}
```

When Payload runs in Docker:
1. Docker creates a port forward from host:3021 to container:3021
2. `lsof` only sees local processes, not Docker's network bridge
3. `lsof -ti:3021` returns empty (becomes 'none' due to || echo 'none')
4. Function immediately returns "not_running" without trying HTTP
5. `setupPayloadServer()` thinks Payload isn't running and tries to start it
6. Starting fails because port 3021 is already bound by Docker

**Supporting Evidence**:
- `lsof -ti:3021` returns 'none' when Payload runs in Docker
- `curl http://localhost:3021/api/health` returns 200 (healthy)
- Docker shows: `slideheroes-payload-test 0.0.0.0:3021->3021/tcp`
- Error: `EADDRINUSE: address already in use :::3021`

### How This Causes the Observed Behavior

1. User runs `/test 7`
2. Test controller calls `healthCheckPayloadServer()` to check if Payload is running
3. `lsof -ti:3021` returns 'none' (can't see Docker ports)
4. Function returns "not_running" without HTTP check
5. `setupPayloadServer()` tries to start Payload via `pnpm --filter payload dev:test`
6. Node.js/Next.js tries to bind to port 3021
7. Fails with `EADDRINUSE` because Docker already has it
8. Test controller marks shard 7 as failed

### Confidence Level

**Confidence**: High

**Reasoning**:
- Directly reproduced the issue
- Proved `lsof` doesn't see Docker ports but HTTP does
- The code flow clearly shows early return before HTTP check
- The fix is obvious: try HTTP check first or remove the lsof gate

## Fix Approach (High-Level)

Remove the `lsof` early-return gate and rely on HTTP health checks instead. The HTTP check at lines 680-693 already handles all cases properly:
- If nothing is running: fetch will fail, return "not_running"
- If Payload is starting: timeout/abort, return "starting"
- If Payload is healthy: response.ok, return "healthy"

The `lsof` check is redundant and causes false negatives with Docker. Simply removing lines 670-677 (or restructuring to try HTTP first) would fix the issue.

## Diagnosis Determination

The root cause is definitively identified: the `lsof`-based port check in `healthCheckPayloadServer()` cannot detect Docker-forwarded ports and causes a premature "not_running" return before the HTTP health check that would succeed.

## Additional Context

- This bug only manifests when Payload runs in Docker (which is the current setup)
- Shards 1-6 work because they don't require Payload
- The fix in #805 addressed a different issue (pkill rejection) but didn't change the detection logic
- The HTTP health check is already implemented and working - it's just never reached

---
*Generated by Claude Debug Assistant*
*Tools Used: lsof, ss, curl, docker ps, grep, GitHub CLI (gh issue list/view)*
