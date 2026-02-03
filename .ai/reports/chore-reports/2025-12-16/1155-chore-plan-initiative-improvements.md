# Chore Plan: Initiative Command Workflow Improvements

## Overview

| Field | Value |
|-------|-------|
| **Type** | tooling |
| **Severity** | high |
| **Created** | 2025-12-16 |
| **Status** | pending |
| **GitHub Issue** | #1155 |

## Problem Statement

The `/initiative` slash command workflow has several architectural issues that reduce its effectiveness and safety:

1. **Report Fragmentation**: Research manifest stored in `.ai/research/` separately from research reports in `.ai/reports/research-reports/`, creating a confusing split
2. **Premature GitHub Issue Creation**: Sub-commands create GitHub issues BEFORE user approval gate, violating the intended workflow safety
3. **Unenforced E2B Sandbox**: Despite "MANDATORY" language, sandbox usage is easily rationalized away without hard stops
4. **Ineffective Sub-Agent Delegation**: GitHub operations delegated to sub-agents fail to execute properly
5. **No Simplified Path**: No lightweight option for smaller initiatives that don't need full research phase

## Success Criteria

- [ ] All research artifacts saved to single location: `.ai/reports/feature-reports/<date>/<slug>/`
- [ ] GitHub issues created ONLY after explicit user approval
- [ ] E2B sandbox has hard-stop assertion that blocks progression without explicit user override
- [ ] GitHub operations executed directly by orchestrator, not delegated to sub-agents
- [ ] `--quick` flag available for simplified workflow (skip research, use existing codebase patterns)

## Tasks

### Task 1: Consolidate Report Location

**Files to modify:**
- `.claude/commands/initiative.md` (lines 38, 291-340)
- `.ai/research/_templates/manifest-template.md`

**Changes:**
1. Change `manifestPath` variable from `.ai/research/{slug}/manifest.md` to `.ai/reports/feature-reports/<date>/{slug}/manifest.md`
2. Update Step 1.5 to create directory in new location
3. Update all references to manifest path throughout the file
4. Remove `.ai/research/` directory usage (keep `_templates` as reference)
5. Update Research Reports section to use relative paths within same directory

**New directory structure:**
```
.ai/reports/feature-reports/2025-12-16/user-dashboard-home/
├── manifest.md                    # Research manifest
├── perplexity-research.md        # Perplexity findings
├── context7-documentation.md     # Context7 findings
└── explore-patterns.md           # Codebase patterns
```

**Validation**: Test that all relative links in manifest.md work correctly

---

### Task 2: Split Decomposition from GitHub Issue Creation

**Files to modify:**
- `.claude/commands/initiative-feature-set.md` (lines 119-127)
- `.claude/commands/feature-set.md` (lines 136-145, 206-325)
- `.claude/commands/initiative.md` (lines 348-433)

**Changes:**

1. **Add `--dry-run` flag to `/initiative-feature-set`**
   - When set, output JSON decomposition WITHOUT creating GitHub issues
   - Skip Step 7 (GitHub issue creation) entirely
   - Output structured plan for user review

2. **Add `--create-issues` flag to `/initiative-feature-set`**
   - When set, ONLY create GitHub issues from existing plan
   - Skip Steps 1-6 (analysis/decomposition)
   - Read plan from `.ai/specs/feature-sets/<slug>/pending-overview.md`

3. **Update `/initiative` orchestrator workflow:**
   - Step 2.1: Call with `--dry-run` flag
   - Step 2.4: User approval gate (EXISTING - no change)
   - NEW Step 2.5: After approval, call with `--create-issues` flag
   - Move branch creation to after issue creation

4. **Update `/feature-set` with same pattern** for standalone usage

**New workflow:**
```
/initiative-feature-set "initiative" --dry-run
    ↓ Returns JSON plan (no issues created)
User reviews decomposition
    ↓ Approval gate
/initiative-feature-set "initiative" --create-issues
    ↓ Creates GitHub issues from saved plan
```

**Validation**: Run decomposition with `--dry-run`, verify no issues created, then run `--create-issues`, verify issues created correctly

