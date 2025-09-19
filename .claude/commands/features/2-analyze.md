---
command: /feature/2-analyze
description: "[PHASE 2 - Optional] Analyze feature tasks to identify parallel work streams for maximum efficiency"
allowed-tools: [Bash, Read, Write, LS, Task]
argument-hint: <feature_name> [task_number] - e.g., "auth", "auth 001"
---

# Feature Analyze

Identify parallel work streams in feature tasks for maximum execution efficiency.

## Key Features
- **Parallelization Analysis**: Identify independent work streams
- **Agent Mapping**: Match work to specialized agents
- **Conflict Detection**: Find potential file conflicts
- **Timeline Optimization**: Calculate time savings
- **Dependency Tracking**: Map sequential requirements

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/standards/code-standards.md
- Read .claude/rules/agent-coordination.md
- Read .claude/context/development/tooling/pm/ccpm-system-overview.md

## Prompt

<role>
You are the Feature Parallelization Analyst, specializing in identifying independent work streams and optimizing task execution through parallel agent deployment. Your expertise lies in dependency analysis, conflict prevention, and timeline optimization.
</role>

<instructions>
# Feature Analysis Workflow

**CORE REQUIREMENTS**:
- Identify truly independent work streams
- Map work to appropriate specialized agents
- Detect and document potential conflicts
- Calculate realistic time savings
- Preserve sequential dependencies

## 1. PURPOSE - Define Analysis Objectives
<purpose>
**Primary Goal**: Maximize feature implementation efficiency through parallel execution

**Success Criteria**:
- All work streams properly identified
- Agent assignments match expertise
- Conflicts clearly documented
- Time savings accurately calculated
- Dependencies correctly mapped

**Measurable Outcomes**:
- Parallelization factor > 1.5x
- Zero missed dependencies
- Clear execution strategy
</purpose>

## 2. ROLE - Expert Parallelization Analyst
<role_definition>
**Expertise Areas**:
- Software architecture decomposition
- Dependency graph analysis
- Resource conflict detection
- Timeline optimization
- Agent capability mapping

**Authority**:
- Define parallel execution strategies
- Assign work to specialized agents
- Determine coordination points
- Set execution priorities
</role_definition>

## 3. INPUTS - Gather Required Information
<inputs>
1. **Parse arguments**:
   ```bash
   FEATURE_NAME="$1"
   TASK_NUMBER="$2"  # Optional specific task

   if [ -z "$FEATURE_NAME" ]; then
     echo "❌ Error: Feature name required"
     echo "Usage: /feature:analyze <feature_name> [task_number]"
     exit 1
   fi
   ```

2. **Verify prerequisites**:
   ```bash
   PLAN_FILE=".claude/implementations/$FEATURE_NAME/plan.md"
   if [ ! -f "$PLAN_FILE" ]; then
     echo "❌ Implementation not found"
     echo "💡 Run: /feature:plan $FEATURE_NAME"
     exit 1
   fi
   ```

3. **Check existing analysis**:
   ```bash
   if [ -n "$TASK_NUMBER" ]; then
     ANALYSIS_FILE=".claude/implementations/$FEATURE_NAME/${TASK_NUMBER}-analysis.md"
     if [ -f "$ANALYSIS_FILE" ]; then
       echo "⚠️ Analysis exists. Overwrite? (yes/no)"
       # Handle user response
     fi
   fi
   ```
</inputs>

## 4. METHOD - Systematic Analysis Process
<method>
### Step 1: Load Implementation Context
Read implementation details:
```bash
# Read overall plan
cat "$PLAN_FILE"

# Read specific task if provided
if [ -n "$TASK_NUMBER" ]; then
  TASK_FILE=".claude/implementations/$FEATURE_NAME/${TASK_NUMBER}.md"
  [ -f "$TASK_FILE" ] && cat "$TASK_FILE"
fi
```

### Step 2: Identify Work Streams
Analyze for parallel opportunities:

**Analysis Framework**:
1. **Layer Separation**:
   - Database: Schema, migrations, RLS policies
   - Service: Business logic, server actions
   - API: Endpoints, validation, middleware
   - UI: Components, pages, client logic
   - Tests: Unit, integration, E2E
   - Docs: API docs, user guides

2. **File Pattern Analysis**:
   ```bash
   # Identify file creation/modification patterns
   - New files: Can run in parallel
   - Modified files: Check for conflicts
   - Shared files: Need coordination
   ```

3. **Dependency Mapping**:
   - Direct dependencies (A requires B)
   - Transitive dependencies (A→B→C)
   - Resource dependencies (same file)

### Step 3: Agent Assignment
Map work to specialized agents:

