# Bug Diagnosis: S1918 Alpha Orchestrator Completion Phase Failure

**ID**: ISSUE-1934
**Created**: 2026-02-04T19:15:00Z
**Reporter**: User (via /diagnose command)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha workflow orchestrator completed implementation of all 18 features for S1918 (user-dashboard) but failed silently during the completion phase. No review sandbox was created, no dev server was started, and the summary box lacked review URLs. The manifest shows `completion_status: "partial_completion"` with an empty `sandbox_ids: []` array.

This is a recurrence of the same issues reported in Issue #1930, indicating the fix for #1930 was incomplete.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: Development (local orchestrator + E2B sandboxes)
- **Run ID**: run-ml8agoaj-09hr
- **Provider**: GPT (Codex) via `--provider gpt`
- **Node Version**: (E2B sandbox default)
- **Last Working**: Unknown - first GPT run for S1918

## Reproduction Steps

1. Run the orchestrator with GPT provider: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1918 --provider gpt`
2. Wait for all 18 features to complete implementation
3. Observe the completion phase
4. Note: Review sandbox is not created, dev server not started, summary lacks URLs

## Expected Behavior

After all features complete:
1. Implementation sandboxes are killed
2. A fresh review sandbox is created with all code
3. Dev server starts in the review sandbox
4. Summary displays VS Code URL and Dev Server URL for review
5. `completion_status` should be `"completed"`

## Actual Behavior

After all features complete:
1. Implementation sandboxes are killed ✅
2. Review sandbox creation FAILS silently ❌
3. Dev server not started (no sandbox) ❌
4. Summary shows no URLs ❌
5. `completion_status: "partial_completion"` with empty `sandbox_ids: []`

## Diagnostic Data

### Manifest Evidence
```json
{
  "progress": {
    "status": "completed",
    "features_completed": 18,
    "features_total": 18,
    "completion_status": "partial_completion"
  },
  "sandbox": {
    "sandbox_ids": [],
    "branch_name": "alpha/spec-S1918"
  }
}
```

### Console Output
No error details visible - the orchestrator was run with UI mode enabled, which suppresses the `log()` function calls. The error details in `setupReviewSandbox()` catch block are logged with `log()` instead of `error()`, making them invisible in UI mode.

### Network Analysis
N/A - sandbox creation is E2B API call, not visible in browser network tab

### Database Analysis
N/A - issue is with E2B sandbox creation, not database

### Performance Metrics
- All 18 features completed successfully in ~53 minutes
- Completion phase failure occurred immediately after work loop finished

## Error Stack Traces

No stack traces captured - errors are logged with `log()` which is suppressed in UI mode.

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/completion-phase.ts` (lines 149-216: `setupReviewSandbox`)
  - `.ai/alpha/scripts/lib/sandbox.ts` (lines 1375-1508: `createReviewSandbox`)
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 80-94: `createLogger`)
- **Recent Changes**: Issue #1930 claimed to fix this exact issue
- **Suspected Functions**:
  - `setupReviewSandbox()` - catches errors but logs with `log()` instead of `error()`
  - `createReviewSandbox()` - possible GPT-specific failure during validation/install

## Related Issues & Context

### Direct Predecessors
- #1930 (CLOSED): "Bug Fix: S1918 Alpha Orchestrator Completion Phase Issues" - This fix was supposed to address the same symptoms but clearly didn't fully resolve the issue.

### Infrastructure Issues
- #1924: GPT provider review sandbox failures with install timeout - Added provider-specific install retry logic

### Similar Symptoms
- #1883: Review sandbox failure event emission - Added `review_sandbox_failed` event
- #1727: Review sandbox resource pressure - Changed to kill implementation sandboxes before creating review sandbox

## Root Cause Analysis

### Identified Root Cause

**Summary**: Critical error logs are suppressed in UI mode because `setupReviewSandbox()` uses `log()` instead of `error()` for error reporting.

