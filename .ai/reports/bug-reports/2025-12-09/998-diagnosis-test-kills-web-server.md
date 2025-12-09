# Bug Diagnosis: Test controller kills development web server on port 3000

**ID**: ISSUE-pending
**Created**: 2025-12-09T10:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When running `/test` (E2E tests), the test controller aggressively kills processes on port 3000, which terminates the user's development web server. The E2E tests run on ports 3001/3021, so killing port 3000 is unnecessary and disrupts the development workflow.

## Environment

- **Application Version**: Current dev branch
- **Environment**: Development (WSL2)
- **Node Version**: v20.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown (may have been broken since initial implementation)

## Reproduction Steps

1. Start the development web server: `pnpm dev` (runs on port 3000)
2. Verify the web server is running: `curl http://localhost:3000`
3. Run E2E tests: `/test` or `/test --e2e`
4. Observe that the development web server on port 3000 is killed

## Expected Behavior

Running `/test` should only manage ports that E2E tests use (3001 for web test server, 3021 for Payload test server). The development web server on port 3000 should be left untouched since tests don't use that port.

## Actual Behavior

The test controller kills any process running on port 3000 during the `preTestCleanup()` phase, terminating the user's development web server.

## Diagnostic Data

### Code Analysis

**File 1: `.ai/ai_scripts/testing/utilities/test-cleanup-guard.cjs`**

Lines 241-252 in `preTestCleanup()`:
```javascript
async preTestCleanup() {
    // Skip ports 3001 and 3021 if using external test servers
    const skipTestPorts = process.env.SKIP_DEV_SERVER === "true";
    let testPorts = [3000, 3001, 3010, 3020];  // <-- PORT 3000 IS ALWAYS INCLUDED

    if (skipTestPorts) {
        // Remove test server ports when using containerized testing
        testPorts = [3000, 3010, 3020];  // <-- PORT 3000 STILL INCLUDED
    }
    ...
}
```

**File 2: `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs`**

Lines 1184-1190 in `cleanupPorts()`:
```javascript
async cleanupPorts(unitOnly = false) {
    try {
        log("🧹 Cleaning up test ports...");

        let portsToClean = [
            this.config.ports.web,      // 3000 <-- KILLS DEV SERVER
            this.config.ports.webTest,  // 3001
            this.config.ports.payload,  // 3020
        ];
```

**File 3: `.ai/ai_scripts/testing/infrastructure/test-controller.cjs`**

Line 593 - Calls preTestCleanup during test initialization:
```javascript
// Pre-test cleanup to ensure clean state
await this.cleanupGuard.preTestCleanup();
```

Line 144 in `runConditionalSetup()`:
```javascript
// Always clean ports as this is lightweight and prevents conflicts
setupResults.ports = await this.cleanupPorts(unitOnly);
```

### Call Flow

1. User runs `/test` command
2. `test-controller.cjs` is invoked via `safe-test-runner.sh`
3. In `TestController.run()` at line 593: `await this.cleanupGuard.preTestCleanup()`
4. `preTestCleanup()` iterates over ports `[3000, 3001, 3010, 3020]`
5. For port 3000, it runs: `lsof -ti:3000 | xargs -r kill`
6. Development web server is killed
7. Later, `cleanupPorts()` also targets port 3000

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `preTestCleanup()` and `cleanupPorts()` functions include port 3000 in their hardcoded list of ports to kill, but E2E tests use port 3001, not port 3000.

**Detailed Explanation**:
The test infrastructure was designed with the assumption that port 3000 would be used for testing, but the actual test configuration uses port 3001 for the test web server (via Docker container or `dev:test` script). The `SKIP_DEV_SERVER` environment variable check only removes port 3001 from the list when using external servers, but never removes port 3000.

The port cleanup logic is over-aggressive because:
1. It assumes port 3000 might have a conflicting process that needs to be killed
2. It doesn't check if the process on port 3000 is a user's development server vs. a stuck test process
3. The logic predates the Docker-based testing setup which uses port 3001

**Supporting Evidence**:
- Code reference: `.ai/ai_scripts/testing/utilities/test-cleanup-guard.cjs:244` - Port 3000 hardcoded in testPorts array
- Code reference: `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs:1188` - Port 3000 included in portsToClean
- Configuration: `.ai/ai_scripts/testing/config/test-config.cjs:53-64` defines `ports.web: 3000` and `ports.webTest: 3001`

### How This Causes the Observed Behavior

1. User starts development server which listens on port 3000
2. User runs `/test` command
3. Test controller executes `preTestCleanup()`
4. `preTestCleanup()` finds PID listening on port 3000
5. It sends SIGTERM/SIGKILL to that PID
6. Development server dies
7. E2E tests run on port 3001 (unrelated to port 3000)
8. User's development session is disrupted

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code path tracing confirms port 3000 is in the kill list
- The test configuration shows tests use port 3001, not port 3000
- The `SKIP_DEV_SERVER` logic confirms this was considered but incompletely implemented

## Fix Approach (High-Level)

Remove port 3000 from the cleanup lists since E2E tests use port 3001:

1. In `test-cleanup-guard.cjs` `preTestCleanup()`: Remove 3000 from `testPorts` array
2. In `infrastructure-manager.cjs` `cleanupPorts()`: Only clean `webTest` (3001) and `payload` (3020), not `web` (3000)
3. Consider adding a safeguard that checks if port 3000 has an active user dev server before killing it (by checking process name or environment)

Alternative approach: Add a new environment variable `PRESERVE_DEV_SERVER=true` that prevents killing port 3000.

## Diagnosis Determination

The root cause has been conclusively identified: Port 3000 is incorrectly included in the test cleanup logic. The fix is straightforward - remove port 3000 from the cleanup targets since tests use port 3001.

## Additional Context

- The test infrastructure supports both Docker-based testing (port 3001) and local dev testing (port 3000)
- The current implementation conflates "dev server cleanup" with "test port cleanup"
- Port 3001 is the dedicated test port defined in `config.ports.webTest`
- Port 3000 is the development server port defined in `config.ports.web`

## Related Issues & Context

### Similar Symptoms
- Previous test infrastructure issues may have similar aggressive cleanup patterns

### Historical Context
- The test controller was recently refactored from a monolithic design to modular architecture
- The port cleanup logic may be a remnant from when tests used port 3000

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, code analysis*
