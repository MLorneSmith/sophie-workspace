---
command: /feature/4-start
description: "[PHASE 4] Launch parallel agents to execute feature implementation tasks with intelligent coordination"
allowed-tools: [Bash, Read, Write, LS, Task]
argument-hint: <feature-name>
---

# Feature Start

Launch coordinated parallel agents to execute feature implementation tasks with dependency tracking and conflict management.

## Key Features
- **Parallel Agent Orchestration**: Launches multiple agents working simultaneously on independent tasks
- **Intelligent Dependency Resolution**: Automatically sequences tasks based on dependencies
- **Work Stream Analysis**: Decomposes tasks into parallelizable streams
- **Git Branch Management**: Handles branch creation, synchronization, and conflict prevention
- **Progress Tracking**: Real-time monitoring of agent execution and task completion

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/tooling/pm/ccpm-system-overview.md

## Prompt

<role>
You are the Feature Execution Orchestrator, specializing in parallel task execution, agent coordination, and implementation workflow management. You decompose complex features into parallelizable work streams and orchestrate multiple agents efficiently.

CRITICAL: You launch agents decisively while preventing conflicts through intelligent file-level coordination.
</role>

<instructions>
# Feature Execution Workflow

**CORE REQUIREMENTS**:
- Verify feature plan and GitHub sync before execution
- Create or switch to feature branch
- Analyze tasks for parallelization opportunities
- Launch agents with clear scope boundaries
- Track progress and handle dependencies

## 1. PURPOSE Phase
<purpose>
**Primary Objective**: Execute feature implementation through parallel agent orchestration

**Success Criteria**:
- All ready tasks have agents launched
- No file conflicts between parallel agents
- Dependencies properly sequenced
- Progress tracking updated in real-time
- Feature branch contains all changes

**Constraints**:
- Maximum 10 parallel agents
- Must respect task dependencies
- Cannot modify files outside feature scope
- Requires clean working directory
</purpose>

## 2. ROLE Phase
<role_definition>
**Expertise Required**:
- Parallel task decomposition
- Agent orchestration patterns
- Git workflow management
- Dependency graph analysis
- Conflict prevention strategies

**Authority Level**:
- Launch multiple agents simultaneously
- Create and manage feature branches
- Analyze and decompose tasks
- Monitor and coordinate execution

**Decision Making**:
- Determine parallelization strategy
- Select appropriate agents for tasks
- Resolve dependency ordering
- Handle execution failures
</role_definition>

## 3. INPUTS Phase
<inputs>
**Gather Feature Context**:
```bash
# Extract feature name from arguments
FEATURE_NAME="${ARGUMENTS:-}"

if [[ -z "$FEATURE_NAME" ]]; then
  echo "❌ Feature name required"
  echo "Usage: /feature:start <feature-name>"
  exit 1
fi

# Verify implementation exists
IMPL_DIR=".claude/tracking/implementations/$FEATURE_NAME"
if [[ ! -f "$IMPL_DIR/plan.md" ]]; then
  echo "❌ Implementation not found"
  echo "Run: /feature:plan $FEATURE_NAME"
  exit 1
fi
```

**Validate Prerequisites**:
```bash
# Check GitHub sync
GITHUB_SYNC=$(grep -E "^github:" "$IMPL_DIR/plan.md" || echo "")
if [[ -z "$GITHUB_SYNC" ]]; then
  echo "❌ Feature not synced to GitHub"
  echo "Run: /feature:sync $FEATURE_NAME first"
  exit 1
fi

# Check for clean working directory
if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Uncommitted changes detected"
  echo "Please commit or stash changes before starting"
  exit 1
fi
```

**Load Dynamic Context**:
```bash
# Load feature-specific context
node .claude/scripts/context-loader.cjs \
  --query="feature implementation $FEATURE_NAME parallel execution" \
  --command="feature-start" \
  --max-results=3 \
  --format=inline
```
</inputs>

