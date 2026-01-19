---
description: Implement all tasks for a feature from Alpha workflow. Reads tasks.json, executes with sub-agents (parallel by default), validates, commits, and reports progress.
argument-hint: <feature-id> [--resume-from=<task-id>] [--sequential] [--parallel-dry-run]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion, WebFetch, WebSearch, TaskOutput]
hooks:
  PostToolUse:
    - matcher: "TodoWrite"
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/task_progress_stream.py || true"
          timeout: 3
  SubagentStop:
    - matcher: ""
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/subagent_complete_stream.py || true"
          timeout: 3
  Stop:
    - matcher: ""
      hooks:
        - type: command
          command: "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/feature_complete_stream.py || true"
          timeout: 5
---

# Alpha Feature Implementation

Implement ALL tasks for Feature #$ARGUMENTS from the Alpha autonomous coding workflow.

**Arguments:**
- `<feature-id>` - Required. The GitHub issue number for the feature.
- `--resume-from=<task-id>` - Optional. Skip completed tasks and resume from the specified task ID (e.g., `--resume-from=T5`).
- `--sequential` - Optional. Force sequential execution even when parallel batches are available.
- `--parallel-dry-run` - Optional. Log parallel execution plan without executing. Use to validate analysis.

## Context

You are running inside an E2B sandbox as part of the Alpha Initiative Orchestrator. Your job is to:
1. Implement ALL tasks for this feature
2. Make regular commits after completing task groups
3. Report progress to the orchestrator via progress files
4. Exit cleanly when context window reaches 60% capacity
5. Use sub-agents aggressively to preserve context

## Critical Instructions

**Context Management**:
- Use sub-agents (Task tool) for all exploration, research, and complex analysis
- Never read large files directly - use Grep/Glob to find specific content
- After completing each task group, estimate context usage
- If context > 60% full, save checkpoint and exit with status "context_limit"

**Progress Reporting**:
- Write progress to `.initiative-progress.json` after each task
- Update task status in the feature's `tasks.json` file
- Make commits after completing each execution group

**Validation**:
- Run the `verification_command` for each task
- ALL commands must pass before marking task complete
- If validation fails, fix the issue and retry (max 3 attempts)

## Implementation Flow

### Phase 1: Load Context

1. **Find feature directory**:
   ```bash
   # Search for feature directory by ID
   find .ai/alpha/specs -name "$ARGUMENTS-Feature-*" -type d
   ```

2. **Load tasks.json**:
   - Read the `tasks.json` file from the feature directory
   - Parse metadata, tasks, and execution groups
   - Create TodoWrite items for all tasks

3. **Load research library**:
   - Check for `research-library/` directory in parent spec folder
   - Read any relevant context files (context7, perplexity research)

4. **Load conditional context**:
   Use the conditional documentation system for targeted context:
   ```
   /conditional_docs implement "[feature title from tasks.json]"
   ```

5. **Analyze task parallelism**:
   - Check if execution groups have `parallel_batches` defined
   - Log parallelization opportunities (Phase 2 - Dry Run)
   - In future: execute parallel batches using Task tool (Phase 3)

### Phase 1.5: Parallel Batch Analysis (Dry Run)

**IMPORTANT**: Before executing tasks, analyze parallelization opportunities.

For each execution group, check if `parallel_batches` is defined:

```
[Parallel Analysis - Group {group.id}: {group.name}]
Tasks in group: {group.task_ids.length}

IF group.parallel_batches exists AND has batches with >1 task:
    Log: "⚡ PARALLEL OPPORTUNITY DETECTED"
    For each batch in parallel_batches:
        IF batch.task_ids.length > 1:
            Log: "  Batch {batch.batch_id}: [{batch.task_ids}] can run in parallel"
            Log: "    Reason: {batch.reason}"
            Log: "    Max hours: {batch.max_hours}h (vs {sum of task hours}h sequential)"
        ELSE:
            Log: "  Batch {batch.batch_id}: [{batch.task_ids}] - single task"

    IF group.parallelization_analysis:
        Log: "  Speedup potential: {analysis.speedup_potential}x"
        IF analysis.file_conflicts.length > 0:
            Log: "  ⚠️ File conflicts detected:"
            For each conflict:
                Log: "    - {task_a} ↔ {task_b}: {conflicting_file}"

    Log: "[DRY RUN] Would execute {parallelizable_count} tasks in parallel"
    Log: "[DRY RUN] Sequential fallback for {sequential_count} tasks"

ELSE:
    Log: "  No parallel batches defined - running sequentially"
```

