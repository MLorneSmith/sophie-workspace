---
allowed-tools: Bash, Read, Write, LS, Task
---

# Feature Start

Launch parallel agents to work on feature tasks.

## Usage
```
/feature:start <feature_name>
```

## Quick Check

1. **Verify implementation exists:**
   ```bash
   test -f .claude/implementations/$ARGUMENTS/plan.md || echo "❌ Implementation not found. Run: /feature:plan $ARGUMENTS"
   ```

2. **Check GitHub sync:**
   Look for `github:` field in plan frontmatter.
   If missing: "❌ Feature not synced. Run: /feature:sync $ARGUMENTS first"

3. **Check for branch:**
   ```bash
   git branch -a | grep "feature/$ARGUMENTS"
   ```

4. **Check for uncommitted changes:**
   ```bash
   git status --porcelain
   ```
   If output is not empty: "❌ You have uncommitted changes. Please commit or stash them before starting a feature"

## Instructions

### 1. Create or Enter Branch

```bash
# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ You have uncommitted changes. Please commit or stash them before starting."
  exit 1
fi

# If branch doesn't exist, create it
if ! git branch -a | grep -q "feature/$ARGUMENTS"; then
  git checkout main
  git pull origin main
  git checkout -b feature/$ARGUMENTS
  git push -u origin feature/$ARGUMENTS
  echo "✅ Created branch: feature/$ARGUMENTS"
else
  git checkout feature/$ARGUMENTS
  git pull origin feature/$ARGUMENTS
  echo "✅ Using existing branch: feature/$ARGUMENTS"
fi
```

### 2. Identify Ready Tasks

Read all task files in `.claude/implementations/$ARGUMENTS/`:
- Parse frontmatter for `status`, `depends_on`, `parallel` fields
- Check GitHub issue status if synced
- Build dependency graph

Categorize tasks:
- **Ready**: No unmet dependencies, status is "open"
- **Blocked**: Has unmet dependencies
- **In Progress**: Already being worked on
- **Complete**: Finished

### 3. Analyze Work Streams

For each ready task without analysis:
```bash
# Check for task analysis
if ! test -f .claude/implementations/$ARGUMENTS/${task}-analysis.md; then
  echo "Analyzing task #${task}..."
  # Create analysis inline
fi
```

Generate task analysis with work streams:
```markdown
---
task: ${task_number}
analyzed: ${datetime}
---

# Task Analysis: ${task_name}

## Work Streams

### Stream A: ${component_type}
- **Files**: ${file_patterns}
- **Scope**: ${description}
- **Agent**: ${recommended_agent}
- **Parallel**: true

### Stream B: ${component_type}
- **Files**: ${file_patterns}
- **Scope**: ${description}
- **Agent**: ${recommended_agent}
- **Parallel**: true

## Coordination Points
- ${shared_files_or_resources}
```

### 4. Launch Parallel Agents

For each ready task with analysis:

```markdown
## Starting Task #${task}: ${title}

Reading analysis...
Found ${count} parallel streams:
  - Stream A: ${description} (Agent-${id})
  - Stream B: ${description} (Agent-${id})

Launching agents in branch: feature/$ARGUMENTS
```

Use Task tool to launch each stream:
```yaml
Task:
  description: "Task #${task} Stream ${X}"
  subagent_type: "${agent_type}"
  prompt: |
    Working in branch: feature/$ARGUMENTS
    Task: #${task} - ${title}
    Stream: ${stream_name}
    
    Your scope:
    - Files: ${file_patterns}
    - Work: ${stream_description}
    
    Read full requirements from:
    - .claude/implementations/$ARGUMENTS/${task_file}
    - .claude/implementations/$ARGUMENTS/${task}-analysis.md
    
    Follow these coordination rules:
    - Only modify files in your assigned scope
    - Commit frequently with message format: "Task #${task}: ${specific_change}"
    - If you need files outside your scope, note it and continue
    - Check git status before modifying shared files
    
    Commit frequently with message format:
    "Task #${task}: ${specific_change}"
    
    Update progress in:
    .claude/implementations/$ARGUMENTS/updates/${task}/stream-${X}.md
    
    Return a summary of:
    - What you completed
    - Files modified
    - Any blockers
    - Tests results if applicable
```

