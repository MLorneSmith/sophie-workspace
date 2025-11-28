# Bug Fix: E2B Sandbox Feature Workflow Issues (5 Issues)

**Related Diagnosis**: #772 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: medium
**Complexity**: moderate

## Quick Reference

- **Root Cause**: Multiple issues including VS Code timeout, gh CLI auth, missing progress feedback, premature implementation (session architecture + orchestrator overreach), and long branch names
- **Fix Approach**: Adopt explicit two-step workflow (`/feature` → user review → `/implement`) plus individual fixes for timeout/auth/feedback/naming issues
- **Estimated Effort**: medium
- **Breaking Changes**: yes (workflow change, but backwards-compatible via `--legacy` flag)

## Solution Design

### Problem Recap

The E2B sandbox feature workflow has 5 distinct issues: (1) VS Code startup timeout, (2) PR creation failure due to gh CLI auth, (3) lack of progress feedback, (4) premature implementation bypassing review gates, and (5) overly long branch names. Issue 4 is the most critical as it defeats the purpose of the review workflow.

For full details, see diagnosis issue #772.

### Solution Approaches Considered

#### Option 1: Explicit Two-Step Workflow ⭐ RECOMMENDED

**Description**: Replace the current `/sandbox feature` → `/sandbox continue` workflow with an explicit two-step approach where the user must manually invoke `/sandbox run-claude "/implement <issue#>"` after reviewing the plan. This eliminates the problematic orchestration behavior entirely.

**Current Workflow (Problematic)**:
```
/sandbox feature "description"
  └─> Creates sandbox, runs /feature
  └─> /feature asks clarifying questions
  └─> Local Claude answers autonomously (PROBLEM!)
  └─> /sandbox continue <id>
  └─> Runs /implement (may bypass review gate)
```

**Proposed Workflow (Explicit Control)**:
```
Step 1: /sandbox run-claude "/feature description"
  └─> Sandbox Claude creates plan only
  └─> User reviews plan in VS Code
  └─> User modifies plan if needed

Step 2: /sandbox run-claude "/implement <issue#>" --sandbox <id>
  └─> User explicitly initiates implementation
  └─> Sandbox Claude implements approved plan
  └─> User reviews code changes
  └─> User approves PR
```

**Pros**:
- Eliminates orchestrator overreach entirely (no autonomous decision-making)
- Forces explicit user decision between planning and implementation
- Each step is a single command with clear purpose
- Session isolation becomes a feature, not a bug
- Simpler to reason about and debug
- No need for complex session persistence

**Cons**:
- Requires user to run two commands instead of one
- User must remember sandbox ID between steps
- Slightly more manual effort

**Risk Assessment**: low - This is a simplification, not added complexity

**Complexity**: simple - Remove code, don't add it

#### Option 2: Session Persistence + Orchestrator Guardrails

**Description**: Maintain the current `/sandbox feature` → `/sandbox continue` workflow but add session persistence (so follow-ups stay within `/feature` constraints) and add guardrails to prevent local Claude from answering on behalf of the user.

**Pros**:
- Preserves single-command convenience
- More "magical" UX

**Cons**:
- Complex session persistence implementation
- Difficult to enforce orchestrator discipline (requires behavioral changes)
- Root cause (Part B) is behavioral, hard to fix technically
- More code to maintain and debug
- Risk of edge cases where guardrails fail

**Why Not Chosen**: The behavioral issue (local Claude making decisions for user) is fundamentally a process problem, not a technical one. Adding complexity to work around it is less reliable than eliminating the opportunity for the problem to occur.

#### Option 3: Interactive Approval Mode

**Description**: When sandbox Claude asks questions, pause execution, surface questions to user, wait for input, then continue.

**Pros**:
- Maintains seamless workflow
- User stays in control

**Cons**:
- Very complex to implement (requires bidirectional communication)
- E2B SDK doesn't support interactive prompts well
- Would need custom IPC mechanism

**Why Not Chosen**: Over-engineered solution to a problem that can be solved with simple workflow separation.

### Selected Solution: Option 1 - Explicit Two-Step Workflow

**Justification**: The explicit two-step approach directly addresses the core issue (Issue 4) by eliminating the opportunity for autonomous decision-making. It's simpler to implement, easier to understand, and more robust. The slight increase in manual effort is a worthwhile trade-off for guaranteed user control.