**Example output**:
```
[Parallel Analysis - Group 1: Foundation]
Tasks in group: 2

⚡ PARALLEL OPPORTUNITY DETECTED
  Batch 1: [T1, T2] can run in parallel
    Reason: No file overlaps between tasks
    Max hours: 2h (vs 4h sequential)
  Speedup potential: 2x

[DRY RUN] Would execute 2 tasks in parallel using Task tool
[DRY RUN] Estimated time: 2h instead of 4h

[Parallel Analysis - Group 3: Data Loader Functions]
Tasks in group: 4

  Batch 1: [T5] - single task
  Batch 2: [T6] - single task
  Batch 3: [T7] - single task
  Batch 4: [T8] - single task
  ⚠️ File conflicts detected:
    - T5 ↔ T6: dashboard-page.loader.ts
    - T5 ↔ T7: dashboard-page.loader.ts
  Speedup potential: 1x (no parallelization possible)

[DRY RUN] All tasks must run sequentially due to file conflicts
```

**Progress file update** - Include parallelism info:
```json
{
  "feature": { "issue_number": 1367, "title": "Dashboard Page" },
  "phase": "analyzing_parallelism",
  "current_group": {
    "id": 1,
    "name": "Foundation",
    "parallel_batches": [
      { "batch_id": 1, "task_ids": ["T1", "T2"], "status": "pending" }
    ],
    "execution_mode": "parallel_ready"
  },
  "parallelism_summary": {
    "total_parallelizable": 8,
    "total_sequential": 12,
    "groups_with_parallel_batches": 3
  },
  "completed_tasks": [],
  "status": "in_progress",
  "last_heartbeat": "2024-01-01T12:00:00Z"
}
```

### Phase 2: Execute Tasks

**Arguments affecting execution**:
- `--resume-from=<task-id>` - Skip completed tasks and resume from specified task
- `--sequential` - Force sequential execution (disable parallel)
- `--parallel-dry-run` - Log parallel execution plan without executing (validation mode)

**CRITICAL: Handle --resume-from argument**

If `--resume-from=<task-id>` was provided:
1. Parse the task ID from the argument (e.g., `T5` from `--resume-from=T5`)
2. Read the progress file to get list of completed tasks
3. Skip all tasks until reaching the resume task
4. Continue from that task

**Execution Mode Selection** (Parallel is DEFAULT):

```
IF --parallel-dry-run flag is set:
    execution_mode = "dry_run"
    Log: "🔍 PARALLEL DRY RUN MODE - Logging execution plan only"

ELSE IF --sequential flag is set:
    execution_mode = "sequential"
    Log: "📝 SEQUENTIAL MODE - Parallel disabled by flag"

ELSE IF group has parallel_batches with >1 task:
    execution_mode = "parallel"  # DEFAULT when parallel batches exist
    Log: "⚡ PARALLEL MODE - Executing batches with Task tool sub-agents"

ELSE:
    execution_mode = "sequential"
    Log: "📝 SEQUENTIAL MODE - No parallel batches available"
```

**Note**: Parallel execution is now the DEFAULT when `parallel_batches` exist in tasks.json. Use `--sequential` to opt-out.

Execute tasks in order, respecting execution groups:

