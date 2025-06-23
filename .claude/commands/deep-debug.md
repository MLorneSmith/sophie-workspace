# Deep Debug Orchestrator

**Orchestrates the 3-phase deep debugging workflow by automatically determining the current phase and routing to the appropriate workflow.**

## Overview

This command intelligently determines where you are in the debugging process and routes you to the appropriate phase:

- **Phase 1**: Investigation & Research (if no GitHub issue exists or investigation incomplete)
- **Phase 2**: Root Cause Analysis & Solution Design (if investigation complete but no solution designed)
- **Phase 3**: Implementation & Verification (if solution designed but not implemented)

## Usage

```
/deep-debug [issue-number] [description]
```

**Parameters:**

- `issue-number` (optional): GitHub issue number if one exists
- `description` (optional): Brief description of the issue if no GitHub issue exists

## Phase Detection Logic

The orchestrator follows this decision tree:

1. **Check for existing GitHub issue**

   - If issue-number provided: Analyze issue state and labels
   - If no issue-number: Proceed to Phase 1 (Investigation)

2. **Analyze issue state and labels**

   - `deep-debug-phase-1-complete` label present → Phase 2
   - `deep-debug-phase-2-complete` label present → Phase 3
   - `deep-debug-phase-3-complete` label present → Issue complete, ask for confirmation
   - No deep-debug labels → Phase 1

3. **Route to appropriate phase workflow**

## Workflow Routing

### Phase 1: Investigation & Research

**When to use:**

- New issue without GitHub tracking
- Existing issue without investigation labels
- User requests fresh investigation

**Actions:**

- Load `.claude/workflows/deep-debug/deep-debug-phase-1.md`
- Load `.claude/context/roles/qa-testing-engineer.md`
- Begin comprehensive investigation

### Phase 2: Root Cause Analysis & Solution Design

**When to use:**

- Issue has `deep-debug-phase-1-complete` label
- Investigation findings documented
- Root cause analysis needed

**Actions:**

- Load `.claude/workflows/deep-debug/deep-debug-phase-2.md`
- Load `.claude/context/roles/systems-architect-engineer.md`
- Begin solution design process

### Phase 3: Implementation & Verification

**When to use:**

- Issue has `deep-debug-phase-2-complete` label
- Solution architecture documented
- Ready for implementation

**Actions:**

- Load `.claude/workflows/deep-debug/deep-debug-phase-3.md`
- Load `.claude/context/roles/remediation-engineer.md`
- Begin implementation process

## Implementation

When you run `/deep-debug`, I will:

1. **Determine Current Phase**

   ```typescript
   // If issue number provided
   if (issueNumber) {
     const issue = await getGitHubIssue(issueNumber);
     const phase = determinePhaseFromLabels(issue.labels);
     return routeToPhase(phase, issueNumber);
   }

   // If no issue number, start Phase 1
   return routeToPhase(1, null);
   ```

2. **Load Appropriate Workflow and Role**

   ```typescript
   const workflows = {
     1: '.claude/workflows/deep-debug/deep-debug-phase-1.md',
     2: '.claude/workflows/deep-debug/deep-debug-phase-2.md',
     3: '.claude/workflows/deep-debug/deep-debug-phase-3.md',
   };

   const roles = {
     1: '.claude/context/roles/qa-testing-engineer.md',
     2: '.claude/context/roles/systems-architect-engineer.md',
     3: '.claude/context/roles/remediation-engineer.md',
   };
   ```

3. **Execute Phase Workflow**
   - Load the role context
   - Load the workflow instructions
   - Execute the phase-specific process
   - Update GitHub issue with progress

## Example Usage

### New Issue

```
/deep-debug "Application crashes when uploading large files"
```

→ Routes to Phase 1 (Investigation & Research)

### Existing Issue

```
/deep-debug 123
```

→ Analyzes GitHub issue #123 labels and routes to appropriate phase

### Force Specific Phase

```
/deep-debug 123 --force-phase 2
```

→ Forces routing to Phase 2 regardless of current state

## Error Handling

- **Invalid issue number**: Prompt user to verify or start new investigation
- **Missing labels**: Default to Phase 1 with warning
- **Completed workflow**: Ask user if they want to restart or add additional investigation
- **Permission issues**: Guide user through authentication setup

## Phase Transition Verification

Before transitioning between phases, the orchestrator verifies:

- **Phase 1 → 2**: Investigation report exists, findings documented
- **Phase 2 → 3**: Solution architecture complete, implementation plan ready
- **Phase 3 → Complete**: All tests passing, documentation updated

## State Management

The orchestrator maintains state through GitHub issue labels:

- `deep-debug-active`: Debugging workflow in progress
- `deep-debug-phase-1-complete`: Investigation phase complete
- `deep-debug-phase-2-complete`: Solution design phase complete
- `deep-debug-phase-3-complete`: Implementation phase complete
- `deep-debug-verified`: All phases complete and verified

## Integration with Existing Workflows

This orchestrator enhances the existing debugging commands:

- **`/log-issue`**: For simple issues (unchanged)
- **`/debug-issue`**: For straightforward debugging (unchanged)
- **`/deep-debug`**: For complex, multi-phase investigations (new)

## Advanced Features

### Issue Clustering

When multiple related issues exist, the orchestrator can:

- Identify patterns across issues
- Suggest consolidation opportunities
- Link related debugging efforts

### Progress Tracking

- Visual progress indicators in GitHub issues
- Estimated time remaining per phase
- Milestone tracking and reporting

### Rollback Support

- Ability to restart any phase
- Preserve previous work in issue comments
- Version control for debugging artifacts