**Technical Approach**:
- Remove `/sandbox feature` command (or deprecate with `--legacy` flag)
- Remove `/sandbox continue` command
- Enhance `/sandbox run-claude` to be the primary interface
- Add VS Code URL output after every `run-claude` that creates changes
- Add clear "next steps" guidance after each step

**Architecture Changes**:
- Simplify `sandbox-cli.ts` by removing `runFeaturePhase()` and `runContinuePhase()`
- Keep `runClaude()` as the core execution function
- Add post-execution summary with VS Code URL and suggested commands

**Migration Strategy**:
- Keep `feature` command but mark as deprecated, add warning
- Provide `--legacy` flag for old behavior during transition
- Update `/sandbox` slash command documentation

## Implementation Plan

### Affected Files

List files that need modification:
- `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts` - Core CLI implementation with all 5 fixes
- `.claude/commands/sandbox.md` - Update command documentation and examples

### New Files

If new files are needed:
- None - this is a simplification, not expansion

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix VS Code Timeout (Issue 1)

Remove the blocking timeout for VS Code startup.

**Location**: `sandbox-cli.ts:467-477`

**Change**:
```typescript
// BEFORE
async function startVSCode(sandbox: Sandbox): Promise<string> {
  console.log("Starting VS Code Web (code-server)...");
  await sandbox.commands.run("start-vscode", { timeoutMs: 30000 });
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const host = sandbox.getHost(VSCODE_PORT);
  return `https://${host}`;
}

// AFTER
async function startVSCode(sandbox: Sandbox): Promise<string> {
  console.log("Starting VS Code Web (code-server)...");
  // Run in background - code-server starts async, no need to wait
  await sandbox.commands.run("start-vscode &", { timeoutMs: 10000 });
  // Brief pause to let it initialize
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const host = sandbox.getHost(VSCODE_PORT);
  return `https://${host}`;
}
```

**Why this step first**: It's the simplest fix and establishes the pattern for subsequent changes.

#### Step 2: Fix GitHub CLI Authentication (Issue 2)

Add explicit `gh auth login` before any `gh` commands.

**Location**: `sandbox-cli.ts` - Create new helper function and update PR creation

**Changes**:

1. Add new helper function after `setupGitCredentials()`:
```typescript
/**
 * Setup GitHub CLI authentication in the sandbox using GITHUB_TOKEN
 */
async function setupGitHubCLI(sandbox: Sandbox): Promise<boolean> {
  if (!GITHUB_TOKEN) {
    console.log("Warning: GITHUB_TOKEN not set, gh CLI will not work");
    return false;
  }

  console.log("Authenticating GitHub CLI...");

  // Authenticate gh CLI with token
  const authResult = await sandbox.commands.run(
    `echo "${GITHUB_TOKEN}" | gh auth login --with-token`,
    { timeoutMs: 30000 }
  );

  if (authResult.exitCode !== 0) {
    console.error("Failed to authenticate gh CLI:", authResult.stderr);
    return false;
  }

  // Setup git to use gh for auth
  await sandbox.commands.run("gh auth setup-git", { timeoutMs: 10000 });

  console.log("GitHub CLI authenticated");
  return true;
}
```

2. Update `pushAndCreatePR()` to call `setupGitHubCLI()` before `gh pr create`

3. Update `createPR()` to call `setupGitHubCLI()` before `gh pr create`

#### Step 3: Improve Branch Name Generation (Issue 5)

Fix the branch name generator to produce shorter, readable names.

**Location**: `sandbox-cli.ts:167-179`

**Change**:
```typescript
// BEFORE
function generateBranchName(description: string, issueNumber?: number): string {
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  if (issueNumber) {
    return `sandbox/issue${issueNumber}-${slug}`;
  }
  const timestamp = Date.now().toString(36);
  return `sandbox/${slug}-${timestamp}`;
}

