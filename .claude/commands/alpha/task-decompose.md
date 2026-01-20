---
description: Decompose features into atomic tasks using MAKER framework. Accepts semantic IDs (S#.I# or S#.I#.F#) or legacy issue numbers. Fourth step in Alpha autonomous coding process.
argument-hint: <S#.I#.F#|S#.I#|feature-#|initiative-#> (e.g., S1362.I1.F1, S1362.I1, 1367)
model: opus
allowed-tools: [Read, Write, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Alpha: Task Decomposition Orchestrator

Orchestrate the decomposition of features into MAKER-compliant atomic tasks.

## Quick Reference

```
ID Formats:
- S1362.I1.F1 - Single feature (semantic)
- S1362.I1    - All features in initiative (semantic)
- 1367        - Single feature (legacy issue number)
- 1363        - Initiative (legacy issue number)

Task IDs: S1362.I1.F1.T1, S1362.I1.F1.T2, etc.
```

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

### Step 1: Parse Input and Detect Type

**Accepted formats:**
- `S1362.I1.F1` - Semantic feature ID → **Mode A** (single feature)
- `S1362.I1` - Semantic initiative ID → **Mode B** (all features in initiative)
- `1367` - Legacy feature issue number → **Mode A** (requires GitHub lookup)
- `1363` - Legacy initiative issue number → **Mode B** (requires GitHub lookup)

**Parse the input:**
```typescript
const input = '$ARGUMENTS';
let mode, specNum, initPriority, featPriority, semanticId;

if (input.match(/^S\d+\.I\d+\.F\d+$/)) {
  // Semantic feature: S1362.I1.F1
  mode = 'A';
  const match = input.match(/S(\d+)\.I(\d+)\.F(\d+)/);
  specNum = match[1];
  initPriority = match[2];
  featPriority = match[3];
  semanticId = input;
} else if (input.match(/^S\d+\.I\d+$/)) {
  // Semantic initiative: S1362.I1
  mode = 'B';
  const match = input.match(/S(\d+)\.I(\d+)/);
  specNum = match[1];
  initPriority = match[2];
  semanticId = input;
} else {
  // Legacy issue number - need GitHub lookup
  // (See legacy detection below)
}
```

**For legacy issue numbers**, fetch from GitHub to determine type:
```bash
gh issue view $ARGUMENTS --repo MLorneSmith/2025slideheroes --json labels,title
```

- `alpha:initiative` or `type:initiative` → Execute **Mode B** (loop through all features)
- `alpha:feature` or `type:feature` → Execute **Mode A** (single feature)

### Step 2A: Single Feature Mode

#### 2A.1: Resolve Paths

**For semantic IDs (S#.I#.F#):**
Use Glob to find the feature directory:
```
Glob tool:
  pattern: .ai/alpha/specs/**/S[specNum].I[initPriority].F[featPriority]-Feature-*
```

**For legacy IDs:**
```bash
PATHS=$(.ai/alpha/scripts/resolve-feature-paths.sh $ARGUMENTS)
```

Extract from result: `FEATURE_ID` (semantic), `INITIATIVE_ID` (semantic), `SPEC_ID`, `SPEC_DIR`, `INIT_DIR`, `FEAT_DIR`, `RESEARCH_DIR`

#### 2A.2: Delegate to Task Decomposer

**Invoke the Task tool:**

```
subagent_type: alpha-task-decomposer
description: "Decompose feature <FEATURE_ID>"
prompt: |
  FEATURE_ID: <semantic ID, e.g., S1362.I1.F1>
  INITIATIVE_ID: <semantic ID, e.g., S1362.I1>
  SPEC_ID: <spec number, e.g., 1362>
  SPEC_DIR: <path>
  INIT_DIR: <path>
  FEAT_DIR: <path>
  RESEARCH_DIR: <path>

  Decompose this feature into MAKER-compliant atomic tasks.
  Tasks should use semantic IDs: S1362.I1.F1.T1, S1362.I1.F1.T2, etc.
  Return a structured JSON summary when complete.
```

#### 2A.3: Process Result

Handle based on returned `status` field:

| Status | Action |
|--------|--------|
| `completed` | Report success with task count and hours |
| `needs_spikes` | Delegate each spike to `spike-researcher`, then re-invoke decomposer |
| `rejected` | Report failure with `rejection_reason`, suggest manual review |

### Step 2B: Initiative Mode (Loop)

#### 2B.1: Resolve Initiative Paths

**For semantic IDs (S#.I#):**
Use Glob to find the initiative directory:
```
Glob tool:
  pattern: .ai/alpha/specs/**/S[specNum].I[initPriority]-Initiative-*
```

**For legacy IDs:**
```bash
gh issue view $ARGUMENTS --repo MLorneSmith/2025slideheroes
INIT_DIR=$(find .ai/alpha/specs -type d -name "$ARGUMENTS-*" -o -name "S*.I*-*" | head -1)
```

Record: `INITIATIVE_ID` (semantic, e.g., S1362.I1), `SPEC_DIR`, `RESEARCH_DIR`, `STATE_FILE=${INIT_DIR}/decomposition-state.json`

#### 2B.2: List Features

For semantic IDs, use Glob to find feature directories:
```
Glob tool:
  pattern: [INIT_DIR]/S*.I*.F*-Feature-*
```

For legacy IDs:
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
   - `completed`: Update state, increment counters, record `task_count`
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

## UI Component Task Handling

**Identifying Component Tasks**:
Tasks that create or integrate UI components should check shadcn availability before creating custom implementations.

**Before Creating a UI Component Task**:
1. Check if component exists in `packages/ui/src/shadcn/`
2. Search shadcn CLI: `npx shadcn@latest search -q "[component]"`
3. Search configured registries if official component not found
4. If found, create installation task as prerequisite

**Component Installation Task Template**:
```json
{
  "id": "T2",
  "name": "Install [component] from shadcn",
  "requires_ui_component": true,
  "component_source": "shadcn/ui | @magicui | @aceternity | etc",
  "installation_command": "cd packages/ui && npx shadcn@latest add [component] -y",
  "action": { "verb": "Install", "target": "[component] component" },
  "outputs": [
    { "type": "new", "path": "packages/ui/src/shadcn/[component].tsx" }
  ],
  "verification_command": "test -f packages/ui/src/shadcn/[component].tsx && grep -q './[component]' packages/ui/package.json",
  "post_install_steps": [
    "Update packages/ui/package.json exports if not auto-added",
    "Run pnpm typecheck to verify"
  ]
}
```

**Component Task Best Practices**:
- Always install components before tasks that use them
- Verify exports are added to packages/ui/package.json
- Run typecheck after installation to catch import issues
- Document component choice rationale in task context

**Configured Registries Reference**:
| Registry | Namespace | Specialty |
|----------|-----------|-----------|
| Official | (none) | Core UI components |
| MagicUI | @magicui | Animated components |
| Aceternity | @aceternity | Modern UI effects |
| Kibo UI | @kibo-ui | Component library |
| ReUI | @reui | Component library |
| ScrollX UI | @scrollxui | Scroll effects |
| Molecule UI | @moleculeui | Component library |
| Gaia | @gaia | Component library |
| PhucBM | @phucbm | Component library |

---

## UI Task Flagging

**Purpose**: Flag tasks that create UI components so the `/alpha:implement` command can invoke specialized frontend skills for improved code quality.

**When to Flag a Task as UI**:
Add `ui_task: true` when the task:
- Creates or modifies React components (`.tsx` files)
- Works with pages, layouts, panels, cards, forms, modals, or dialogs
- Involves styling, design, or visual presentation
- Outputs files in `_components/` directories

**Metadata Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `ui_task` | `boolean` | True if task creates/modifies UI components |
| `skill_hints` | `string[]` | Suggested skills: `frontend-design`, `react-best-practices` |

**Skill Hint Selection Guide**:

| Task Pattern | Recommended Skill Hints |
|--------------|------------------------|
| Create new visual component | `["frontend-design"]` |
| Create page layout | `["frontend-design"]` |
| Create data-fetching component | `["react-best-practices"]` |
| Create form with validation | `["frontend-design", "react-best-practices"]` |
| Create dashboard/visualization | `["frontend-design", "react-best-practices"]` |
| Optimize component performance | `["react-best-practices"]` |
| Style existing component | `["frontend-design"]` |

**Example Task with UI Flagging**:
```json
{
  "id": "T4",
  "name": "Create project card component",
  "type": "task",
  "ui_task": true,
  "skill_hints": ["frontend-design"],
  "action": { "verb": "Create", "target": "project card component" },
  "outputs": [
    { "type": "new", "path": "apps/web/app/home/(user)/_components/project-card.tsx" }
  ],
  "acceptance_criterion": "ProjectCard component renders with title, description, and status badge",
  "verification_command": "pnpm typecheck && test -f apps/web/app/home/(user)/_components/project-card.tsx"
}
```

**Example with Multiple Skills**:
```json
{
  "id": "T6",
  "name": "Create analytics dashboard panel",
  "type": "task",
  "ui_task": true,
  "skill_hints": ["frontend-design", "react-best-practices"],
  "action": { "verb": "Create", "target": "analytics dashboard panel" },
  "purpose": "Display real-time analytics with charts and metrics",
  "context": {
    "patterns": [
      { "file": "apps/web/app/home/(user)/_components/metrics-card.tsx", "description": "Card layout pattern" }
    ],
    "constraints": [
      "Must use Server Components where possible",
      "Implement loading skeleton for data fetching"
    ]
  }
}
```

**Important Notes**:
- `ui_task` and `skill_hints` are optional fields - tasks work without them
- If not specified, the implement command can still detect frontend tasks from output paths
- Explicit hints provide better guidance than auto-detection
- Adding hints during decomposition saves time during implementation

---

## Report

### Single Feature (Mode A)

```markdown
## Feature Decomposition Complete

**Feature**: <FEATURE_ID> - <Name>  (e.g., S1362.I1.F1 - Dashboard Page)
**Tasks**: <count>
**Task IDs**: <FEATURE_ID>.T1 through <FEATURE_ID>.T<count>
**Estimated Hours**: <sequential>h (parallel: <parallel>h)

### tasks.json Location
`<FEAT_DIR>/tasks.json`

### Next Step
After decomposing ALL features in the initiative, run the spec orchestrator from the command line:
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts <SPEC_NUM>
```
```

### Initiative (Mode B)

```markdown
## Initiative Decomposition Complete

**Initiative**: <INITIATIVE_ID> - <Name>  (e.g., S1362.I1 - Dashboard Foundation)

### Features Decomposed

| Feature ID | Name | Status | Tasks | Spikes | Hours |
|------------|------|--------|-------|--------|-------|
| S1362.I1.F1 | Dashboard Page | ✅ | 5 | 0 | 8h |
| S1362.I1.F2 | Data Loading | ✅ | 8 | 1 | 12h |

### Summary

- **Total Features**: N
- **Total Tasks**: N
- **Total Spikes**: N
- **Sequential Hours**: Nh
- **Parallel Hours**: Nh (X% time saved)

### State File
`${INIT_DIR}/decomposition-state.json`

### Next Step
After decomposing ALL features in ALL initiatives, run the spec orchestrator from the command line:
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts <SPEC_NUM>
```

Example:
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```
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
