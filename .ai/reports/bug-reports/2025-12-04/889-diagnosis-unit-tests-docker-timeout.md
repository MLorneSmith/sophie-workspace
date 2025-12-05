# Bug Diagnosis: Unit tests unnecessarily validate Docker containers causing timeout

**ID**: ISSUE-889
**Created**: 2025-12-04T14:35:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: performance

## Summary

When running unit tests with `--unit` flag, the test-controller still attempts to validate Docker containers via HTTP health checks. This causes unnecessary 10+ second timeouts when Docker containers aren't running, even though unit tests don't require Docker infrastructure.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: v22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: N/A (existing behavior)

## Reproduction Steps

1. Ensure Docker containers are NOT running (or not accessible)
2. Run `/test --unit` or `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh --unit`
3. Observe timeout error during infrastructure check phase

## Expected Behavior

Unit tests should skip all Docker container validation since they don't require Docker infrastructure. The test should proceed directly to running unit tests without any Docker-related checks.

## Actual Behavior

The test-controller times out with error:
```
[2025-12-04T14:35:51.670Z] INFO:   ❌ Container validation failed: The operation was aborted due to timeout
[2025-12-04T14:35:51.670Z] INFO: ⚠️ Docker container unhealthy: Container validation error: The operation was aborted due to timeout
```

## Diagnostic Data

### Console Output
```
[2025-12-04T14:35:40.622Z] INFO: 📋 Transitioning to phase: infrastructure_check (timeout: 180000ms)
[2025-12-04T14:35:40.633Z] INFO: 🔍 Running smart pre-flight infrastructure validation...
[2025-12-04T14:35:51.670Z] INFO:   ❌ Container validation failed: The operation was aborted due to timeout
[2025-12-04T14:35:51.670Z] INFO: ⚠️ Docker container unhealthy: Container validation error: The operation was aborted due to timeout
```

### Root Cause Code Paths

**Path 1: `cleanupPorts()` in infrastructure-manager.cjs:1194**
```javascript
// Always clean ports as this is lightweight and prevents conflicts
setupResults.ports = await this.cleanupPorts();
// Inside cleanupPorts():
const dockerAvailable = await this.checkDockerContainer(); // Called unconditionally!
```

**Path 2: `cleanup()` in test-controller.cjs:1215-1216**
```javascript
// Skip Docker container ports to avoid signal conflicts
const dockerAvailable = await this.infrastructureManager.checkDockerContainer(); // Called unconditionally!
```

## Error Stack Traces
```
The operation was aborted due to timeout
```

This is from `AbortSignal.timeout()` in `validateContainerHealth()` when the HTTP fetch to `http://localhost:3001/api/health` times out.

## Related Code

- **Affected Files**:
  - `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs` (lines 1194, 432-457)
  - `.ai/ai_scripts/testing/infrastructure/test-controller.cjs` (lines 1215-1220)
- **Recent Changes**: None - this is existing behavior
- **Suspected Functions**:
  - `cleanupPorts()` - line 1194 calls `checkDockerContainer()` unconditionally
  - `cleanup()` - line 1215-1216 calls `checkDockerContainer()` unconditionally
  - `checkDockerContainer()` - line 443 calls `validateContainerHealth()` which does HTTP fetches

## Related Issues & Context

### Direct Predecessors
None found - this is the first diagnosis of this issue.

### Historical Context
The Docker validation was added to prevent signal conflicts when cleaning up ports that might be used by Docker containers. However, the `unitOnly` flag that controls skipping dev server checks was not propagated to these cleanup functions.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `cleanupPorts()` and `cleanup()` functions call `checkDockerContainer()` unconditionally, ignoring the `unitOnly` flag that should skip Docker-related operations for unit tests.

**Detailed Explanation**:
The test-controller correctly passes `unitOnly=true` to `infrastructureManager.checkAll()` when the `--unit` flag is used. This flag is properly handled in:
- `runHealthChecks()` - skips `healthCheckDevServer()` when `unitOnly=true`
- `runConditionalSetup()` - skips Docker container check when `unitOnly=true` (line 130)

However, the flag is NOT propagated to:
1. `cleanupPorts()` (line 144 in `runConditionalSetup()`) - always called, always checks Docker
2. `cleanup()` in test-controller.cjs (line 1215) - always checks Docker

**Supporting Evidence**:
- Log shows `Container validation failed` during infrastructure_check phase
- `cleanupPorts()` is called unconditionally at line 144 of `runConditionalSetup()`
- `checkDockerContainer()` at line 1194 in `cleanupPorts()` has no `unitOnly` guard
- `validateContainerHealth()` attempts HTTP fetch to `http://localhost:3001/api/health` with 5-second timeout
- When Docker isn't running, this fetch times out

### How This Causes the Observed Behavior

1. User runs `/test --unit`
2. Test-controller sets `options.unitOnly = true`
3. `infrastructureManager.checkAll(unitOnly=true)` is called
4. `runHealthChecks(unitOnly=true)` correctly skips devServer check
5. `runConditionalSetup()` correctly skips devServer setup
6. BUT `cleanupPorts()` is called unconditionally at line 144
7. Inside `cleanupPorts()`, `checkDockerContainer()` is called at line 1194
8. `checkDockerContainer()` calls `validateContainerHealth()` at line 443
9. `validateContainerHealth()` attempts HTTP fetch to `http://localhost:3001/api/health`
10. With Docker not running, the fetch times out after 5-10 seconds
11. Error is logged: "Container validation failed: The operation was aborted due to timeout"

### Confidence Level

**Confidence**: High

**Reasoning**: The code path is clearly traced through the log output and source code. The `unitOnly` flag is correctly handled in some places but not in `cleanupPorts()` and `cleanup()`. The timeout error message directly correlates with the HTTP timeout in `validateContainerHealth()`.

## Fix Approach (High-Level)

1. Pass `unitOnly` flag to `cleanupPorts()` method and skip Docker check when `unitOnly=true`
2. Store `unitOnly` flag in test-controller instance and check it in `cleanup()` method before calling `checkDockerContainer()`
3. Alternative: Use a quick `docker ps` check with short timeout instead of HTTP validation for cleanup purposes

The fix should:
- Add `unitOnly` parameter to `cleanupPorts(unitOnly = false)`
- Skip `checkDockerContainer()` call when `unitOnly=true` in `cleanupPorts()`
- Store `this.options.unitOnly` and check it in `cleanup()` before Docker validation
- Consider using a simpler Docker check (just `docker ps | grep`) for cleanup purposes vs full HTTP validation

## Diagnosis Determination

The root cause is confirmed: Docker container validation is performed unconditionally in port cleanup functions, even when running unit-only tests that don't require Docker infrastructure.

The fix is straightforward - propagate the `unitOnly` flag to these cleanup functions and skip Docker validation when unit-only mode is active.

## Additional Context

- Unit tests completed successfully when run directly via `pnpm test:unit`, bypassing the test-controller
- The Docker validation is useful for E2E tests to prevent killing Docker container processes
- For unit tests, there's no need to worry about Docker container ports since unit tests don't use them

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash*
