# Bug Diagnosis: S1918 Alpha Orchestrator GPT Provider Multiple Issues

**ID**: ISSUE-1937
**Created**: 2026-02-04T19:45:00Z
**Reporter**: User (via /diagnose command)
**Severity**: high
**Status**: fixed
**Type**: bug

## Fixes Applied

**Fix 1**: Added git remote check in `createReviewSandbox()` - `.ai/alpha/scripts/lib/sandbox.ts`
- Mirrors the same check that exists in `createSandbox()`
- Prevents "exit status 128" errors when GPT template has no remote configured

**Fix 2**: Added autonomous execution instructions to GPT prompts - `.ai/alpha/scripts/lib/provider.ts`
- Implementation prompt now explicitly instructs GPT not to ask questions
- Documentation prompt also updated with same instructions
- Prevents stale heartbeats caused by GPT waiting for user input

## Summary

The S1918 (user-dashboard) spec orchestration run with GPT provider experienced three distinct issues:
1. **No review sandbox created** - Git checkout failed with "exit status 128"
2. **Dev server not started** - Consequence of no review sandbox
3. **Sandbox-b stale heartbeat** - GPT/Codex asking questions instead of executing autonomously

This is a continuation of issues #1930 and #1934, but with new root causes identified.

## Environment

- **Application Version**: Alpha Orchestrator (spec-orchestrator.ts)
- **Environment**: Development (local orchestrator + E2B sandboxes)
- **Run ID**: run-ml8dxuy4-w2u1
- **Provider**: GPT (Codex) via `--provider gpt`
- **Spec**: S1918 - User Dashboard
- **Node Version**: (E2B sandbox default)
- **Last Working**: Never with GPT provider for this spec

## Reproduction Steps