```
For each execution_group (sorted by group.id ascending):

    # Determine execution mode for this group
    group_has_parallel = group.parallel_batches exists AND
                         any batch has task_ids.length > 1

    IF execution_mode == "dry_run":
        # DRY RUN - see below

    ELSE IF execution_mode == "sequential" OR NOT group_has_parallel:
        # SEQUENTIAL - see below

    ELSE:
        # PARALLEL EXECUTION (DEFAULT when parallel batches exist)
        For each batch in group.parallel_batches:
            IF batch.task_ids.length > 1:
                # Execute parallel batch - See "Parallel Batch Execution" section
                Log: "⚡ Parallel batch ${batch.batch_id}: [${batch.task_ids}]"
                Execute parallel batch using Task tool
            ELSE:
                # Single task - execute normally
                Execute task sequentially

    # Continue to group completion...

    # --- EXECUTION MODE DETAILS ---

    IF execution_mode == "dry_run":
        # DRY RUN - Log what would happen
        For each batch in group.parallel_batches (if exists):
            IF batch.task_ids.length > 1:
                Log: "[DRY RUN] Would launch parallel batch: [{batch.task_ids}]"
                Log: "[DRY RUN] Sub-agent prompts would be:"
                For each task_id in batch.task_ids:
                    Log: "  - Task {task_id}: {task.name}"
            ELSE:
                Log: "[DRY RUN] Sequential: {batch.task_ids[0]}"

        # Still execute sequentially in dry-run mode
        For each task_id in group.task_ids:
            Execute task sequentially (normal flow)

    ELSE:
        # SEQUENTIAL EXECUTION (Current default)
        For each task_id in group.task_ids:
            # Skip completed tasks if resuming
            If task_id is in completed_tasks from progress file:
                Skip to next task

            # PRE-TASK CHECKPOINT (CRITICAL for crash recovery)
            1. Save checkpoint BEFORE starting task:
               - Write progress file with status "starting"
               - This ensures we can resume if process crashes

            2. Mark task as in_progress (in TodoWrite and tasks.json)
            3. Read task context and constraints
            4. Implement the task using the action verb
            5. Run verification_command
            6. If verification fails:
               - Fix the issue
               - Retry (max 3 attempts)
               - If still failing, mark as blocked
            7. Mark task as completed
            8. Update progress file with completed status

    After completing group:
        - Commit changes with conventional format
        - Push to remote
        - Check context usage - exit if > 60%
```

### Pre-Task Checkpoint (CRITICAL)

**Before starting each task, save a checkpoint to enable crash recovery:**

```bash
# Create checkpoint BEFORE starting task implementation
# This ensures orchestrator can resume from this task if sandbox crashes

FEATURE_ID="$ARGUMENTS"  # Parse feature ID from arguments
TASK_ID="T5"             # Current task ID
COMPLETED='["T1", "T2", "T3", "T4"]'  # Array of completed task IDs
TIMESTAMP=$(date -Iseconds)

cat > .initiative-progress.json << EOF
{
  "feature": {
    "issue_number": ${FEATURE_ID},
    "title": "Feature title from tasks.json"
  },
  "current_task": {
    "id": "${TASK_ID}",
    "name": "Task name",
    "status": "starting",
    "started_at": "${TIMESTAMP}"
  },
  "completed_tasks": ${COMPLETED},
  "failed_tasks": [],
  "checkpoint_type": "pre_task",
  "status": "in_progress",
  "last_checkpoint": "${TIMESTAMP}",
  "last_heartbeat": "${TIMESTAMP}"
}
EOF
```

**Why pre-task checkpointing matters:**
- If sandbox runs out of memory/CPU, the process is killed immediately
- Without pre-task checkpoint, we lose track of where we were
- With pre-task checkpoint, orchestrator knows which task to resume from
- Saves significant time by not re-running completed tasks

### Heartbeat Protocol (CRITICAL)

**Purpose**: The orchestrator monitors progress files to detect stalled Claude sessions. A heartbeat timestamp tells the orchestrator "I'm still alive and working" even during long operations.

**When to update heartbeat:**
1. **Every 60 seconds** during long operations (reading files, complex analysis)
2. **After every major checkpoint** (task start, task complete, verification attempt)
3. **Before and after sub-agent calls** (Task tool invocations)

**Heartbeat update command:**
```bash
# Update heartbeat timestamp in progress file
# Run this periodically during long operations

TIMESTAMP=$(date -Iseconds)

# Read current progress, update heartbeat, write back
jq --arg ts "$TIMESTAMP" '.last_heartbeat = $ts' .initiative-progress.json > .initiative-progress.tmp.json && \
mv .initiative-progress.tmp.json .initiative-progress.json
```

**IMPORTANT**: If you cannot run the `jq` command (e.g., not installed), include `last_heartbeat` in every progress file write instead.

