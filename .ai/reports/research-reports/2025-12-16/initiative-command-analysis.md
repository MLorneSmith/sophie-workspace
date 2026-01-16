# /initiative Command Analysis

**Date**: 2025-12-16
**Context**: Post-mortem analysis of `/initiative` command execution for "User Dashboard at /home"

## Executive Summary

The `/initiative` command failed to use the E2B sandbox and create a working branch, despite these being core requirements described in the command documentation. This analysis identifies root causes and proposes specific improvements.

---

## What Happened During the Session

### Phase 1: Interview & Research - WORKED WELL
- User interview was conducted using `AskUserQuestion`
- Research agents were launched in parallel (Explore, docs-mcp-expert)
- Research findings were synthesized
- Research manifest was created at `.ai/research/user-dashboard-home/manifest.md`

### Phase 2: Decomposition - PARTIALLY WORKED
- Decomposed initiative into 9 features across 3 phases
- User approved the decomposition
- **FAILED**: Did NOT delegate to `/initiative-feature-set` command
- **FAILED**: Did NOT create GitHub issues
- **FAILED**: Did NOT create `github-mapping.md` file

### Phase 3: Feature Loop (E2B Sandbox) - COMPLETELY FAILED
- **FAILED**: Did NOT create E2B sandbox
- **FAILED**: Did NOT create a feature branch
- Started implementing directly in local environment
- This violated the core safety principle of isolated sandbox execution

### Phase 4: Completion - Never Reached
- User interrupted to undo changes

---

## Root Cause Analysis

### Issue 1: E2B Sandbox Not Used

**Root Causes:**

1. **No enforcement mechanism** - The command describes sandbox usage but doesn't enforce it
2. **Vague transition point** - The shift from "LOCAL EXECUTION" to "E2B SANDBOX EXECUTION" is documented but not mandated
3. **No state tracking** - There's no variable like `sandboxId` that must be set before Phase 3
4. **Instructions are "descriptive" not "prescriptive"** - Lines like "Create sandbox using the project's template" leave room for interpretation
5. **No explicit STOP gate** - After Phase 2 approval, there's no "CREATE SANDBOX NOW" checkpoint

**Evidence from command:**
```
#### Step 3.1: Create E2B Sandbox

```bash
# Create sandbox using the project's template
./.claude/skills/e2b-sandbox/scripts/sandbox create --timeout 3600
```

Capture sandbox ID for subsequent operations.
```

This is just a suggestion, not a mandatory step with validation.

### Issue 2: No Branch Created

**Root Causes:**

1. **Branch creation is mentioned too late** - It appears in Phase 4.1 (Commit and Push Changes), AFTER implementation
2. **No pre-implementation branch requirement** - Standard practice is to create branch BEFORE writing code
3. **Missing from Phase 3** - The E2B sandbox command `/sandbox feature` creates a branch automatically, but this isn't emphasized
4. **No validation step** - Nothing checks "am I on a feature branch?" before implementation starts

**Evidence from command:**
```
### Phase 4: Completion

#### Step 4.1: Commit and Push Changes

```bash
# In sandbox:
git add -A
git commit -m "feat(<scope>): implement <initiative-name>
...
git push origin <branch-name>
```
```

This assumes a branch exists but never specifies when/where to create it.

### Issue 3: Skipped Delegation to Sub-Commands

**Root Causes:**

1. **Sub-commands presented as "delegation" options** - Not mandatory handoffs
2. **No validation that sub-command was executed** - Could manually decompose instead
3. **Task tool invocation is suggested but not enforced**

**Evidence:**
```typescript
Task(general-purpose, prompt: `
  Execute the /initiative-feature-set command:
  /initiative-feature-set "${initiative}" --manifest ...
`)
```

This is described but easy to skip when doing manual decomposition feels faster.

---

## What Worked Well

1. **Research phase parallelization** - Launching multiple agents simultaneously was effective
2. **User interview flow** - AskUserQuestion gathered appropriate context
3. **Research manifest structure** - Good template for capturing findings
4. **ASCII architecture diagram** - Clearly shows the intended workflow visually
5. **Phase-based structure** - Logical progression from research → decomposition → implementation

---

## Proposed Improvements

### Critical Improvement 1: Mandatory E2B Sandbox Creation

**Before Phase 3, add explicit mandatory checkpoint:**

```markdown
### MANDATORY: Create E2B Sandbox

**This step is NOT optional. Do NOT proceed without completing it.**

```bash
# Execute this EXACT command and capture the output
/sandbox create --timeout 3600
```

**Required output capture:**
```typescript
const sandboxId = "<sandbox-id-from-output>";
// Store this - ALL Phase 3 operations require it
```

**Validation**: If you cannot provide a sandbox ID, STOP and troubleshoot.
```

### Critical Improvement 2: Branch Creation Immediately After Approval

**Move branch creation to Phase 2.5 (after approval, before sandbox):**