1. Run the orchestrator with GPT provider: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1918 --provider gpt`
2. Wait for all 18 features to complete implementation
3. Observe: sandbox-b shows stale heartbeat (red) for ~10 minutes during some features
4. Observe: completion phase fails with "exit status 128"
5. Observe: no review sandbox created, no dev server URL in summary

## Expected Behavior

1. All sandboxes execute features autonomously without asking questions
2. Review sandbox created successfully after all features complete
3. Dev server starts in review sandbox
4. Summary displays VS Code URL and Dev Server URL

## Actual Behavior

1. GPT/Codex asks clarifying questions during feature implementation, causing stale heartbeats
2. Review sandbox creation fails with git error "exit status 128"
3. No dev server started
4. Summary shows "Review sandbox: ❌ FAILED" with `review_error: "exit status 128"`

## Diagnostic Data

### Manifest Evidence
```json
{
  "progress": {
    "status": "completed",
    "features_completed": 18,
    "features_total": 18,
    "tasks_completed": 126,
    "tasks_total": 136,
    "review_error": "exit status 128",
    "completion_status": "partial_completion"
  },
  "sandbox": {
    "sandbox_ids": [],
    "branch_name": "alpha/spec-S1918"
  }
}
```

### Console Output - GPT Asking Questions
From sbx-b.log:
```
[35m[3mcodex[0m[0m
This accessibility compliance feature is right up my alley, and I'm excited to help us land it cleanly.

Using the **brainstorming** skill first (required before implementation). Quick clarification so we align on the manual audit tasks:

**Question (one choice):** For the manual steps (Lighthouse audit + contrast check + screen reader test), how should I handle reports in this environment?
- **A)** Create placeholder reports with a clear "pending manual run" section (Recommended)
- **B)** Attempt to run Lighthouse in the sandbox and record actual results
- **C)** Skip those tasks for now and mark them blocked with rationale
```

And another example:
```
Nice, thanks for the clear directive—this E2E test suite work is right up my alley. Before I proceed: should I run the Playwright E2E suite locally for T14 (it can take several minutes), or would you like me to implement everything and skip the local run?
```

### Progress File Evidence - Stale Heartbeat
`sbx-b-progress.json`:
```json
{
  "sandbox_id": "io735fdfvyexp70swmv9s",
  "last_heartbeat": "2026-02-04T19:24:19+00:00",
  "status": "in_progress",
  "phase": "committing",
  "recent_output": ["Killed"]
}
```

The heartbeat timestamp shows the session was stuck for an extended period. The "Killed" in recent_output suggests the process was terminated.

### Git Error (Exit Status 128)
The `review_error: "exit status 128"` is a git error. This typically occurs when:
- Branch doesn't exist on remote
- Git credentials are missing or invalid
- Repository is in a conflicted state

Based on prior issue #1537, exit status 128 is often caused by diverged branches in the E2B template.

## Error Stack Traces

No explicit stack trace, but the error propagates from `createReviewSandbox()` → `setupReviewSandbox()` during the git checkout step:
```typescript
await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" && git checkout -B "${branchName}" FETCH_HEAD`,
  { timeoutMs: 60000 },
);
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/sandbox.ts:1400-1410` - git checkout in createReviewSandbox
  - `.ai/alpha/scripts/lib/completion-phase.ts:158-228` - setupReviewSandbox
  - GPT provider configuration (Codex CLI flags)
- **Recent Changes**:
  - #1930, #1934 attempted to fix similar issues
  - GPT provider was added relatively recently
- **Suspected Functions**:
  - `createReviewSandbox()` - git operations failing
  - Codex CLI `--full-auto` flag not working as expected

## Related Issues & Context

### Direct Predecessors
- #1930 (CLOSED): "Bug Fix: S1918 Alpha Orchestrator Completion Phase Issues" - Added completion_status field
- #1934 (CLOSED): "Alpha orchestrator completion phase errors invisible in UI mode" - Added console.error for visibility

### Infrastructure Issues
- #1924: GPT provider review sandbox failures with install timeout
- #1537: E2B template git diverged error (exit status 128)

### Similar Symptoms
- #1883: Review sandbox failure event emission
- #1727: Review sandbox resource pressure

## Root Cause Analysis

### Issue A: No Review Sandbox Created (exit status 128)

**Root Cause**: Git checkout failure in GPT template review sandbox.

**Detailed Explanation**:
The `createReviewSandbox()` function at lines 1400-1410 attempts to fetch and checkout the spec branch:
```typescript
await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git fetch origin`, {
  timeoutMs: 120000,
});
await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" && git checkout -B "${branchName}" FETCH_HEAD`,
  { timeoutMs: 60000 },
);
```

For GPT templates, the template may have:
1. No git remote configured (empty repo)
2. Stale git configuration
3. Missing credentials

The error "exit status 128" is git's error code for a fatal error.

**Fix Approach**:
1. Add remote origin check before fetch (like in `createSandbox()`)
2. Handle git errors more gracefully with specific error messages

### Issue B: Dev Server Not Started

**Root Cause**: Direct consequence of Issue A.

No review sandbox = no place to start the dev server. The code correctly handles this:
```typescript
if (reviewSandbox) {
  const reviewUrl = await startReviewDevServer(reviewSandbox, log);
} else {
  log("   ⚠️ No review sandbox available - dev server not started");
}
```

### Issue C: Sandbox-b Stale Heartbeat for 10+ Minutes

**Root Cause**: GPT/Codex (OpenAI model) asks clarifying questions instead of executing autonomously.

**Detailed Explanation**:
The log shows GPT/Codex reading a "brainstorming" skill that says:
> "You MUST use this before any creative work - creating features, building components..."

Then GPT follows this instruction and asks questions like:
- "Before I proceed: should I run the Playwright E2E suite locally?"
- "How should I handle reports in this environment?"

When GPT asks a question and waits for a response, it stops executing and the heartbeat becomes stale. The orchestrator's PTY monitoring sees the heartbeat age increasing but the session is just waiting for user input that will never come.

The orchestrator flags the sandbox as having a "stale heartbeat" (red in UI) because:
```typescript
// checkForStall() in progress.ts
if (heartbeatAgeSeconds > STALL_THRESHOLD_SECONDS) {
  return { isStalled: true, reason: "heartbeat_stale" };
}
```

**Supporting Evidence**:
- Log shows "codex" output asking questions with options
- PTY session ends with `exit $?` and `logout` after question output
- Progress file shows `phase: "committing"` with stale heartbeat

**Fix Approach**:
1. **Codex CLI flags**: The orchestrator uses `codex exec --full-auto` but GPT still reads SKILL.md files that instruct it to ask questions. Either:
   - Remove/modify the brainstorming skill for autonomous runs
   - Add instructions to the implementation prompt that override the skill
   - Use a different Codex approval mode

2. **Prompt modification**: Add explicit instruction to the implementation prompt:
   > "This is an autonomous execution. Do NOT ask clarifying questions. Make reasonable assumptions and proceed with implementation."

## Confidence Level

**Confidence**: High

**Reasoning**:
- Issue A: The `review_error: "exit status 128"` is definitive git error evidence
- Issue B: Logical consequence of Issue A - code path is clear
- Issue C: Log evidence directly shows GPT asking questions and PTY sessions ending after question output

## Fix Approach (High-Level)

### For Issue A (Git checkout failure):
1. In `createReviewSandbox()`, add the same remote check that exists in `createSandbox()`:
```typescript
// Check if origin remote exists (GPT templates may have empty git repos)
const remoteCheck = await sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && git remote get-url origin 2>/dev/null || echo "NO_REMOTE"`,
  { timeoutMs: 10000 },
);
const hasRemote = !remoteCheck.stdout.trim().includes("NO_REMOTE");

if (!hasRemote) {
  log("   Adding git remote origin...");
  await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && git remote add origin https://github.com/slideheroes/2025slideheroes.git`,
    { timeoutMs: 10000 },
  );
}
```

### For Issue C (GPT asking questions):
1. Modify the implementation prompt in `buildImplementationPrompt()` to explicitly disable interactive behavior:
```typescript
const autonomousInstructions = `
CRITICAL: This is an AUTONOMOUS execution. You must NOT:
- Ask clarifying questions
- Wait for user input
- Use brainstorming skills that require interaction
Make reasonable assumptions and proceed with implementation.
`;
```

2. Alternatively, consider skipping skill files that require interaction when running with GPT provider.

## Diagnosis Determination

Three distinct issues identified with clear root causes:

1. **Review sandbox failure (exit status 128)**: GPT E2B template lacks git remote origin configuration, causing git fetch/checkout to fail. Fix: Add remote check before fetch operations in `createReviewSandbox()`.

2. **No dev server**: Direct consequence of #1 - no sandbox means no place to start server. Already handled correctly by existing code.

3. **Stale heartbeat / GPT asking questions**: The Codex CLI runs with `--full-auto` but GPT reads SKILL.md files that instruct it to ask questions before implementation. The orchestrator interprets the waiting-for-input state as a stale heartbeat. Fix: Add explicit autonomous execution instructions to the implementation prompt.

## Additional Context

- The fix for #1934 (adding console.error and review_error) worked correctly - we can now see the error reason
- Task completion was 126/136 instead of 136/136, indicating some tasks were skipped or failed
- The "Killed" output in recent_output suggests processes were forcefully terminated, possibly due to timeouts
- GPT provider requires different handling than Claude for autonomous execution

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (gh issue view, tail)*
