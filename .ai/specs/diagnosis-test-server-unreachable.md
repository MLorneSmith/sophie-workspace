# Bug Diagnosis: Test server unreachable during E2E test execution

**ID**: ISSUE-669
**Created**: 2025-11-21T18:26:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: infrastructure

## Summary

The E2E test suite fails because the test server (slideheroes-app-test Docker container) becomes unreachable during the transition from unit tests to E2E tests. The container restarts during test execution, and the E2E readiness check times out before the container is fully ready again.

## Environment

- **Application Version**: dev branch, commit 2c67b1cf3
- **Environment**: development (local Docker)
- **Node Version**: 22 (in container)
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - intermittent issue

## Reproduction Steps

1. Start Docker test containers: `docker compose -f docker-compose.test.yml up -d`
2. Wait for containers to be healthy
3. Run the test suite: `/test` or `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh`
4. Observe that unit tests complete successfully
5. E2E tests fail with "Cannot reach test server: The operation was aborted due to timeout"

## Expected Behavior

The test server should remain available throughout the entire test run. E2E readiness check should succeed after unit tests complete.

## Actual Behavior

The test server container restarts during unit test execution, causing the E2E readiness check to timeout. The container becomes available again ~40 seconds after the check times out.

## Diagnostic Data

### Console Output
```
[2025-11-21T18:17:24.754Z] INFO: ✅ Container application is fully healthy
[2025-11-21T18:17:24.754Z] INFO: 🐳 Skipping Docker container port cleanup (3001) to avoid signal conflicts
[2025-11-21T18:18:06.447Z] INFO:   🔍 Checking server at http://localhost:3001...
[2025-11-21T18:18:11.941Z] INFO: ⚠️ E2E tests skipped: Cannot reach test server: The operation was aborted due to timeout
```

### Container State Analysis
```
$ docker inspect slideheroes-app-test --format 'StartedAt: {{.State.StartedAt}}
FinishedAt: {{.State.FinishedAt}}
RestartCount: {{.RestartCount}}
ExitCode: {{.State.ExitCode}}
Status: {{.State.Status}}'

StartedAt: 2025-11-21T18:18:46.884482841Z
FinishedAt: 2025-11-21T18:18:46.829976145Z
RestartCount: 1
ExitCode: 0
Status: running
```

### Timeline Analysis

| Time (UTC) | Event |
|------------|-------|
| 18:17:12 | Infrastructure check phase starts |
| 18:17:24 | Container passes health check, marked as healthy |
| 18:17:25 | Unit tests start (248 tests) |
| 18:18:06 | Unit tests complete, E2E phase starts |
| 18:18:06-11 | E2E readiness check - TIMEOUT after 5s |
| 18:18:46 | Container finishes restart, becomes available |

**Gap**: 40 seconds between E2E check timeout (18:18:11) and container ready (18:18:46)

### Network Analysis
```
# Port 3001 is accessible after container restart
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:3001
200

$ curl http://localhost:3001/api/health
{"status":"ready","timestamp":"2025-11-21T18:21:15.220Z","services":{"database":false}}
```

### Container Configuration
```yaml
# docker-compose.test.yml relevant settings
restart: unless-stopped
healthcheck:
  interval: 15s
  timeout: 10s
  retries: 10
  start_period: 180s
```

## Error Stack Traces
```
[2025-11-21T18:18:11.941Z] INFO: ⚠️ E2E tests skipped: Cannot reach test server: The operation was aborted due to timeout
```

The error originates from test-controller.cjs:293 in the `validateE2EReadiness()` function which uses a 5-second AbortSignal timeout for the health check fetch.

## Related Code
- **Affected Files**:
  - `.ai/ai_scripts/testing/infrastructure/test-controller.cjs` - E2E readiness validation
  - `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs` - Container health checks
  - `docker-compose.test.yml` - Container configuration

