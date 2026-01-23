# Chore: Add Orchestrator Debugging Tooling

## Chore Description

Add two complementary debugging tools to accelerate orchestrator development and testing:

1. **Option A: Debug Spec (S9999)** - A minimal spec with 1 initiative, 1 feature, and 2 trivial tasks that completes in ~5 minutes. This tests the full end-to-end workflow naturally, revealing bugs in the actual completion flow.

2. **Option B: `--skip-to-completion` Flag** - A CLI flag that bypasses the work loop and jumps directly to the completion sequence (review sandbox creation, dev server startup, summary output, UI exit handling). This enables rapid iteration (~30 seconds) when debugging post-completion logic.

**Context**: The current spec takes ~1 hour to complete, making it impractical to debug the completion sequence. These tools address different debugging needs:
- Option B for rapid iteration on completion code
- Option A for end-to-end validation after fixes

## Relevant Files

### Orchestrator Core Files
- `.ai/alpha/scripts/spec-orchestrator.ts` - Main entry point, parses CLI args
- `.ai/alpha/scripts/cli/index.ts` - CLI argument parsing (`parseArgs()`) and help text (`showHelp()`)
- `.ai/alpha/scripts/types/orchestrator.types.ts` - `OrchestratorOptions` interface definition
- `.ai/alpha/scripts/lib/orchestrator.ts` - Main orchestration logic, completion sequence at lines 1467-1623

### Debug Spec Files (New)
- `.ai/alpha/specs/S9999-Spec-debug-completion/spec.md` - Debug spec document
- `.ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/initiative.md` - Single initiative
- `.ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/S9999.I1.F1-Feature-trivial-task/feature.md` - Single feature
- `.ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/S9999.I1.F1-Feature-trivial-task/tasks.json` - 2 trivial tasks

### Reference Files
- `.ai/alpha/templates/spec.md` - Spec template structure
- `.ai/alpha/templates/feature.md` - Feature template structure
- `.ai/alpha/specs/S1692-Spec-user-dashboard/S1692.I1-Initiative-dashboard-foundation/S1692.I1.F1-Feature-dashboard-page-shell/tasks.json` - Example tasks.json structure

## Impact Analysis

### Dependencies Affected
- **CLI parsing module** (`cli/index.ts`): New flag added
- **Type definitions** (`types/orchestrator.types.ts`): New boolean option
- **Orchestrator logic** (`lib/orchestrator.ts`): Conditional skip of work loop
- **No external dependencies affected**

### Risk Assessment
**Low Risk**:
- Changes are additive (new flag, new spec)
- No existing functionality modified
- Debug tooling doesn't affect production code paths
- Easy to verify: flag doesn't exist = no behavior change

### Backward Compatibility
- Fully backward compatible
- No breaking changes
- New flag is opt-in only
- Debug spec is isolated in its own directory

## Pre-Chore Checklist
Before starting implementation:
- [ ] Create feature branch: `chore/orchestrator-debug-tooling`
- [ ] Review existing CLI flags in `cli/index.ts` for consistency
- [ ] Confirm S9999 spec ID is not in use
- [ ] Understand completion sequence at `orchestrator.ts:1467-1623`

## Documentation Updates Required
- Update CLI help text in `.ai/alpha/scripts/cli/index.ts`
- Add debug spec to `.ai/alpha/docs/alpha-implementation-system.md` under a "Debugging" section
- No external documentation needed (internal tooling only)

## Rollback Plan
- **Option B (flag)**: Revert the 4 file changes (cli, types, orchestrator, help)
- **Option A (spec)**: Delete the `S9999-Spec-debug-completion/` directory
- No database migrations or persistent state changes
- Git revert is sufficient for complete rollback

## Step by Step Tasks

### Step 1: Add `skipToCompletion` to OrchestratorOptions Interface

Update the TypeScript interface to include the new option:

- Edit `.ai/alpha/scripts/types/orchestrator.types.ts`
- Add `skipToCompletion: boolean` to `OrchestratorOptions` interface at line ~108
- Add JSDoc comment explaining the purpose

```typescript
export interface OrchestratorOptions {
  specId: number;
  sandboxCount: number;
  timeout: number;
  dryRun: boolean;
  forceUnlock: boolean;
  skipDbReset: boolean;
  skipDbSeed: boolean;
  ui: boolean;
  minimalUi: boolean;
  reset: boolean;
  /** Skip work loop and jump to completion sequence (for debugging) */
  skipToCompletion: boolean;
}
```

### Step 2: Add CLI Flag Parsing

Update the argument parser to handle the new flag:

- Edit `.ai/alpha/scripts/cli/index.ts`
- Add `skipToCompletion: false` to default options in `parseArgs()` (around line 35)
- Add flag parsing for `--skip-to-completion` in the for loop (around line 66)
- Update help text in `showHelp()` to document the new flag