---

### Task 3: Enforce E2B Sandbox with Hard Stop

**Files to modify:**
- `.claude/commands/initiative.md` (lines 479-518)

**Changes:**

1. **Add hard stop assertion before Phase 3:**
   ```markdown
   ### Pre-Phase 3 Sandbox Assertion (HARD STOP)

   **THIS IS A BLOCKING REQUIREMENT. DO NOT PROCEED WITHOUT SANDBOX.**

   Before executing Phase 3, verify:
   - [ ] `sandboxId` is set to a valid E2B sandbox ID
   - [ ] Sandbox status is "running" (verify with `/sandbox list`)

   **If sandbox is not running:**
   1. STOP immediately
   2. Present user with explicit choice:

   AskUserQuestion({
     question: "E2B sandbox is required but not running. How to proceed?",
     header: "Sandbox",
     options: [
       { label: "Create sandbox", description: "Create E2B sandbox now (recommended)" },
       { label: "Skip sandbox (UNSAFE)", description: "Run locally without isolation - NOT RECOMMENDED" },
       { label: "Cancel initiative", description: "Stop and review manually" }
     ]
   })

   3. If user selects "Skip sandbox (UNSAFE)":
      - Log warning: "USER CHOSE TO SKIP SANDBOX ISOLATION"
      - Add warning banner to all subsequent progress messages
      - Continue with local execution

   4. If user selects "Create sandbox":
      - Run `/sandbox create` command
      - Capture sandboxId
      - Continue to Phase 3

   **DO NOT rationalize skipping this step.** The sandbox provides critical isolation.
   ```

2. **Add visual warning for non-sandbox execution:**
   ```markdown
   **[WARNING] Running without E2B sandbox isolation - changes affect local environment directly**
   ```

**Validation**: Attempt to start Phase 3 without sandbox, verify hard stop triggers

---

### Task 4: Execute GitHub Operations Directly

**Files to modify:**
- `.claude/commands/initiative.md` (lines 348-368)
- `.claude/commands/initiative-feature-set.md` (lines 119-127)

**Changes:**

1. **Remove Task() delegation for GitHub operations in `/initiative`:**
   - Step 2.1 currently delegates to `Task(general-purpose)` for `/initiative-feature-set`
   - Change to execute `/initiative-feature-set` directly using `SlashCommand` tool
   - Orchestrator maintains control of GitHub issue creation

2. **Update instruction text to clarify:**
   ```markdown
   #### Step 2.1: Execute /initiative-feature-set (DIRECT - NO DELEGATION)

   **CRITICAL**: Do NOT delegate this step to a sub-agent. GitHub operations must be
   executed directly by the orchestrator to ensure proper credential handling and
   state tracking.

   Execute directly:
   SlashCommand("/initiative-feature-set \"${initiative}\" --manifest ${manifestPath} --dry-run")

   Capture the structured JSON output for:
   - Feature list
   - Dependency graph
   - Phase assignments
   ```

3. **Add explanation comment:**
   ```markdown
   > **Why no delegation?** Sub-agents don't have access to the same GitHub credentials
   > and state tracking as the orchestrator. Delegating GitHub operations causes them
   > to fail silently or create issues without proper tracking.
   ```

**Validation**: Run `/initiative` and verify GitHub issues are created with correct linking

---

### Task 5: Add Simplified `--quick` Workflow

**Files to modify:**
- `.claude/commands/initiative.md` (add new section after line 237)

**Changes:**

1. **Add `--quick` flag detection in Step 1.1:**
   ```markdown
   #### Step 1.0: Check for Quick Mode

   Parse arguments for `--quick` flag:

   ```typescript
   const args = "$ARGUMENTS";
   const quickMode = args.includes('--quick');
   const initiative = args.replace('--quick', '').trim();
   ```

   **If `--quick` is set:**
   - Skip Step 1.2 (Interview) - use default answers
   - Skip Step 1.3 (Research agents) - use codebase exploration only
   - Reduce research to single Explore agent call
   - Create minimal manifest with codebase patterns only
   - Proceed directly to Phase 2: Decomposition

   **Quick mode is appropriate for:**
   - Initiatives using existing project patterns
   - UI-focused work with established components
   - Small-to-medium features (4-6 features expected)
   - Time-sensitive work where full research is overkill

   **Quick mode is NOT appropriate for:**
   - New technology integrations
   - Security-sensitive features
   - Complex architectural changes
   - Features requiring external API research
   ```

