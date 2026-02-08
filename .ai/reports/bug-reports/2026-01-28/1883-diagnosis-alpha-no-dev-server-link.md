# Bug Diagnosis: Alpha Orchestrator Completion Screen Shows No Dev Server Link

**ID**: ISSUE-pending
**Created**: 2026-01-28T18:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When the Alpha orchestrator completes implementation for S1877 (user dashboard), the completion screen did not show a dev server link for reviewing the implemented work. The user expected to see a URL like `https://sbx_xxx-3000.e2b.dev` for previewing the implementation.

## Environment

- **Application Version**: Alpha Implementation System (spec-orchestrator.ts)
- **Environment**: development (E2B sandboxes)
- **Node Version**: Node.js 22+
- **Spec Implemented**: S1877 - User Dashboard
- **Last Working**: Unknown (may have worked on previous specs)

## Reproduction Steps

1. Run the Alpha orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1877`
2. Wait for implementation to complete (all features processed)
3. Observe the completion screen in the UI

## Expected Behavior

The completion screen should display:
- ✅ Spec #S1877 Complete!
- Review URLs including:
  - VS Code: `https://sbx_xxx-8080.e2b.dev`
  - Dev Server: `https://sbx_xxx-3000.e2b.dev`

## Actual Behavior

The completion screen shows the spec is complete but no review URLs are displayed. The `overall-progress.json` file confirms no `reviewUrls` property was written:

```json
{
  "specId": "S1877",
  "specName": "user dashboard",
  "status": "completed",
  ...
  // Missing: "reviewUrls": [...]
}
```

## Diagnostic Data

### Manifest State
```json
{
  "progress": {
    "status": "completed",
    "features_completed": 13,
    "features_total": 14,
    "completed_at": "2026-01-28T18:04:54.399Z"
  },
  "sandbox": {
    "sandbox_ids": [],  // Empty - no sandboxes retained
    "branch_name": "alpha/spec-S1877"
  }
}
```

### Feature Status (S1877.I4.F5)
One feature remained in `pending` status with an error:
```json
{
  "id": "S1877.I4.F5",
  "title": "E2E Test Coverage",
  "status": "pending",
  "error": "Implementation error: 2: [unknown] terminated (attempt 1/3)",
  "retry_count": 1
}
```

### Code Path Analysis

The completion phase executes these steps:
1. `killImplementationSandboxes()` - Kills all implementation sandboxes ✅
2. `setupReviewSandbox()` - Creates fresh review sandbox ❌ (likely failed)
3. `startReviewDevServer()` - Starts dev server (skipped if step 2 failed)
4. `saveManifest(manifest, reviewUrls, runId)` - Saves results

The `setupReviewSandbox()` function:
- Wraps `createReviewSandbox()` with 15-minute timeout
- Catches errors and returns `null` on failure
- Error is logged via `log()` which is silenced in UI mode

The `createReviewSandbox()` function performs:
1. Create E2B sandbox
2. Git fetch/checkout branch
3. **Fresh-clone validation** (Bug fix #1803):
   - `rm -rf node_modules`
   - `pnpm install --frozen-lockfile`
   - `pnpm typecheck` ← Most likely failure point
4. Build workspace packages

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/completion-phase.ts:120-154` - setupReviewSandbox
  - `.ai/alpha/scripts/lib/sandbox.ts:942-1044` - createReviewSandbox
  - `.ai/alpha/scripts/lib/orchestrator.ts:850-867` - Completion phase execution
  - `.ai/alpha/scripts/lib/manifest.ts:918-990` - writeOverallProgress

- **Recent Changes**: Fresh-clone validation added in Bug fix #1803

- **Suspected Functions**:
  - `createReviewSandbox()` - likely throwing an error during typecheck or install
  - `setupReviewSandbox()` - catching error and returning null without emitting failure event

## Root Cause Analysis

### Identified Root Cause

**Summary**: Review sandbox creation fails silently in UI mode because error logging is suppressed and no failure event is emitted.

**Detailed Explanation**:

When `createReviewSandbox()` fails (likely due to typecheck errors from the implementation), the following happens:

1. `createReviewSandbox()` throws an error (e.g., "TypeScript errors on clean install")
2. `setupReviewSandbox()` catches this error at line 148-152:
   ```typescript
   } catch (error) {
       log(`   ⚠️ Failed to create review sandbox: ${error instanceof Error ? error.message : error}`);
       return null;
   }
   ```
3. **Critical Issue**: The `log()` function is created by `createLogger(uiEnabled)` which suppresses output when UI mode is enabled
4. **Missing Event**: No `emitOrchestratorEvent()` call is made to notify the UI of the failure
5. `executeCompletionPhase()` receives `reviewSandbox = null`
6. The `dev_server_failed` event IS emitted (line 464-467), but only says "No review sandbox available" without the actual error
7. `reviewUrls` remains empty, so no URLs are written to `overall-progress.json`

**Supporting Evidence**:
- `manifest.sandbox.sandbox_ids: []` confirms no sandbox was retained
- No `reviewUrls` in `overall-progress.json`
- S1877.I4.F5 failed with implementation error, possibly leaving code in broken state that fails typecheck

### How This Causes the Observed Behavior

1. Implementation completes with 13/14 features (one failed)
2. Completion phase starts, kills all implementation sandboxes
3. Attempts to create review sandbox for remaining work preview
4. `createReviewSandbox()` clones branch, runs fresh-clone validation
5. Typecheck or install fails (code from 13 features may have errors)
6. Error is caught but NOT surfaced to UI (only logged to suppressed console)
7. `reviewUrls` array stays empty
8. Completion screen renders with no review URLs
9. User sees "complete" status but no way to preview the work

### Confidence Level

**Confidence**: High

**Reasoning**:
- The code path clearly shows that errors in `setupReviewSandbox` are logged but not emitted as events when UI mode is on
- The empty `sandbox_ids` array confirms the review sandbox wasn't created
- The missing `reviewUrls` in progress confirms the flow executed correctly but with null reviewSandbox

## Fix Approach (High-Level)

1. **Add failure event emission**: When `setupReviewSandbox()` catches an error, emit a `review_sandbox_failed` event with the actual error message:
   ```typescript
   } catch (error) {
       const errorMessage = error instanceof Error ? error.message : String(error);
       log(`   ⚠️ Failed to create review sandbox: ${errorMessage}`);
       emitOrchestratorEvent(
           "review_sandbox_failed",
           `Failed to create review sandbox: ${errorMessage}`,
           { error: errorMessage }
       );
       return null;
   }
   ```

2. **Update UI to display the error**: The CompletionUI component should check for review sandbox failure events and display the error reason to help users diagnose why preview isn't available.

3. **Optional**: Consider whether fresh-clone validation should be made less strict or optional for review sandboxes when the primary goal is just previewing the UI (not validating the build).

## Additional Context

The fresh-clone validation (Bug fix #1803) was added to catch dependency/lockfile mismatches. While valuable for ensuring deployability, it may be too strict for the review sandbox use case where the user just wants to preview their work.

A potential enhancement would be to:
- Make fresh-clone validation configurable via a flag
- Fall back to a "quick" review sandbox (no validation) if the validated sandbox fails
- Always display the failure reason prominently in the UI

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash for log inspection*