```typescript
// In parseArgs():
const options: OrchestratorOptions = {
  // ... existing options
  skipToCompletion: false,
};

// In the for loop:
} else if (arg === "--skip-to-completion") {
  options.skipToCompletion = true;
}
```

### Step 3: Implement Skip-to-Completion Logic in Orchestrator

Update the main orchestration flow to conditionally skip the work loop:

- Edit `.ai/alpha/scripts/lib/orchestrator.ts`
- Add skip logic around line 1450-1452 (just before `runWorkLoop` call)
- Mark all features as completed when skipping
- Update progress counters to reflect "completion"
- Ensure proper logging to indicate debug mode

```typescript
// Around line 1450, before runWorkLoop:
if (options.skipToCompletion) {
  log("⏭️  DEBUG MODE: Skipping work loop (--skip-to-completion)");
  log("   Marking all features as completed for testing...");

  // Mark all pending/in_progress features as completed
  for (const feature of manifest.feature_queue) {
    if (feature.status !== "completed" && feature.status !== "failed") {
      feature.status = "completed";
      feature.tasks_completed = feature.task_count;
    }
  }

  // Update progress counters
  manifest.progress.features_completed = manifest.feature_queue.filter(
    f => f.status === "completed"
  ).length;
  manifest.progress.tasks_completed = manifest.feature_queue.reduce(
    (sum, f) => sum + (f.status === "completed" ? f.task_count : 0), 0
  );

  // Update initiative statuses
  for (const initiative of manifest.initiatives) {
    const initFeatures = manifest.feature_queue.filter(
      f => f.initiative_id === initiative.id
    );
    const completedCount = initFeatures.filter(f => f.status === "completed").length;
    initiative.features_completed = completedCount;
    if (completedCount === initiative.feature_count) {
      initiative.status = "completed";
    }
  }
  manifest.progress.initiatives_completed = manifest.initiatives.filter(
    i => i.status === "completed"
  ).length;

  saveManifest(manifest);
} else {
  // Normal work loop
  await runWorkLoop(instances, manifest, options.ui, options.timeout, runId);
}
```

### Step 4: Create Debug Spec Directory Structure

Create the minimal debug spec for end-to-end testing:

- Create directory: `.ai/alpha/specs/S9999-Spec-debug-completion/`
- Create initiative directory: `S9999.I1-Initiative-debug/`
- Create feature directory: `S9999.I1.F1-Feature-trivial-task/`

### Step 5: Create Debug Spec Document

Create `.ai/alpha/specs/S9999-Spec-debug-completion/spec.md` with minimal content:

```markdown
# Project Specification: Debug Completion Workflow

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S9999 |
| **GitHub Issue** | N/A (Internal Debug Tool) |
| **Document Owner** | Developer |
| **Created** | 2026-01-22 |
| **Status** | Active |
| **Version** | 1.0 |

---

## 1. Executive Summary

### One-Line Description
Minimal spec for debugging the orchestrator's completion sequence.

### Purpose
This spec contains trivial tasks that complete quickly (~2 minutes), enabling:
1. Rapid testing of completion flow (review sandbox, dev server, summary)
2. End-to-end validation of orchestrator changes
3. Debugging without waiting for full spec execution (~1 hour)

---

## 2. Scope Definition

### In Scope
- [x] 1 initiative with 1 feature
- [x] 2 trivial tasks (create empty files)
- [x] Completes in <5 minutes total

### Out of Scope
- Actual feature implementation
- Database operations
- Complex dependencies

---

## 3. Key Capabilities

1. **Trivial Task Execution**: Simple file creation to verify task flow
2. **Fast Completion**: Enables rapid debugging iteration

---

## 10. Decomposition Hints

### Candidate Initiatives
1. **Debug Initiative** (I1): Single initiative with trivial feature

### Suggested Priority Order
I1 only - no dependencies

### Complexity Indicators
| Area | Complexity | Rationale |
|------|------------|-----------|
| Tasks | Minimal | File creation only |
| Dependencies | None | No inter-task deps |
```

### Step 6: Create Debug Initiative Document

Create `.ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/initiative.md`:

```markdown
# Initiative: Debug Workflow

## Initiative Metadata
| Field | Value |
|-------|-------|
| **Initiative ID** | S9999.I1 |
| **Initiative Name** | Debug Workflow |
| **Priority** | 1 |
| **Status** | Ready |

## Overview
Single initiative for debugging orchestrator completion sequence.

## Features
1. **F1: Trivial Task** - Creates empty marker files to verify task execution

## Dependencies
None - standalone initiative.

## Success Criteria
- Tasks complete without errors
- Files are created in sandbox
- Completion sequence executes
```

