# Bug Fix: Task Decompose Command Creating GitHub Issues When It Should Not

**Related Diagnosis**: #1675
**Severity**: medium
**Bug Type**: workflow/regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `alpha-task-decomposer` agent was not updated when the Alpha workflow design changed from GitHub-issue-based tracking to local semantic ID tracking
- **Fix Approach**: Remove GitHub issue creation from `alpha-task-decomposer.md` and replace with Spec issue commenting (follow feature-decompose pattern)
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha workflow underwent a design change where:
- **Old design**: Each level (spec, initiative, feature, tasks) created its own GitHub issue
- **New design**: Only the Spec creates a GitHub issue; everything else uses local semantic IDs (S#.I#, S#.I#.F#, S#.I#.F#.T#) and updates the Spec issue via comments

The `alpha-task-decomposer` agent (`.claude/agents/alpha/task-decomposer.md`) was NOT updated to follow this new pattern, causing it to create a GitHub issue for every feature's tasks when it should only comment on the parent Spec issue.

**Evidence**: 14 GitHub issues (#1660-#1673) were created for the S1656 spec, all labeled with `type:feature-tasks` and `alpha:tasks`.

### Solution Approaches Considered

#### Option 1: Follow Feature-Decompose Pattern ⭐ RECOMMENDED

**Description**: Remove GitHub issue creation from the task-decomposer agent and replace with a comment on the parent Spec issue, following the exact pattern used by the feature-decompose command.

**Pros**:
- Simple, surgical change - only remove problematic lines and add comment step
- Follows existing proven pattern from feature-decompose (lines 589-624 of feature-decompose.md)
- Consistent with workflow design across all decomposition levels
- No new infrastructure or scripts needed
- Low risk - purely removing code, not adding

**Cons**:
- None significant

**Risk Assessment**: low - Only removing outdated instructions and adding documented pattern

**Complexity**: simple - ~3 lines removed, ~10 lines added, no architectural changes

#### Option 2: Keep GitHub Issues but Update Documentation

**Description**: Keep the GitHub issue creation but update documentation to reflect this is the intended behavior.

**Why Not Chosen**: Violates the fundamental workflow design change. The other decomposition commands (initiative-decompose, feature-decompose) explicitly avoid creating GitHub issues. Creating task issues goes against the new semantic ID-based tracking system.

#### Option 3: Add Feature Flag for GitHub Issue Creation

**Description**: Add a flag to toggle GitHub issue creation on/off.

**Why Not Chosen**: Overcomplicates the fix. There's no legitimate use case for creating task issues in the new workflow. Keep it simple.

### Selected Solution: Follow Feature-Decompose Pattern

**Justification**: The feature-decompose command already implements the correct pattern (comment on Spec issue, no new GitHub issues). The task-decomposer should follow the same approach for consistency and correctness.

**Technical Approach**:
1. Remove Phase 7, Step 7.3 (lines 873-879) - Eliminate the `create-feature-tasks-issue.sh` call
2. Remove Phase 7, Step 7.5 (lines 896-915) - Remove the outdated Feature issue comment step
3. Add new phase/step - Comment on parent Spec issue with task decomposition summary
4. Update the JSON schema documentation (lines 856-859) - Change `"issues_created": false` comment to reflect new behavior
5. Update validation quick checks if they reference GitHub issue fields

**Architecture Changes**:
- **Zero architectural impact** - Just fixing outdated agent implementation
- No changes to the semantic ID system
- No changes to task structure
- No changes to feature/initiative decomposition

## Implementation Plan

### Affected Files

- `/.claude/agents/alpha/task-decomposer.md` - Remove GitHub issue creation, add Spec comment step (PRIMARY CHANGE)
- `.ai/alpha/scripts/create-feature-tasks-issue.sh` - Becomes unused (can document as deprecated)
- `.ai/alpha/templates/tasks.schema.json` - Update comments if references GitHub issue creation (if exists)

### New Files

No new files needed.

### Step-by-Step Tasks

**IMPORTANT**: Execute every step in order.

#### Step 1: Read Current Task-Decomposer Implementation

Read the current task-decomposer.md to understand the full context:

- Lines 873-879: The problematic GitHub issue creation step
- Lines 856-859: JSON schema showing `issues_created` and `feature_tasks_issue`
- Lines 896-915: The outdated Feature issue comment logic
- Understand the overall agent structure and phases

**Why this step first**: Need to fully understand current implementation before modifying

#### Step 2: Read Feature-Decompose Pattern as Template

Read the feature-decompose command to see the correct pattern:

- Lines 589-624: The correct approach to updating the Spec issue with decomposition progress
- Understand the comment format and information included
- Note that feature-decompose does NOT create GitHub issues

**Why this step**: Ensures we follow the exact same pattern that's already proven to work

#### Step 3: Remove GitHub Issue Creation Code

Edit `.claude/agents/alpha/task-decomposer.md`:

- **Remove lines 873-879** (Step 7.3: Create GitHub Issue section)
- **Remove lines 896-915** (Step 7.5: Link to Parent Feature Issue section)
- Keep the rest of Phase 7 intact (steps 7.1, 7.2, 7.4)
- Update phase/step numbering if needed after deletions

**What this accomplishes**: Eliminates the problematic code that creates GitHub issues

#### Step 4: Add Spec Issue Comment Step

Add a new step after Step 7.2 (Validate Dependencies) and before Step 7.4 (Create README):

This new Step 7.3 should:
- Follow the pattern from feature-decompose (lines 589-624)
- Create a comment on the parent Spec issue (not the feature issue)
- Include task decomposition summary:
  - Total task count
  - Task list with IDs and names
  - Dependencies visualization
  - Execution timeline (sequential vs parallel)
  - Next steps guidance
- Use semantic IDs (S#.I#.F#.T#) not GitHub issue numbers

**Format to follow**:
```bash
gh issue comment [SPEC_NUM] --repo "slideheroes/2025slideheroes" --body "## [Decomposition Update] Tasks for S[SPEC_NUM].I[INIT_NUM].F[FEAT_NUM]

Tasks have been decomposed as follows:

| ID | Task Name | Type | Hours | Dependencies |
|---|---|---|---|---|
| S[SPEC].I[INIT].F[FEAT].T1 | Task Name | implementation | 4 | None |
| S[SPEC].I[INIT].F[FEAT].T2 | Task Name | test | 2 | T1 |

...
_Decomposed on $(date +%Y-%m-%d) by /alpha:task-decompose_"
```

**What this accomplishes**: Replaces GitHub issue creation with Spec issue commenting

#### Step 5: Update JSON Schema Documentation

Edit the JSON output documentation (around lines 856-859):

Change from:
```json
"github": {
  "issues_created": false,
  "feature_tasks_issue": null
}
```

To a comment explaining that GitHub issues are no longer created at task level (keep the fields for backward compatibility but mark as deprecated).

**What this accomplishes**: Documents the correct behavior

#### Step 6: Verify Consistency

Check that the updated task-decomposer.md is consistent with:
- feature-decompose.md approach (no new GitHub issues)
- initiative-decompose.md approach (no new GitHub issues)
- The Alpha workflow design documentation

**What this accomplishes**: Ensures consistency across all decomposition commands

#### Step 7: Create Validation Test

Create a simple verification that the fix works:

```bash
# After fix is applied, verify that:
# 1. No create-feature-tasks-issue.sh call exists
grep -n "create-feature-tasks-issue.sh" .claude/agents/alpha/task-decomposer.md
# Should return: (no matches)

# 2. Spec issue comment step exists
grep -n "gh issue comment" .claude/agents/alpha/task-decomposer.md
# Should find the new comment step
```

**What this accomplishes**: Confirms the fix is properly applied

## Testing Strategy

### Unit Tests

No unit tests needed (this is CLI/agent documentation, not code).

### Integration Tests

Manual testing with the Alpha workflow:

**Test Case 1: Task Decomposition No Longer Creates Issues**

Steps:
1. Create a new spec using `/alpha:spec`
2. Decompose into initiatives using `/alpha:initiative-decompose S#`
3. Decompose into features using `/alpha:feature-decompose S#.I#`
4. Run `/alpha:task-decompose S#.I#.F#`
5. Verify NO new GitHub issues are created
6. Verify the parent Spec issue was commented with task decomposition summary
7. Verify `tasks.json` is created with correct structure

**Expected Result**:
- ✅ No new GitHub issues (#XXXX-#YYYY pattern)
- ✅ Comment appears on Spec issue with task summary
- ✅ `tasks.json` file created in feature directory
- ✅ Semantic IDs used (S#.I#.F#.T#), not issue numbers

**Test Case 2: Consistency Across All Decomposition Levels**

Steps:
1. Verify initiative-decompose doesn't create issues (should comment on Spec)
2. Verify feature-decompose doesn't create issues (should comment on Spec)
3. Verify task-decompose doesn't create issues (should comment on Spec)
4. All three should use Spec issue for status updates

**Expected Result**: All three commands follow the same pattern

### Manual Testing Checklist

Before considering the fix complete:

- [ ] Read and understand the root cause in diagnosis #1675
- [ ] Verify the feature-decompose.md pattern (lines 589-624)
- [ ] Remove GitHub issue creation code from task-decomposer.md
- [ ] Add Spec issue comment step following feature-decompose pattern
- [ ] Update JSON schema documentation
- [ ] Search for any other references to feature task issues (grep for "feature_tasks_issue")
- [ ] Test task decomposition doesn't create new GitHub issues
- [ ] Verify Spec issue receives comment with task summary
- [ ] Check that semantic IDs are used (S#.I#.F#.T#), not issue numbers
- [ ] Verify no regression: existing features still decompose correctly

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Breaking Existing Workflows**: If someone was relying on task GitHub issues being created
   - **Likelihood**: low - The new design explicitly removed this feature
   - **Impact**: low - Old issues remain, just no new ones created
   - **Mitigation**: This is the intended behavior; no workaround needed

2. **Incomplete Task Comment**: If the new Spec issue comment is malformed
   - **Likelihood**: medium - need to test the gh comment syntax
   - **Impact**: low - easy to re-run command
   - **Mitigation**: Thorough testing of Spec comment step before deployment

3. **Backward Compatibility**: Existing tasks.json files with GitHub issue numbers
   - **Likelihood**: low - JSON structure unchanged, just not populated
   - **Impact**: low - legacy data doesn't break new runs
   - **Mitigation**: Document that `feature_tasks_issue` field is deprecated

**Rollback Plan**:

If issues arise from this fix:

1. Revert `.claude/agents/alpha/task-decomposer.md` to previous version
2. Clear out the 14 incorrectly-created task issues (#1660-#1673)
3. Re-run task decomposition if needed
4. Investigate any actual workflow impact

No data loss or system damage possible - this is purely removing incorrect GitHub issue creation.

## Performance Impact

**Expected Impact**: none

This change has zero performance implications:
- Removes an external GitHub API call (actually improves performance slightly)
- Local file operations unchanged
- No computational complexity changes

## Security Considerations

**Security Impact**: none

- No changes to authentication or authorization
- No changes to data handling
- No changes to sensitive operations

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Count the GitHub issues that were incorrectly created
gh issue list --repo slideheroes/2025slideheroes \
  --search "Feature Tasks" --label type:feature-tasks

# Expected Result: Shows issues #1660-#1673 (14 issues that shouldn't exist)
```

### After Fix (Bug Should Be Resolved)

```bash
# Verify the problematic code is removed
grep -n "create-feature-tasks-issue.sh" .claude/agents/alpha/task-decomposer.md

# Expected Result: No matches (code removed)

# Verify Spec comment step was added
grep -n "gh issue comment.*Spec" .claude/agents/alpha/task-decomposer.md

# Expected Result: Finds the new comment step

# Run a test decomposition (requires active spec/initiative/feature)
/alpha:task-decompose S#.I#.F#

# Expected Results:
# - No new GitHub issue created
# - Spec issue #NNN receives a comment about task decomposition
# - tasks.json created in feature directory
# - No errors in command output
```

### Regression Prevention

```bash
# Verify consistency across all decomposition commands
grep -n "create.*issue\|gh issue create" \
  .claude/commands/alpha/initiative-decompose.md \
  .claude/commands/alpha/feature-decompose.md \
  .claude/agents/alpha/task-decomposer.md

# Expected Result: No matches (no GitHub issue creation anywhere)

# Verify all use Spec comment pattern
grep -n "gh issue comment.*SPEC" \
  .claude/commands/alpha/initiative-decompose.md \
  .claude/commands/alpha/feature-decompose.md \
  .claude/agents/alpha/task-decomposer.md

# Expected Result: All three commands use Spec issue comments
```

## Dependencies

### New Dependencies

No new dependencies required.

### Modified Dependencies

- `.claude/agents/alpha/task-decomposer.md` - already exists, just updating instructions

## Database Changes

**No database changes required** - This is a CLI/workflow fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained

The change is purely removing incorrect behavior. No data structure changes, no breaking changes to the workflow.

## Success Criteria

The fix is complete when:

- [ ] Lines 873-879 (GitHub issue creation) removed from task-decomposer.md
- [ ] Lines 896-915 (outdated Feature issue comment) removed from task-decomposer.md
- [ ] New Spec issue comment step added following feature-decompose pattern
- [ ] JSON schema documentation updated to reflect correct behavior
- [ ] No grep matches for "create-feature-tasks-issue.sh" in task-decomposer.md
- [ ] Task decomposition tested - no new GitHub issues created
- [ ] Spec issue receives task decomposition summary comment
- [ ] Semantic IDs used throughout (S#.I#.F#.T#), not issue numbers
- [ ] Consistency verified across all decomposition commands
- [ ] No regressions in existing feature decompositions

## Notes

**Related Diagnosis**: The diagnosis issue (#1675) contains comprehensive analysis of the root cause, affected code, and supporting evidence. Refer to it for detailed context.

**Pattern Reference**: The feature-decompose command (`.claude/commands/alpha/feature-decompose.md`, lines 589-624) provides the exact pattern to follow for Spec issue commenting.

**Workflow Design**: The Alpha workflow design moved from GitHub-issue-per-level to local semantic ID tracking with comments on the Spec issue. This fix ensures the task-decomposer aligns with this design.

**Legacy Data**: The 14 incorrectly-created task issues (#1660-#1673) can remain open for reference but should not be created going forward.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1675*
