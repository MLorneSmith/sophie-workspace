# Bug Fix: E2E Test Shard Resource Exhaustion and Parallelism

**Related Diagnosis**: #617
**Severity**: high
**Bug Type**: error
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Excessive parallel browser instance creation (30+) causes system resource exhaustion when running 10 E2E test shards simultaneously
- **Fix Approach**: Implement adaptive parallelism with shard sequencing and resource monitoring
- **Estimated Effort**: medium
- **Breaking Changes**: no
- **Database Changes**: no

## Solution Design

### Problem Recap

The E2E test suite runs 10 shards in parallel, with each shard creating 2-3 Playwright browser contexts during global setup. This results in ~30 concurrent browser instances competing for limited system resources (memory, file descriptors, CPU). The system becomes resource-constrained around shard 7, causing:

1. **Shard 7**: Auth API timeouts (system under memory/CPU pressure)
2. **Shard 8**: Browser instance premature closure (file descriptor limit reached)
3. **Shards 9-10**: SIGTERM termination (cascading failure from shard 8 crash)

Previous fixes addressed specific symptoms (auth stability, cookie persistence, timeout tuning) but didn't solve the fundamental resource management problem. Tests are now more complex and resource-intensive, pushing the system beyond sustainable parallelism limits.

For full context, see diagnosis issue #617.

### Solution Approaches Considered

#### Option 1: Reduce Parallel Shards with Sequential Batching ⭐ RECOMMENDED

**Description**: Limit concurrent shards to 4-5 (sustainable for most systems) and execute remaining shards sequentially in batches. Implement a test scheduler that queues shards and manages batch execution.

**Pros**:
- **Directly addresses root cause**: Reduces concurrent browser instances from 30 to ~12-15
- **Efficient resource utilization**: Completes tests in ~1.5-2x original time instead of failure
- **Scalable approach**: Can adjust batch size based on system metrics
- **Minimal code changes**: Localized to test runner configuration and scheduler
- **No architectural changes**: Existing test infrastructure remains unchanged

**Cons**:
- **Slower total execution**: ~1.5-2x longer than ideal parallelism (but faster than current failures)
- **More complex test controller**: Need to implement batch scheduling and queue management
- **Requires monitoring**: Need to track batch completion and handle inter-batch failures

**Risk Assessment**: Medium - Changes test runner behavior but not test code itself

**Complexity**: Moderate - Requires new batch scheduling logic but straightforward implementation

#### Option 2: Reduce Workers Per Shard + Fewer Overall Shards

**Description**: Reduce Playwright workers from 2-3 per shard to 1, and reduce total shards from 10 to 6-7.

**Pros**:
- **Simpler implementation**: Just config changes, no scheduler needed
- **Safer**: More conservative resource limits
- **Predictable**: Fixed parallelism, no dynamic adjustment

**Cons**:
- **Still slow**: Execution time increases significantly
- **Wastes resources**: System may have headroom but can't use it
- **Less flexible**: Can't adapt to different system capabilities
- **Doesn't scale**: Adding more tests requires re-tuning

**Why Not Chosen**: Option 1 is more efficient and scalable while remaining straightforward to implement.

#### Option 3: Resource-Based Adaptive Parallelism

**Description**: Monitor system resources (memory, CPU, open file descriptors) and dynamically adjust parallelism based on real-time metrics.

**Pros**:
- **Maximum flexibility**: Adapts to different system capabilities
- **Future-proof**: Works as tests become heavier
- **Efficient**: Uses available resources without leaving headroom

**Cons**:
- **Complex implementation**: Requires system monitoring integration
- **Unpredictable timing**: Execution time varies based on system state
- **Harder to debug**: Dynamic behavior makes troubleshooting harder
- **Overkill for current need**: High complexity for the problem at hand

**Why Not Chosen**: Too complex for the immediate problem. Option 1 provides good balance of simplicity and efficiency. Resource monitoring can be added later if needed.

#### Option 4: Move to Single-Shard Sequential Execution

**Description**: Remove all parallelism and run all tests sequentially in one shard.

**Pros**:
- **Zero resource contention**: Guaranteed to work
- **Simplest implementation**: Minimal code changes

