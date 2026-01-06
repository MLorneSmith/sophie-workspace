---
description: Decompose features into atomic tasks using MAKER framework. Accepts initiative-# (all features) or feature-# (single feature). Fourth step in Alpha autonomous coding process.
argument-hint: [initiative-# or feature-#]
model: opus
allowed-tools: [Read, Write, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Alpha: Task Decomposition Orchestrator

Orchestrate the decomposition of features into MAKER-compliant atomic tasks.

## Overview

```
Alpha Workflow: 1. Spec → 2. Initiatives → 3. Features → 4. Tasks (this) → 5. Implement

                              $ARGUMENTS
                                  │
                    ┌─────────────┴─────────────┐
                    │     Detect Input Type     │
                    └─────────────┬─────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                       ▼
    ┌─────────────────┐                     ┌─────────────────┐
    │  Single Feature │                     │   Initiative    │
    │     Mode A      │                     │     Mode B      │
    └────────┬────────┘                     └────────┬────────┘
             │                                       │
             ▼                                       ▼
    ┌─────────────────┐                     ┌─────────────────┐
    │ Task(alpha-     │                     │  For each feat: │
    │ task-decomposer)│                     │  Task(alpha-    │
    └────────┬────────┘                     │  task-decomposer│
             │                              └────────┬────────┘
             │                                       │
             │                              ┌────────┴────────┐
             │                              ▼                 ▼
             │                     ┌──────────────┐  ┌──────────────┐
             │                     │Spike Research│  │Update State  │
             │                     │(if needed)   │  │& Continue    │
             │                     └──────────────┘  └──────────────┘
             │                                       │
             └───────────────────┬───────────────────┘
                                 ▼
                        ┌─────────────────┐
                        │  Summary Report │
                        └─────────────────┘
```

**You are an orchestrator, not a decomposer.** Delegate all decomposition work to `alpha-task-decomposer` via the Task tool.

---

## Instructions

### Step 1: Detect Input Type

Fetch the issue to determine if it's an initiative or single feature:

```bash
gh issue view $ARGUMENTS --repo MLorneSmith/2025slideheroes --json labels,title
```

- `alpha:initiative` or `type:initiative` → Execute **Mode B** (loop through all features)
- `alpha:feature` or `type:feature` → Execute **Mode A** (single feature)

### Step 2A: Single Feature Mode

#### 2A.1: Resolve Paths

```bash
PATHS=$(.ai/alpha/scripts/resolve-feature-paths.sh $ARGUMENTS)
```

Extract from JSON: `FEATURE_ID`, `INITIATIVE_ID`, `SPEC_ID`, `SPEC_DIR`, `INIT_DIR`, `FEAT_DIR`, `RESEARCH_DIR`

#### 2A.2: Delegate to Task Decomposer

**Invoke the Task tool:**

```
subagent_type: alpha-task-decomposer
description: "Decompose feature #<FEATURE_ID>"
prompt: |
  FEATURE_ID: <value>
  INITIATIVE_ID: <value>
  SPEC_ID: <value>
  SPEC_DIR: <path>
  INIT_DIR: <path>
  FEAT_DIR: <path>
  RESEARCH_DIR: <path>

  Decompose this feature into MAKER-compliant atomic tasks.
  Return a structured JSON summary when complete.
```

#### 2A.3: Process Result

Handle based on returned `status` field:

| Status | Action |
|--------|--------|
| `completed` | Report success with task count, hours, GitHub issue |
| `needs_spikes` | Delegate each spike to `spike-researcher`, then re-invoke decomposer |
| `rejected` | Report failure with `rejection_reason`, suggest manual review |

### Step 2B: Initiative Mode (Loop)

#### 2B.1: Resolve Initiative Paths

```bash
gh issue view $ARGUMENTS --repo MLorneSmith/2025slideheroes
INIT_DIR=$(find .ai/alpha/specs -type d -name "$ARGUMENTS-*" | head -1)
```

Record: `INITIATIVE_ID`, `SPEC_DIR`, `RESEARCH_DIR`, `STATE_FILE=${INIT_DIR}/decomposition-state.json`

#### 2B.2: List Features

```bash
FEATURES=$(.ai/alpha/scripts/list-initiative-features.sh $INITIATIVE_ID --paths)
```

#### 2B.3: Load or Create State

Check if `decomposition-state.json` exists:
- **Exists**: Resume from previous progress (skip completed features)
- **Not exists**: Create new state file

#### 2B.4: Decomposition Loop

**For EACH feature**, execute:

1. **Check status** - Skip if already `completed`
2. **Update state** - Set `features[ID].status = "in_progress"`
3. **Invoke Task tool** with `subagent_type=alpha-task-decomposer` (same prompt as Step 2A.2)
4. **Process result**:
   - `completed`: Update state, increment counters, record `task_count`, `github_issue`
   - `needs_spikes`: Append to `spikes_pending`, increment `total_spikes`
   - `rejected`: Mark as `failed`, record error
5. **Save state** after each feature

#### 2B.5: Spike Resolution Phase

If `spikes_pending` is not empty:

1. For each spike, invoke Task tool with `subagent_type=spike-researcher`:
   ```
   prompt: |
     Question: <specific-question>
     Timebox: <hours> hours
     SPEC_DIR: <path>
     FEAT_DIR: <path>
     Context: <feature-name-and-constraints>
   ```
2. After all spikes complete, re-process features with `status == "needs_spikes"`

#### 2B.6: Finalization

Update state:
- `status = "completed"`
- `current_phase = "finalization"`
- Calculate `total_hours_sequential` and `total_hours_parallel`

---

## State Management

State file: `${INIT_DIR}/decomposition-state.json`

Enables:
- **Resume capability** - Re-run command to continue from interruption
- **Progress tracking** - See which features are done
- **Spike coordination** - Track pending spikes across features

**Save state after every feature** to prevent work loss.

---

## Report

### Single Feature (Mode A)

```markdown
## Feature Decomposition Complete

**Feature**: #<ID> - <Name>
**Tasks**: <count>
**Estimated Hours**: <sequential>h (parallel: <parallel>h)
**GitHub Issue**: #<task-issue>

### Next Step
Run `/alpha:implement <FEATURE_ID>` to begin implementation.
```

### Initiative (Mode B)

```markdown
## Initiative Decomposition Complete

**Initiative**: #<ID> - <Name>

### Features Decomposed

| Feature | Status | Tasks | Spikes | Issue | Hours |
|---------|--------|-------|--------|-------|-------|
| #1354 Dashboard Page | ✅ | 5 | 0 | #1357 | 8h |
| #1355 Data Loading | ✅ | 8 | 1 | #1360 | 12h |

### Summary

- **Total Features**: N
- **Total Tasks**: N
- **Total Spikes**: N
- **Sequential Hours**: Nh
- **Parallel Hours**: Nh (X% time saved)

### State File
`${INIT_DIR}/decomposition-state.json`

### Next Step
Run `/alpha:implement <INITIATIVE_ID>` to begin implementation.
```

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Feature decomposition fails | Mark as `failed`, continue with remaining features, report in summary |
| Spike research fails | Mark spike and dependent feature as `failed`, continue with others |
| Resume after failure | Load state, skip completed features, retry failed ones |

---

## Orchestrator Rules

1. **Never spawn nested sub-agents** - Only direct Task tool calls from orchestrator
2. **Save state frequently** - After each feature, after each spike
3. **Process sequentially** - One feature at a time to manage context
4. **Aggregate summaries** - Only hold lean JSON summaries in context
5. **Delegate heavy work** - Task-decomposer does detailed analysis

---

## Input

$ARGUMENTS
