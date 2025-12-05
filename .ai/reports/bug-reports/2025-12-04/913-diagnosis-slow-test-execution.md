# Bug Diagnosis: Slow Test Execution - Multiple Architectural Issues

**ID**: ISSUE-913
**Created**: 2025-12-04T19:21:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: performance

## Summary

The comprehensive test suite (`/test`) takes significantly longer than expected due to multiple architectural issues in the test orchestration system. A full test run that should complete in ~10-15 minutes is taking 25+ minutes due to: (1) duplicate test execution between Shards 7 and 8, (2) Global Setup running once per shard instead of once globally, and (3) unbalanced shard distribution causing sequential bottlenecks.

## Environment

- **Application Version**: dev branch
- **Environment**: development (WSL2)
- **Node Version**: 22.x
- **Database**: PostgreSQL via Supabase
- **Test Framework**: Playwright + Vitest
- **Test Controller**: `.ai/ai_scripts/testing/infrastructure/test-controller.cjs`

## Reproduction Steps

1. Run `/test` (comprehensive test suite)
2. Observe test execution time
3. Check `/tmp/test-output.log` for timing breakdown

## Expected Behavior

- Full test suite completes in ~10-15 minutes
- Each shard runs unique tests (no duplicates)
- Global Setup runs once for all tests, not per-shard
- Shards are balanced for parallel execution efficiency

## Actual Behavior

- Full test suite takes 25+ minutes
- Shard 7 and Shard 8 both run the same Payload CMS tests (duplicates)
- Global Setup runs 6+ times (once per pnpm command invocation)
- Shard 2 chain (Payload shards) blocks completion while Shard 1 chain finishes in 6 min

## Diagnostic Data

### Timing Analysis

```
=== Shard Timing Summary ===
Unit tests: 9s

Shard 1 Chain (fast, ~6 min total):
  - Smoke Tests: 8s
  - Authentication: 20s
  - Personal Accounts: 87s
  - Admin & Invitations: 66s
  - Accessibility: 107s
  - Config & Health: 62s
  TOTAL: ~350s (5.8 min)

Shard 2 Chain (SLOW, bottleneck):
  - Payload CMS (shard7): 723s (12 min) <- MAJOR BOTTLENECK
  - Payload CMS Extended (shard8): Running 69 tests (estimate: 12+ min)
  - User Billing (shard9): pending
  - Team Billing (shard10): pending
  - Config Verification (shard11): pending
  - Team Accounts (shard12): pending
  TOTAL: 24+ minutes
```

### Global Setup Overhead

```
Global Setup ran: 6 times (and counting)
Each Global Setup authenticates 4 users:
  - test@slideheroes.com
  - owner@slideheroes.com
  - super-admin@slideheroes.com (with MFA)
  - payload-admin (with Payload CMS navigation)

Estimated overhead per setup: 30-60s
Total overhead: 3-6 minutes of pure setup time
```

### Duplicate Test Execution Evidence

```typescript
// e2e-test-runner.cjs lines 489-511
{
  id: 7,
  name: "Payload CMS",
  files: [
    "tests/payload/payload-auth.spec.ts",      // <- DUPLICATE
    "tests/payload/payload-collections.spec.ts", // <- DUPLICATE
    "tests/payload/payload-database.spec.ts",   // <- DUPLICATE
  ],
},
{
  id: 8,
  name: "Payload CMS Extended",
  files: [
    "tests/payload/payload-auth.spec.ts",      // <- DUPLICATE
    "tests/payload/payload-collections.spec.ts", // <- DUPLICATE
    "tests/payload/payload-database.spec.ts",   // <- DUPLICATE
    "tests/payload/seeding.spec.ts",           // <- UNIQUE
    "tests/payload/seeding-performance.spec.ts", // <- UNIQUE
  ],
},
```

## Root Cause Analysis

### Identified Root Causes

**Summary**: Three architectural issues combine to create significant test execution slowdown: duplicate tests, repeated global setup, and unbalanced shard distribution.

**Root Cause 1: Duplicate Test Execution (Shards 7 & 8)**

The shard configuration in `e2e-test-runner.cjs:489-511` defines Shard 8 to include ALL files from Shard 7 plus additional seeding tests. This means:
- `payload-auth.spec.ts` runs twice (42 tests * 2 = 84 test executions)
- `payload-collections.spec.ts` runs twice
- `payload-database.spec.ts` runs twice

This alone doubles the Payload CMS test execution time.

**Root Cause 2: Global Setup Per-Shard Execution**

The Playwright `globalSetup` function runs once per `playwright test` command invocation. Since each shard is executed as a separate pnpm command (`pnpm --filter web-e2e test:shard7`), the global setup runs for every shard instead of once for all tests.

Evidence: Global Setup ran 6 times in the log, authenticating 4 users each time.

**Root Cause 3: Unbalanced Shard Distribution**

The test controller uses `maxConcurrentShards=2`, creating two "chains":
- **Chain 1**: Shards 1-6 (non-Payload, fast tests)
- **Chain 2**: Shards 7-12 (includes slow Payload tests)

Chain 1 completes in ~6 minutes, then waits idle while Chain 2 processes the slow Payload tests sequentially.

### Supporting Evidence

1. **Log timestamps**: Shard 1 completed all 6 sub-shards (1-6) before Shard 2 finished shard 7
2. **Global Setup count**: 6 completions logged = 6 separate Playwright invocations
3. **Code inspection**: Shard 7 and 8 file arrays clearly show overlap

### How This Causes the Observed Behavior

1. Test run starts with 2 concurrent shard chains
2. Chain 1 runs shards 1-6 sequentially (~6 min total)
3. Chain 2 runs shard 7 (Payload CMS) for 12+ minutes
4. Chain 1 finishes and waits idle
5. Chain 2 continues to shard 8 (duplicates shard 7 tests + seeding)
6. Shard 8 re-runs Global Setup, re-runs all Payload tests, adds seeding
7. Total wait extends to 25+ minutes

### Confidence Level

**Confidence**: High

**Reasoning**:
- Clear code evidence showing duplicate file configuration
- Log timestamps prove execution order and timing
- Global Setup count matches number of shard invocations
- Timing math aligns with observed behavior

## Fix Approach (High-Level)

1. **Remove duplicate tests from Shard 8**: Change Shard 8 to only include `seeding.spec.ts` and `seeding-performance.spec.ts`

2. **Optimize Global Setup**: Either:
   - Share auth state files between shard invocations (check if `.auth/` persists)
   - Or implement a setup cache that skips auth if valid tokens exist

3. **Rebalance shard distribution**: Move some slow Payload tests to a separate chain or split Payload tests into smaller shards for better parallelization

## Related Files

- `.ai/ai_scripts/testing/runners/e2e-test-runner.cjs:489-543` - Shard configuration with duplicates
- `.ai/ai_scripts/testing/config/test-config.cjs:72-74` - maxConcurrentShards setting
- `apps/e2e/global-setup.ts` - Global Setup that runs per-shard
- `apps/e2e/playwright.config.ts` - Playwright configuration

## Additional Context

The current architecture was likely designed this way to ensure Shard 8's seeding tests had the Payload CMS tests as dependencies. However, this creates unnecessary duplication. A better approach would be to use Playwright's project dependencies or simply rely on the fact that Shard 7 runs before Shard 8 in the same chain.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (log analysis, timing extraction), Read (code inspection), Grep (pattern search)*
