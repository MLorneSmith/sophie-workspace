# Chore: Improve /initiative slash command and associated commands

## Chore Description

Improve the `/initiative` orchestrator command and its associated sub-commands (`/initiative-feature-set`, `/initiative-feature`, `/initiative-implement`) by implementing 6 critical improvements identified in the post-mortem analysis. The `/initiative` command failed to enforce its core safety requirements (E2B sandbox isolation and branch creation) during a recent execution, indicating gaps between documented intentions and actual enforcement.

**Root Issues:**
1. **No enforcement mechanism** for E2B sandbox creation - described but not mandatory
2. **No branch creation before implementation** - mentioned only in Phase 4, after work starts
3. **Skipped delegation to sub-commands** - presented as optional rather than required
4. **No state tracking** - variables and prerequisites not explicitly tracked
5. **Vague phase transitions** - unclear boundaries between local and sandbox execution
6. **Flexible workflow** - multiple possible execution paths instead of standardized flow

These issues compromise the core safety principle of isolated sandbox execution and increase risk of direct modifications to local code.

## Relevant Files

### Core Slash Commands
- `.claude/commands/initiative.md` - Main orchestrator (528 lines)
  - **Why**: This is the primary file that needs updates. Contains all 4 phases and is the entry point.
  - **Improvements Needed**: Add mandatory checkpoints, state tracking table, pre-phase assertions

- `.claude/commands/initiative-feature-set.md` - Feature decomposition (256 lines)
  - **Why**: Sub-command that must be made mandatory with validated execution
  - **Improvements Needed**: Add validation that command was executed, make GitHub issue creation non-optional

- `.claude/commands/initiative-feature.md` - Feature planning (361 lines)
  - **Why**: Sub-command for individual feature planning with research manifest
  - **Improvements Needed**: Add state tracking output, research sections used tracking

- `.claude/commands/initiative-implement.md` - Implementation execution (331 lines)
  - **Why**: Sub-command that executes in E2B sandbox
  - **Improvements Needed**: Add research patterns tracking, state validation

- `.claude/commands/sandbox.md` - E2B sandbox operations (337 lines)
  - **Why**: Referenced for sandbox creation/management
  - **Improvements Needed**: Verify `/sandbox feature` workflow is documented

### Documentation Files
- `.ai/reports/research-reports/2025-12-16/initiative-command-analysis.md` - Analysis document
  - **Why**: Contains the detailed root cause analysis and improvement recommendations
  - **Reference**: Provides the specific 6 improvements and implementation order

### Configuration Files
- `.claude/config/command-profiles.yaml` - Command documentation routing (optional)
  - **Why**: May need updates if new documentation patterns are added

## New Files

No new files required. All changes are modifications to existing slash command files.

## Impact Analysis

### Scope
- **Direct Impact**: 5 slash command files (initiative, initiative-feature-set, initiative-feature, initiative-implement, sandbox reference)
- **Indirect Impact**: E2B sandbox workflow, GitHub issue creation, feature planning and implementation
- **User Impact**: Developers using the `/initiative` command will have safer, more predictable workflows with clearer checkpoints

### Dependencies Affected
- **E2B Sandbox Skill**: Referenced in command but no dependency changes needed
- **GitHub CLI (gh)**: Already used for GitHub operations, no version changes
- **Slash Command System**: Uses existing architecture, no breaking changes
- **Research Manifest System**: Already integrated, enhancements only

### Risk Assessment

**Low Risk** - These are improvements to user-facing documentation and workflow enforcement, not core library changes.

**Rationale:**
- Changes are isolated to markdown documentation files (no code changes)
- Improvements add constraints/gates without removing existing functionality
- Backward compatible - existing workflows will still work, just with additional checkpoints
- No database migrations or breaking API changes
- No external dependencies added

**Potential Issues:**
- Users running old cached versions of commands won't see updates (requires re-source)
- Additional checkpoints may slightly increase workflow time (acceptable tradeoff for safety)

### Backward Compatibility

**Fully backward compatible** - The improvements add validation and checkpoints but don't break existing command logic:

- Phase progression still follows same order
- Sub-commands still work when called manually
- E2B sandbox still optional in Phase 3 (becomes mandatory via gate)
- All outputs remain compatible with orchestrator consumption