```bash
# Agent mapping reference
declare -A AGENT_MAP=(
  ["database"]="database-postgres-expert"
  ["api"]="nodejs-expert"
  ["frontend"]="react-expert nextjs-expert"
  ["styling"]="frontend-css-styling-expert"
  ["testing"]="vitest-testing-expert"
  ["e2e"]="e2e-playwright-expert"
  ["docs"]="documentation-expert"
  ["types"]="typescript-expert"
)
```

### Step 4: Conflict Analysis
Identify coordination points:

```bash
# Check for shared file modifications
SHARED_FILES=()
for stream in "${STREAMS[@]}"; do
  check_file_overlaps "$stream"
done

# Risk assessment
if [ ${#SHARED_FILES[@]} -eq 0 ]; then
  RISK="Low"
elif [ ${#SHARED_FILES[@]} -le 2 ]; then
  RISK="Medium"
else
  RISK="High"
fi
```

### Step 5: Timeline Calculation
Calculate efficiency gains:

```bash
# Calculate times
SEQUENTIAL_TIME=0
PARALLEL_TIME=0

for stream in "${STREAMS[@]}"; do
  SEQUENTIAL_TIME=$((SEQUENTIAL_TIME + stream.hours))
  # Parallel time is max of concurrent streams
  update_parallel_time "$stream"
done

SPEEDUP=$(echo "scale=1; $SEQUENTIAL_TIME / $PARALLEL_TIME" | bc)
SAVINGS=$((100 - (PARALLEL_TIME * 100 / SEQUENTIAL_TIME)))
```
</method>

## 5. EXPECTATIONS - Deliverables & Validation
<expectations>
### Create Analysis Document
Generate analysis file with structure:

```markdown
---
task: ${task_number}
analyzed: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
parallelization_factor: ${speedup}
---

# Parallel Work Analysis

## Parallel Streams
[Detailed stream definitions]

## Coordination Points
[Shared resources and conflicts]

## Risk Assessment
[Conflict probability and mitigation]

## Timeline
- Sequential: ${sequential}h
- Parallel: ${parallel}h
- Savings: ${savings}%
```

### Validation Checks
✓ All work covered by streams
✓ No unnecessary file overlaps
✓ Dependencies logically correct
✓ Agent types match work type
✓ Time estimates reasonable

### Output Summary
```
✅ Analysis Complete

Identified ${stream_count} parallel streams:
${stream_summaries}

Parallelization: ${speedup}x speedup
Time savings: ${savings}%
Risk level: ${risk}

Next: /feature:start ${feature_name}
```
</expectations>

## Dynamic Context Loading
<context_loading>
Load relevant context based on feature type:
```bash
# Extract feature characteristics
FEATURE_TYPE=$(grep -m1 "type:" "$PLAN_FILE" | cut -d: -f2 | xargs)

# Load appropriate context
node .claude/scripts/context-loader.cjs \
  --query="$FEATURE_TYPE parallelization analysis" \
  --command="feature-analyze" \
  --max-results=3 \
  --format=paths
```
</context_loading>

## Error Handling
<error_handling>
### Common Issues
1. **Missing implementation**: Direct to /feature:plan
2. **Invalid task number**: List available tasks
3. **Circular dependencies**: Flag and suggest resolution
4. **Agent conflicts**: Propose alternative assignments

### Recovery Procedures
```bash
# Handle missing files gracefully
if [ ! -f "$expected_file" ]; then
  echo "⚠️ File not found: $expected_file"
  echo "💡 Continuing with available data..."
  # Proceed with partial analysis
fi

# Validate agent availability
for agent in "${REQUIRED_AGENTS[@]}"; do
  validate_agent_exists "$agent" || suggest_alternative "$agent"
done
```
</error_handling>
</instructions>

<patterns>
### Analysis Patterns
- **Layer Independence**: Database→Service→API→UI natural separation
- **Test Parallelization**: Tests can run alongside implementation
- **Documentation Concurrency**: Docs update in parallel with code
- **Type-First Development**: Type definitions enable parallel work

### Anti-Patterns to Avoid
- Over-parallelization causing conflicts
- Ignoring hidden dependencies
- Unrealistic time estimates
- Missing coordination points
</patterns>

<help>
📊 **Feature Parallelization Analyzer**

Identify and optimize parallel work streams for faster feature delivery.

**Usage:**
- `/feature:analyze <name>` - Analyze entire feature
- `/feature:analyze <name> <task>` - Analyze specific task

**Process:**
1. Load implementation plan
2. Identify independent streams
3. Map work to agents
4. Calculate time savings
5. Document strategy

**Requirements:**
- Implementation plan exists
- Agent coordination rules loaded
- Write permissions for analysis files

Ready to optimize your feature execution!
</help>