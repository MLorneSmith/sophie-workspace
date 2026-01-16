---
description: Decompose a feature into atomic tasks using MAKER framework principles. This is the fourth step in our 'Alpha' autonomous coding process
argument-hint: [feature-#]
model: opus
allowed-tools: [Read, Write, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

<!--
  Enhanced with MAKER patterns (v2.0):
  - Step 0: Complexity Estimation (adaptive granularity)
  - Step 1.7: Pattern Cache Lookup
  - Step 7.6: Decomposition Discriminator Validation
  - Red-Flag Validation (implementation phase)

  Agents:
  - alpha-complexity-estimator: Pre-decomposition complexity scoring
  - alpha-decomposition-discriminator: Post-decomposition validation
  - alpha-red-flag-validator: Implementation output quality gates

  Pattern Cache:
  - .ai/alpha/cache/decomposition-patterns/
-->

# Alpha: Task Decomposition (MAKER-Aligned)

Decompose the provided feature into atomic, implementation-ready tasks following the MAKER framework's Maximal Agentic Decomposition (MAD) principles. These tasks will be executed in sandboxed environments in the final Alpha workflow step.

## Context

The Alpha autonomous coding process:
1. **Spec** - Capture project specification
2. **Initiatives** - Break spec into major initiatives (2-8 weeks each)
3. **Features** - Decompose each initiative into vertical slices (3-10 days each)
4. **Tasks** (this command) - Break features into atomic implementable tasks (2-8 hours each)
5. **Implement** - Execute each task in a sandboxed environment

## MAKER Framework Principles

This command applies the MAKER framework from "Solving a Million-Step LLM Task with Zero Errors" (arXiv:2511.09030) which achieved **zero errors over 1 million steps** through extreme decomposition.

### The m=1 Principle (Maximal Agentic Decomposition)

Every task must be an **atomic action** - the smallest possible unit of work that:
- Contains exactly ONE decision/action
- Cannot be meaningfully split further
- Requires no planning before execution
- Has a single, clear outcome

```
❌ Bad (m > 1):                    ✅ Good (m = 1):
"Add form with validation"        "Create form component skeleton"
                                  "Add name input field"
                                  "Add email input field"
                                  "Add validation schema"
                                  "Wire validation to form"
```

### The Granularity Test

A task MUST be split if it:
- Contains the word **"and"** connecting two actions
- Requires **planning before action**
- Contains multiple **verbs** (create AND wire AND test)
- Exceeds **2-8 hours** of estimated work
- Would require **>750 tokens** to describe fully

### The Single-Verb Rule

Every task must start with exactly ONE action verb:

| Verb | Usage | Example |
|------|-------|---------|
| **Create** | New file/component from scratch | "Create UserCard component skeleton" |
| **Add** | Insert into existing file | "Add email field to UserForm" |
| **Update** | Modify existing code | "Update loader to include email" |
| **Remove** | Delete code/file | "Remove deprecated helper function" |
| **Wire** | Connect components together | "Wire UserCard to dashboard page" |
| **Extract** | Pull out into separate unit | "Extract validation logic to schema" |
| **Rename** | Change identifier names | "Rename getUserData to loadUserProfile" |
| **Move** | Relocate file/code | "Move types to shared package" |
| **Configure** | Set up tooling/config | "Configure ESLint rule for imports" |
| **Test** | Add test coverage | "Add unit test for calculateTotal" |

### Red-Flag Validation

Tasks are INVALID if they exhibit these red flags:

| Red Flag | Detection | Resolution |
|----------|-----------|------------|
| **Multiple actions** | Contains "and", "then", multiple verbs | Split into separate tasks |
| **Vague scope** | "Improve", "refactor", "clean up" | Define specific changes |
| **Requires planning** | "Figure out", "decide how" | Add spike task first |
| **Too large** | >8 hours estimated | Apply decomposition pattern |
| **Unclear done state** | No testable outcome | Define acceptance criterion |

## Decomposition Patterns

Read the patterns reference for detailed examples:

```bash
cat .ai/alpha/templates/decomposition-patterns.md
```

**Available Patterns:**

| Pattern | Use When |
|---------|----------|
| CRUD | Data operations (create/read/update/delete) |
| Layer | Multi-layer components (DB → Data → UI) |
| State-Based | Multiple UI states (empty/loading/error) |
| Workflow Step | Sequential user flows |
| Spike-Then-Implement | Unknowns block estimation |

**Spike Principles:**
- Spikes have **Priority 0** - run before implementation tasks
- Spikes are **timeboxed** - stop at limit even if incomplete
- Spikes produce **decision documents** - not production code
- Implementation tasks are **extracted from spike reports**

## Instructions

You are a **Task Architect** decomposing features into MAKER-compliant atomic tasks.

**Template Syntax:** Throughout this command, replace all `{placeholder}` values with actual content from the feature context.

**CRITICAL**: Before decomposing into implementation tasks, you MUST:
1. Assess feature complexity to determine appropriate granularity
2. Check for matching decomposition patterns
3. Identify and resolve unknowns via spike tasks

Attempting to decompose without proper complexity assessment leads to over-engineering simple tasks or under-decomposing complex ones.

### Step 0: Complexity Assessment

Assess feature complexity to determine appropriate decomposition granularity.

**Run the Complexity Estimator Agent:**

```
Task tool with subagent_type=alpha-complexity-estimator
prompt: |
  [FEATURE]
  {Feature description from GitHub issue}

  [CONTEXT]
  {Codebase patterns, file structure, similar components}

  [RESEARCH]
  {Summary of research findings if available}
```

**Granularity by Score:**

| Score | Level | Target Steps |
|-------|-------|--------------|
| 0-20 | MINIMAL | 1-3 |
| 21-40 | LOW | 3-6 |
| 41-60 | STANDARD | 6-12 |
| 61-80 | HIGH | 12-20 |
| 81+ | MAXIMAL | 20+ |

Store the result and use it to guide decomposition depth.

### Step 1: Read the Feature

If the GitHub issue number was provided as [feature-#], fetch the issue:

```bash
gh issue view <feature-#> --repo MLorneSmith/2025slideheroes
```

If no issue number provided, ask the user:
```
AskUserQuestion: "What is the GitHub issue number for the feature you want to decompose?"
```

**Use the resolve-feature-paths.sh script to find directories:**

```bash
# Resolve all paths from feature issue number
PATHS=$(.ai/alpha/scripts/resolve-feature-paths.sh <feature-#>)

# Extract individual paths
SPEC_DIR=$(echo "$PATHS" | jq -r '.spec_dir')
INIT_DIR=$(echo "$PATHS" | jq -r '.init_dir')
FEAT_DIR=$(echo "$PATHS" | jq -r '.feat_dir')
RESEARCH_DIR=$(echo "$PATHS" | jq -r '.research_dir')

# Read the feature file
cat ${FEAT_DIR}/feature.md
```

### Step 1.5: Load Context and Research

**Load conditional documentation** for architecture and pattern context:

```bash
slashCommand /conditional_docs implement "[brief feature summary from issue]"
```

Read each suggested document before proceeding.

**Then read previous research** to leverage existing knowledge:

```bash
# List available research files
ls -la ${SPEC_DIR}/research-library/
```

Read relevant files in `${SPEC_DIR}/research-library/`:
- `context7-*.md` - Library/framework documentation findings
- `perplexity-*.md` - Best practices and industry pattern research

**Extract task-relevant information:**
1. **API specifics** - Exact methods, parameters, and configurations
2. **Code patterns** - Implementation patterns to follow
3. **Integration details** - Step-by-step requirements
4. **Edge cases** - Known issues or gotchas

### Step 1.7: Pattern Cache Lookup (NEW)

Check if the feature matches a cached decomposition pattern to accelerate decomposition.

**Use the match-decomposition-pattern.sh script:**

```bash
# Match feature against cached patterns
MATCH=$(.ai/alpha/scripts/match-decomposition-pattern.sh "${FEAT_DIR}/feature.md")

# Check if pattern matched
if [[ $(echo "$MATCH" | jq -r '.matched') == "true" ]]; then
    PATTERN_ID=$(echo "$MATCH" | jq -r '.pattern_id')
    PATTERN_FILE=$(echo "$MATCH" | jq -r '.pattern_file')
    CONFIDENCE=$(echo "$MATCH" | jq -r '.confidence')

    echo "Matched pattern: $PATTERN_ID (confidence: $CONFIDENCE)"

    # Read the pattern
    cat "$PATTERN_FILE"
fi
```

**If Pattern Matches:**

1. Read the pattern file from the match result
2. Adapt the pattern steps to the specific feature
3. Replace template variables with actual values
4. Add feature-specific steps not covered by pattern
5. Remove pattern steps not applicable

**If No Pattern Match:**

Proceed with manual decomposition using the appropriate pattern from the Decomposition Patterns section.

**Update Pattern After Success:**

After successful feature implementation, consider creating or updating patterns in the cache. See `.ai/alpha/cache/decomposition-patterns/SCHEMA.md` for structure.

### Step 2: Analyze Feature Components

From the feature document, identify:

1. **Vertical Slice Components** - UI, Logic, Data, Database layers
2. **Acceptance Criteria** - Each criterion may generate 1+ tasks
3. **Files to Create/Modify** - Each file operation is a task candidate
4. **Task Hints** - Author-suggested decomposition

Create a working list of task candidates.

### Step 2.5: Identify Spike Candidates (CRITICAL)

Before decomposing into implementation tasks, identify unknowns that prevent accurate estimation:

```
UNKNOWN DETECTION CHECKLIST:
┌─────────────────────────────────────────────────────────────────┐
│ Does this feature involve:                                       │
├─────────────────────────────────────────────────────────────────┤
│ [ ] Technology we haven't used before?              → SPIKE     │
│ [ ] External API we haven't integrated?             → SPIKE     │
│ [ ] Architecture pattern that's unclear?            → SPIKE     │
│ [ ] Performance requirements we can't verify?       → SPIKE     │
│ [ ] Multiple valid approaches, unclear winner?      → SPIKE     │
│ [ ] "I don't know how long this will take"?         → SPIKE     │
│ [ ] Third-party service with unknown capabilities?  → SPIKE     │
│ [ ] Complex algorithm with unknown complexity?      → SPIKE     │
└─────────────────────────────────────────────────────────────────┘
```

**For EACH unknown identified**, create a spike task:

#### Spike Task Format

Read the spike template and use it as the structure for each spike task:

```bash
cat .ai/alpha/templates/spike.md
```

Fill in all `{{PLACEHOLDER}}` values with spike-specific information.

#### Running Spike Tasks

Launch the spike-researcher agent for each spike:

```
Task tool with subagent_type=spike-researcher
prompt: |
  Question: [Specific question from spike task]
  Timebox: [Hours] hours
  Context:
    Feature: [Feature name and description]
    Codebase: [Relevant patterns from Step 3 exploration]
    Constraints: [Technical requirements]
```

#### Processing Spike Results

After each spike completes:

1. **Read the spike report** from `${FEAT_DIR}/spike-<slug>.md`
2. **Extract "Implementation Tasks"** section
3. **Add extracted tasks** to the feature's task list
4. **Mark spike as complete**
5. **Continue decomposition** with remaining tasks

**Workflow with Spikes:**
```
Feature Decomposition
        │
        ▼
┌─────────────────────┐
│ Step 2.5: Identify  │
│ Unknowns            │
└─────────────────────┘
        │
   Has Unknowns?
    /        \
  YES         NO
   │           │
   ▼           │
┌──────────┐   │
│ Create   │   │
│ Spike    │   │
│ Tasks    │   │
└──────────┘   │
   │           │
   ▼           │
┌──────────┐   │
│ Run      │   │
│ spike-   │   │
│ researcher│   │
│ Agents   │   │
└──────────┘   │
   │           │
   ▼           │
┌──────────┐   │
│ Extract  │   │
│ Tasks    │   │
│ from     │   │
│ Reports  │   │
└──────────┘   │
   │           │
   ▼           ▼
┌─────────────────────┐
│ Step 4: Apply       │
│ Decomposition       │
│ Pattern             │
└─────────────────────┘
```

### Step 3: Explore Implementation Patterns

Use the Task tool with `subagent_type=code-explorer` to understand:

1. **Similar implementations**: How are comparable tasks structured?
2. **File conventions**: Naming patterns, directory structure
3. **Code patterns**: Existing utilities, shared components
4. **Test patterns**: How similar features are tested

```
Task tool with subagent_type=code-explorer
prompt: "Find examples of <similar-component> implementation in this codebase.
        Show: file structure, component skeleton, loader pattern, test structure."
```

### Step 4: Apply Decomposition Pattern

Select the appropriate pattern based on feature type:

| Feature Type | Pattern | Indicator |
|--------------|---------|-----------|
| Data operations | CRUD | "Create/Read/Update/Delete" in acceptance criteria |
| New component | Layer | "UI + logic + data" in vertical slice |
| Multi-state UI | State-Based | "Empty/loading/error states" required |
| User flow | Workflow Step | Sequential actions in user story |
| Mixed | Combine patterns | Use multiple patterns for complex features |

### Step 5: Validate Each Task (m=1 Compliance)

For every task, verify:

```
┌─────────────────────────────────────────────────────────────────┐
│ MAKER m=1 VALIDATION CHECKLIST                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. SINGLE VERB?                                                │
│    [ ] Task starts with exactly one action verb                │
│    [ ] No "and", "then", or implicit multiple actions          │
│                                                                 │
│ 2. ATOMIC?                                                     │
│    [ ] Cannot be meaningfully split further                    │
│    [ ] One decision/outcome only                               │
│    [ ] No planning required before execution                   │
│                                                                 │
│ 3. SIZED CORRECTLY?                                            │
│    [ ] Estimated 2-8 hours (not less, not more)               │
│    [ ] Could be described in <750 tokens                       │
│    [ ] Touches 1-3 files maximum                               │
│                                                                 │
│ 4. CLEAR OUTCOME?                                              │
│    [ ] Binary done/not-done state                              │
│    [ ] Testable completion criterion                           │
│    [ ] No ambiguity about what "done" means                    │
│                                                                 │
│ 5. CONTEXT-FREE?                                               │
│    [ ] Can be executed with minimal context                    │
│    [ ] Doesn't require reading 10+ other tasks                 │
│    [ ] Self-contained instructions                             │
│                                                                 │
│ ALL CHECKED → Valid m=1 task                                   │
│ ANY UNCHECKED → Apply decomposition pattern                    │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6: Define Task Context

For each task, specify the minimal context needed:

```markdown
## Task Context (≤750 tokens total)

### Current State
- Files that exist: [list relevant files]
- Functions available: [list dependencies]
- Types defined: [list relevant types]

### Instruction
[Single sentence: "Create X that does Y"]

### Acceptance Criterion
[Single testable condition: "X exists and passes Y check"]

### Output
[Expected result: "New file at path/to/file.tsx"]
```

### Step 7: Determine Task Order

Apply dependency rules:

1. **Types before implementations** - Define TypeScript types first
2. **Database before loaders** - RPC/schema before data access
3. **Loaders before components** - Data before UI
4. **Components before wiring** - Build before integrate
5. **Integration before tests** - Wire before verify
6. **Parallel where independent** - Group non-blocking tasks

Create execution graph:
```
T1 (Types) ────────────────────────────────────────┐
    ↓                                              │
T2 (Database RPC) ───┬─────────────────────────────┤
    ↓                │                             │
T3 (Loader) ─────────┤                             │
    ↓                │                             │
T4 (Component) ──────┼── parallel ── T5 (Styles)   │
    ↓                │                             │
T6 (Wire to page) ───┘                             │
    ↓                                              │
T7 (E2E Test) ←────────────────────────────────────┘
```

### Step 8: Create tasks.json

Create a single JSON file containing all tasks for this feature:

```bash
# File: ${FEAT_DIR}/tasks.json
```

**Read the schema and example:**

```bash
# Schema (for validation)
cat .ai/alpha/templates/tasks.schema.json

# Example (for reference)
cat .ai/alpha/templates/tasks.example.json
```

**Structure the JSON with these sections:**

1. **metadata** - Feature info, complexity assessment, pattern matched
2. **tasks** - Array of all tasks (spikes + implementation tasks)
3. **execution** - Parallel groups, critical path, duration analysis
4. **validation** - MAKER compliance scores and dependency checks
5. **github** - Issue tracking (populated after Step 11)

**Task object required fields:**
- `id` - S1, S2 for spikes; T1, T2, etc. for tasks
- `type` - "spike" or "task"
- `name` - Single-verb task name
- `action` - `{ verb, target }` following single-verb rule
- `estimated_hours` - 2-8 hours for MAKER compliance
- `group` - Parallel execution group (0 = spikes)
- `acceptance_criterion` - Single testable condition
- `dependencies` - `{ blocked_by, blocks }` arrays
- `m1_checks` - All 6 MAKER validation flags

Use the Write tool to create `${FEAT_DIR}/tasks.json` with the complete structure.

### Step 9: Dependency Validation Phase (CRITICAL)

Before creating task documents, validate the dependency graph using the validate-dependencies.py script.

**Run the validation script:**

```bash
# Validate dependencies and compute execution metrics
VALIDATION=$(.ai/alpha/scripts/validate-dependencies.py ${FEAT_DIR}/tasks.json)

# Check if valid
if [[ $(echo "$VALIDATION" | jq -r '.valid') == "false" ]]; then
    echo "Dependency validation FAILED:"
    echo "$VALIDATION" | jq -r '.errors[]'
    # STOP and resolve before continuing
fi

# Extract results for tasks.json
CRITICAL_PATH=$(echo "$VALIDATION" | jq '.critical_path')
PARALLEL_GROUPS=$(echo "$VALIDATION" | jq '.parallel_groups')
DURATION=$(echo "$VALIDATION" | jq '.duration')
CHECKS=$(echo "$VALIDATION" | jq '.checks')
```

**The script automatically performs:**

1. **Cycle Detection** - Topological sort to find circular dependencies
2. **Critical Path Calculation** - Longest path through dependency graph
3. **Parallel Group Computation** - Groups tasks that can run concurrently
4. **Duration Analysis** - Sequential vs parallel execution time

**Validation Checks:**

| Check | Meaning |
|-------|---------|
| `no_cycles` | No circular dependencies in graph |
| `all_documented` | All referenced task IDs exist |
| `spikes_first` | All spikes are in Group 0 |
| `critical_path_valid` | Critical path calculated successfully |

**If validation fails:**

1. Review the errors in the output
2. Fix the dependency structure in your task list
3. Re-run the validation script
4. Repeat until all checks pass

**Update tasks.json with results:**

```bash
# Merge validation results into tasks.json
jq --argjson cp "$CRITICAL_PATH" \
   --argjson pg "$PARALLEL_GROUPS" \
   --argjson dur "$DURATION" \
   --argjson chk "$CHECKS" \
   '.execution.critical_path = $cp |
    .execution.groups = $pg |
    .execution.duration = $dur |
    .validation.dependency_checks = $chk' \
   ${FEAT_DIR}/tasks.json > ${FEAT_DIR}/tasks.json.tmp && \
   mv ${FEAT_DIR}/tasks.json.tmp ${FEAT_DIR}/tasks.json
```

### Step 10: Decomposition Validation

Before creating task documents, run the formal decomposition validation to ensure quality.

**Run the Decomposition Discriminator Agent:**

```
Task tool with subagent_type=alpha-decomposition-discriminator
prompt: |
  [FEATURE]
  {Original feature description}

  [DECOMPOSITION]
  {Full list of tasks with dependencies, grouped by parallel execution}

  [COMPLEXITY ASSESSMENT]
  Score: {X}/100
  Granularity: {LEVEL}
  Target Steps: {range}
```

**Validation Checks:**

| Check | Threshold for APPROVED |
|-------|------------------------|
| Completeness | >= 90% (feature requirements covered) |
| Atomicity | >= 95% (all tasks are m=1 compliant) |
| Dependencies | 100% (no cycles, all explicit) |
| State Flow | >= 90% (inputs/outputs chain correctly) |
| Testability | >= 80% (tasks have verifiable outcomes) |

**Verdicts:**

| Verdict | Meaning | Action |
|---------|---------|--------|
| APPROVED | Decomposition is ready | Proceed to Step 11 |
| NEEDS_REVISION | Minor issues | Fix listed issues, re-run validation |
| REJECTED | Fundamental issues | Re-do decomposition from Step 4 |

**If NEEDS_REVISION:**

1. Review the Priority 1 (Must Fix) issues
2. Apply the suggested fixes to the decomposition
3. Re-run the discriminator agent
4. Repeat until APPROVED

**Splitting Tasks (Common Revision):**

When the discriminator identifies a task that should be split (e.g., T14 needs to become 4 tasks):

1. **Split the task** - Modify T14 to be the first sub-task, add T15, T16, T17 as new tasks
2. **Renumber subsequent tasks** - Use the renumber script to shift all following task IDs:

```bash
# If you split T14 into 4 tasks, shift T15+ by 3 to make room:
.ai/alpha/scripts/renumber-tasks.sh ${FEAT_DIR}/tasks.json --split T14 --count 4

# Preview changes first with --dry-run:
.ai/alpha/scripts/renumber-tasks.sh ${FEAT_DIR}/tasks.json --split T14 --count 4 --dry-run

# Or shift specific range:
.ai/alpha/scripts/renumber-tasks.sh ${FEAT_DIR}/tasks.json --shift T15 --by 3
```

The script automatically updates:
- Task IDs (T15→T18, T16→T19, etc.)
- `blocked_by` references in all tasks
- `blocks` references in all tasks
- Execution group task lists
- Critical path task lists

3. **Update dependencies** for the new split tasks
4. **Re-run dependency validation**: `.ai/alpha/scripts/validate-dependencies.py ${FEAT_DIR}/tasks.json`
5. **Re-run discriminator** to verify the fix

**If REJECTED:**

1. Review the rejection reason carefully
2. Identify where the decomposition went wrong
3. Return to Step 4 (Apply Decomposition Pattern) with new approach
4. Consider if complexity assessment was accurate

**Validation Report Location:**

Store the validation report in the feature directory:

```bash
# File: ${FEAT_DIR}/decomposition-validation.md
```

### Step 11: Create README (Optional)

Optionally create a human-readable overview from the JSON:

```bash
# File: ${FEAT_DIR}/README.md
```

This can be auto-generated from `tasks.json` or skipped entirely since the JSON is the source of truth. If created, include:
- Task summary table
- Mermaid execution graph
- Duration analysis

### Step 12: Create Feature Tasks Issue

Create a single GitHub issue for this Feature that lists all tasks as checkboxes, grouped by execution order.

**Run the script:**

```bash
# Create the consolidated feature tasks issue
.ai/alpha/scripts/create-feature-tasks-issue.sh ${FEAT_DIR}/tasks.json

# Or dry-run first to preview what will be created
.ai/alpha/scripts/create-feature-tasks-issue.sh --dry-run ${FEAT_DIR}/tasks.json

# To update an existing issue (if re-running after changes)
.ai/alpha/scripts/create-feature-tasks-issue.sh --update ${FEAT_DIR}/tasks.json
```

**The script automatically:**

1. Ensures required labels exist (type:feature-tasks, alpha:tasks, parent:$FEATURE_ID)
2. Creates ONE GitHub issue containing all tasks as checkboxes
3. Groups tasks by parallel execution group (Group 0 = spikes first)
4. Includes execution summary (sequential vs parallel duration)
5. Includes validation status and critical path
6. Adds collapsible section with full task details
7. Updates `tasks.json` with:
   - `github.feature_tasks_issue` = issue number
   - `github.issues_created = true`

**Issue Structure:**
- Summary table (total tasks, spikes, complexity, pattern)
- Tasks by execution group with checkboxes
- Execution summary (duration, time saved)
- Validation status
- Expandable task details section

### Step 13: Link to Parent Feature Issue (Optional)

If you want to add a reference comment to the original Feature issue linking to the tasks issue:

```bash
FEATURE_ISSUE="${FEATURE_ID}"
TASKS_ISSUE=$(jq -r '.github.feature_tasks_issue' ${FEAT_DIR}/tasks.json)

gh issue comment ${FEATURE_ISSUE} --repo MLorneSmith/2025slideheroes --body "## Task Decomposition Complete

Tasks have been decomposed and tracked in issue #${TASKS_ISSUE}

**Summary:**
- Total Tasks: $(jq '.tasks | length' ${FEAT_DIR}/tasks.json)
- Spikes: $(jq '[.tasks[] | select(.type == "spike")] | length' ${FEAT_DIR}/tasks.json)

**Next Step:** Begin implementation with Group 0 tasks (spikes) if any, otherwise Group 1.

See #${TASKS_ISSUE} for the full task list with checkboxes."
```

This step is optional since the tasks issue already has the `parent:$FEATURE_ID` label for traceability.

## Pre-Completion Checklist

Before finalizing, verify:

### Spike Validation
- [ ] All unknowns identified (technology, API, architecture, feasibility)
- [ ] Spike tasks created for each unknown (Priority 0)
- [ ] Spike tasks have timeboxes (2-8 hours max)
- [ ] Spike tasks have specific questions (not vague "investigate X")
- [ ] Implementation tasks blocked by spikes are marked as such
- [ ] Spike reports saved to feature directory

### Task Validation (m=1 Compliance)
- [ ] Every task passes m=1 validation (single verb, atomic, sized, clear, context-free)
- [ ] No task exceeds 8 hours estimated effort
- [ ] No task requires >750 tokens of context
- [ ] No task touches more than 3 files
- [ ] No task contains "and"/"then" connecting actions
- [ ] Each task has a single, testable acceptance criterion

### Dependency & Execution Validation (CRITICAL)
- [ ] All dependencies explicitly documented
- [ ] **No circular dependencies** (cycle detection passed)
- [ ] Critical path calculated and documented
- [ ] Parallel groups identified for execution optimization
- [ ] Spikes are in Group 0 (run before all other tasks)
- [ ] No task depends on unfinished spike
- [ ] Execution order is logical and achievable

### Artifact Validation
- [ ] `tasks.json` created in feature directory with valid schema
- [ ] Feature tasks issue created with all tasks as checkboxes
- [ ] Issue has proper labels (type:feature-tasks, alpha:tasks, parent:$FEATURE_ID)
- [ ] `tasks.json` updated with `github.feature_tasks_issue` number
- [ ] `github.issues_created` set to `true` in JSON

### Decomposition Validation
- [ ] Complexity assessment completed (Step 0)
- [ ] Pattern cache checked for matches (Step 1.7)
- [ ] Decomposition discriminator returned APPROVED (Step 10)
- [ ] Validation report saved to feature directory

## Red-Flag Validation (Implementation Phase)

When tasks are executed in the `/alpha:implement` phase, each task output is validated using the Red-Flag Validator to catch unreliable responses before they cascade.

### Red-Flag Checks

| Check | Detection | Threshold |
|-------|-----------|-----------|
| LENGTH | Response too long | >750 tokens (warn), >1000 (fail) |
| FORMAT | Missing expected structure | Required sections absent |
| COHERENCE | Repetition, contradictions | 3+ repeated phrases, conflicting claims |
| COMPLETION | Task not actually done | TODO/placeholder code, wrong outcome |

### High Severity Flags (Any = Retry)

- `LENGTH_EXCEEDED`: Response > 1000 tokens
- `TRUNCATED`: Response cut off mid-sentence
- `CONTRADICTION`: Claims success but describes failure
- `WRONG_OUTCOME`: Output doesn't match expected
- `PLACEHOLDER_CODE`: Contains TODO, FIXME, stub implementations

### Medium Severity Flags (2+ = Retry)

- `LENGTH_WARNING`: Response 751-1000 tokens
- `REPETITION`: Same phrase repeated 3+ times
- `RAMBLING`: Excessive hedging language
- `VAGUE_OUTPUT`: Output state unclear

### Recommended Actions

| Situation | Action |
|-----------|--------|
| High severity flag | RETRY (max 3 attempts) |
| 2+ medium flags | RETRY_WITH_GUIDANCE |
| Critical step fails 3x | ESCALATE_TO_VOTING |
| All checks pass | PROCEED |

### Red-Flag Validator Usage

During implementation, run after each task:

```
Task tool with subagent_type=alpha-red-flag-validator
prompt: |
  [TASK_OUTPUT]
  {Complete output from task executor}

  [EXPECTED_FORMAT]
  {What the output should contain}

  [TASK_CONTEXT]
  Task ID: {task ID}
  Task Name: {task name}
  Expected Outcome: {what the task should produce}
```

## MAKER Compliance Metrics

After decomposition, report:

| Metric | Target | Actual |
|--------|--------|--------|
| **Complexity Assessment** | | |
| Complexity score | - | X/100 |
| Granularity level | - | LEVEL |
| Target steps | - | N-M |
| **Decomposition Quality** | | |
| Unknowns identified | All | N |
| Spikes created | 1 per unknown | S |
| Tasks per feature | Matches target | N |
| Avg hours per task | 2-4 | X |
| Max context tokens | <750 | Y |
| **Validation Scores** | | |
| Completeness | >= 90% | X% |
| Atomicity | >= 95% | X% |
| Dependencies | 100% | X% |
| State Flow | >= 90% | X% |
| Testability | >= 80% | X% |
| **Execution Efficiency** | | |
| Parallel efficiency | >30% | Z% |
| m=1 compliance | 100% | W% |
| Pattern matched | - | Yes/No |

## Validation Commands

**Use the validate-tasks-json.sh script for comprehensive validation:**

```bash
# Run full validation suite
.ai/alpha/scripts/validate-tasks-json.sh ${FEAT_DIR}/tasks.json

# The script checks:
# - JSON syntax
# - Required top-level fields (metadata, tasks, execution, validation)
# - Task-level required fields (id, type, name, action, etc.)
# - m=1 compliance (valid verbs, no conjunctions)
# - Hours within range (2-8)
# - Dependencies (via validate-dependencies.py)
```

**Output shows all checks:**

```json
{
  "valid": true,
  "checks": {
    "json_syntax": true,
    "required_fields": true,
    "task_fields": true,
    "m1_compliance": true,
    "hours_range": true,
    "dependencies": true
  },
  "errors": [],
  "warnings": []
}
```

**Use the renumber-tasks.sh script when splitting tasks:**

```bash
# After splitting T14 into 4 tasks, renumber T15+ by 3:
.ai/alpha/scripts/renumber-tasks.sh ${FEAT_DIR}/tasks.json --split T14 --count 4

# Preview changes first:
.ai/alpha/scripts/renumber-tasks.sh ${FEAT_DIR}/tasks.json --split T14 --count 4 --dry-run

# Create backup before modifying:
.ai/alpha/scripts/renumber-tasks.sh ${FEAT_DIR}/tasks.json --split T14 --count 4 --backup
```

**Quick manual checks:**

```bash
# Count tasks
jq '.tasks | length' ${FEAT_DIR}/tasks.json

# Check GitHub issues created
jq '.github.issues_created' ${FEAT_DIR}/tasks.json

# List issue map
jq '.github.issue_map' ${FEAT_DIR}/tasks.json

# Check validation verdict
jq '.validation.discriminator_verdict' ${FEAT_DIR}/tasks.json
```

## Feature Issue Number

$ARGUMENTS

## Report

When complete, provide:

- **Summary**: Overview of decomposition results (2-3 sentences)
- **Output File**: `${FEAT_DIR}/tasks.json` (source of truth)
- **Complexity Assessment** (from `metadata.complexity`):
  - Score: X/100
  - Granularity Level: MINIMAL/LOW/STANDARD/HIGH/MAXIMAL
  - Target Steps: N-M
  - Pattern Matched: {pattern name or "none"}
- **Tasks Created** (from `tasks` array):
  | ID | Type | Name | Issue # | Hours | Group |
  |----|------|------|---------|-------|-------|
  | S1 | spike | ... | #XXX | 4 | 0 |
  | T1 | task | ... | #YYY | 2 | 1 |
- **Validation Results** (from `validation`):
  - Discriminator Verdict: APPROVED/NEEDS_REVISION/REJECTED
  - Completeness: X%
  - Atomicity: X%
  - m=1 Compliance: X%
- **Execution Summary** (from `execution`):
  - Critical Path: S1 → T1 → T3 → T6 (Xh)
  - Sequential: Xh | Parallel: Yh | Saved: Z%
- **GitHub Integration** (from `github`):
  - Feature Tasks Issue: #XXX (single issue with all tasks)
  - Issues Created: true/false
- **Next Step**:
  - If spikes exist: "Run `/alpha:implement` for Group 0 spikes first"
  - If no spikes: "Run `/alpha:implement` for Group 1 tasks"
  - Source: "Read task details from `tasks.json`"