**Cons**:
- **Extremely slow**: Test execution time 8-10x longer
- **Defeats purpose of sharding**: Original sharding was to improve speed
- **Poor developer experience**: Long test feedback cycles

**Why Not Chosen**: Excessive performance regression. Option 1 provides much better trade-off.

### Selected Solution: Reduce Parallel Shards with Sequential Batching

**Justification**: This approach directly addresses the resource exhaustion root cause while maintaining reasonable test execution speed. It's simple enough to implement reliably but sophisticated enough to adapt to different system capabilities. The 1.5-2x slowdown is acceptable compared to current failures that prevent tests from running at all.

**Technical Approach**:

1. **Batch Configuration**: Reduce concurrent shards from 10 to 4-5 (sustainable level)
2. **Test Scheduler**: Implement queue-based scheduler that:
   - Batches shards into groups of 4-5
   - Executes each batch sequentially
   - Waits for batch completion before starting next batch
   - Tracks results across batches
3. **Resource Management**:
   - Pre-check available system resources before test execution
   - Log resource usage during test runs
   - Warn if system resources approach limits
4. **Configuration Flexibility**: Make batch size tunable via environment variables

## Implementation Plan

### Affected Files

List files that need modification:

- `apps/e2e/playwright.config.ts` - Modify workers configuration
- `.ai/ai_scripts/testing/infrastructure/safe-test-runner.sh` - Add shard batching logic
- `apps/e2e/package.json` - Update test scripts to support batching
- **NEW**: `.ai/ai_scripts/testing/infrastructure/shard-batch-scheduler.js` - Batch scheduling logic
- `.github/workflows/e2e.yml` - Update CI/CD to use batch scheduling (if needed)

### New Files

If new files are needed:

- `.ai/ai_scripts/testing/infrastructure/shard-batch-scheduler.js` - Queue-based shard batch scheduler with resource monitoring and inter-batch synchronization

### Step-by-Step Tasks

#### Step 1: Analyze Current Test Configuration and Shard Distribution

**Describe**: Understand current shard structure, test counts per shard, and resource profiles.

- Review current `playwright.config.ts` and Playwright worker configuration
- Analyze test distribution across 10 shards (which are heaviest, which are lightest)
- Identify current script invocation in `safe-test-runner.sh` that runs all 10 shards in parallel
- Determine optimal batch size (4-5 shards per batch) based on test analysis
- Document current baseline execution time and failure points

**Why this step first**: Must understand current structure before redesigning batch execution.

#### Step 2: Create Batch Scheduler Implementation

**Describe**: Implement the core queue-based batch scheduler that manages shard execution.

- Create `.ai/ai_scripts/testing/infrastructure/shard-batch-scheduler.js` with:
  - Batch queue management (accept shard list, organize into batches)
  - Parallel shard execution within batch (run 4-5 shards concurrently)
  - Sequential batch execution (wait for batch to complete before starting next)
  - Result aggregation across batches (combine results into single test report)
  - Graceful failure handling (continue to next batch if shard fails)
  - Resource pre-flight checks (verify system has minimum resources)
- Implement shard result parsing and aggregation logic
- Add logging at batch boundaries (batch start, completion, results)

**Why this step second**: Foundation for all other changes. Can't proceed without this logic.

#### Step 3: Update Test Scripts and Configuration

**Describe**: Integrate batch scheduler into test execution pipeline.

- Modify `apps/e2e/package.json` test scripts:
  - Update `test:e2e:shards` or equivalent to use batch scheduler instead of direct `pnpm recursive run`
  - Add environment variables for batch size configuration
- Update `safe-test-runner.sh` E2E phase to call batch scheduler instead of raw pnpm command
- Add configuration options:
  - `E2E_SHARD_BATCH_SIZE` - Number of shards per batch (default: 4)
  - `E2E_ENABLE_BATCH_SCHEDULING` - Toggle for batch mode (default: true)
  - `E2E_RESOURCE_CHECK_ENABLED` - Enable pre-flight resource checks (default: true)

**Why this step third**: Connects scheduler to actual test execution infrastructure.

#### Step 4: Implement Resource Monitoring

