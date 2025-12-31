# Bug Diagnosis: Payload E2E Tests Fail Due to Container OOM Kill

**ID**: ISSUE-pending
**Created**: 2025-12-19T15:12:00Z
**Reporter**: system (automated detection during /test shard 7)
**Severity**: high
**Status**: new
**Type**: error

## Summary

Payload CMS E2E tests (shard 7) fail with `ERR_CONNECTION_RESET` errors because the Payload test container (`slideheroes-payload-test`) hits its 4GB memory limit during parallel test execution. The Linux OOM killer terminates the `next-server` process, causing all subsequent test connections to fail. The container automatically restarts but tests have already failed.

## Environment

- **Application Version**: dev branch (commit f3077544e)
- **Environment**: development (local Docker)
- **Node Version**: v22 (node:22-slim Docker image)
- **Database**: PostgreSQL via Supabase (host.docker.internal:54522)
- **Container Memory Limit**: 4GB
- **Idle Memory Usage**: ~2.7GB (67%)
- **Test Parallelism**: 3 workers

## Reproduction Steps

1. Ensure Docker test containers are running: `docker-compose -f docker-compose.test.yml up -d`
2. Run Payload E2E tests: `/test 7` or `pnpm --filter web-e2e test:shard7`
3. Observe test failures with `ERR_CONNECTION_RESET` errors
4. Check kernel logs: `dmesg | grep oom` - shows OOM kill of `next-server` process

## Expected Behavior

All 9 Payload auth tests should pass with stable server connectivity throughout the test run.

## Actual Behavior

- First test may pass while server is still responsive
- Subsequent tests fail with connection errors:
  - `Error: page.goto: net::ERR_CONNECTION_RESET at http://localhost:3021/admin/login`
  - `Error: apiRequestContext.get: socket hang up`
  - `TimeoutError: page.waitForLoadState: Timeout 90000ms exceeded`
- Container restarts automatically after OOM kill
- Final result: 2 passed, 8 failed (87% failure rate)

## Diagnostic Data

### Kernel OOM Kill Logs
```
2025-12-19T10:02:16,241210-05:00 node invoked oom-killer: gfp_mask=0xcc0(GFP_KERNEL), order=0
2025-12-19T10:02:16,242076-05:00 memory: usage 4194304kB, limit 4194304kB, failcnt 6112734
2025-12-19T10:02:16,242449-05:00 Memory cgroup out of memory: Killed process 6050 (next-server (v1)
    total-vm:114295520kB, anon-rss:3177256kB, file-rss:66176kB

2025-12-19T10:05:35,145509-05:00 memory: usage 4194304kB, limit 4194304kB, failcnt 1718879
2025-12-19T10:05:35,145671-05:00 Memory cgroup out of memory: Killed process 275870 (next-server (v1)
    total-vm:104644220kB, anon-rss:3539776kB, file-rss:84736kB
```

### Container State After Restart
```json
{
  "Status": "running",
  "OOMKilled": false,  // Reset after container restart
  "RestartCount": 2,
  "StartedAt": "2025-12-19T15:05:29.020063844Z",
  "FinishedAt": "2025-12-19T15:05:28.986021487Z"
}
```

### Current Memory Usage (Idle)
```
NAME                         MEM USAGE / LIMIT     MEM %     CPU %
slideheroes-payload-test     2.691GiB / 4GiB       67.26%    0.01%
```

### Test Log Timeline
```
[14:57:21] INFO: Payload CMS server healthy on port 3021
[14:57:21] INFO: Running Payload Auth using 3 workers
[15:02:16] KERNEL: OOM kill of next-server process (memory at limit)
[15:05:28] Tests complete: 2 passed, 8 failed
[15:05:29] Container restarted automatically
```

## Error Stack Traces
```
TimeoutError: page.waitForLoadState: Timeout 90000ms exceeded.
   at payload/pages/PayloadBasePage.ts:32

Error: page.goto: net::ERR_CONNECTION_RESET at http://localhost:3021/admin/login
   at payload/pages/PayloadLoginPage.ts:37

Error: apiRequestContext.get: socket hang up
   → GET http://localhost:3021/api/health
```

## Related Code
- **Affected Files**:
  - `docker-compose.test.yml:90-158` - Payload container configuration
  - `apps/e2e/tests/payload/payload-auth.spec.ts` - Test file that triggers failures
  - `apps/e2e/tests/payload/pages/PayloadBasePage.ts:31-36` - waitForPageLoad uses networkidle
