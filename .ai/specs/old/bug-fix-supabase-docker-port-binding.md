# Bug Fix: Supabase Docker Port Binding Failure in WSL2

**Related Diagnosis**: #665 (REQUIRED)
**Severity**: critical
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Docker Desktop's vpnkit port forwarding proxy fails to establish host port bindings in WSL2
- **Fix Approach**: Add pre-flight port binding verification with automated recovery and clear error messaging
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Docker containers start and report healthy status, but the vpnkit port forwarding proxy fails to bind container ports (54321, 54322, 54323) to the host in WSL2 environment. This causes all infrastructure health checks to fail with connection timeouts, preventing test execution.

For full details, see diagnosis issue #665.

### Research Findings

This is a **confirmed known issue** affecting Docker Desktop with WSL2:

**GitHub Issues**:
- [docker/for-win#14961](https://github.com/docker/for-win/issues/14961) - Container Port Mapping Issue
- [microsoft/WSL#10683](https://github.com/microsoft/WSL/issues/10683) - WSL2 mirrored network port access failure
- [docker/for-win#13182](https://github.com/docker/for-win/issues/13182) - WSL2 port mapping failures

**Root Causes Identified**:
1. VPNKit proxy service loses synchronization
2. WSL2 mirrored networking mode incompatibility
3. Windows Hyper-V dynamic port reservations
4. Stale port proxy rules from previous sessions

### Solution Approaches Considered

#### Option 1: Pre-flight Port Binding Verification with Automated Recovery ⭐ RECOMMENDED

**Description**: Add a verification step in the test infrastructure controller that checks if Docker port bindings are actually established (not just configured), with automated recovery attempts and clear error messaging.

**Pros**:
- Catches the issue before tests start, preventing 180s timeout waste
- Provides automated recovery (restart Docker) for common cases
- Gives clear, actionable error messages with exact fix steps
- Non-invasive - adds verification without changing existing infrastructure
- Prevents false "healthy" status when ports aren't actually bound

**Cons**:
- Adds ~2-3 seconds to startup for verification
- Cannot fix all cases automatically (some require manual Docker Desktop restart)
- Requires careful implementation to avoid false positives

**Risk Assessment**: low - This is additive functionality that improves diagnostics without changing core behavior

**Complexity**: moderate - Requires understanding of Docker port binding states and test infrastructure controller

#### Option 2: WSL2 Configuration Enforcement

**Description**: Add a pre-flight check that verifies WSL2 is not using mirrored networking mode, and document the required `.wslconfig` settings.

**Pros**:
- Addresses one of the primary root causes
- One-time configuration fix
- Well-documented solution from Docker/Microsoft

**Cons**:
- Requires manual user intervention to change system configuration
- May conflict with other WSL2 use cases requiring mirrored mode
- Doesn't address vpnkit proxy failures or port reservation conflicts

**Why Not Chosen**: This should be documented as a preventive measure, but the pre-flight verification is more comprehensive and catches all failure modes.

#### Option 3: Automatic Docker Desktop Restart on Port Binding Failure

**Description**: When port binding failure is detected, automatically restart Docker Desktop service.

**Pros**:
- Fully automated recovery
- Addresses the most common fix (restart Docker)

**Cons**:
- Aggressive - restarts Docker even when user may have other containers running
- May not work in all environments (service permissions)
- Could mask underlying issues that need attention
- Long restart time (~30-60 seconds)

**Why Not Chosen**: Too aggressive for automated execution. Option 1 can offer this as a prompted choice rather than automatic action.

### Selected Solution: Pre-flight Port Binding Verification with Automated Recovery

**Justification**: This approach provides the best balance of automation and user control. It catches issues early, provides clear diagnostics, and offers recovery options without being overly aggressive. The verification adds minimal overhead (~2-3 seconds) while preventing frustrating 180-second timeouts.

**Technical Approach**:
- Check both `HostConfig.PortBindings` AND `NetworkSettings.Ports` in docker inspect
- Verify actual TCP connectivity to bound ports (not just configuration)
- Provide tiered recovery: retry → prompt for Docker restart → manual instructions
- Log detailed diagnostic information for debugging

**Architecture Changes**: None - this adds to existing infrastructure controller without modifying core architecture.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/e2e/src/infrastructure/controller.ts` - Add port binding verification to health check flow
- `apps/e2e/src/infrastructure/docker-utils.ts` - Add port binding inspection utilities (may need to create)
- `apps/e2e/src/infrastructure/health-checker.ts` - Enhance health check to verify actual port connectivity

### New Files

If new files are needed:
- `apps/e2e/src/infrastructure/port-binding-verifier.ts` - Encapsulated port binding verification logic
- `apps/e2e/src/infrastructure/__tests__/port-binding-verifier.test.ts` - Unit tests for verifier

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create Port Binding Verification Module

Create the core verification logic that checks Docker port bindings are actually established.

- Create `port-binding-verifier.ts` with functions to:
  - `inspectPortBindings(containerName)` - Get both HostConfig and NetworkSettings
  - `verifyPortConnectivity(port, timeout)` - TCP connection test
  - `diagnosePortBindingFailure(containerName)` - Generate diagnostic report
  - `getRecoveryInstructions()` - Return actionable fix steps
- Handle the specific symptom: HostConfig.PortBindings configured but NetworkSettings.Ports empty
- Include timeout handling for connection tests (500ms per port)

**Why this step first**: This is the core functionality that other steps depend on.

#### Step 2: Integrate Verification into Infrastructure Controller

Add the pre-flight check to the infrastructure startup flow.

- Modify controller to call port binding verification after container health check passes
- Add verification for critical Supabase ports: 54321 (Kong), 54322 (PostgreSQL), 54323 (Studio)
- Implement tiered response:
  1. If ports bound correctly → continue
  2. If not bound → wait 5 seconds and retry (handles race condition)
  3. If still not bound → display diagnostic message and recovery options
- Add `--skip-port-verify` flag for advanced users who want to bypass

**Why this order**: Controller integration requires the verification module to exist first.

#### Step 3: Add Recovery Options

Implement recovery suggestions and optional automated recovery.

- Display clear error message explaining the issue
- Show diagnostic data (docker inspect output)
- Provide prioritized recovery steps:
  1. "Run: wsl --shutdown && restart Docker Desktop"
  2. "Check for port conflicts: netsh interface ipv4 show excludedportrange protocol=tcp"
  3. "Verify .wslconfig doesn't use networkingMode=mirrored"
- Optionally prompt user: "Attempt automatic recovery? (will restart WSL) [y/N]"
- If user accepts, run `wsl --shutdown` and wait for Docker to restart

#### Step 4: Add/Update Tests

Add comprehensive tests for the port binding verification.

- Add unit tests for `port-binding-verifier.ts`:
  - Test parsing of docker inspect output
  - Test detection of bound vs unbound ports
  - Test connectivity verification with mock TCP server
  - Test diagnostic message generation
- Add integration test for controller with port verification
- Add regression test: simulate the original failure scenario

#### Step 5: Update Documentation

Document the new verification and troubleshooting steps.

- Add section to docker-troubleshooting.md about port binding verification
- Document the `--skip-port-verify` flag
- Add WSL2 configuration recommendations to prevent the issue
- Update CLAUDE.md if needed with new command flags

#### Step 6: Validation

- Run all validation commands (see Validation Commands section)
- Test on WSL2 environment with Docker Desktop
- Verify zero regressions in existing test infrastructure
- Manually test the error path by stopping Docker port proxy

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `inspectPortBindings()` correctly parses docker inspect JSON
- ✅ `inspectPortBindings()` detects empty NetworkSettings.Ports
- ✅ `verifyPortConnectivity()` returns true for accessible ports
- ✅ `verifyPortConnectivity()` returns false for inaccessible ports with timeout
- ✅ `diagnosePortBindingFailure()` generates correct diagnostic report
- ✅ Edge case: Container doesn't exist
- ✅ Edge case: Docker command fails
- ✅ Regression test: Original bug scenario (configured but not bound)

**Test files**:
- `apps/e2e/src/infrastructure/__tests__/port-binding-verifier.test.ts`

### Integration Tests

Test the verification integrated into the infrastructure controller:
- Verify controller proceeds when ports are correctly bound
- Verify controller stops with clear error when ports not bound
- Verify retry logic works for race condition (ports bound on second check)

**Test files**:
- `apps/e2e/src/infrastructure/__tests__/controller.integration.test.ts`

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start Supabase normally and run /test - should pass verification
- [ ] Stop Docker Desktop port proxy (advanced) and run /test - should show diagnostic
- [ ] Run with `--skip-port-verify` flag - should skip verification
- [ ] Verify diagnostic message includes correct recovery steps
- [ ] Verify recovery instructions work (wsl --shutdown fixes the issue)
- [ ] Test on fresh WSL2 environment
- [ ] Verify no performance regression (startup time increase < 5 seconds)

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **False Positives**: Verification incorrectly reports ports as unbound
   - **Likelihood**: low
   - **Impact**: medium - Tests won't run when they could
   - **Mitigation**: Use multiple verification methods (docker inspect + TCP connect), provide `--skip-port-verify` flag

2. **Race Condition**: Ports take longer than expected to bind
   - **Likelihood**: medium
   - **Impact**: low - Retry logic handles this
   - **Mitigation**: Implement retry with exponential backoff, configurable timeout

3. **Platform Compatibility**: Verification logic may not work on macOS/Linux
   - **Likelihood**: low
   - **Impact**: low - Issue is WSL2-specific
   - **Mitigation**: Only run WSL2-specific checks when detected, use platform detection

**Rollback Plan**:

If this fix causes issues:
1. Add `--skip-port-verify` flag to bypass verification
2. Remove verification call from controller if blocking all users
3. Revert to previous version of controller.ts

**Monitoring**:
- Watch for reports of false positives in CI/CD
- Monitor test infrastructure startup times
- Track recovery success rate

## Performance Impact

**Expected Impact**: minimal

- Adds ~2-3 seconds to infrastructure startup for verification
- TCP connectivity tests use 500ms timeout per port
- Docker inspect command adds ~100ms

**Performance Testing**:
- Measure startup time before and after change
- Acceptable increase: < 5 seconds
- Timeout should not exceed infrastructure phase timeout (180s)

## Security Considerations

**Security Impact**: none

- No new external connections
- No credential handling changes
- Only inspects local Docker containers

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Simulate the issue by checking current state
docker inspect supabase_kong_2025slideheroes-db --format '{{json .NetworkSettings.Ports}}'
# If empty {}, the bug is present

# Run /test and observe 180s timeout on health checks
```

**Expected Result**: Health checks timeout after 180s with "4/7 healthy" message

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests for new module
pnpm --filter web-e2e test:unit src/infrastructure/__tests__/port-binding-verifier.test.ts

# Full test suite
pnpm test:unit

# Build
pnpm build

# Manual verification - run /test and verify:
# 1. Port binding check occurs before tests
# 2. Clear error message if ports not bound
# 3. Recovery instructions are displayed
```

**Expected Result**: All commands succeed. When port binding fails, clear diagnostic message appears within 10 seconds (not 180s timeout).

### Regression Prevention

```bash
# Run full E2E test suite to ensure no regressions
pnpm test:e2e

# Verify infrastructure starts correctly
cd apps/e2e && npx playwright test --grep "infrastructure"
```

## Dependencies

**No new dependencies required**

The implementation uses:
- Node.js `net` module for TCP connectivity tests (built-in)
- `child_process` for docker commands (already used)

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

This change only affects local development and CI test infrastructure. No production deployment considerations.

**Feature flags needed**: no (but `--skip-port-verify` flag provided for bypass)

**Backwards compatibility**: maintained - existing behavior unchanged when ports are correctly bound

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Port binding failure is detected within 10 seconds (not 180s)
- [ ] Clear diagnostic message with recovery steps is displayed
- [ ] Recovery instructions successfully fix the issue
- [ ] All existing tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] Manual testing checklist complete
- [ ] Performance acceptable (< 5 second startup increase)

## Notes

### WSL2 Configuration Recommendations

Users should verify their `.wslconfig` (located at `%USERPROFILE%\.wslconfig` on Windows):

```ini
[wsl2]
# Use NAT mode (default) - avoid mirrored mode
networkingMode=NAT

# If mirrored mode is required, add ignoredPorts:
# [experimental]
# ignoredPorts=54321,54322,54323
```

### Stable Docker Desktop Versions

Based on research, these versions are reported as more stable for WSL2 port binding:
- Docker Desktop 4.35.1
- Docker Desktop 4.38.x

### Related Research

- [Docker Desktop WSL2 Port Forwarding Architecture](https://docs.docker.com/desktop/wsl/)
- [VPNKit - Docker's network proxy](https://github.com/moby/vpnkit)
- [WSL2 Networking Overview](https://learn.microsoft.com/en-us/windows/wsl/networking)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #665*
*Research conducted via exa-expert and perplexity-expert agents*
