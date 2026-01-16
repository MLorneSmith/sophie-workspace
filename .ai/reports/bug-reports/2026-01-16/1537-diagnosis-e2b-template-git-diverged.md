# Bug Diagnosis: E2B Sandbox Template Git Branch Divergence Causes Orchestrator Failure

**ID**: ISSUE-1537
**Created**: 2026-01-16T19:15:00Z
**Reporter**: user
**Severity**: critical
**Status**: new
**Type**: error

## Summary

The Alpha spec orchestrator fails immediately on startup with git exit code 128 because the E2B sandbox template (`slideheroes-claude-agent-dev`) contains a pre-baked copy of the repository where the local `dev` branch has diverged significantly from `origin/dev`. When the sandbox attempts `git pull origin dev`, it fails because git doesn't know how to reconcile 1 local commit vs 2923 remote commits.

## Environment

- **Application Version**: dev branch
- **Environment**: development (local orchestrator + E2B cloud sandbox)
- **Node Version**: 20.x (assumed, based on project)
- **E2B Template**: `slideheroes-claude-agent-dev`
- **Last Working**: Unknown (potentially never worked after recent template build)

## Reproduction Steps

1. Run the orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock`
2. Orchestrator creates an E2B sandbox using template `slideheroes-claude-agent-dev`
3. Sandbox runs `git checkout dev && git pull origin dev`
4. Command fails with exit code 128

## Expected Behavior

The sandbox should:
1. Checkout the `dev` branch
2. Pull latest changes from `origin/dev`
3. Create the feature branch `alpha/spec-1362`
4. Continue with feature implementation

## Actual Behavior

The `git pull origin dev` command fails because:
- The template's local `dev` branch has 1 commit
- The remote `origin/dev` has 2923 commits
- Git refuses to merge divergent branches without explicit merge strategy

Error output:
```
Your branch and 'origin/dev' have diverged,
and have 1 and 2923 different commits each, respectively.
fatal: Need to specify how to reconcile divergent branches.
```

## Diagnostic Data

### Console Output
```
❌ Orchestrator error: CommandExitError: exit status 128
    at CommandHandle.wait (/home/msmith/projects/2025slideheroes/node_modules/.pnpm/e2b@2.8.2/node_modules/e2b/src/sandbox/commands/commandHandle.ts:161:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async createSandbox (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/sandbox.ts:156:3)
    at async orchestrate (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/orchestrator.ts:1054:25)
    at async main (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/spec-orchestrator.ts:118:2)
```

### Git Error Details
```
result: {
  exitCode: 128,
  error: 'exit status 128',
  stdout: "Your branch and 'origin/dev' have diverged,\n" +
    'and have 1 and 2923 different commits each, respectively.\n' +
    '  (use "git pull" if you want to integrate the remote branch with yours)\n',
  stderr: "Already on 'dev'\n" +
    'From https://github.com/MLorneSmith/2025slideheroes\n' +
    ' * branch                dev        -> FETCH_HEAD\n' +
    'hint: You have divergent branches and need to specify how to reconcile them.\n' +
    'hint: You can do so by running one of the following commands sometime before\n' +
    'hint: your next pull:\n' +
    'hint: \n' +
    'hint:   git config pull.rebase false  # merge\n' +
    'hint:   git config pull.rebase true   # rebase\n' +
    'hint:   git config pull.ff only       # fast-forward only\n' +
    'hint: \n' +
    'hint: You can replace "git config" with "git config --global" to set a default\n' +
    'hint: preference for all repositories. You can also pass --rebase, --no-rebase,\n' +
    'hint: or --ff-only on the command line to override the configured default per\n' +
    'hint: invocation.\n' +
    'fatal: Need to specify how to reconcile divergent branches.\n'
}
```

## Error Stack Traces

```
CommandExitError: exit status 128
    at CommandHandle.wait (node_modules/.pnpm/e2b@2.8.2/node_modules/e2b/src/sandbox/commands/commandHandle.ts:161:13)
    at createSandbox (.ai/alpha/scripts/lib/sandbox.ts:156:3)
    at orchestrate (.ai/alpha/scripts/lib/orchestrator.ts:1054:25)
    at main (.ai/alpha/scripts/spec-orchestrator.ts:118:2)
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/lib/sandbox.ts` (lines 154-159)
  - `.ai/alpha/scripts/config/constants.ts` (template alias definition)

- **Suspected Functions**:
  - `createSandbox()` in sandbox.ts - the git checkout/pull command at lines 156-159

### Problematic Code Block

```typescript
// sandbox.ts lines 154-159
log(`Creating new branch from dev: ${branchName}`);
await sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && git checkout dev && git pull origin dev && git checkout -b "${branchName}"`,
    { timeoutMs: 60000 },
);
```

## Root Cause Analysis

### Identified Root Cause

**Summary**: The E2B sandbox template (`slideheroes-claude-agent-dev`) contains a stale/diverged git repository where the local `dev` branch has diverged from `origin/dev` by thousands of commits.

**Detailed Explanation**:

1. **Template Build Time**: When the E2B template was built/updated, it included a snapshot of the git repository
2. **Template Staleness**: The template's git repo state is now very old - the local `dev` branch has only 1 commit while the actual remote has 2923 commits
3. **Git Configuration**: The template doesn't have a default pull strategy configured (`pull.rebase` or `pull.ff`)
4. **Divergence Error**: When `git pull origin dev` runs, git refuses because it doesn't know whether to merge or rebase the divergent histories

**Supporting Evidence**:
- Error message explicitly states: "Your branch and 'origin/dev' have diverged, and have 1 and 2923 different commits each"
- The `stderr` shows git's hint about needing to specify `pull.rebase` or `pull.ff`
- Exit code 128 is git's standard error for fatal conditions
- Stack trace points to `sandbox.ts:156:3` which is the exact line running `git pull origin dev`

### How This Causes the Observed Behavior

1. Orchestrator calls `createSandbox()`
2. E2B spins up sandbox from template `slideheroes-claude-agent-dev`
3. Sandbox contains stale git repo with diverged `dev` branch
4. Code runs: `git checkout dev && git pull origin dev`
5. `git checkout dev` succeeds (stderr: "Already on 'dev'")
6. `git pull origin dev` fails because branches have diverged and no merge strategy is set
7. Exit code 128 propagates as `CommandExitError`
8. Orchestrator crashes without creating any sandboxes

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message is explicit and unambiguous - git is clearly stating the exact problem
- The stack trace pinpoints the exact line of code
- The stdout/stderr clearly shows the sequence: checkout succeeds, pull fails
- The divergence numbers (1 vs 2923) explain why this is happening - the template is very stale

## Fix Approach (High-Level)

Two options (not mutually exclusive):

**Option A - Fix the Code (Immediate)**:
Modify `sandbox.ts` to handle diverged branches more robustly:
1. Add `git config pull.rebase false` before the pull, OR
2. Use `git fetch origin dev && git reset --hard origin/dev` instead of `git pull`, OR
3. Use `git checkout -B dev origin/dev` to force-update local dev to match remote

**Option B - Rebuild E2B Template (Long-term)**:
Rebuild the E2B template `slideheroes-claude-agent-dev` with a fresh clone of the repository so the local `dev` branch matches current `origin/dev`.

The recommended approach is **both**: fix the code to be resilient to this scenario AND rebuild the template to reduce git operations at startup.

## Diagnosis Determination

The root cause is definitively identified: the E2B sandbox template contains a git repository where the local `dev` branch has diverged from `origin/dev`. The sandbox creation code assumes `git pull` will work, but git refuses without a merge strategy configuration.

This is a **code bug** in `sandbox.ts` - it should handle diverged branches gracefully rather than assuming `git pull` will always succeed. It's also an **infrastructure issue** - the E2B template should be rebuilt with fresh repo state.

## Additional Context

- The template alias is defined in `.ai/alpha/scripts/config/constants.ts:13` as `slideheroes-claude-agent-dev`
- The workspace directory is `/home/user/project` (constant `WORKSPACE_DIR`)
- This appears to be a new failure mode, likely introduced when the remote repo accumulated many commits while the template remained static

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (sandbox.ts, orchestrator.ts, constants.ts, progress files), Grep (template search), Bash (git log)*