**Detailed Explanation**:
The orchestrator's logging system (orchestrator.ts:80-94) provides two functions:
1. `log()` - Conditional logger, suppressed when `uiEnabled: true`
2. `error()` - Always outputs via `console.error()`

In the completion-phase.ts at lines 192-200, when `createReviewSandbox()` throws an error:
```typescript
catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Bug fix #1924: Log at ERROR level with full context for diagnostics
    log(`   ❌ ERROR: Failed to create review sandbox (${providerDisplayName})`);  // <-- USES log() NOT error()!
    log(`   Error message: ${errorMessage}`);
    // ...
}
```

The comment says "Log at ERROR level" but it actually uses `log()` which is NOT error level - it's a conditional debug log that's suppressed in UI mode.

**Root Cause Chain**:
1. User runs orchestrator with UI mode (default when running from terminal with TTY)
2. All features complete successfully
3. `setupReviewSandbox()` is called
4. `createReviewSandbox()` fails (reason unknown - could be GPT template issue, install timeout, typecheck failure)
5. Error is caught and logged with `log()` - **BUT THIS IS SUPPRESSED IN UI MODE**
6. Event is emitted to UI via `emitOrchestratorEvent()` - displayed briefly in UI event log but not persisted
7. Function returns `null`
8. `completionStatus` is set to `"partial_completion"`
9. User sees "partial_completion" but has no visibility into WHY it failed

**Supporting Evidence**:
- `spec-manifest.json` shows `completion_status: "partial_completion"` with empty `sandbox_ids`
- No error messages in console output or log files
- The #1930 fix added completion summary logging (lines 560-587) but also used `log()` not `error()`

### How This Causes the Observed Behavior

1. Review sandbox creation fails for some reason (GPT template, install, typecheck)
2. Error details are logged with `log()` but suppressed in UI mode
3. User sees summary with "Review sandbox: ❌ FAILED" but no explanation
4. Summary instructions say "Check logs above for sandbox creation error details" but there ARE no logs (suppressed)
5. Manifest records `partial_completion` but no `review_error` field to explain why

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path is clear and the logging behavior is explicitly conditional
- The comment at line 191 says "Log at ERROR level" but the implementation uses `log()` not `error()`
- This explains why the fix from #1930 didn't work - it added more logging but with the same `log()` function

## Fix Approach (High-Level)

**Immediate fixes (orchestrator code):**

1. **Use `error()` for critical failures** - In completion-phase.ts, change error logging from `log()` to `error()` so errors are always visible:
   ```typescript
   // Instead of: log(`   ❌ ERROR: Failed to create review sandbox`)
   // Use: error(`   ❌ ERROR: Failed to create review sandbox`)
   ```

2. **Store error in manifest** - Add a `review_error` field to the manifest so the failure reason persists:
   ```typescript
   manifest.progress.review_error = errorMessage;
   ```

3. **Pass `error` function to completion phase** - The `executeCompletionPhase` function receives a `log` function but should also receive an `error` function for critical failures.

**Secondary fixes:**

4. **Persist orchestrator logs to file** - The event server receives events but doesn't persist them. Consider writing completion phase events to a log file.

5. **GPT template validation** - Investigate why `createReviewSandbox()` might be failing for GPT provider specifically. Could be template issues, install flags, or typecheck failures.

## Diagnosis Determination

The root cause is a logging level bug: critical errors in `setupReviewSandbox()` use `log()` (suppressed in UI mode) instead of `error()` (always visible). The actual sandbox creation error is unknown because it's not being displayed or persisted.

The fix from #1930 was incomplete because it added completion summary logging but used the same suppressed `log()` function.

## Additional Context

- The orchestrator uses GPT/Codex provider, which has different template handling than Claude
- The sandbox logs in `.ai/alpha/logs/run-ml8agoaj-09hr/` only contain sandbox PTY output (Claude/Codex sessions), not orchestrator console output
- The manifest doesn't store error details, only `completion_status`
- The UI event log shows events briefly but doesn't persist them

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (gh issue view)*