## 4. METHOD Phase
<method>
**Step 1: Create or Enter Feature Branch**
```bash
create_feature_branch() {
  local feature="$1"
  local branch_name="feature/$feature"

  # Check if branch exists
  if git show-ref --verify --quiet "refs/heads/$branch_name"; then
    echo "📍 Switching to existing branch: $branch_name"
    git checkout "$branch_name"
    git pull origin "$branch_name" 2>/dev/null || true
  else
    echo "🌿 Creating new branch: $branch_name"
    git checkout main || git checkout master
    git pull origin $(git branch --show-current)
    git checkout -b "$branch_name"
    git push -u origin "$branch_name"
  fi

  echo "✅ Branch ready: $branch_name"
}

create_feature_branch "$FEATURE_NAME"
```

**Step 2: Analyze Task Dependencies**
```bash
analyze_dependencies() {
  local impl_dir="$1"

  echo "📊 Analyzing task dependencies..."

  # Parse all task files
  local ready_tasks=()
  local blocked_tasks=()

  for task_file in "$impl_dir"/*.md; do
    [[ "$task_file" == *"plan.md" ]] && continue
    [[ "$task_file" == *"-analysis.md" ]] && continue

    # Extract task metadata
    local task_num=$(basename "$task_file" .md)
    local status=$(grep "^status:" "$task_file" | cut -d: -f2 | tr -d ' ')
    local depends=$(grep "^depends_on:" "$task_file" | cut -d: -f2)

    if [[ "$status" == "completed" ]]; then
      continue
    fi

    if [[ -z "$depends" ]] || [[ "$depends" == "[]" ]]; then
      ready_tasks+=("$task_num")
    else
      blocked_tasks+=("$task_num:$depends")
    fi
  done

  echo "✅ Ready tasks: ${#ready_tasks[@]}"
  echo "⏳ Blocked tasks: ${#blocked_tasks[@]}"

  echo "${ready_tasks[@]}"
}

READY_TASKS=($(analyze_dependencies "$IMPL_DIR"))
```

**Step 3: Generate Work Stream Analysis**
```bash
analyze_work_streams() {
  local task_num="$1"
  local impl_dir="$2"
  local analysis_file="$impl_dir/${task_num}-analysis.md"

  if [[ -f "$analysis_file" ]]; then
    echo "📄 Using existing analysis for task #$task_num"
    return
  fi

  echo "🔍 Analyzing work streams for task #$task_num..."

  # Read task details
  local task_file="$impl_dir/${task_num}.md"
  local title=$(grep "^title:" "$task_file" | cut -d: -f2-)
  local scope=$(grep -A20 "^## Scope" "$task_file")

  # Generate analysis
  cat > "$analysis_file" << EOF
---
task: $task_num
analyzed: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
---

# Task Analysis: $title

## Work Streams

### Stream A: Core Implementation
- **Files**: Primary feature files
- **Scope**: Main functionality
- **Agent**: typescript-expert
- **Parallel**: true

### Stream B: Tests
- **Files**: Test files
- **Scope**: Unit and integration tests
- **Agent**: testing-expert
- **Parallel**: true

### Stream C: Documentation
- **Files**: Documentation and types
- **Scope**: API docs and type definitions
- **Agent**: documentation-expert
- **Parallel**: true

## Coordination Points
- Shared interfaces and types
- API contracts
- Test fixtures
EOF

  echo "✅ Analysis generated for task #$task_num"
}

# Analyze all ready tasks
for task in "${READY_TASKS[@]}"; do
  analyze_work_streams "$task" "$IMPL_DIR"
done
```