**Describe**: Add system resource checks and logging to detect when resources are constrained.

- Add pre-test resource verification:
  - Check available memory (must have >500MB free)
  - Check available file descriptors (must have >1000 free)
  - Check CPU availability (log current load average)
  - Warn if any check fails but allow override
- Add in-test resource logging:
  - Log memory usage at batch boundaries
  - Log file descriptor count at batch start/end
  - Warn if usage exceeds thresholds
  - Capture peak resource usage for later analysis
- Add resource summary to final test report

**Why this step fourth**: Provides visibility into resource constraints and validates fix effectiveness.

#### Step 5: Update CI/CD Configuration (if needed)

**Describe**: Update GitHub Actions workflow to use batch scheduling.

- Review `.github/workflows/e2e.yml` (if exists)
- Update E2E test execution to use `E2E_ENABLE_BATCH_SCHEDULING=true`
- Add resource monitoring to CI/CD logs
- Test batch scheduling in CI environment to ensure compatibility

**Why this step fifth**: Ensures fix works in CI/CD environment, not just locally.

#### Step 6: Add/Update Tests for Batch Scheduler

**Describe**: Add test coverage for batch scheduling logic and edge cases.

- Unit tests for batch scheduler:
  - Test batch queue creation and organization
  - Test shard result parsing and aggregation
  - Test failure handling (one shard fails, batch continues)
  - Test empty batch handling
- Integration tests:
  - Run actual E2E test suite with batch scheduling enabled
  - Verify results match expected test counts
  - Verify all tests that should pass do pass
- Manual test scenarios:
  - Run with different batch sizes (1, 3, 5, 8)
  - Verify resource usage stays within limits
  - Verify execution time is within expected range

#### Step 7: Document Changes and Update Configuration

**Describe**: Document the batch scheduling approach and configuration options.

- Add comments to batch scheduler explaining algorithm and design decisions
- Update test runner documentation with batch scheduling overview
- Document configuration environment variables and their effects
- Add troubleshooting guide for common batch scheduling issues
- Update E2E README with new test execution model

#### Step 8: Validation and Testing

**Describe**: Execute complete validation before considering fix complete.

- Run all validation commands (see Validation Commands section)
- Verify zero regressions in test results
- Test all edge cases (resource limits, inter-batch failures, etc.)
- Confirm bug is fixed (no SIGTERM, all shards complete)

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Batch scheduler can organize 10 shards into groups of 4-5
- ✅ Sequential batch execution waits for previous batch before starting next
- ✅ Result aggregation correctly combines all shard results
- ✅ Graceful handling when individual shard fails (batch continues)
- ✅ Resource pre-check correctly identifies insufficient memory/file descriptors
- ✅ Shard result parsing handles both pass and fail cases
- ✅ Empty batch handling (edge case)
- ✅ Single-shard batch (edge case)

**Test files**:
- `.ai/ai_scripts/testing/infrastructure/__tests__/shard-batch-scheduler.spec.js` - Batch scheduler unit tests

### Integration Tests

Ensure batch scheduling works with actual E2E test suite:

- Run full E2E test suite with batch scheduling enabled
- Verify all tests that passed before still pass
- Verify no new test failures from batch scheduling
- Test with different batch sizes (3, 4, 5, 6) to confirm optimal sizing
- Verify resource usage stays within acceptable limits throughout execution
- Verify results aggregation produces correct summary statistics

### E2E Tests

Behavioral validation of the fix:

- **Reproduction**: Run full 10-shard test suite with batch scheduling
  - Expected: All shards complete successfully without SIGTERM
  - Verify: Global setup completes for all shards
  - Verify: No browser closure errors
  - Verify: No auth API timeouts
  - Verify: All test results properly aggregated

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug without fix (10 parallel shards fail as documented)
- [ ] Apply batch scheduling fix
- [ ] Run full E2E test suite with batch scheduling
  - [ ] Shard 1-5 complete successfully in first batch
  - [ ] Resource usage stays within limits during first batch
  - [ ] Second batch (shards 6-10) starts without errors
  - [ ] All shards complete with expected test results
  - [ ] No SIGTERM or browser closure errors
