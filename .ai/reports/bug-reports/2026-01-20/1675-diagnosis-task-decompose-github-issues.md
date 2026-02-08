# Bug Diagnosis: Task Decompose Command Creating GitHub Issues

**ID**: ISSUE-1675
**Created**: 2026-01-20T22:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The `/alpha:task-decompose` command (and its delegated `alpha-task-decomposer` agent) is creating GitHub issues for each feature's tasks, which violates the current Alpha workflow design. According to the updated workflow documentation, only the Spec document should have a GitHub issue - initiatives, features, and tasks should be tracked locally using semantic IDs (S#.I#.F#.T#).

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: v22.x
- **Alpha Workflow Version**: Current (with semantic IDs)
- **Last Working**: Never (design changed, code not updated)

## Reproduction Steps

1. Create a spec using `/alpha:spec`
2. Decompose into initiatives using `/alpha:initiative-decompose S#`
3. Decompose into features using `/alpha:feature-decompose S#.I#`
4. Run `/alpha:task-decompose S#.I#.F#` or `/alpha:task-decompose S#.I#`
5. Observe that GitHub issues are created for each feature's tasks

## Expected Behavior

Task decomposition should:
1. Create `tasks.json` file in the feature directory
2. Update the parent Spec's GitHub issue with a comment showing decomposition progress
3. **NOT** create any new GitHub issues for tasks

## Actual Behavior

Task decomposition:
1. Creates `tasks.json` file (correct)
2. Creates a new GitHub issue titled "Tasks: [Feature Name] [#S#.I#.F#]" (incorrect)
3. Updates `tasks.json` with `github.issues_created: true` and `github.feature_tasks_issue: <number>` (incorrect)

Evidence: 14 GitHub issues (#1660-#1673) were created for the S1656 spec, all labeled with `type:feature-tasks` and `alpha:tasks`.

## Diagnostic Data

### Files Analyzed

1. **`.claude/commands/alpha/task-decompose.md`** (lines relevant to issue):
   - Lines 153-162: The command expects no GitHub issue creation per design
   - The command delegates to `alpha-task-decomposer` agent

2. **`.claude/agents/alpha/task-decomposer.md`** (ROOT CAUSE):
   - Lines 873-879: Contains explicit instruction to create GitHub issues:
     ```
     ### Step 7.3: Create GitHub Issue

     Run the issue creation script:

     ```bash
     .ai/alpha/scripts/create-feature-tasks-issue.sh ${FEAT_DIR}/tasks.json
     ```
     ```
   - Lines 896-915: Contains instructions to link to "parent Feature issue" (which doesn't exist in the new design)

3. **Comparison with other workflow commands**:
   - `.claude/commands/alpha/initiative-decompose.md` lines 499-532: Correctly comments on Spec issue instead of creating new issues
   - `.claude/commands/alpha/feature-decompose.md` lines 589-624: Correctly comments on Spec issue instead of creating new issues

### Evidence from tasks.json

```json
"github": {
  "issues_created": true,
  "feature_tasks_issue": 1660
}
```

This JSON structure in `.ai/alpha/specs/S1656-Spec-user-dashboard/S1656.I1-Initiative-dashboard-foundation/S1656.I1.F1-Feature-dashboard-page-grid/tasks.json` shows the agent is creating issues.

### GitHub CLI Query

```bash
gh issue list --repo slideheroes/2025slideheroes --search "Feature Tasks" --limit 20
```

Returns 14 issues (#1660-#1673) all created by the task-decompose workflow.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `alpha-task-decomposer` agent definition was not updated when the Alpha workflow design changed from GitHub-issue-based tracking to local semantic ID tracking.

**Detailed Explanation**:
The Alpha workflow underwent a design change where:
- **Old design**: Each level (spec, initiative, feature, tasks) created its own GitHub issue
- **New design**: Only the Spec creates a GitHub issue; everything else uses local semantic IDs (S#.I#, S#.I#.F#, S#.I#.F#.T#) and updates the Spec issue via comments

The other workflow commands (initiative-decompose, feature-decompose) were updated to follow the new pattern:
- They create local directories with semantic IDs
- They comment on the parent Spec issue with decomposition progress
- They do NOT create individual GitHub issues

However, the `alpha-task-decomposer` agent (`.claude/agents/alpha/task-decomposer.md`) was NOT updated:
- Phase 7, Step 7.3 (lines 873-879) still contains instructions to run `create-feature-tasks-issue.sh`
- Phase 7, Step 7.5 (lines 896-915) references "parent Feature issue" which doesn't exist in the new design
- The agent's json output structure includes `github.issues_created` and `github.feature_tasks_issue` fields

**Supporting Evidence**:
1. The initiative-decompose command (lines 499-532) shows the correct pattern: comment on Spec issue
2. The feature-decompose command (lines 589-624) shows the correct pattern: comment on Spec issue
3. The task-decomposer agent (lines 873-879) shows the incorrect pattern: create new GitHub issue

### How This Causes the Observed Behavior

1. User runs `/alpha:task-decompose S1656.I1.F1`
2. Command delegates to `alpha-task-decomposer` agent
3. Agent executes Phase 7, Step 7.3: runs `create-feature-tasks-issue.sh`
4. Script creates GitHub issue #1660 titled "Tasks: Dashboard Page & Grid Layout [#S1656.I1.F1]"
5. Agent updates `tasks.json` with issue number
6. This repeats for every feature decomposed

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The code explicitly instructs creating GitHub issues (line 878: `create-feature-tasks-issue.sh`)
2. The expected behavior is documented in the other workflow commands (initiative-decompose, feature-decompose)
3. The evidence (14 task issues created) matches exactly what the code would produce
4. The workflow design documentation (`.ai/alpha/docs/alpha-implementation-system.md`) confirms only Spec should have GitHub issue

## Fix Approach (High-Level)

Remove GitHub issue creation from the `alpha-task-decomposer` agent and replace with Spec issue commenting:

1. **Remove Phase 7, Step 7.3** (lines 873-879) - Remove the GitHub issue creation step
2. **Replace Phase 7, Step 7.5** (lines 896-915) - Change "link to parent Feature issue" to "comment on parent Spec issue"
3. **Update JSON schema** - Remove or mark as deprecated the `github.issues_created` and `github.feature_tasks_issue` fields
4. **Add Spec comment step** - Add a step to comment on the Spec issue (pattern from feature-decompose.md lines 589-624)

## Diagnosis Determination

The root cause is conclusively identified: the `alpha-task-decomposer` agent contains outdated instructions that create GitHub issues, while the workflow design has moved to local-only tracking with Spec issue comments.

## Additional Context

### Files Requiring Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `.claude/agents/alpha/task-decomposer.md` | Edit | Remove GitHub issue creation, add Spec comment |
| `.ai/alpha/scripts/create-feature-tasks-issue.sh` | Optional | Consider deprecating or documenting as legacy |
| `.ai/alpha/templates/tasks.schema.json` | Optional | Update `github` section to be optional/removed |

### Related Documentation

- `.ai/alpha/docs/alpha-implementation-system.md` - Authoritative workflow design
- `.ai/alpha/docs/hierarchical-ids.md` - Semantic ID system documentation

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash, Grep*