**Stall Detection**: The orchestrator considers a session stalled if:
- No heartbeat update for 10 minutes
- Current task stuck in "starting" status for 10 minutes

When a stall is detected, the orchestrator logs a warning. This helps identify hung sessions that need manual intervention.

### Granular Progress Checkpoints

**Update the progress file at these checkpoints for maximum visibility:**

| Checkpoint | Phase Value | When |
|------------|-------------|------|
| Context loading | `loading_context` | After finding feature directory |
| Research loaded | `loading_research` | After reading research library |
| Conditional docs | `loading_docs` | After loading conditional documentation |
| Task starting | `executing` | Before each task (with task status "starting") |
| Task in progress | `executing` | During task implementation |
| Verification | `verifying` | Before running verification_command |
| Verification retry | `verifying` | After failed verification (include attempt count) |
| Task complete | `executing` | After task passes verification |
| Group complete | `committing` | Before git commit |
| Pushing | `pushing` | Before git push |

**Example progress file with granular checkpoints:**
```json
{
  "feature": { "issue_number": 1367, "title": "Dashboard Page" },
  "phase": "verifying",
  "current_task": {
    "id": "T5",
    "name": "Create data loader",
    "status": "in_progress",
    "started_at": "2024-01-01T12:00:00Z",
    "verification_attempts": 2
  },
  "current_group": {
    "id": 2,
    "name": "Data Layer",
    "tasks_total": 4,
    "tasks_completed": 1
  },
  "completed_tasks": ["T1", "T2", "T3", "T4"],
  "context_usage_percent": 45,
  "last_heartbeat": "2024-01-01T12:05:00Z",
  "status": "in_progress"
}
```

### Parallel Batch Execution (--enable-parallel)

When `--enable-parallel` flag is set and a batch has multiple tasks, execute them in parallel using the Task tool.

**Step 1: Pre-Batch Checkpoint**

Before launching parallel tasks, save a checkpoint:

```bash
BATCH_TASKS='["T1", "T2", "T3"]'
TIMESTAMP=$(date -Iseconds)

cat > .initiative-progress.json << EOF
{
  "feature": { "issue_number": ${FEATURE_ID} },
  "current_group": {
    "id": ${GROUP_ID},
    "name": "${GROUP_NAME}",
    "batch": {
      "batch_id": ${BATCH_ID},
      "task_ids": ${BATCH_TASKS},
      "status": "launching"
    }
  },
  "parallel_execution": {
    "mode": "parallel",
    "batch_started_at": "${TIMESTAMP}",
    "agents": {}
  },
  "completed_tasks": ${COMPLETED_JSON},
  "status": "in_progress",
  "last_heartbeat": "${TIMESTAMP}"
}
EOF
```

**Step 2: Launch Parallel Sub-Agents**

For each task in the batch, launch a Task tool sub-agent with `run_in_background=true`:

```
Log: "⚡ Launching parallel batch ${batch.batch_id}: [${batch.task_ids}]"

For each task_id in batch.task_ids:
    Launch Task tool:
        description: "Implement ${task_id}: ${task.name}"
        subagent_type: "general-purpose"
        run_in_background: true
        prompt: |
            ## Task: ${task.name}

            **Task ID**: ${task_id}
            **Feature**: #${feature_id} - ${feature_name}
            **Action**: ${task.action.verb} ${task.action.target}

            ### Context
            **Files to reference**:
            ${task.context.files.join('\n')}

            **Constraints**:
            ${task.context.constraints.join('\n')}

            **Patterns to follow**:
            ${task.context.patterns.map(p => p.file + ': ' + p.description).join('\n')}

            ### Expected Outputs
            ${task.outputs.map(o => o.type + ': ' + o.path).join('\n')}

            ### Acceptance Criterion
            ${task.acceptance_criterion}

            ### Verification
            Run this command to verify completion:
            ```bash
            ${task.verification_command}
            ```

            ### Instructions
            1. Read the context files to understand patterns
            2. Implement the task following constraints
            3. Create/modify the output files as specified
            4. Run the verification command
            5. If verification fails, fix and retry (max 3 attempts)
            6. Report SUCCESS or FAILURE with details

            **IMPORTANT**: Do NOT commit changes. Just implement and verify.
            Return a JSON summary:
            ```json
            {
              "task_id": "${task_id}",
              "status": "success" | "failed" | "blocked",
              "files_modified": [...],
              "verification_passed": true | false,
              "error_message": null | "description if failed"
            }
            ```

    Store agent_id for later retrieval
```