- [ ] Verify test results summary is accurate and complete
- [ ] Test with different batch sizes to confirm resource efficiency
  - [ ] Batch size 3: Verify slower but still works
  - [ ] Batch size 5: Verify optimal speed/stability trade-off
  - [ ] Batch size 8: Verify exceeding batch size causes failures
- [ ] Verify resource monitoring logs show expected memory/FD usage
- [ ] Check browser console for no new errors introduced
- [ ] Run on different system (if possible) to verify portability

## Risk Assessment

**Overall Risk Level**: Medium

**Potential Risks**:

1. **Batch Scheduling Complexity**: Implementation of queue-based scheduler could have synchronization bugs
   - **Likelihood**: Medium
   - **Impact**: High (incorrect test results)
   - **Mitigation**: Comprehensive unit tests for all batch scenarios; manual testing with multiple batch sizes; gradual rollout to verify before full adoption

2. **Resource Monitoring Accuracy**: File descriptor or memory checks might not correctly reflect actual resource constraints
   - **Likelihood**: Low
   - **Impact**: Medium (missed resource issues)
   - **Mitigation**: Test on systems with different resource profiles; add logging to verify check accuracy; allow override for edge cases

3. **Increased Test Execution Time**: Batch scheduling increases execution time by 1.5-2x compared to ideal parallelism
   - **Likelihood**: High
   - **Impact**: Low (test feedback is slower but acceptable)
   - **Mitigation**: Clear documentation of trade-offs; option to adjust batch size for different contexts

4. **CI/CD Compatibility**: Batch scheduling might behave differently in CI environment vs. local development
   - **Likelihood**: Medium
   - **Impact**: Medium (CI tests might still fail)
   - **Mitigation**: Test thoroughly in CI before deploying; include CI-specific configuration options

5. **Regression in Test Coverage**: Changes to test execution might cause some tests to not run
   - **Likelihood**: Low
   - **Impact**: High (missing test coverage)
   - **Mitigation**: Verify test count matches expected across all batches; add validation that all shards executed

**Rollback Plan**:

If batch scheduling causes issues in production/CI:

1. Immediately disable batch scheduling by setting `E2E_ENABLE_BATCH_SCHEDULING=false`
2. Revert to original 10-parallel execution (will reproduce original issue)
3. Analyze batch scheduler logs to identify failure mode
4. Fix issue in batch scheduler implementation
5. Re-enable batch scheduling with fix
6. If unable to fix quickly, revert entire feature and use Option 2 (reduce shards/workers) as temporary solution

**Monitoring** (if deployed to CI):

- Monitor E2E test execution time for each batch
- Alert if any batch takes >300% longer than baseline
- Monitor for any SIGTERM errors (indicates resource issue still present)
- Track resource usage metrics to validate fix effectiveness
- Monthly review of test execution performance to ensure batch size is optimal

## Performance Impact

**Expected Impact**: Minimal to Moderate

Current state: Test suite fails partway through (SIGTERM, browser closure errors)

With batch scheduling: Test suite completes successfully but takes 1.5-2x longer

Trade-off analysis:
- **Current (failing)**: 0% success rate, requires manual retry
- **With fix (batch scheduling)**: 100% success rate, 1.5-2x execution time
- **Net improvement**: Test suite is actually useful now vs. consistently failing

Execution time breakdown:
- Original goal (10 fully parallel shards): ~5-7 minutes (theoretical, not achievable due to resource limits)
- Current failing state: ~6-7 minutes before SIGTERM (time wasted on partial execution)
- With batch scheduling (4-shard batches): ~8-12 minutes (acceptable, predictable)

## Security Considerations

**Security Impact**: None

No security implications from this fix:
- Batch scheduler is internal testing infrastructure
- No changes to authentication, authorization, or data handling
- Changes are local to E2E test execution only
- No external API or network changes
- Test data remains isolated

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run comprehensive test suite with original 10-parallel configuration
pnpm test

# Expected Result:
# - Shards 1-6 pass
# - Shard 7 hangs with auth timeout
# - Shard 8 crashes with "browser has been closed" error
# - Shards 9-10 terminate with SIGTERM
# - Overall test suite fails
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run E2E tests with batch scheduling enabled
E2E_ENABLE_BATCH_SCHEDULING=true pnpm test:e2e