// AFTER
function generateBranchName(description: string, issueNumber?: number): string {
  // Convert to slug: lowercase, replace non-alphanumeric with hyphens
  let slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Truncate at word boundary to max 20 chars
  if (slug.length > 20) {
    const truncated = slug.slice(0, 20);
    const lastHyphen = truncated.lastIndexOf("-");
    slug = lastHyphen > 10 ? truncated.slice(0, lastHyphen) : truncated;
  }

  if (issueNumber) {
    // With issue number: sandbox/issue123-short-slug (max ~35 chars)
    return `sandbox/issue${issueNumber}-${slug}`;
  }

  // Without issue number: sandbox/short-slug-MMDD (max ~30 chars)
  const now = new Date();
  const dateSuffix = `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `sandbox/${slug}-${dateSuffix}`;
}
```

**Benefits**:
- Max 20-char slug (down from 40)
- Word-boundary aware truncation
- Human-readable date suffix (MMDD) instead of cryptic base-36 timestamp
- Total branch name ~30-35 chars (down from 50+)

#### Step 4: Add Progress Feedback (Issue 3)

Add step indicators and streaming output for long operations.

**Changes to `runClaude()`** (lines 229-282):

```typescript
async function runClaude(
  prompt: string,
  sandboxId?: string,
  timeout: number = 600,
): Promise<void> {
  checkApiKey();
  checkClaudeAuth();

  let sandbox: Sandbox;
  let createdSandbox = false;

  try {
    if (sandboxId) {
      console.log(`📦 Connecting to sandbox ${sandboxId}...`);
      sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });
      console.log(`✓ Connected to sandbox`);
    } else {
      console.log(`📦 Creating new sandbox...`);
      sandbox = await createSandbox(timeout);
      createdSandbox = true;
      console.log(`✓ Sandbox created: ${sandbox.sandboxId}`);
    }

    console.log(`\n🤖 Running Claude Code...`);
    console.log(`   Prompt: "${prompt}"`);
    console.log(`   Auth: ${getClaudeAuthType()}`);
    console.log("\n" + "─".repeat(60) + "\n");

    // Run Claude Code with streaming output
    const result = await sandbox.commands.run(
      `run-claude "${prompt.replace(/"/g, '\\"')}"`,
      {
        timeoutMs: 0,
        envs: getClaudeEnvVars(),
        onStdout: (data) => process.stdout.write(data),
        onStderr: (data) => process.stderr.write(data),
      },
    );

    console.log("\n" + "─".repeat(60));
    console.log(`\n✓ Claude Code completed (exit code: ${result.exitCode})`);

    // Check for changes and show summary
    const reviewSummary = await getReviewSummary(sandbox);

    if (reviewSummary.changedFiles.length > 0) {
      console.log(`\n📊 Changes detected: ${reviewSummary.changedFiles.length} file(s)`);

      // Start VS Code for review
      const vscodeUrl = await startVSCode(sandbox);

      console.log(`\n📝 Review in VS Code: ${vscodeUrl}`);
      console.log(`\n📋 Changed files:`);
      for (const file of reviewSummary.changedFiles.slice(0, 10)) {
        console.log(`   - ${file}`);
      }
      if (reviewSummary.changedFiles.length > 10) {
        console.log(`   ... and ${reviewSummary.changedFiles.length - 10} more`);
      }
    }

    // Show next steps
    console.log("\n" + "═".repeat(60));
    console.log("NEXT STEPS:");
    console.log("═".repeat(60));

    if (reviewSummary.changedFiles.length > 0) {
      console.log(`\n1. Review changes in VS Code`);
      console.log(`2. Run more commands if needed:`);
      console.log(`   /sandbox run-claude "/implement <issue#>" --sandbox ${sandbox.sandboxId}`);
      console.log(`   /sandbox run-claude "/test" --sandbox ${sandbox.sandboxId}`);
      console.log(`\n3. When ready, create PR:`);
      console.log(`   /sandbox approve ${sandbox.sandboxId}`);
      console.log(`\n4. Or discard:`);
      console.log(`   /sandbox reject ${sandbox.sandboxId}`);
    } else {
      console.log(`\nNo file changes detected.`);
      console.log(`\nContinue working:`);
      console.log(`   /sandbox run-claude "<prompt>" --sandbox ${sandbox.sandboxId}`);
      console.log(`\nOr kill sandbox:`);
      console.log(`   /sandbox kill ${sandbox.sandboxId}`);
    }

    console.log("");

  } catch (error) {
    console.error(
      "❌ Failed to run Claude:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}
```

#### Step 5: Simplify Workflow Architecture (Issue 4 - Core Fix)

Deprecate the complex `/sandbox feature` and `/sandbox continue` commands in favor of explicit `/sandbox run-claude` calls.

**Changes**:

1. **Mark `feature` command as deprecated** - Add warning output:
```typescript
case "feature": {
  console.log("⚠️  DEPRECATED: /sandbox feature is deprecated.");
  console.log("   Use the explicit two-step workflow instead:");
  console.log("");
  console.log("   Step 1: Plan");
  console.log('   /sandbox run-claude "/feature <description>"');
  console.log("");
  console.log("   Step 2: Review plan in VS Code, then implement");
  console.log('   /sandbox run-claude "/implement <issue#>" --sandbox <id>');
  console.log("");
  console.log("   Add --legacy to use old behavior (will be removed in future)");
  console.log("");

  if (!args.includes("--legacy")) {
    process.exit(1);
  }

  // ... existing feature workflow code for --legacy mode
}
```

2. **Mark `continue` command as deprecated**:
```typescript
case "continue": {
  console.log("⚠️  DEPRECATED: /sandbox continue is deprecated.");
  console.log("   Use explicit /sandbox run-claude instead:");
  console.log("");
  console.log('   /sandbox run-claude "/implement <issue#>" --sandbox <sandbox-id>');
  console.log("");
  process.exit(1);
}
```

3. **Update help text** to reflect new workflow:
```typescript
function showHelp(): void {
  console.log(`
E2B Sandbox Manager - Commands:

  BASIC OPERATIONS:
  create [--timeout 300]                    Create a new sandbox
  list [--json]                             List running sandboxes
  status <sandbox-id>                       Check sandbox status
  kill <sandbox-id>                         Kill a specific sandbox
  kill-all                                  Kill all sandboxes

  CLAUDE CODE (Primary Interface):
  run-claude "<prompt>" [--sandbox ID]      Run Claude Code with a prompt
              [--timeout 600]               Creates new sandbox if --sandbox not provided

  === RECOMMENDED WORKFLOW ===

  Step 1: Create plan
    /sandbox run-claude "/feature Add dark mode toggle"

  Step 2: Review plan in VS Code at provided URL
    - Open .ai/specs/feature-*.md
    - Modify if needed

  Step 3: Implement (using sandbox ID from step 1)
    /sandbox run-claude "/implement <issue#>" --sandbox <id>

  Step 4: Review code in VS Code, test at dev server URL

  Step 5: Approve to create PR
    /sandbox approve <id>

  Or reject to discard
    /sandbox reject <id>

  GIT OPERATIONS:
  diff <sandbox-id>                         Show git diff in sandbox
  approve <sandbox-id> ["message"]          Create PR from sandbox changes
  reject <sandbox-id> [--keep]              Discard changes, kill sandbox

  DEPRECATED (use --legacy to force):
  feature "<description>"                   Use run-claude "/feature ..." instead
  continue <sandbox-id>                     Use run-claude "/implement ..." instead

Requirements:
  - E2B_API_KEY: Required for all operations
  - CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY: For Claude Code operations
  - GITHUB_TOKEN: For git operations (approve command)
`);
}
```

#### Step 6: Update /sandbox Slash Command Documentation

Update `.claude/commands/sandbox.md` to reflect the new workflow.

**Key changes to documentation**:
- Remove `/sandbox feature` as primary workflow
- Add explicit two-step workflow as recommended approach
- Update examples to use `run-claude` with `/feature` and `/implement`
- Add deprecation notices for old commands

#### Step 7: Validation

Run all validation commands to ensure changes work correctly.

## Testing Strategy

### Unit Tests

No unit tests needed - this is CLI tooling, not library code.

### Integration Tests

Manual integration tests:
- ✅ `/sandbox run-claude "/feature Add a test button"` - should create plan only
- ✅ `/sandbox run-claude "/implement <issue#>" --sandbox <id>` - should implement
- ✅ `/sandbox approve <id>` - should create PR successfully
- ✅ VS Code URL should be accessible within 10 seconds
- ✅ Branch names should be ≤35 characters
- ✅ Progress indicators should show during execution

### E2E Tests

Not applicable - sandbox operations require real E2B infrastructure.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `/sandbox run-claude "/feature Test feature"` and verify:
  - [ ] Sandbox creates successfully
  - [ ] Claude Code runs /feature command
  - [ ] Plan is created (not implementation)
  - [ ] VS Code URL is shown
  - [ ] Progress indicators appear during execution
- [ ] Run `/sandbox run-claude "/implement <issue#>" --sandbox <id>` and verify:
  - [ ] Connects to existing sandbox
  - [ ] Implementation occurs
  - [ ] Changed files are listed
- [ ] Run `/sandbox approve <id>` and verify:
  - [ ] gh CLI authenticates
  - [ ] PR is created successfully
  - [ ] Branch name is short and readable
- [ ] Run deprecated `/sandbox feature` and verify:
  - [ ] Deprecation warning appears
  - [ ] Command exits without `--legacy` flag
  - [ ] Works with `--legacy` flag

## Risk Assessment

**Overall Risk Level**: medium

**Potential Risks**:

1. **User workflow disruption**
   - **Likelihood**: medium
   - **Impact**: low
   - **Mitigation**: Keep `--legacy` flag for backwards compatibility during transition. Clear deprecation messages with migration instructions.

2. **VS Code startup still slow**
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Background execution means user isn't blocked. URL is still provided even if VS Code takes time to fully load.

3. **gh auth token exposure in logs**
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: Use `echo "$TOKEN" | gh auth login` pattern which doesn't expose token in command line. Avoid logging token values.

**Rollback Plan**:

If this fix causes issues:
1. Revert changes to `sandbox-cli.ts`
2. Users can continue using existing sandboxes
3. No data loss possible (sandboxes are ephemeral)

**Monitoring**:
- Watch for user complaints about workflow changes
- Monitor sandbox creation success rate
- Check PR creation success rate

## Performance Impact

**Expected Impact**: minimal (slight improvement)

- VS Code startup no longer blocks execution
- Slightly faster overall workflow due to removed complexity

**Performance Testing**:
- Time sandbox creation → should be ~30s
- Time VS Code availability → should be <30s
- Time full workflow (plan → implement → PR) → should be <5 min

## Security Considerations

**Security Impact**: low

- GITHUB_TOKEN handling improved (explicit auth vs env var pass-through)
- No new attack surface introduced
- Token not exposed in command output

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# VS Code timeout
/sandbox feature "test"
# Expected: TimeoutError after 30s

# Long branch name
/sandbox feature "Change the H1 title color on the homepage to red"
# Expected: Branch name 50+ chars with -mijbz9q9 suffix
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Test new workflow
/sandbox run-claude "/feature Add a test button"
# Expected: Plan created, VS Code URL shown, progress indicators visible

# Check branch name
/sandbox list --json
# Expected: Branch names ≤35 chars, readable suffix

# Test PR creation (requires active sandbox with changes)
/sandbox approve <sandbox-id>
# Expected: PR created successfully
```

**Expected Result**: All commands succeed, bugs are resolved, zero regressions.

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - this is local CLI tooling

**Feature flags needed**: no (use `--legacy` flag for backwards compatibility)

**Backwards compatibility**: maintained via `--legacy` flag

## Success Criteria

The fix is complete when:
- [ ] VS Code starts without timeout blocking execution
- [ ] `gh pr create` succeeds when GITHUB_TOKEN is set
- [ ] Progress indicators show during sandbox operations
- [ ] `/sandbox run-claude "/feature X"` creates plan only (no implementation)
- [ ] `/sandbox run-claude "/implement <issue#>" --sandbox <id>` implements approved plan
- [ ] Branch names are ≤35 characters with readable format
- [ ] Deprecated commands show warning and exit (without `--legacy`)
- [ ] All validation commands pass
- [ ] Manual testing checklist complete

## Notes

### Key Insight: Simplification Over Complexity

The original diagnosis identified Issue 4 as having two parts: (A) session architecture and (B) orchestrator overreach. The tempting solution was to add session persistence to fix Part A and add guardrails to fix Part B.

However, the user's suggestion to separate `/feature` and `/implement` into explicit steps is superior because:
1. It eliminates Part B entirely (no opportunity for orchestrator to overstep)
2. It makes Part A irrelevant (session isolation is now expected behavior)
3. It reduces code complexity instead of adding it
4. It gives users more explicit control

### Workflow Comparison

| Aspect | Old Workflow | New Workflow |
|--------|--------------|--------------|
| Commands | `feature` → `continue` → `approve` | `run-claude "/feature"` → `run-claude "/implement"` → `approve` |
| User control | Orchestrator can answer for user | User always decides |
| Session handling | Complex (needs persistence) | Simple (isolation expected) |
| Code complexity | High | Lower |
| Debugging | Hard | Easy |

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #772*