**No migration path needed** - Existing workflows continue to work; improvements are additive.

## Pre-Chore Checklist

Before starting implementation:

- [ ] Review the full analysis in `.ai/reports/research-reports/2025-12-16/initiative-command-analysis.md`
- [ ] Understand the 6 critical improvements and their implementation order
- [ ] Verify all 5 command files are readable and writable
- [ ] Check that recent `/initiative` execution logs exist for reference
- [ ] Plan for testing the improved workflow (manual execution recommended)

## Documentation Updates Required

- **Command Files (Internal)**: Updated markdown in `.claude/commands/` files
- **CLAUDE.md** (Optional): Consider adding section about `/initiative` best practices
- **No external documentation changes**: This is internal tooling

## Rollback Plan

**Simple rollback procedure:**
1. All changes are in markdown files (`.claude/commands/*.md`)
2. Each file can be independently reverted using git
3. No state or configuration changes persist
4. Revert commands:
   ```bash
   git checkout HEAD -- .claude/commands/initiative.md
   git checkout HEAD -- .claude/commands/initiative-feature-set.md
   git checkout HEAD -- .claude/commands/initiative-feature.md
   git checkout HEAD -- .claude/commands/initiative-implement.md
   ```
5. Re-source slash commands (they'll load from git)

**Detection**: If new gates cause issues, users will report blocking on checkpoint approvals. Address specific checkpoints as needed.

## Step by Step Tasks

### Task 1: Add State Variables Section to /initiative.md

Add a new section after the Architecture diagram (before Phase 1) that tracks required state variables throughout execution:

- [ ] Insert section titled "## State Variables (Track Throughout)"
- [ ] Create a table with columns: Variable | Set In | Value
- [ ] Include variables: slug, manifestPath, masterIssueNumber, featureIssues[], branchName, sandboxId, prNumber
- [ ] Add CRITICAL note: "If any required variable is empty at the start of a phase, STOP and backfill"
- [ ] Position: After Architecture section, before Phase 1 instructions

**Rationale**: Makes state tracking explicit and prevents skipped variables. Users can print/reference this table during execution.

### Task 2: Add Pre-Phase Assertions to /initiative.md

Add assertion sections before each major phase (after state tracking section):

- [ ] Add "### Pre-Phase 2 Assertions" before Phase 2 instructions with checklist:
  - User has been interviewed
  - Research agents have completed
  - Research manifest exists and is readable

- [ ] Add "### Pre-Phase 3 Assertions" before Phase 3 instructions with checklist:
  - `masterIssueNumber` is set
  - `featureIssues[]` has at least one issue
  - `manifestPath` exists and is readable
  - User has approved decomposition

- [ ] Add validation language: "If any assertion fails, STOP and resolve before continuing"

**Rationale**: Creates explicit checkpoints that prevent skipping critical setup steps. Forces intentional validation.

### Task 3: Make E2B Sandbox Creation Mandatory in Phase 3

Refactor Phase 3 sandbox creation from optional suggestion to mandatory with validation:

- [ ] Update Step 3.1 title to "### MANDATORY: Create E2B Sandbox"
- [ ] Change description to explicitly state "This step is NOT optional"
- [ ] Add required output capture section that requires `sandboxId` variable
- [ ] Add validation language: "If you cannot provide a sandbox ID, STOP and troubleshoot"
- [ ] Add error handling subsection for common sandbox creation failures

**Rationale**: Enforces the core safety principle of isolated execution. Current wording allows skipping entirely.

### Task 4: Move Branch Creation to Phase 2.5 (New Section)

Create a new phase section for branch creation that executes immediately after user approval, before sandbox:

- [ ] Insert new section "### Step 2.5: Create Feature Branch (MANDATORY)" between approval gate and Phase 3
- [ ] Provide two options:
  - Manual: `git checkout -b feature/<slug>`
  - Sandbox-based: `/sandbox feature "<description>"`
- [ ] Add validation: "Run `git branch --show-current` to confirm on feature branch, not dev/main"
- [ ] Add state tracking: Update `branchName` variable

**Rationale**: Ensures work happens on isolated branch BEFORE any implementation. Prevents direct dev/main modifications.

### Task 5: Standardize Phase 3 to Use /sandbox feature Workflow

Simplify Phase 3 feature loop structure to use the `/sandbox feature` command as primary workflow:

- [ ] Replace pseudocode `runInSandbox()` calls with actual command: `/sandbox feature "#<issue> <description>"`
- [ ] Simplify feature loop to 3 steps:
  1. `/sandbox feature "#N <description>"` - Creates sandbox, branch, plan
  2. `/sandbox continue <sandbox-id>` - Implements and reviews
  3. `/sandbox approve <sandbox-id>` - Commits and pushes

- [ ] Remove manual sandbox + manual implementation complexity
- [ ] Add inline comments explaining what each command does
- [ ] Preserve error recovery guidance

**Rationale**: The existing `/sandbox feature` workflow already does everything needed. Reduces confusion by using actual commands instead of pseudocode.

### Task 6: Make Sub-Command Delegation Non-Optional

Update Phase 2 to mandate `/initiative-feature-set` execution with validation:

- [ ] Change language in Step 2.1 from "delegate to" to "YOU MUST execute"
- [ ] Add explicit: "Do NOT manually decompose - the sub-command handles GitHub integration"
- [ ] Add validation section after execution that verifies:
  - Master issue created (#<number>)
  - Feature stub issues created (count matches expected)
  - `github-mapping.md` file exists
  - Structured JSON output received

- [ ] Add error section for when sub-command fails or is skipped
- [ ] If validation fails, provide recovery steps

**Rationale**: Sub-commands handle critical integrations (GitHub issues, dependency tracking). Skipping them defeats the automation value.

### Task 7: Update /initiative-feature-set.md

Update feature-set decomposition sub-command to reflect mandatory status:

- [ ] Verify manifest loading is properly documented
- [ ] Ensure GitHub issue creation steps are clear and non-optional
- [ ] Verify structured JSON output format matches orchestrator expectations
- [ ] Add note: "This command is ALWAYS called by /initiative - not meant for standalone use"

**Rationale**: Clarifies the command's role in the orchestrator workflow.

### Task 8: Update /initiative-feature.md

Update feature planning sub-command to support state tracking:

- [ ] Verify research manifest integration is documented
- [ ] Ensure structured JSON output includes: research_sections_used, dependencies, estimated_files
- [ ] Add section: "Research Sections Referenced" to track which manifest sections informed the plan
- [ ] Add validation: Plan file is created and GitHub issue updated

**Rationale**: Enables tracking of which research informed which features.

### Task 9: Update /initiative-implement.md

Update implementation sub-command to track research patterns:

- [ ] Verify research manifest integration is documented
- [ ] Ensure structured JSON output includes: research_patterns_applied
- [ ] Add section during Step 6: Extract which research patterns were applied during implementation
- [ ] Track in final output which code examples from manifest were referenced

**Rationale**: Enables understanding of how research influenced final implementation.

### Task 10: Add Error Recovery Guidance

Add a new "## Error Handling and Recovery" section to /initiative.md after all phases:

- [ ] Sandbox timeout recovery: How to resume with new sandbox
- [ ] Feature skip handling: How to skip a feature and continue
- [ ] Research failure: How to proceed with partial research
- [ ] Implementation failure: How to fix blocking issues
- [ ] Branch issue: How to recover from branch problems

**Rationale**: Provides users with recovery paths instead of forcing restart.

### Task 11: Add Progress Checkpoint Reporting

Add a progress reporting subsection within Phase 3 feature loop:

- [ ] After each feature completes, add checkpoint output:
  - Feature X/N complete
  - Branch: `<branch-name>`
  - Sandbox: `<sandbox-id>`
  - Files changed: <count>
  - Next: Feature Y

- [ ] Track cumulative progress through all features
- [ ] Update state variables table with latest values

**Rationale**: Provides visibility into multi-feature progress and helps users track position in execution.

### Task 12: Add Testing and Validation

Create a simple test plan to verify the improved workflow:

- [ ] Run `/initiative` with a small test initiative (2-3 features)
- [ ] Verify all 6 critical improvements are enforced:
  1. ✓ E2B sandbox created before Phase 3
  2. ✓ Branch created before implementation
  3. ✓ Sub-commands execute and produce output
  4. ✓ State variables tracked throughout
  5. ✓ Pre-phase assertions validated
  6. ✓ /sandbox feature workflow used for Phase 3

- [ ] Verify no workflow steps are skipped
- [ ] Capture screenshots of state tracking table, checkpoints, progress updates
- [ ] Document any issues or edge cases found

**Rationale**: Ensures improvements work as designed and don't break existing functionality.

## Validation Commands

Execute these commands to validate the chore is complete:

```bash
# 1. Verify all command files exist and are readable
test -r .claude/commands/initiative.md && echo "✓ initiative.md" || echo "✗ initiative.md"
test -r .claude/commands/initiative-feature-set.md && echo "✓ feature-set.md" || echo "✗ feature-set.md"
test -r .claude/commands/initiative-feature.md && echo "✓ feature.md" || echo "✗ feature.md"
test -r .claude/commands/initiative-implement.md && echo "✓ implement.md" || echo "✗ implement.md"

# 2. Verify key sections exist in initiative.md
grep -q "State Variables" .claude/commands/initiative.md && echo "✓ State Variables section" || echo "✗ State Variables section"
grep -q "Pre-Phase 3 Assertions" .claude/commands/initiative.md && echo "✓ Pre-Phase 3 Assertions" || echo "✗ Pre-Phase 3 Assertions"
grep -q "MANDATORY: Create E2B Sandbox" .claude/commands/initiative.md && echo "✓ Mandatory sandbox" || echo "✗ Mandatory sandbox"
grep -q "Step 2.5" .claude/commands/initiative.md && echo "✓ Phase 2.5 branch creation" || echo "✗ Phase 2.5 branch creation"
grep -q "/sandbox feature" .claude/commands/initiative.md && echo "✓ /sandbox feature workflow" || echo "✗ /sandbox feature workflow"

# 3. Verify shell syntax (markdown files should parse)
test -s .claude/commands/initiative.md && echo "✓ initiative.md has content" || echo "✗ initiative.md is empty"

# 4. Verify git status shows modified files
git status --short .claude/commands/ | grep -E "^\s?M" && echo "✓ Files modified in git" || echo "✗ No git modifications"

# 5. Final visual check - verify readability
echo "=== State Variables Section ===" && \
grep -A 10 "State Variables" .claude/commands/initiative.md | head -15
```

All validation must show ✓ status (no ✗ errors) for the chore to be considered complete.

## Notes

### Implementation Order (From Research Report)

Follow this exact sequence as recommended in the analysis:

1. **State Variables section** - Quick win, improves tracking visibility
2. **Pre-Phase Assertions** - Prevents skipping critical steps
3. **Move branch creation to Phase 2.5** - Ensures work on proper branch
4. **Make sandbox creation mandatory** - Core safety feature enforcement
5. **Standardize /sandbox feature workflow** - Simplifies Phase 3
6. **Make sub-command delegation non-optional** - Ensures GitHub integration

### Why These Changes Matter

The research report shows the `/initiative` command failed its core safety requirement: E2B sandbox isolation. The user started implementing directly in the local environment instead of in an isolated sandbox. While the documentation described the sandbox requirement, nothing enforced it.

These 6 improvements transform the command from "descriptive" to "prescriptive":
- **Descriptive**: "Create a sandbox" (suggestion, easy to skip)
- **Prescriptive**: "MANDATORY: Create sandbox. If you cannot get a sandbox ID, STOP" (enforced requirement)

### Edge Cases & Considerations

- **Offline Research**: If research agents fail, command continues with available results
- **Feature Dependencies**: Some features may depend on others - /sandbox feature handles this
- **Sandbox Timeouts**: Error recovery guidance helps users resume
- **Large Initiatives**: Progress checkpoints help track position in multi-feature work
- **Sub-command Failures**: Validation catches when delegation doesn't complete properly

### Future Enhancements (Not in this chore)

- Automatic state variable export/import for recovery
- Dashboard view of initiative progress
- Integration with GitHub project boards
- Automated documentation generation from research manifest
- Real-time collaboration in E2B sandbox