# Expected Result:
# - Batch 1 (shards 1-5): ✅ All pass
# - Batch 2 (shards 6-10): ✅ All pass
# - Final summary: All X tests pass across all shards
# - No SIGTERM or browser closure errors
# - Resource usage within acceptable limits

# Run with different batch sizes to verify flexibility
E2E_SHARD_BATCH_SIZE=3 pnpm test:e2e  # Smaller batches, more resource-safe
E2E_SHARD_BATCH_SIZE=5 pnpm test:e2e  # Optimal speed/stability trade-off
E2E_SHARD_BATCH_SIZE=8 pnpm test:e2e  # Larger batches, higher resource usage

# Verify resource monitoring is working
E2E_RESOURCE_CHECK_ENABLED=true pnpm test:e2e  # Should log resource checks at start and between batches

# Build to ensure no regressions
pnpm build
```

**Expected Result**: All commands succeed, no SIGTERM errors, all tests pass, resource usage stays within limits.

### Regression Prevention

```bash
# Run full test suite (unit + integration + E2E) to ensure no regressions
pnpm test

# Verify no new test failures introduced
# Expected: All tests pass with batch scheduling enabled

# Monitor test execution time across multiple runs
# Expected: Consistent 8-12 minute E2E execution time
# Should not be significantly slower or unstable
```

## Dependencies

### New Dependencies (if any)

No new external dependencies required. Batch scheduler will be implemented in Node.js using built-in APIs:
- `child_process` for spawning shard processes
- `fs` for file I/O
- `os` for system resource checks

**No new npm packages** required for core functionality.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
- No database migrations or schema changes
- No API changes
- Test infrastructure only change
- Safe to deploy at any time

**Feature flags needed**: No

**Backwards compatibility**: Maintained

Existing test execution method can be enabled/disabled via `E2E_ENABLE_BATCH_SCHEDULING` environment variable.

## Success Criteria

The fix is complete when:
- [ ] Batch scheduler implementation complete and tested
- [ ] E2E test suite runs with batch scheduling: All 10 shards complete successfully
- [ ] No SIGTERM errors or browser closure errors
- [ ] No auth API timeouts occur
- [ ] Test results are correctly aggregated across batches
- [ ] Resource monitoring detects and logs resource usage
- [ ] All validation commands pass
- [ ] Zero regressions in existing tests
- [ ] Execution time is within expected range (8-12 minutes)
- [ ] Manual testing checklist complete
- [ ] Code review approved (if applicable)

## Notes

### Implementation Strategy

This fix is intentionally straightforward and localized to test infrastructure. The goal is to get the E2E test suite working reliably again while leaving room for future optimization.

Future enhancements could include:
- Dynamic batch size adjustment based on real-time resource monitoring
- Test distribution optimization (grouping related tests together)
- Parallel batch execution across machines (distributed testing)
- AI-powered test scheduling based on historical execution times

### Why Batching Works

The root cause is resource exhaustion from too many concurrent processes. Batching solves this by:
1. **Reducing concurrent processes**: 10 parallel → 4-5 concurrent per batch
2. **Maintaining parallelism benefit**: Still running multiple shards concurrently (not sequential)
3. **Allowing system recovery**: System has time to clean up between batches
4. **Predictable resource usage**: Peak memory/FD usage is constant across batches

The 1.5-2x slowdown is acceptable because:
- It's faster than sequential execution (which would be 8-10x)
- It's better than current state (test suite fails)
- Most teams run tests asynchronously (in background or CI)
- Test feedback loop is still acceptable for most use cases

### Git History Context

Recent commits show E2E infrastructure has been struggling with resource management for several months:
- Multiple auth timeout fixes (issues #570-572)
- Timeout tuning for CI environment
- Cookie persistence and localStorage key generation fixes

This indicates the underlying resource problem has persisted despite specific symptom fixes. Batching addresses the root cause rather than patching symptoms.

---

*Bug Fix Plan for Issue #617: E2E Test Shard Resource Exhaustion*
*Generated by Claude Code Bug Fix Planning*
*Based on diagnosis completed 2025-11-17*