- **Recent Changes**: No recent changes to these files
- **Suspected Functions**:
  - `validateE2EReadiness()` at test-controller.cjs:247
  - Container startup command running `pnpm install` on every restart

## Related Issues & Context

### Direct Predecessors
None found via GitHub search.

### Historical Context
This appears to be the first documented occurrence of this specific issue. The container restart during tests suggests potential resource contention or signal handling issues.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Docker container restarts during unit test execution due to an unidentified trigger, and the E2E readiness check has insufficient retry/wait logic to handle the ~40 second restart window.

**Detailed Explanation**:

1. **Container Restart Occurs**: Between 18:17:24 and 18:18:06, the slideheroes-app-test container exits (exit code 0, clean shutdown) and restarts due to the `restart: unless-stopped` policy.

2. **Slow Startup**: The container command runs `npx pnpm install` on every startup, which takes significant time (~30-40 seconds for dependency installation + Next.js startup).

3. **Inadequate Timeout**: The E2E readiness check uses only a 5-second timeout with no retry logic. When the container is restarting, this times out immediately.

4. **Potential Restart Triggers**:
   - File system changes in the mounted volume during unit tests
   - Memory pressure (container has 4GB limit)
   - Signal propagation from test processes
   - Next.js Turbopack file watcher reacting to test artifacts

**Supporting Evidence**:
- Container RestartCount: 1 (confirmed restart occurred)
- Exit code: 0 (clean shutdown, not crash)
- Container StartedAt: 18:18:46 (started after E2E check failed at 18:18:06)
- Container logs show "Installing dependencies with pnpm..." on each restart

### How This Causes the Observed Behavior

1. Unit tests run and modify files in the project (test output, coverage, etc.)
2. Container's file watcher or another trigger causes the container to restart
3. Container exits cleanly (exit code 0), Docker restarts it immediately
4. Container begins startup sequence: pnpm install + next dev
5. E2E phase starts and checks localhost:3001/api/health
6. Container is still installing dependencies, check times out after 5s
7. E2E tests are skipped with "Cannot reach test server" error
8. Container finally becomes available ~40 seconds later (after tests have already been skipped)

### Confidence Level

**Confidence**: High

**Reasoning**:
- Docker state clearly shows restart occurred (RestartCount=1, exit code=0)
- Timeline precisely explains the 40-second gap
- The 5-second timeout is too short for a container restart that takes 30-40 seconds
- All evidence points to the container being unavailable during the specific check window

## Fix Approach (High-Level)

Three potential fixes, in order of preference:

1. **Add retry logic to E2E readiness check**: Modify `validateE2EReadiness()` to retry the health check multiple times with delays, matching the container's healthcheck settings (wait up to 180 seconds with multiple retries).

2. **Optimize container startup**: Remove `pnpm install` from the startup command since dependencies are already installed, or use a volume for node_modules to persist between restarts.

3. **Prevent container restart**: Investigate what's triggering the clean shutdown during unit tests. Add .dockerignore patterns to exclude test artifacts from the mounted volume, or configure the file watcher to ignore certain directories.

## Diagnosis Determination

The root cause is clearly identified: the test server Docker container restarts during the unit test phase, and the E2E readiness check's 5-second timeout is insufficient to wait for the container to complete its startup sequence.

The fix requires either:
- More robust retry logic in the test infrastructure (preferred)
- Faster container startup times
- Prevention of the restart trigger

The most immediate and reliable fix is to add retry logic to the E2E readiness check to match the container's health check configuration (15s intervals, 10 retries, 180s start period).

## Additional Context

- The container mounts the entire project directory, so any file changes during tests are visible inside the container
- Next.js Turbopack has aggressive file watching that could trigger recompilation
- The unit tests write to stdout/stderr and may create temporary files
- The container uses tmpfs for .next directory, so cache is lost on restart

---
*Generated by Claude Debug Assistant*
*Tools Used: docker inspect, docker logs, curl, grep, test logs analysis*
