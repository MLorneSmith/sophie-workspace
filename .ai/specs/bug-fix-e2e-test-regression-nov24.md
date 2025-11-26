# Bug Fix: E2E Test Regression - Shard Execution Halt After Authentication Timeout

**Related Diagnosis**: #688
**Severity**: critical
**Bug Type**: regression
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Authentication shard (Shard 2) timeout cascades; `continueOnTimeout` config not explicitly set, defaults to undefined
- **Fix Approach**: Explicitly set `continueOnTimeout: true` in config, clarify continuation logic, add defensive logging
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

E2E test suite stops executing after Shard 2 (Authentication) times out at 134 seconds. Despite configuration attempting to continue, only ~11 tests execute before all remaining 8 shards are skipped (0/0 passed, 1s each). This regression was introduced by commit abd362ceb (Supabase port 54321→54521), adding authentication latency that causes test timeouts.

The condition on line 633 of e2e-test-runner.cjs checks `this.config.execution.continueOnTimeout`, but if this value isn't explicitly set to `true`, the condition fails and execution falls through to the failure check.

For full details, see diagnosis issue #688.

### Solution Approaches Considered

#### Option 1: Explicit Config + Unified Condition Logic ⭐ RECOMMENDED

**Description**: Ensure `continueOnTimeout: true` in config, clarify continuation logic, add debugging logging.

**Pros**:
- Fixes root cause (config not explicitly set)
- Makes logic clear and maintainable
- Adds visibility for future debugging
- Minimal code changes

**Cons**:
- Requires config file modification
- Adds logging overhead

**Risk Assessment**: low

**Complexity**: moderate

#### Option 2: Just Fix Config Default

**Description**: Only ensure `continueOnTimeout` defaults to `true`.

**Pros**:
- Minimal changes

**Cons**:
- Doesn't improve clarity
- Doesn't add debugging visibility

**Risk Assessment**: medium

**Complexity**: simple

#### Option 3: Complete Refactor

**Description**: Redesign timeout handling entirely.

**Pros**:
- Clean architecture

**Cons**:
- High complexity and risk

**Risk Assessment**: high

**Complexity**: complex

### Selected Solution: Explicit Config + Unified Condition Logic

**Justification**: The test runner checks `this.config.execution.continueOnTimeout` but if undefined/false, execution stops. Setting this explicitly to `true` and clarifying the condition logic ensures timeouts don't block subsequent shards. This is surgical, low-risk, and improves maintainability.

## Implementation Plan

### Affected Files

- `.ai/ai_scripts/testing/infrastructure/test-controller.cjs` - Config init
- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs` - Lines 560-662

### Step-by-Step Tasks

#### Step 1: Update Test Controller Config

- Read `.ai/ai_scripts/testing/infrastructure/test-controller.cjs`
- Find `execution` config object
- Ensure: `continueOnTimeout: true, continueOnFailure: true`
- If missing, add/update both values

#### Step 2: Add Config Verification Logging

- At line 564 in `runShardByShardSequential()`, add:
  ```javascript
  log(`⚙️  Config: continueOnTimeout=${this.config.execution.continueOnTimeout}, continueOnFailure=${this.config.execution.continueOnFailure}`);
  ```

#### Step 3: Add Shard Decision Logging

- Before line 633, add:
  ```javascript
  log(`   Shard result: timedOut=${shardResult.timedOut}, failed=${shardResult.failed}`);
  log(`   Decision: continueOnTimeout=${this.config.execution.continueOnTimeout}, continueOnFailure=${this.config.execution.continueOnFailure}`);
  ```

#### Step 4: Clarify Continuation Logic

Replace lines 633-645 with:
```javascript
// Determine if we should continue to next shard
const shouldContinue = 
  (shardResult.timedOut && this.config.execution.continueOnTimeout) ||
  (shardResult.failed > 0 && this.config.execution.continueOnFailure !== false) ||
  (!shardResult.timedOut && shardResult.failed === 0);

if (!shouldContinue) {
  log(`❌ Stopping test execution - Shard ${shardNum} (${shard.name})`);
  log(`   timedOut=${shardResult.timedOut}, continueOnTimeout=${this.config.execution.continueOnTimeout}`);
  log(`   failed=${shardResult.failed}, continueOnFailure=${this.config.execution.continueOnFailure}`);
  break;
} else if (shardResult.timedOut) {
  log(`⏱️ Shard ${shardNum} (${shard.name}) timed out, but continuing...`);
}
```

#### Step 5: Run Tests and Verify

```bash
pnpm test:e2e
```

Verify:
- All 10 shards execute
- Config values logged at start
- Decision logic logged for each shard
- Test summary shows actual results for all shards

## Testing Strategy

### Unit Tests

- Config defaults test
- Timeout with continueOnTimeout=true → continue
- Timeout with continueOnTimeout=false → stop
- Failure with continueOnFailure=true → continue  
- Failure with continueOnFailure=false → stop

### Manual Testing Checklist

- [ ] Run `pnpm test:e2e`
- [ ] Verify config logged: `continueOnTimeout=true`
- [ ] Verify Shards 1-10 all execute
- [ ] Verify shard 2 doesn't cause exit
- [ ] Verify test summary shows all shard results
- [ ] Verify no zombie processes after completion

## Risk Assessment

**Overall Risk**: medium

**Risks**:
1. Config change breaks something (low likelihood, medium impact)
   - Mitigation: Add config validation in constructor
2. Logic still wrong (low likelihood, high impact)
   - Mitigation: Add logging, run comprehensive tests
3. Auth tests still timeout (medium likelihood, medium impact)
   - Mitigation: Monitor execution times, optimize separately
4. Unforeseen side effects (low likelihood, medium impact)
   - Mitigation: Comprehensive testing

**Rollback**: `git checkout HEAD -- .ai/ai_scripts/testing/runners/e2e-test-runner.cjs`

## Validation Commands

### After Fix

```bash
pnpm typecheck
pnpm test:e2e

# Verify all shards executed
pnpm test:e2e 2>&1 | grep "completed in" | wc -l
# Should output: 10

# Check for unexecuted shards
pnpm test:e2e 2>&1 | grep "0/0 passed"
# Should return nothing
```

## Success Criteria

- [ ] Config explicitly sets continueOnTimeout=true
- [ ] All 10 shards execute without premature exit
- [ ] Shard 2 timeout doesn't stop subsequent shards
- [ ] Test summary shows actual results for all shards
- [ ] Validation commands pass
- [ ] No zombie processes after tests

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #688*