### Step 7: Create Debug Feature Document

Create `.ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/S9999.I1.F1-Feature-trivial-task/feature.md`:

```markdown
# Feature: Trivial Task for Debug

## Feature Metadata
| Field | Value |
|-------|-------|
| **Feature ID** | S9999.I1.F1 |
| **Feature Name** | Trivial Task |
| **Priority** | 1 |
| **Initiative** | S9999.I1 |

## Overview
Creates two empty marker files to verify task execution flow.

## Tasks
1. T1: Create first marker file
2. T2: Create second marker file

## Acceptance Criteria
- Both marker files exist after completion
- TypeScript check passes (no changes to verify)
```

### Step 8: Create Debug Tasks JSON

Create `.ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/S9999.I1.F1-Feature-trivial-task/tasks.json`:

```json
{
  "$schema": "../../../../templates/tasks.schema.json",
  "metadata": {
    "feature_id": "S9999.I1.F1",
    "feature_name": "Trivial Task for Debug",
    "feature_slug": "trivial-task",
    "initiative_id": "S9999.I1",
    "spec_id": 9999,
    "created_at": "2026-01-22T00:00:00Z",
    "complexity": {
      "score": 1,
      "level": "MINIMAL",
      "target_steps": { "min": 1, "max": 2 }
    },
    "requires_database": false,
    "database_tasks": [],
    "requires_ui": false,
    "ui_tasks": []
  },
  "tasks": [
    {
      "id": "S9999.I1.F1.T1",
      "type": "task",
      "name": "Create first marker file",
      "action": {
        "verb": "Create",
        "target": "debug marker file 1"
      },
      "purpose": "Verify task execution by creating a simple marker file",
      "status": "draft",
      "estimated_hours": 0.1,
      "priority": 1,
      "group": 1,
      "requires_database": false,
      "requires_ui": false,
      "context": {
        "files": [],
        "dependencies": [],
        "constraints": [
          "Create file in temp directory",
          "File should contain timestamp"
        ]
      },
      "input_state": "No marker file exists",
      "output_state": "Marker file created with timestamp",
      "acceptance_criterion": "File /tmp/debug-marker-1.txt exists",
      "verification_command": "test -f /tmp/debug-marker-1.txt && echo 'Marker 1 exists'",
      "outputs": [
        {
          "type": "new",
          "path": "/tmp/debug-marker-1.txt",
          "description": "Debug marker file 1"
        }
      ],
      "dependencies": {
        "blocked_by": [],
        "blocks": ["S9999.I1.F1.T2"]
      },
      "m1_checks": {
        "single_verb": true,
        "no_conjunctions": true,
        "under_8_hours": true,
        "under_750_tokens": true,
        "binary_done_state": true,
        "max_3_files": true
      }
    },
    {
      "id": "S9999.I1.F1.T2",
      "type": "task",
      "name": "Create second marker file",
      "action": {
        "verb": "Create",
        "target": "debug marker file 2"
      },
      "purpose": "Verify sequential task execution",
      "status": "draft",
      "estimated_hours": 0.1,
      "priority": 2,
      "group": 1,
      "requires_database": false,
      "requires_ui": false,
      "context": {
        "files": ["/tmp/debug-marker-1.txt"],
        "dependencies": [],
        "constraints": [
          "Create file in temp directory",
          "File should contain timestamp and reference to marker 1"
        ]
      },
      "input_state": "Marker 1 exists",
      "output_state": "Marker 2 created, feature complete",
      "acceptance_criterion": "File /tmp/debug-marker-2.txt exists",
      "verification_command": "test -f /tmp/debug-marker-2.txt && echo 'Marker 2 exists'",
      "outputs": [
        {
          "type": "new",
          "path": "/tmp/debug-marker-2.txt",
          "description": "Debug marker file 2"
        }
      ],
      "dependencies": {
        "blocked_by": ["S9999.I1.F1.T1"],
        "blocks": []
      },
      "m1_checks": {
        "single_verb": true,
        "no_conjunctions": true,
        "under_8_hours": true,
        "under_750_tokens": true,
        "binary_done_state": true,
        "max_3_files": true
      }
    }
  ],
  "execution": {
    "groups": [
      {
        "id": 1,
        "name": "Marker Creation",
        "task_ids": ["S9999.I1.F1.T1", "S9999.I1.F1.T2"],
        "depends_on_groups": [],
        "estimated_hours": 0.2,
        "parallel_hours": 0.2
      }
    ],
    "critical_path": {
      "task_ids": ["S9999.I1.F1.T1", "S9999.I1.F1.T2"],
      "total_hours": 0.2
    },
    "duration": {
      "sequential": 0.2,
      "parallel": 0.2,
      "time_saved_percent": 0
    }
  },
  "validation": {
    "discriminator_verdict": "APPROVED",
    "scores": {
      "completeness": 100,
      "atomicity": 100,
      "dependencies": 100,
      "state_flow": 100,
      "testability": 100
    },
    "dependency_checks": {
      "no_cycles": true,
      "all_documented": true,
      "spikes_first": true,
      "critical_path_valid": true
    },
    "m1_compliance": 100
  },
  "github": {
    "issues_created": false,
    "spec_issue_commented": false
  }
}
```

