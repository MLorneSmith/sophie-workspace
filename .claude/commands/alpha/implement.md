---
description: Implement all tasks for a feature from Alpha workflow. Reads tasks.json, executes sequentially with sub-agents, validates, commits, and reports progress to orchestrator
argument-hint: <feature-id>
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion, WebFetch, WebSearch]
---

# Alpha Feature Implementation

Implement ALL tasks for Feature #$ARGUMENTS from the Alpha autonomous coding workflow.

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

### Phase 2: Execute Tasks

Execute tasks in order, respecting execution groups:

```
For each execution_group (sorted by group.id ascending):
    For each task_id in group.task_ids:
        1. Mark task as in_progress (in TodoWrite and tasks.json)
        2. Read task context and constraints
        3. Implement the task using the action verb
        4. Run verification_command
        5. If verification fails:
           - Fix the issue
           - Retry (max 3 attempts)
           - If still failing, mark as blocked
        6. Mark task as completed
        7. Update progress file

    After completing group:
        - Commit changes with conventional format
        - Push to remote
        - Check context usage - exit if > 60%
```

### Task Implementation Guidelines

**For each task**:
1. **Read context.files** - Examine referenced files for patterns
2. **Follow context.constraints** - Strict adherence required
3. **Match context.patterns** - Follow existing code patterns
4. **Produce outputs** - Create/modify files as specified
5. **Run verification** - Execute verification_command
6. **Meet acceptance_criterion** - Binary done/not-done

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
  "current_task": {
    "id": "T5",
    "name": "[task name]",
    "index": 5,
    "total": 20
  },
  "completed_tasks": ["T1", "T2", "T3", "T4"],
  "failed_tasks": [],
  "context_usage_percent": 45,
  "status": "in_progress",
  "last_commit": "[commit hash]",
  "entries": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "type": "task_complete",
      "message": "Completed T4: Create dashboard types"
    }
  ]
}
```

**Update progress file after each task**:
```bash
# Write progress (use jq or node to update JSON)
cat > .initiative-progress.json << 'EOF'
{
  "feature": { ... },
  "current_task": { ... },
  "completed_tasks": [...],
  "status": "in_progress",
  ...
}
EOF
```

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

## Important Reminders

1. **Never skip tasks** - Execute ALL tasks in order
2. **Always verify** - Run verification_command for every task
3. **Commit often** - After each execution group
4. **Report progress** - Update progress file after each task
5. **Preserve context** - Use sub-agents for exploration
6. **Exit cleanly** - Save state before context limit

## Arguments

Feature ID: $ARGUMENTS