### 5. Track Active Agents

Create/update `.claude/implementations/$ARGUMENTS/execution-status.md`:

```markdown
---
started: ${datetime}
branch: feature/$ARGUMENTS
---

# Execution Status

## Active Agents
- Agent-1: Task #1234 Stream A (Database) - Started ${time}
- Agent-2: Task #1234 Stream B (API) - Started ${time}
- Agent-3: Task #1235 Stream A (UI) - Started ${time}

## Queued Tasks
- Task #1236 - Waiting for #1234
- Task #1237 - Waiting for #1235

## Completed
- ${None yet or list}
```

### 6. Monitor and Coordinate

Set up monitoring:
```bash
echo "
Agents launched successfully!

Monitor progress:
  /feature:status $ARGUMENTS
  
View branch changes:
  git log --oneline -10
  
View active work:
  git status
  
When complete:
  git push origin feature/$ARGUMENTS
  gh pr create
"
```

### 7. Handle Dependencies

As agents complete streams:
- Check if any blocked tasks are now ready
- Launch new agents for newly-ready work
- Update execution-status.md

## Parallel Execution Strategy

### Identify Parallelizable Work
Tasks can run in parallel if they:
- Have no dependencies on each other
- Work on different files (no conflicts)
- Are marked with `parallel: true`

### Stream Assignment
Break each task into work streams:
- **Database Stream**: Schema, migrations, models
- **API Stream**: Endpoints, services, validation
- **UI Stream**: Components, pages, styles
- **Test Stream**: Unit tests, integration tests

### Agent Coordination Rules
1. **File-level parallelism**: Agents working on different files never conflict
2. **Explicit coordination**: When same file needed, coordinate through git
3. **Fail fast**: Surface conflicts immediately
4. **Human resolution**: Conflicts are resolved by humans, not agents

### Synchronization Points
- After each commit
- Before starting new file
- When switching work streams
- Every 30 minutes of work

## Output Format

```
🚀 Feature Execution Started: $ARGUMENTS

Branch: feature/$ARGUMENTS

Launching ${total} agents across ${task_count} tasks:

Task #1234: Database Schema
  ├─ Stream A: Schema creation (Agent-1) ✓ Started
  └─ Stream B: Migrations (Agent-2) ✓ Started

Task #1235: API Endpoints  
  ├─ Stream A: User endpoints (Agent-3) ✓ Started
  ├─ Stream B: Post endpoints (Agent-4) ✓ Started
  └─ Stream C: Tests (Agent-5) ⏸ Waiting for A & B

Blocked Tasks (2):
  - #1236: UI Components (depends on #1234)
  - #1237: Integration (depends on #1235, #1236)

Monitor with: /feature:status $ARGUMENTS
```

## Error Handling

If agent launch fails:
```
❌ Failed to start Agent-${id}
  Task: #${task}
  Stream: ${stream}
  Error: ${reason}

Continue with other agents? (yes/no)
```

If uncommitted changes are found:
```
❌ You have uncommitted changes. Please commit or stash them before starting.

To commit changes:
  git add .
  git commit -m "Your commit message"
  
To stash changes:
  git stash push -m "Work in progress"
  # (Later restore with: git stash pop)
```

If branch creation fails:
```
❌ Cannot create branch
  ${git error message}
  
Try: git branch -d feature/$ARGUMENTS
Or: Check existing branches with: git branch -a
```

## Important Notes

- Agents work in the SAME branch (not separate branches)
- Maximum parallel agents should be reasonable (e.g., 5-10)
- Monitor system resources if launching many agents
- Each agent commits directly to the feature branch
- Conflicts are handled through git's normal mechanisms
- Progress is tracked through markdown files and git commits