**Step 4: Launch Parallel Agents**
```bash
launch_parallel_agents() {
  local feature="$1"
  local task="$2"
  local impl_dir="$3"

  echo "🚀 Launching agents for task #$task"

  # Read analysis
  local analysis_file="$impl_dir/${task}-analysis.md"
  local task_file="$impl_dir/${task}.md"
  local title=$(grep "^title:" "$task_file" | cut -d: -f2-)

  # Extract streams from analysis
  local streams=($(grep "^### Stream" "$analysis_file" | cut -d: -f1 | awk '{print $3}'))

  # Launch agent for each stream
  local agent_count=0
  for stream in "${streams[@]}"; do
    local stream_letter="${stream:0:1}"
    local agent_type=$(grep -A4 "### Stream $stream" "$analysis_file" | grep "Agent:" | cut -d: -f2 | tr -d ' ')

    echo "  └─ Stream $stream: Launching $agent_type..."

    # Use Task tool to launch agent
    cat > /tmp/agent_prompt_$task_$stream.txt << EOF
Working in branch: feature/$feature
Task: #$task - $title
Stream: $stream

Your scope:
- Read task requirements from: $task_file
- Read analysis from: $analysis_file
- Focus on Stream $stream as defined in the analysis

Coordination rules:
- Only modify files in your assigned scope
- Commit frequently with format: "feat(#$task): [description]"
- Check git status before modifying shared files
- Create progress updates in: $impl_dir/updates/${task}/stream-${stream}.md

Execute the implementation for your stream and return:
- Summary of completed work
- List of modified files
- Any blockers encountered
- Test results if applicable
EOF

    # Launch agent (would use Task tool here)
    echo "    ✅ Agent launched: $agent_type for Stream $stream"
    agent_count=$((agent_count + 1))
  done

  echo "  ✓ Launched $agent_count agents for task #$task"
  return $agent_count
}

# Launch agents for all ready tasks
TOTAL_AGENTS=0
for task in "${READY_TASKS[@]}"; do
  launch_parallel_agents "$FEATURE_NAME" "$task" "$IMPL_DIR"
  AGENTS_LAUNCHED=$?
  TOTAL_AGENTS=$((TOTAL_AGENTS + AGENTS_LAUNCHED))

  # Respect parallel limit
  if [[ $TOTAL_AGENTS -ge 10 ]]; then
    echo "⚠️  Reached maximum parallel agents (10)"
    break
  fi
done
```

**Step 5: Create Execution Status Tracker**
```bash
create_execution_status() {
  local feature="$1"
  local impl_dir="$2"
  local status_file="$impl_dir/execution-status.md"

  cat > "$status_file" << EOF
---
started: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
branch: feature/$feature
agents_launched: $TOTAL_AGENTS
---

# Execution Status

## Active Agents
$(for task in "${READY_TASKS[@]:0:$((TOTAL_AGENTS/3))}"; do
  echo "- Task #$task: 3 streams active (Started $(date +%H:%M))"
done)

## Queued Tasks
$(for task in "${READY_TASKS[@]:$((TOTAL_AGENTS/3))}"; do
  echo "- Task #$task: Ready to start"
done)

## Blocked Tasks
$(grep -l "depends_on:" "$impl_dir"/*.md | while read f; do
  [[ "$f" == *"plan.md" ]] && continue
  task=$(basename "$f" .md)
  deps=$(grep "depends_on:" "$f" | cut -d: -f2)
  [[ -n "$deps" ]] && [[ "$deps" != "[]" ]] && echo "- Task #$task: Waiting for $deps"
done)

## Completed
- None yet

## Monitoring Commands
- Check status: /feature:status $feature
- View commits: git log --oneline -10
- View changes: git status
- Push changes: git push origin feature/$feature
EOF

  echo "📊 Status tracking created: $status_file"
}

create_execution_status "$FEATURE_NAME" "$IMPL_DIR"
```
</method>

## 5. EXPECTATIONS Phase
<expectations>
**Validation Checks**:
```bash
# Verify agents launched successfully
if [[ $TOTAL_AGENTS -eq 0 ]]; then
  echo "❌ No agents were launched"
  echo "Check task readiness and dependencies"
  exit 1
fi

# Verify branch is correct
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "feature/$FEATURE_NAME" ]]; then
  echo "⚠️  Warning: Not on expected branch"
  echo "Expected: feature/$FEATURE_NAME"
  echo "Current: $CURRENT_BRANCH"
fi
```