- **Recent Changes**: None directly related - this is an infrastructure capacity issue
- **Suspected Functions**: Memory allocation in Next.js dev server under parallel load

## Related Issues & Context

### Similar Symptoms
- #989 (CLOSED): "E2E Tests Fail Due to Server Crash and Auth API Timeout" - Similar server crash pattern
- #693 (CLOSED): "E2E Payload CMS Tests Failing - Server Not Running" - Infrastructure related

### Same Component
- #694 (CLOSED): "Payload CMS Server Not Running During E2E Tests" - Payload test infrastructure
- #975 (CLOSED): "Payload CMS E2E Tests Failing - Admin User Password Mismatch" - Same test file

### Historical Context
This appears to be a recurring pattern where Payload tests are sensitive to infrastructure conditions. Previous fixes addressed different root causes (missing schema, password mismatch, server not started), but this is the first diagnosis of OOM-related failures.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Payload test Docker container exceeds its 4GB memory limit during parallel E2E test execution, triggering Linux OOM killer which terminates the Next.js server process.

**Detailed Explanation**:
1. The `slideheroes-payload-test` container runs Next.js (Payload CMS) with a 4GB memory limit
2. At idle, the container uses ~2.7GB (67% of limit)
3. When Playwright runs 9 tests with 3 parallel workers, each worker:
   - Opens a browser context
   - Makes navigation requests to `/admin/login`
   - Triggers server-side compilation and rendering
4. The combined memory pressure pushes usage above 4GB
5. Linux cgroup memory controller invokes OOM killer
6. The `next-server` process is terminated
7. Playwright connections fail with `ERR_CONNECTION_RESET` (TCP RST when process dies)
8. Container restarts automatically (restart policy: unless-stopped)
9. Tests complete with failures before server recovers

**Supporting Evidence**:
- Kernel logs show OOM kills at 15:02:16 UTC during test window (14:57-15:05 UTC)
- Memory limit was exactly 4194304kB (4GB) with 100% usage at kill time
- Container restart timestamp (15:05:29) matches test completion time (15:05:28)
- Container shows `RestartCount: 2` indicating multiple crash/restart cycles

### How This Causes the Observed Behavior

1. Test starts → Server healthy (2.7GB baseline)
2. 3 parallel workers begin → Memory climbs toward 4GB
3. OOM kill occurs → `next-server` process terminates abruptly
4. TCP connections reset → `ERR_CONNECTION_RESET` errors
5. Health checks fail → `socket hang up` on API requests
6. Page loads timeout → 90s timeout waiting for dead server

### Confidence Level

**Confidence**: High

**Reasoning**:
- Kernel logs provide definitive proof of OOM kills during exact test window
- Container restart timestamp correlates perfectly with test failure time
- Memory usage at idle (67%) leaves insufficient headroom for parallel tests
- Error pattern (`ERR_CONNECTION_RESET`) is consistent with sudden process termination

## Fix Approach (High-Level)

Two primary options:

**Option A - Increase Memory Limit** (Quick fix):
- Change `docker-compose.test.yml` line 148: increase from 4G to 6G or 8G
- Pro: Simple, immediate fix
- Con: May mask underlying memory inefficiency

**Option B - Reduce Test Parallelism** (Conservative fix):
- Configure Payload tests to run with 1-2 workers instead of 3
- Pro: Works within current memory constraints
- Con: Slower test execution

**Option C - Both** (Recommended):
- Increase memory limit to 6G
- Add Payload-specific worker configuration: `workers: 1` in playwright config for Payload project

## Diagnosis Determination

Root cause definitively identified: Container OOM during parallel E2E test execution.

The fix is straightforward - either increase the container memory limit or reduce test parallelism for Payload tests. Given that idle usage is 2.7GB and the limit is 4GB, there's only 1.3GB headroom which is insufficient for 3 parallel browser contexts with server-side rendering.

## Additional Context

- The nested HTML bug fix (#1306) was unrelated to these test failures
- Payload uses webpack mode (not Turbopack) in Docker due to compatibility issues
- The container has `restart: unless-stopped` which masks OOM kills by auto-restarting
- Similar patterns may affect other Payload shards (8, 9, 14, 15) under heavy load

---
*Generated by Claude Debug Assistant*
*Tools Used: docker inspect, docker logs, docker stats, dmesg, grep, test-output.log analysis*