### Step 9: Update CLI Help Text

Ensure the new flag is documented in the help output:

- Edit `.ai/alpha/scripts/cli/index.ts` in `showHelp()` function
- Add documentation for `--skip-to-completion` flag
- Add example usage

Add to Options section:
```
  --skip-to-completion  Skip work loop, jump to completion (debugging)
```

Add to Examples section:
```
  tsx spec-orchestrator.ts 9999                     # Run debug spec
  tsx spec-orchestrator.ts 1362 --skip-to-completion  # Debug completion sequence
```

### Step 10: Run Validation Commands

Execute every command to validate the chore is complete with zero regressions:

```bash
# Verify TypeScript compiles without errors
pnpm typecheck

# Verify linting passes
pnpm lint

# Verify the CLI help shows the new flag
cd .ai/alpha/scripts && tsx spec-orchestrator.ts --help | grep -q "skip-to-completion"

# Verify debug spec directory exists with required files
test -f .ai/alpha/specs/S9999-Spec-debug-completion/spec.md
test -f .ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/initiative.md
test -f .ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/S9999.I1.F1-Feature-trivial-task/feature.md
test -f .ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/S9999.I1.F1-Feature-trivial-task/tasks.json

# Verify tasks.json is valid JSON
jq empty .ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/S9999.I1.F1-Feature-trivial-task/tasks.json

# Dry run the debug spec to verify manifest generation
cd .ai/alpha/scripts && tsx spec-orchestrator.ts 9999 --dry-run

# Verify skip-to-completion flag is recognized (should not error)
cd .ai/alpha/scripts && tsx spec-orchestrator.ts 9999 --skip-to-completion --dry-run
```

## Validation Commands

Execute every command to validate the chore is complete with zero regressions:

```bash
# TypeScript compilation
pnpm typecheck

# Linting
pnpm lint

# Format check
pnpm format

# Verify CLI help includes new flag
cd .ai/alpha/scripts && tsx spec-orchestrator.ts --help 2>&1 | grep -q "skip-to-completion" && echo "✅ Flag documented in help"

# Verify debug spec structure
ls -la .ai/alpha/specs/S9999-Spec-debug-completion/

# Verify tasks.json is valid
jq . .ai/alpha/specs/S9999-Spec-debug-completion/S9999.I1-Initiative-debug/S9999.I1.F1-Feature-trivial-task/tasks.json > /dev/null && echo "✅ tasks.json valid"

# Dry run with debug spec
cd .ai/alpha/scripts && tsx spec-orchestrator.ts 9999 --dry-run --no-ui

# Test skip-to-completion flag parsing (dry-run prevents actual execution)
cd .ai/alpha/scripts && tsx spec-orchestrator.ts 9999 --skip-to-completion --dry-run --no-ui
```

## Notes

### Usage Examples

**Debug the completion sequence rapidly:**
```bash
# Use --skip-to-completion for instant completion (30 seconds)
tsx spec-orchestrator.ts 1692 --skip-to-completion -s 1

# This will:
# 1. Create 1 sandbox
# 2. Skip the work loop entirely
# 3. Mark all features as completed
# 4. Execute the full completion sequence:
#    - Create review sandbox
#    - Start dev server
#    - Generate review URLs
#    - Print summary
#    - Wait for UI exit
```

**Validate with end-to-end test:**
```bash
# Use the debug spec for full workflow validation
tsx spec-orchestrator.ts 9999 -s 1

# This will:
# 1. Create 1 sandbox
# 2. Run the debug spec (2 trivial tasks)
# 3. Complete in ~5 minutes
# 4. Execute natural completion sequence
```

### When to Use Each Option

| Scenario | Recommended Approach |
|----------|---------------------|
| Debugging completion UI | `--skip-to-completion` |
| Debugging review sandbox creation | `--skip-to-completion` |
| Validating fix end-to-end | Debug spec (S9999) |
| Quick iteration on post-completion | `--skip-to-completion` |
| Testing task execution flow | Debug spec (S9999) |

### Cleanup

The debug spec creates marker files in `/tmp/` which are automatically cleaned on sandbox termination. No manual cleanup required.