**CRITICAL**: Launch ALL tasks in the batch in a SINGLE message with multiple Task tool calls. This enables true parallel execution.

Example of launching 3 tasks in parallel (single message with 3 tool calls):

```
<Task tool call 1>
  description: "Implement T1: Create types"
  run_in_background: true
  prompt: "## Task: Create dashboard types..."

<Task tool call 2>
  description: "Implement T2: Create loader"
  run_in_background: true
  prompt: "## Task: Create data loader..."

<Task tool call 3>
  description: "Implement T3: Create skeleton"
  run_in_background: true
  prompt: "## Task: Create skeleton component..."
```

**Step 3: Wait for All Agents**

After launching, use TaskOutput to wait for each agent:

```
Log: "⏳ Waiting for ${batch.task_ids.length} parallel tasks to complete..."

results = []
For each agent_id from launched agents:
    Use TaskOutput tool:
        task_id: agent_id
        block: true
        timeout: 300000  # 5 minutes per task

    Parse result JSON from agent output
    Append to results array

    # Update progress file with partial completion
    Update .initiative-progress.json with task status
```

**Step 4: Aggregate Results**

After all agents complete:

```
Log: "📊 Parallel batch results:"

successful_tasks = []
failed_tasks = []

For each result in results:
    If result.status == "success":
        Log: "  ✅ ${result.task_id}: Success"
        successful_tasks.push(result.task_id)
    Else:
        Log: "  ❌ ${result.task_id}: ${result.error_message}"
        failed_tasks.push(result.task_id)

# Update progress file
Update completed_tasks with successful_tasks
Update failed_tasks with failed_tasks
```

**Step 5: Handle Failures**

If any tasks in the batch failed:

```
IF failed_tasks.length > 0:
    Log: "⚠️ ${failed_tasks.length} tasks failed in parallel batch"

    For each failed_task in failed_tasks:
        # Option 1: Retry sequentially (recommended)
        Log: "🔄 Retrying ${failed_task} sequentially..."
        Execute task sequentially with full error handling

        # Option 2: Mark as blocked and continue
        # Mark task as blocked
        # Continue with next batch/group
```

**Step 6: Verification After Batch**

After parallel batch completes (including retries):

```
# Run typecheck to ensure all parallel changes integrate correctly
Log: "🔍 Running post-batch verification..."
pnpm typecheck

If typecheck fails:
    Log: "❌ Type errors after parallel batch - fixing..."
    # Fix type errors
    # This may happen if parallel tasks had hidden dependencies
```

**Progress File During Parallel Execution**:

```json
{
  "feature": { "issue_number": 1367 },
  "current_group": {
    "id": 1,
    "name": "Foundation",
    "batch": {
      "batch_id": 1,
      "task_ids": ["T1", "T2"],
      "status": "in_progress"
    }
  },
  "parallel_execution": {
    "mode": "parallel",
    "batch_started_at": "2024-01-01T12:00:00Z",
    "agents": {
      "T1": { "agent_id": "abc123", "status": "running" },
      "T2": { "agent_id": "def456", "status": "completed", "result": "success" }
    },
    "completed": ["T2"],
    "pending": ["T1"]
  },
  "completed_tasks": [],
  "status": "in_progress",
  "last_heartbeat": "2024-01-01T12:01:30Z"
}
```

### Task Implementation Guidelines

**For each task**:
1. **Read context.files** - Examine referenced files for patterns
2. **Follow context.constraints** - Strict adherence required
3. **Match context.patterns** - Follow existing code patterns
4. **Produce outputs** - Create/modify files as specified
5. **Run verification** - Execute verification_command
6. **Meet acceptance_criterion** - Binary done/not-done

### Database Task Handling

**Identifying Database Tasks**:
Tasks with `requires_database: true` require special handling. These tasks typically:
- Create or modify database schema files (in `apps/web/supabase/schemas/`)
- Create or modify migration files (in `apps/web/supabase/migrations/`)
- Define RLS policies, indexes, or constraints
- Require type generation after schema changes

