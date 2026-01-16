# Bug Diagnosis: Preview URL Not Displayed in Orchestrator UI After Completion

**ID**: ISSUE-pending
**Created**: 2026-01-15T20:45:00Z
**Reporter**: User
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When the Alpha Orchestrator completes its work, the UI does not display the preview URLs for human-in-the-loop review. The preview URLs ARE correctly written to the `overall-progress.json` file, but the UI is stopped immediately after writing, before the UI polling can read the updated data and render the completion screen.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: development
- **Node Version**: 22.16.0
- **Run ID**: run-mkfti9z9-zwju

## Reproduction Steps

1. Run the orchestrator: `tsx spec-orchestrator.ts 1362`
2. Wait for all features to complete
3. Observe the UI dashboard
4. UI stops without displaying the preview URLs

## Expected Behavior

After completion, the UI should display a completion screen showing:
- "Spec #{specId} Complete!"
- Number of features/tasks completed
- Branch name
- **Review URLs** with VS Code and Dev Server links for each sandbox

The user should be able to click the Dev Server URL to preview the implemented features.

## Actual Behavior

The UI stops abruptly without displaying the completion screen or preview URLs. The `overall-progress.json` file contains the correct `reviewUrls` data, but the UI never reads it.

## Diagnostic Data

### overall-progress.json (Correctly Contains reviewUrls)

```json
{
  "specId": 1362,
  "specName": "user dashboard home",
  "status": "completed",
  "reviewUrls": [
    {
      "label": "sbx-a",
      "vscode": "https://8080-igbnhkdw17i9yces469lc.e2b.app",
      "devServer": "https://3000-igbnhkdw17i9yces469lc.e2b.app"
    }
  ]
}
```

The data IS in the file - the UI just never displays it.

### Code Sequence (orchestrator.ts lines 1153-1175)

```typescript
// 1. Write file with reviewUrls
saveManifest(manifest, reviewUrls, runId);  // Line 1156

// 2. Some logging (instant)
if (!options.ui) { printSummary(...) }
if (process.env.SUPABASE_SANDBOX_PROJECT_REF) { log(...) }

// 3. IMMEDIATELY stop UI
if (uiManager) {
  uiManager.stop();  // Line 1174 - NO DELAY!
}
```

### UI Polling Configuration

```typescript
// types.ts line 571
export const POLL_INTERVAL_MS = 5000;  // 5 seconds
```

## Error Stack Traces

No errors - this is a timing/race condition issue.

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1156-1174)
  - `.ai/alpha/scripts/ui/index.tsx` (stop() method)
  - `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts` (polling logic)
  - `.ai/alpha/scripts/ui/components/OrchestratorUI.tsx` (CompletionUI component)

- **Suspected Functions**:
  - `orchestrate()` - No delay between file write and UI stop
  - `UIManager.stop()` - Immediately unmounts React component

## Related Issues & Context

### Same Component
- #1495 - UI progress stale after session recovery (similar UI polling issue)

## Root Cause Analysis

### Identified Root Cause

**Summary**: The orchestrator calls `uiManager.stop()` immediately after writing `overall-progress.json`, without waiting for the UI to poll and display the completion screen with review URLs.

**Detailed Explanation**:

The timing sequence is:

1. `saveManifest(manifest, reviewUrls, runId)` writes file with `status: "completed"` and `reviewUrls`
2. Some synchronous logging happens (instant)
3. `uiManager.stop()` is called immediately
4. `stop()` calls `this.instance.unmount()` which terminates React

Meanwhile, the UI:
- Polls `overall-progress.json` every 5 seconds
- On detecting `status === "completed"`, it would render `CompletionUI` with `reviewUrls`
- But the component is unmounted before this can happen

**The file write and UI stop happen in rapid succession with NO delay**, while the UI polling interval is 5 seconds. Even if a poll happened to occur right after the write, `stop()` unmounts the component before React can re-render.

**Supporting Evidence**:
- `overall-progress.json` contains correct `reviewUrls` data
- `POLL_INTERVAL_MS = 5000` (5 seconds)
- No delay between `saveManifest()` and `uiManager.stop()` calls
- `stop()` immediately calls `this.instance.unmount()`

### How This Causes the Observed Behavior

```
Timeline:
[T+0.0s] saveManifest() writes file with reviewUrls
[T+0.0s] Some logging (instant)
[T+0.0s] uiManager.stop() - UNMOUNTS UI
[T+0.0s] Process exits

UI never gets a chance to:
- Poll the updated file
- Detect "completed" status
- Render CompletionUI with reviewUrls
```

### Confidence Level

**Confidence**: High

**Reasoning**:
- The file contains correct data (proven by cat command)
- The code path clearly shows no delay
- The UI polling interval is 5 seconds
- `stop()` immediately unmounts

## Fix Approach (High-Level)

Several options:

**Option 1: Wait for UI to render completion screen**
Add a delay after writing and before stopping to allow UI to poll and display:
```typescript
saveManifest(manifest, reviewUrls, runId);
await sleep(6000);  // Wait for at least one poll cycle + render
uiManager.stop();
```

**Option 2: Use waitForExit() instead of stop()**
Let the user manually exit after seeing the completion screen:
```typescript
saveManifest(manifest, reviewUrls, runId);
await uiManager.waitForExit();  // Wait for user to press 'q'
```

**Option 3: Force immediate poll before showing completion**
Trigger a poll immediately when writing completion status:
```typescript
// In UIManager, add method:
forceRefresh(): void {
  // Trigger immediate poll
}

// In orchestrator:
saveManifest(manifest, reviewUrls, runId);
uiManager.forceRefresh();
await sleep(1000);  // Brief delay for render
uiManager.stop();
```

**Recommended**: Option 2 - Let user manually exit. This allows them to see the URLs and actually use them before the sandboxes are killed.

## Diagnosis Determination

The preview URL is not displayed because the orchestrator stops the UI immediately after writing the completion data, without waiting for the UI to poll and render the completion screen. The data IS correctly saved to `overall-progress.json`, but the UI never gets a chance to display it.

## Additional Context

This is critical for the "human-in-the-loop" review workflow:
- The preview URL points to a running dev server in an E2B sandbox
- Users need to see this URL to review the implemented features
- If the URL is not displayed, users can't perform the review step
- The sandbox may also be killed if the process exits without displaying the URL

The fix should ensure users can see AND use the preview URLs before the orchestrator exits.

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Bash, code analysis*