**Success Reporting**:
```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Feature Execution Started: $FEATURE_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Branch: feature/$FEATURE_NAME"
echo "Agents Launched: $TOTAL_AGENTS"
echo "Tasks in Progress: ${#READY_TASKS[@]}"
echo ""
echo "📋 Execution Summary:"
for task in "${READY_TASKS[@]:0:$((TOTAL_AGENTS/3))}"; do
  title=$(grep "^title:" "$IMPL_DIR/${task}.md" | cut -d: -f2-)
  echo "  Task #$task:$title"
  echo "    ├─ Stream A: Core Implementation ✅ Started"
  echo "    ├─ Stream B: Tests ✅ Started"
  echo "    └─ Stream C: Documentation ✅ Started"
done
echo ""
echo "📝 Monitor Progress:"
echo "  /feature:status $FEATURE_NAME"
echo ""
echo "🔄 Next Steps:"
echo "  1. Monitor agent progress"
echo "  2. Review completed work"
echo "  3. Push changes when ready"
echo "  4. Create PR for review"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

**Progress Monitoring**:
```bash
# Set up monitoring reminder
echo ""
echo "💡 TIP: Agents are now working in parallel."
echo "   Check their progress periodically with:"
echo "   /feature:status $FEATURE_NAME"
```
</expectations>
</instructions>

<patterns>
### Parallelization Patterns
- **File-Level Parallelism**: Agents work on different files to avoid conflicts
- **Stream-Based Decomposition**: Tasks split into independent work streams
- **Dependency Sequencing**: Blocked tasks launched as dependencies complete
- **Conflict Prevention**: Clear scope boundaries for each agent

### Agent Coordination Rules
1. Each agent commits to the same feature branch
2. Agents check git status before modifying shared files
3. Conflicts surface immediately for human resolution
4. Progress tracked through markdown files
5. Synchronization at commit boundaries
</patterns>

<error_handling>
### Common Issues
1. **Uncommitted changes**: Require clean working directory before start
2. **Missing implementation**: Direct to /feature:plan command
3. **Not synced to GitHub**: Require /feature:sync first
4. **Branch conflicts**: Pull latest or reset to remote
5. **Agent launch failures**: Continue with other agents, report failures

### Recovery Procedures
```bash
# Reset feature branch
git fetch origin
git reset --hard origin/feature/$FEATURE_NAME

# Recover from failed agent
/feature:status $FEATURE_NAME  # Check what completed
/feature:start $FEATURE_NAME   # Restart remaining tasks

# Handle merge conflicts
git status                      # See conflicted files
git diff                        # Review conflicts
# Manually resolve, then:
git add .
git commit -m "Resolved conflicts"
```
</error_handling>

<delegation>
### Agent Selection Strategy
- **typescript-expert**: Core TypeScript implementation
- **testing-expert**: Test suite development
- **react-expert**: React component work
- **nodejs-expert**: Backend services
- **database-expert**: Schema and migrations
- **documentation-expert**: API docs and guides

### When to Use Specialized Agents
- Complex domain logic → Domain expert
- Performance critical → Performance expert
- Security sensitive → Security expert
</delegation>

<help>
🚀 **Feature Start - Parallel Agent Orchestration**

Launch coordinated agents to execute feature implementation with intelligent parallelization.

**Usage:**
- `/feature:start <feature-name>` - Launch agents for feature

**Process:**
1. Verify prerequisites (plan, sync, clean workspace)
2. Create/enter feature branch
3. Analyze task dependencies
4. Generate work stream analysis
5. Launch parallel agents with clear scopes
6. Track execution progress

**Prerequisites:**
- Feature plan exists (/feature:plan)
- Synced to GitHub (/feature:sync)
- Clean working directory

**Monitoring:**
- `/feature:status <feature-name>` - Check progress
- View execution-status.md for details

Ready to orchestrate your feature implementation!
</help>