**Database Task Workflow**:

```
IF task.requires_database == true:
    Log: "🗄️ Database task detected: ${task.name}"

    1. Check Supabase configuration:
       - Verify SUPABASE_ACCESS_TOKEN is set (for CLI operations)
       - Verify DATABASE_URL or SUPABASE_SANDBOX_DB_URL is set

    2. For schema file tasks (outputs contain schemas/*.sql):
       a. Create/modify schema file
       b. Generate migration: pnpm --filter web supabase:db:diff -f ${task.migration_name_prefix}
       c. Push to sandbox: cd apps/web && pnpm exec supabase db push
       d. Generate types: pnpm supabase:web:typegen
       e. Verify types exist in database.types.ts

    3. For RLS policy tasks:
       a. Create/modify policy in schema file
       b. Run migration diff
       c. Push and verify

    4. Verification MUST include:
       - Type generation succeeded
       - Types exist for new tables/columns
       - No TypeScript errors referencing DB types
```

**Migration Name Prefix**:
Each database task should have a `migration_name_prefix` to ensure unique migration filenames:
- Format: `{feature_id}_{task_id}` (e.g., `1367_T3`)
- This prevents conflicts when features run in parallel across sandboxes

**Example Database Task**:
```json
{
  "id": "T3",
  "name": "Create user_activities table schema",
  "requires_database": true,
  "migration_name_prefix": "1367_T3",
  "action": { "verb": "Create", "target": "user_activities table" },
  "outputs": [
    { "type": "new", "path": "apps/web/supabase/schemas/30-user-activities.sql" }
  ],
  "verification_command": "pnpm supabase:web:typegen && grep 'user_activities' apps/web/lib/database.types.ts"
}
```

**Database Task Verification Commands**:
```bash
# After schema changes, verify the full pipeline works:
cd apps/web

# Generate migration from schema changes
pnpm exec supabase db diff -f ${MIGRATION_PREFIX}_${TASK_ID}

# Push to sandbox database
pnpm exec supabase db push

# Generate TypeScript types
pnpm supabase:web:typegen

# Verify types were generated
grep 'table_name' ../web/lib/database.types.ts
```

**Important Notes**:
- Database tasks are serialized by the orchestrator (only one runs at a time)
- Always include the migration_name_prefix in generated migration filenames
- Type generation MUST succeed before marking a DB task complete
- If typegen fails, check for SQL syntax errors in the schema file

**Action Verbs** (from task.action.verb):
- `Create` - Create a new file
- `Add` - Add content to existing file
- `Update` - Modify existing content
- `Remove` - Delete content or file
- `Wire` - Connect components together
- `Extract` - Pull out reusable code
- `Rename` - Rename symbol or file
- `Move` - Move code to different location
- `Configure` - Update configuration
- `Test` - Write or run tests
- `Spike` - Research and document findings

### Phase 3: Validation & Commit

After each execution group:

1. **Run group validations**:
   ```bash
   # Type check
   pnpm typecheck

   # Lint
   pnpm lint
   ```

2. **Commit changes**:
   ```bash
   # Stage all changes
   git add -A

   # Create conventional commit
   git commit -m "feat(alpha): implement [task names] for #$ARGUMENTS

   Tasks completed:
   - [T1]: [task name]
   - [T2]: [task name]

   [agent: alpha-implement]"
   ```

3. **Push to remote**:
   ```bash
   git push origin HEAD
   ```

### Phase 4: Progress Reporting

**Progress File Format** (`.initiative-progress.json`):
```json
{
  "feature": {
    "issue_number": $ARGUMENTS,
    "title": "[from tasks.json]"
  },
  "phase": "executing",
  "current_task": {
    "id": "T5",
    "name": "[task name]",
    "status": "in_progress",
    "started_at": "2024-01-01T12:00:00Z",
    "verification_attempts": 1
  },
  "current_group": {
    "id": 2,
    "name": "[group name]",
    "tasks_total": 5,
    "tasks_completed": 4
  },
  "completed_tasks": ["T1", "T2", "T3", "T4"],
  "failed_tasks": [],
  "context_usage_percent": 45,
  "status": "in_progress",
  "last_commit": "[commit hash]",
  "last_heartbeat": "2024-01-01T12:05:00Z",
  "entries": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "type": "task_complete",
      "message": "Completed T4: Create dashboard types"
    }
  ]
}
```