2. **Add quick mode manifest template:**
   ```markdown
   #### Quick Mode Manifest

   When `--quick` is set, create simplified manifest:

   ```markdown
   # Research Manifest: <Initiative Name> (Quick Mode)

   ## Quick Reference
   | Field | Value |
   |-------|-------|
   | **Initiative** | <description> |
   | **Mode** | Quick (codebase patterns only) |
   | **Date** | <today> |
   | **GitHub Issue** | #1155 |

   ## Codebase Patterns
   <From Explore agent - existing patterns, data sources, component structure>

   ## Applicable Documentation
   <From /conditional_docs output - relevant context docs>

   ## Notes
   - Full research skipped in quick mode
   - Using existing codebase patterns
   - Consider full research if unfamiliar patterns needed
   ```

3. **Update usage documentation:**
   ```markdown
   ## Usage

   **Full workflow (recommended for new technologies):**
   ```bash
   /initiative "local-first architecture with RxDB encrypted sync"
   ```

   **Quick workflow (for familiar patterns):**
   ```bash
   /initiative "user dashboard with course progress and activity feed" --quick
   ```
   ```

**Validation**: Run `/initiative "test feature" --quick` and verify streamlined execution

---

## Implementation Order

Execute tasks in this order (dependencies noted):

1. **Task 1: Consolidate Report Location** (independent)
2. **Task 4: Execute GitHub Operations Directly** (independent)
3. **Task 2: Split Decomposition from GitHub Issue Creation** (depends on Task 4)
4. **Task 3: Enforce E2B Sandbox with Hard Stop** (independent)
5. **Task 5: Add Simplified `--quick` Workflow** (independent, but test after other changes)

## Testing Strategy

### Unit Testing
- N/A (slash commands are not unit testable)

### Integration Testing
1. Run `/initiative "test dashboard feature" --quick` with full flow
2. Verify:
   - Reports saved to `.ai/reports/feature-reports/<date>/<slug>/`
   - `--dry-run` produces plan without GitHub issues
   - `--create-issues` creates issues from existing plan
   - Sandbox hard stop triggers when sandbox not running
   - GitHub issues have correct linking and labels

### Validation Commands
```bash
# Check report location
ls -la .ai/reports/feature-reports/2025-12-16/

# Verify no issues created during dry-run
gh issue list --repo slideheroes/2025slideheroes --label "type:feature-set" --limit 5

# Check sandbox status
/sandbox list
```

## Rollback Plan

If issues arise:
1. Revert changes to `.claude/commands/initiative.md`
2. Revert changes to `.claude/commands/initiative-feature-set.md`
3. Revert changes to `.claude/commands/feature-set.md`
4. Keep `.ai/reports/` structure (no data loss)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing `/feature-set` standalone usage | Medium | Medium | Test standalone command separately |
| `--quick` mode insufficient for complex initiatives | Low | Low | Document when NOT to use quick mode |
| GitHub credential issues in direct execution | Low | High | Test GitHub operations before full workflow |

## Related Files

| File | Purpose |
|------|---------|
| `.claude/commands/initiative.md` | Main orchestrator (809 lines) |
| `.claude/commands/initiative-feature-set.md` | Sandbox-optimized decomposition (256 lines) |
| `.claude/commands/feature-set.md` | Standalone decomposition (403 lines) |
| `.claude/commands/initiative-feature.md` | Feature planning (sandbox) |
| `.claude/commands/initiative-implement.md` | Feature implementation (sandbox) |
| `.ai/research/_templates/manifest-template.md` | Manifest template reference |

---

*Generated by `/chore` command*
*Ready for GitHub issue creation and implementation*