```markdown
### Step 2.5: Create Feature Branch (MANDATORY)

After user approves decomposition, create the feature branch:

```bash
# Generate branch name from initiative slug
git checkout -b feature/<slug>

# Or use sandbox command which creates branch automatically:
/sandbox feature "<initiative-description>"
```

**Validation**: Run `git branch --show-current` to confirm you're on a feature branch, not `dev` or `main`.
```

### Critical Improvement 3: Use `/sandbox feature` as Primary Workflow

**Replace manual sandbox + implementation with unified command:**

```markdown
### Phase 3: Feature Implementation (SANDBOX REQUIRED)

**Use the sandbox feature workflow for each feature:**

```bash
# This creates sandbox, branch, and runs /feature planning
/sandbox feature "#<issue-number> <feature-description>"
```

This command:
1. Creates E2B sandbox
2. Creates branch: `sandbox/issue<N>-<slug>`
3. Runs `/feature` for planning
4. Opens VS Code Web for review
5. **PAUSES** for human approval

**Continue workflow:**
```bash
/sandbox continue <sandbox-id>  # Runs /implement and /review
/sandbox approve <sandbox-id>   # Commits, pushes, creates PR
```
```

### Critical Improvement 4: Add State Tracking Section

**Add explicit state tracking at the top of the command:**

```markdown
## State Variables (Track Throughout)

Capture and track these values as you progress:

| Variable | Set In | Value |
|----------|--------|-------|
| `slug` | Step 1.1 | |
| `manifestPath` | Step 1.5 | |
| `masterIssueNumber` | Step 2.1 | |
| `featureIssues[]` | Step 2.1 | |
| `branchName` | Step 2.5 | |
| `sandboxId` | Step 3.1 | |
| `prNumber` | Step 4.2 | |

**CRITICAL**: If any required variable is empty at the start of a phase, STOP and backfill.
```

### Critical Improvement 5: Add Phase Transition Assertions

**Add assertions before each phase:**

```markdown
### Pre-Phase 3 Assertions

Before proceeding, verify:

- [ ] `masterIssueNumber` is set (e.g., #123)
- [ ] `featureIssues[]` has at least one issue number
- [ ] `manifestPath` exists and is readable
- [ ] User has approved the decomposition

**If any assertion fails, STOP and resolve before continuing.**
```

### Other Improvements

#### 1. Simplify Phase 3 Structure

Current structure tries to be too flexible. Simplify to:

```markdown
### Phase 3: Implementation Loop

For each feature in dependency order:

1. `/sandbox feature "#<issue> <description>"`
2. Review plan → `/sandbox continue <id>`
3. Review code → `/sandbox approve <id>` OR `/sandbox reject <id>`
4. Repeat for next feature
```

#### 2. Remove Ambiguous "runInSandbox" Pseudocode

Replace pseudocode like:
```typescript
const planResult = await runInSandbox(`...`);
```

With actual commands:
```bash
/sandbox run-claude "/initiative-feature #<issue> --manifest <path>"
```

#### 3. Add Error Recovery Guidance

```markdown
### If Sandbox Times Out

1. Note the last completed feature
2. `/sandbox kill <id>`
3. `/sandbox create --timeout 3600`
4. Resume from uncompleted feature
```

#### 4. Add Progress Checkpoints

```markdown
### Progress Checkpoint (After Each Feature)

Report to user:
- Feature X/N complete
- Branch: `<branch-name>`
- Sandbox: `<sandbox-id>`
- Files changed: <count>
- Next: Feature Y
```

#### 5. Make GitHub Issue Creation Explicit and Non-Skippable

```markdown
### Step 2.1: Create GitHub Issues (MANDATORY)

You MUST use the `/initiative-feature-set` command to:
1. Create master feature-set issue
2. Create stub issues for each feature
3. Generate `github-mapping.md`

**Do NOT manually decompose** - the sub-command handles GitHub integration.
```

---

## Summary of Key Changes

| Issue | Current Behavior | Proposed Fix |
|-------|------------------|--------------|
| No sandbox used | Described but not enforced | Add mandatory checkpoint with validation |
| No branch created | Mentioned in Phase 4 | Move to Phase 2.5, require before implementation |
| Skipped sub-commands | Suggested as delegation | Make mandatory, validate outputs |
| No state tracking | Implicit/none | Add explicit state table |
| Vague transitions | "Local" vs "Sandbox" described | Add clear ASSERTIONS before phases |
| Flexible workflow | Multiple paths possible | Standardize on `/sandbox feature` workflow |

---

## Recommended Implementation Order

1. **Add State Variables section** (quick win, improves tracking)
2. **Add Pre-Phase Assertions** (prevents skipping critical steps)
3. **Move branch creation to Phase 2.5** (ensures work happens on branch)
4. **Make sandbox creation mandatory with validation** (core safety feature)
5. **Standardize on `/sandbox feature` workflow** (simplifies Phase 3)
6. **Make sub-command delegation non-optional** (ensures GitHub integration)