**Update progress file after each task** (MUST include `last_heartbeat`):
```bash
# Write progress - ALWAYS include last_heartbeat with current timestamp
TIMESTAMP=$(date -Iseconds)
cat > .initiative-progress.json << EOF
{
  "feature": { "issue_number": ${FEATURE_ID}, "title": "${FEATURE_TITLE}" },
  "phase": "${PHASE}",
  "current_task": {
    "id": "${TASK_ID}",
    "name": "${TASK_NAME}",
    "status": "${STATUS}",
    "started_at": "${TASK_STARTED_AT}"
  },
  "current_group": {
    "id": ${GROUP_ID},
    "name": "${GROUP_NAME}",
    "tasks_total": ${GROUP_TOTAL},
    "tasks_completed": ${GROUP_COMPLETED}
  },
  "completed_tasks": ${COMPLETED_JSON},
  "failed_tasks": ${FAILED_JSON},
  "context_usage_percent": ${CONTEXT_PERCENT},
  "status": "in_progress",
  "last_heartbeat": "${TIMESTAMP}"
}
EOF
```

**CRITICAL**: Every progress file write MUST include `last_heartbeat` set to the current timestamp. The orchestrator uses this to detect stalled sessions.

### Phase 5: Exit Conditions

**Normal completion**:
- All tasks completed successfully
- Set status to "completed"
- Exit with code 0

**Context limit reached**:
- Context window > 60% full
- Save checkpoint with current task
- Set status to "context_limit"
- Exit with code 0 (orchestrator will resume)

**Task blocked**:
- Task fails verification 3+ times
- Set status to "blocked"
- Document the blocker
- Continue with next task if possible

**Fatal error**:
- Unrecoverable error
- Set status to "failed"
- Document error
- Exit with code 1

## Sub-Agent Delegation

Use these sub-agents to preserve context:

**For research**:
```
Task tool with subagent_type=alpha-context7:
"Research [topic] for implementing [task name].
Save findings to .ai/alpha/research/[topic].md"
```

**For code exploration**:
```
Task tool with subagent_type=code-explorer:
"Find all implementations of [pattern] in the codebase.
Focus on [specific areas]."
```

**For codebase search**:
```
Task tool with subagent_type=Explore:
"Explore the codebase to understand [component/pattern].
Return specific file paths and code snippets."
```

## Error Handling

**Verification failure**:
1. Read error output carefully
2. Identify root cause
3. Fix the issue
4. Retry verification
5. If 3 failures: mark as blocked, continue

**Type errors**:
```bash
pnpm typecheck 2>&1 | head -50
```
Fix errors iteratively until typecheck passes.

**Lint errors**:
```bash
pnpm lint:fix  # Auto-fix what's possible
pnpm lint      # Check remaining issues
```

## Example Execution

For Feature #1367 with 20 tasks in 7 groups:

```
=== Alpha Feature Implementation ===
Feature #1367: Dashboard Page & Grid Layout
Tasks: 20 | Groups: 7

[Loading Context]
✓ Found feature directory: .ai/alpha/specs/.../1367-Feature-dashboard-page-grid/
✓ Loaded tasks.json (20 tasks, 7 groups)
✓ Loaded research library (3 files)
✓ Loaded conditional docs (5 files)

[Group 1: Foundation]
→ T1: Create dashboard TypeScript types
  ✓ Created apps/web/app/home/(user)/_lib/types/dashboard.types.ts
  ✓ Verification passed: pnpm typecheck
→ T2: Create dashboard data loader skeleton
  ✓ Created apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts
  ✓ Verification passed
✓ Group 1 complete - Committing...
✓ Pushed: abc1234

[Group 2: Component Skeletons]
→ T3: Create dashboard skeleton component
  ✓ Created dashboard-skeleton.tsx
  ✓ Verification passed
...

[Context Check: 45% used]

[Group 7: Testing & Validation]
→ T16: Test page renders at /home route
  ✓ Verification passed
...

=== Implementation Complete ===
Status: completed
Tasks: 20/20 completed
Context: 58% used
Commits: 7
```

### Example with Parallel Execution (--enable-parallel)

For Feature #1369 with 6 tasks in 3 groups (5 parallelizable):

```
=== Alpha Feature Implementation ===
Feature #1369: Quick Actions Panel
Tasks: 6 | Groups: 3
Mode: PARALLEL EXECUTION ENABLED

[Loading Context]
✓ Found feature directory: .ai/alpha/specs/.../1369-Feature-quick-actions-panel/
✓ Loaded tasks.json (6 tasks, 3 groups)
✓ Parallel batches detected: 2 groups with parallelizable tasks

[Parallel Analysis]
⚡ Group 1: Core Components - 3 tasks can run in parallel
   Batch 1: [T1, T2, T3] - No file overlaps
   Speedup: 2.67x (8h → 3h)
⚡ Group 2: Integration - 2 tasks can run in parallel
   Batch 1: [T4, T5] - No file overlaps
   Speedup: 2x (4h → 2h)
📝 Group 3: Testing - sequential (1 task)

[Group 1: Core Components - PARALLEL]
⚡ Launching parallel batch 1: [T1, T2, T3]
   → Agent abc123: T1 - Create quick-action.types.ts
   → Agent def456: T2 - Create quick-action-button.tsx
   → Agent ghi789: T3 - Create quick-actions-panel.tsx

⏳ Waiting for 3 parallel tasks...
   ✅ T2: Completed (45s)
   ✅ T1: Completed (52s)
   ✅ T3: Completed (58s)

📊 Parallel batch results:
   ✅ T1: Success - Created types file
   ✅ T2: Success - Created button component
   ✅ T3: Success - Created panel component

🔍 Post-batch verification: pnpm typecheck ✅
✓ Group 1 complete (58s vs ~8min sequential) - Committing...
✓ Pushed: abc1234

[Group 2: Integration - PARALLEL]
⚡ Launching parallel batch 1: [T4, T5]
   → Agent jkl012: T4 - Wire panel to dashboard
   → Agent mno345: T5 - Add actions to nav

⏳ Waiting for 2 parallel tasks...
   ✅ T4: Completed (38s)
   ✅ T5: Completed (42s)

📊 Parallel batch results:
   ✅ T4: Success
   ✅ T5: Success

🔍 Post-batch verification: pnpm typecheck ✅
✓ Group 2 complete - Committing...
✓ Pushed: def5678

[Group 3: Testing - SEQUENTIAL]
→ T6: Test quick actions E2E
  ✓ Verification passed
✓ Group 3 complete - Committing...
✓ Pushed: ghi9012

=== Implementation Complete ===
Status: completed
Tasks: 6/6 completed
Parallel batches: 2 (5 tasks parallelized)
Time saved: ~60% (estimated)
Context: 42% used
Commits: 3
```

## Important Reminders

1. **CHECKPOINT BEFORE EACH TASK** - Save progress file with "starting" status BEFORE implementing
2. **Never skip tasks** - Execute ALL tasks in order (unless resuming)
3. **Always verify** - Run verification_command for every task
4. **Commit often** - After each execution group
5. **Report progress** - Update progress file after each task completes
6. **Preserve context** - Use sub-agents for exploration
7. **Exit cleanly** - Save state before context limit
8. **Handle --resume-from** - Skip completed tasks when resuming from crash
9. **Check parallel batches** - Run Phase 1.5 analysis before execution
10. **Use --parallel-dry-run** - Validate parallelism analysis before enabling parallel execution

## Parallel Execution Quick Reference

**Parallel is now DEFAULT** when `parallel_batches` exist in tasks.json.

**Normal execution (parallel enabled)**:
```bash
/alpha:implement 1367
```

**Dry run validation**:
```bash
/alpha:implement 1367 --parallel-dry-run
```

**Force sequential execution**:
```bash
/alpha:implement 1367 --sequential
```

**Check if parallelism is available**:
```
Look for group.parallel_batches in tasks.json
If batch.task_ids.length > 1 → Tasks will run in parallel
If group.parallelization_analysis.speedup_potential > 1 → Worth parallelizing
```

## Arguments

Feature ID: $ARGUMENTS
