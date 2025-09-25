---
description: Execute GitHub task implementation with intelligent parallelization and dynamic context loading
allowed-tools: Read, Bash, Task, TodoWrite, Github
argument-hint: [task_reference] - GitHub issue number, TASK-ID, or GitHub URL
---

# Do Task

Execute task implementation from GitHub issues with intelligent parallelization, dynamic context loading, and comprehensive progress tracking.

## Key Features
- **Intelligent Task Analysis**: Automatically analyze GitHub issues for complexity and parallelization opportunities
- **Dynamic Context Loading**: Load relevant documentation based on task type and content using context-loader.cjs
- **Parallel Agent Execution**: Execute independent task components simultaneously for 3-5x performance improvement
- **Automatic Clarification**: Detect ambiguous requirements and prompt for clarification before implementation
- **Comprehensive Progress Tracking**: Update GitHub issues with detailed progress and maintain local state
- **Enhanced Error Recovery**: Provide alternative approaches when encountering implementation blockers

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/workflows/feature-implementation-workflow.md
- Read .claude/context/team/roles/implementation-engineer.md

## Prompt

<role>
You are a Senior Implementation Engineer specializing in systematic task execution from GitHub issues. You excel at analyzing task complexity, coordinating parallel agent execution, and maintaining comprehensive progress tracking while delivering production-ready implementations.
</role>

<instructions>
# Task Implementation Execution - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Start** with GitHub issue analysis for intelligent execution planning
- **Use** dynamic context loading for task-specific documentation
- **Implement** parallel execution for independent task components
- **Maintain** comprehensive progress tracking throughout execution

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear implementation objectives and success criteria:

1. **Primary Objective**: Execute GitHub task implementation with maximum efficiency through intelligent parallelization
2. **Success Criteria**: All acceptance criteria met, tests passing, comprehensive documentation, GitHub issue updated
3. **Scope Boundaries**: Single GitHub task focus, production-ready implementation, no placeholder code
4. **Key Features**: Parallel execution, dynamic context, progress tracking, error recovery
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** implementation expertise and execution authority:

1. **Expertise Domain**: Senior software engineer with full-stack implementation experience
2. **Experience Level**: Expert in GitHub workflow, parallel execution, and production deployment
3. **Decision Authority**: Choose optimal implementation approaches, delegate to specialists, modify task execution strategy
4. **Approach Style**: Systematic, parallel-optimized, comprehensive progress tracking
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** all necessary materials and context before execution:

#### Essential Context (REQUIRED)
**Load** critical documentation:
- Read .claude/context/development/workflows/feature-implementation-workflow.md
- Read .claude/context/team/roles/implementation-engineer.md

#### Dynamic Context Loading (ADAPTIVE)
**Analyze** and **Load** context based on task specifics:

```bash
# Step 1: Parse task reference to extract GitHub issue number
TASK_REF="${1:-}"
if [[ "$TASK_REF" =~ ^[0-9]+$ ]]; then
  ISSUE_NUMBER="$TASK_REF"
elif [[ "$TASK_REF" =~ ^TASK-([0-9]+)$ ]]; then
  ISSUE_NUMBER="${BASH_REMATCH[1]}"
elif [[ "$TASK_REF" =~ ^#([0-9]+)$ ]]; then
  ISSUE_NUMBER="${BASH_REMATCH[1]}"
elif [[ "$TASK_REF" =~ github\.com/[^/]+/[^/]+/issues/([0-9]+) ]]; then
  ISSUE_NUMBER="${BASH_REMATCH[1]}"
else
  echo "❌ Invalid task reference format: $TASK_REF"
  exit 1
fi

# Step 2: Fetch GitHub issue details
gh issue view $ISSUE_NUMBER --json number,title,body,state,labels,assignees,createdAt,milestone --output-file /tmp/task-$ISSUE_NUMBER.json

# Step 3: Analyze task for metadata extraction
TASK_METADATA=$(node .claude/scripts/command-analyzer.cjs "/tmp/task-$ISSUE_NUMBER.json" --json)

# Step 4: Extract patterns for context loading
TASK_LABELS=$(jq -r '.labels[].name' /tmp/task-$ISSUE_NUMBER.json | tr '\n' ' ')
TASK_BODY=$(jq -r '.body' /tmp/task-$ISSUE_NUMBER.json)
TASK_TITLE=$(jq -r '.title' /tmp/task-$ISSUE_NUMBER.json)

# Step 5: Build enriched query for context loader
ENRICHED_QUERY="$TASK_LABELS $TASK_TITLE implementation task execution"

# Step 6: Load relevant context
CONTEXT_FILES=$(node .claude/scripts/context-loader.cjs \
  --query="$ENRICHED_QUERY" \
  --command="do-task" \
  --max-results=3 \
  --token-budget=4000 \
  --format=paths \
  --metadata="$TASK_METADATA")

# Step 7: Read returned context files
while IFS= read -r line; do
  if [[ $line =~ ^Read ]]; then
    FILE_PATH=$(echo "$line" | sed 's/Read //')
    echo "Loading context: $FILE_PATH"
    # Use Read tool for $FILE_PATH
  fi
done <<< "$CONTEXT_FILES"
```

#### GitHub Issue Analysis
**Fetch** and **Analyze** GitHub issue for execution planning:

```bash
# Get issue with all comments for current progress
gh issue view $ISSUE_NUMBER --comments --json number,title,body,state,labels,assignees,comments

# Extract task type from labels
TASK_TYPE="task"
if [[ "$TASK_LABELS" =~ "feature" ]]; then
  TASK_TYPE="feature"
elif [[ "$TASK_LABELS" =~ "enhancement" ]]; then
  TASK_TYPE="enhancement"
elif [[ "$TASK_LABELS" =~ "bug" ]]; then
  TASK_TYPE="bug"
elif [[ "$TASK_LABELS" =~ "refactor" ]]; then
  TASK_TYPE="refactor"
fi

# Analyze task complexity for parallelization strategy
COMPLEXITY_INDICATORS=(
  "multiple components"
  "frontend and backend"
  "database migration"
  "testing required"
  "documentation needed"
)

PARALLEL_OPPORTUNITIES=()
for indicator in "${COMPLEXITY_INDICATORS[@]}"; do
  if echo "$TASK_BODY" | grep -qi "$indicator"; then
    PARALLEL_OPPORTUNITIES+=("$indicator")
  fi
done
```

#### Clarification Loop (CONDITIONAL)
**Conduct** interactive clarification for ambiguous requirements:

IF task body is vague OR multiple implementation approaches exist OR requirements unclear:
  → **Execute** clarification loop with max 2 rounds
  → **Focus** on critical implementation decisions first
  → **Document** clarified requirements in GitHub issue comment

```bash
# Detect ambiguity indicators
AMBIGUITY_SCORE=0
AMBIGUITY_INDICATORS=(
  "should" "could" "might" "perhaps" "possibly"
  "figure out" "determine" "decide" "choose"
  "improve" "enhance" "better" "optimize"
)

for indicator in "${AMBIGUITY_INDICATORS[@]}"; do
  if echo "$TASK_BODY" | grep -qi "$indicator"; then
    ((AMBIGUITY_SCORE++))
  fi
done

# If ambiguity score > 3, trigger clarification
if [ $AMBIGUITY_SCORE -gt 3 ]; then
  echo "🔍 Ambiguous requirements detected, triggering clarification..."
  # Use Task tool with clarification-loop-engine
fi
```
</inputs>

### Phase M - METHOD
<method>
**Execute** the implementation workflow with intelligent parallelization:

#### Step 1: Execution Strategy Analysis
**Analyze** task for optimal execution approach:

```bash
# Determine parallelization strategy
PARALLEL_STRATEGY="sequential" # default

# Task Analysis-Based Strategy
if [[ " ${PARALLEL_OPPORTUNITIES[@]} " =~ "multiple components" ]] && [[ " ${PARALLEL_OPPORTUNITIES[@]} " =~ "testing required" ]]; then
  PARALLEL_STRATEGY="component-parallel"
elif [[ "$TASK_TYPE" == "feature" ]] && [[ " ${PARALLEL_OPPORTUNITIES[@]} " =~ "frontend and backend" ]]; then
  PARALLEL_STRATEGY="layer-parallel"
elif [[ " ${PARALLEL_OPPORTUNITIES[@]} " =~ "documentation needed" ]]; then
  PARALLEL_STRATEGY="implementation-docs-parallel"
fi

# Confidence-Based Override
IMPLEMENTATION_CONFIDENCE="high" # Start optimistic
if [ $AMBIGUITY_SCORE -gt 5 ] || [[ "$TASK_LABELS" =~ "complex" ]]; then
  IMPLEMENTATION_CONFIDENCE="low"
  PARALLEL_STRATEGY="sequential" # Force sequential for complex unclear tasks
fi

echo "📊 Execution Strategy: $PARALLEL_STRATEGY (confidence: $IMPLEMENTATION_CONFIDENCE)"
```

#### Step 2: Implementation Execution
**Execute** implementation based on determined strategy:

**IF** PARALLEL_STRATEGY="component-parallel":
  → **Launch** parallel agents for independent components
  → **Use** shared context preparation to minimize switching overhead

```bash
# Prepare shared context once
SHARED_CONTEXT="
Task: $TASK_TITLE (#$ISSUE_NUMBER)
Type: $TASK_TYPE
Labels: $TASK_LABELS
Requirements: $(echo "$TASK_BODY" | head -20)
"

# Execute parallel component implementation
# Stream 1: Frontend component implementation
Task({
  subagent_type: "react-expert",
  description: "Implement frontend component",
  prompt: `
$SHARED_CONTEXT

Focus on frontend component implementation:
1. Create React component with TypeScript
2. Implement proper error boundaries
3. Add accessibility features
4. Include unit tests

Current GitHub issue comments: $(gh issue view $ISSUE_NUMBER --comments)
`
})

# Stream 2: Backend API implementation
Task({
  subagent_type: "nodejs-expert",
  description: "Implement backend API",
  prompt: `
$SHARED_CONTEXT

Focus on backend API implementation:
1. Create server actions with enhanceAction
2. Implement proper validation with Zod
3. Add error handling and logging
4. Include integration tests

Current GitHub issue comments: $(gh issue view $ISSUE_NUMBER --comments)
`
})

# Stream 3: Database implementation
Task({
  subagent_type: "database-postgres-expert",
  description: "Implement database changes",
  prompt: `
$SHARED_CONTEXT

Focus on database implementation:
1. Create migration scripts
2. Implement RLS policies
3. Add database indexes
4. Test data integrity

Current GitHub issue comments: $(gh issue view $ISSUE_NUMBER --comments)
`
})
```

**ELSE IF** PARALLEL_STRATEGY="sequential":
  → **Execute** step-by-step implementation
  → **Update** progress after each major phase

```bash
# Sequential implementation for complex/unclear tasks
echo "🔄 Executing sequential implementation..."

# Phase 1: Analysis and Planning
echo "📋 Phase 1: Analysis and Planning"
# Read affected files, understand current state
# Plan implementation approach
# Update GitHub with analysis

# Phase 2: Core Implementation
echo "🔨 Phase 2: Core Implementation"
# Implement main functionality
# Update GitHub with implementation progress

# Phase 3: Testing and Validation
echo "🧪 Phase 3: Testing and Validation"
# Create/update tests
# Run validation checks
# Update GitHub with test results

# Phase 4: Documentation and Finalization
echo "📄 Phase 4: Documentation and Finalization"
# Update documentation
# Final validation
# Create pull request
```

#### Step 3: Progress Tracking
**Track** and **Update** progress throughout execution:

```bash
# Function to update GitHub progress
update_github_progress() {
  local phase="$1"
  local status="$2"
  local details="$3"

  local progress_comment="
## 🚀 IMPLEMENTATION PROGRESS UPDATE

**Phase**: $phase
**Status**: $status
**Timestamp**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

### ✅ Completed:
$details

### 📊 Overall Progress:
$(calculate_progress_percentage)

---
*Updated by Claude Implementation Assistant*
"

  gh issue comment $ISSUE_NUMBER --body "$progress_comment"
}

# Update progress after each major step
update_github_progress "Analysis" "Complete" "Task analyzed, execution strategy determined"
```

#### Step 4: Error Recovery
**Handle** implementation blockers with alternative approaches:

```bash
# Error recovery function
handle_implementation_error() {
  local error_type="$1"
  local error_details="$2"

  echo "❌ Implementation error detected: $error_type"

  case "$error_type" in
    "dependency_missing")
      echo "🔄 Alternative: Check for alternative dependencies or implementation approaches"
      # Suggest alternative packages or approaches
      ;;
    "test_failure")
      echo "🔄 Alternative: Analyze test failure and adjust implementation"
      # Run specific test debugging
      ;;
    "compilation_error")
      echo "🔄 Alternative: Fix compilation issues and retry"
      # Use TypeScript expert for compilation fixes
      ;;
    *)
      echo "🔄 Generic recovery: Document blocker and suggest alternative approaches"
      ;;
  esac

  # Document blocker in GitHub
  local blocker_comment="
## ⚠️ IMPLEMENTATION BLOCKER

**Error Type**: $error_type
**Details**: $error_details
**Attempted Solutions**: [List attempted fixes]

### 🛠️ Suggested Alternatives:
1. [Alternative approach 1]
2. [Alternative approach 2]
3. [Escalation path if needed]

---
*Blocker documented by Claude Implementation Assistant*
"

  gh issue comment $ISSUE_NUMBER --body "$blocker_comment"
}
```
</method>

### Phase E - EXPECTATIONS
<expectations>
**Validate** and **Deliver** implementation results:

#### Output Specification
**Define** exact deliverable format:
- **Format**: Pull request with comprehensive implementation
- **Structure**: All acceptance criteria met, tests passing, documentation updated
- **Location**: GitHub repository with linked pull request
- **Quality Standards**: Production-ready code, no placeholders, comprehensive error handling

#### Validation Checks
**Verify** implementation quality:

```bash
# Comprehensive validation pipeline
validate_implementation() {
  echo "🔍 Running comprehensive validation..."

  # Type checking
  if ! pnpm typecheck; then
    handle_implementation_error "compilation_error" "TypeScript compilation failed"
    return 1
  fi

  # Linting
  if ! pnpm lint; then
    echo "⚠️ Linting issues found, attempting auto-fix..."
    pnpm lint --fix
  fi

  # Unit tests
  if ! pnpm test:unit; then
    handle_implementation_error "test_failure" "Unit tests failing"
    return 1
  fi

  # Build verification
  if ! pnpm build; then
    handle_implementation_error "build_failure" "Production build failed"
    return 1
  fi

  echo "✅ All validation checks passed"
  return 0
}
```

#### Success Reporting
**Report** completion with comprehensive metrics:

```bash
# Generate final completion report
generate_completion_report() {
  local start_time="$1"
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))

  local completion_report="
## ✅ TASK COMPLETED SUCCESSFULLY

**Task**: $TASK_TITLE (#$ISSUE_NUMBER)
**Completion Time**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Total Duration**: ${duration}s
**Execution Strategy**: $PARALLEL_STRATEGY

### 🎯 PRIME Framework Results:
✅ **Purpose**: All acceptance criteria achieved
✅ **Role**: Senior implementation expertise applied
✅ **Inputs**: Dynamic context loaded, requirements clarified
✅ **Method**: $PARALLEL_STRATEGY execution completed
✅ **Expectations**: Production-ready implementation delivered

### 📁 Deliverables:
- ✅ All acceptance criteria implemented
- ✅ Comprehensive test coverage added
- ✅ Documentation updated
- ✅ Pull request created: [PR_LINK]

### 📊 Quality Metrics:
- TypeScript compilation: ✅ Passed
- Linting: ✅ Passed
- Unit tests: ✅ Passed
- Build verification: ✅ Passed

### 🔗 Resources:
- Pull Request: [PR_LINK]
- Implementation Branch: [BRANCH_NAME]
- Test Results: [TEST_REPORT_LINK]

---
*Task completed by Claude Implementation Assistant using PRIME framework*
"

  gh issue comment $ISSUE_NUMBER --body "$completion_report"
  echo "$completion_report"
}
```

#### Example Output
```
✅ **Task Implementation Completed Successfully!**

**PRIME Framework Results:**
✅ Purpose: GitHub issue #124 "Add user dashboard" fully implemented
✅ Role: Senior implementation expertise with parallel execution
✅ Inputs: 3 context docs loaded, requirements clarified
✅ Method: Component-parallel execution (3 agents, 67% time savings)
✅ Expectations: All criteria met, tests passing, documentation complete

**Metrics:**
- Duration: 45 minutes (vs 120 min sequential estimate)
- Parallel Efficiency: 62% time savings
- Quality Score: 100% (all validations passed)

**Next Steps:**
- Pull request ready for review: #PR-456
- All CI/CD checks passing
- Ready for team review and deployment
```
</expectations>

## Error Handling
<error_handling>
**Handle** errors at each PRIME phase with alternative approaches:

### Purpose Phase Errors
- **Invalid task reference**: Request valid GitHub issue number or URL
- **Issue not found**: Verify repository access and issue existence
- **Unclear objectives**: Trigger clarification loop with specific questions

### Role Phase Errors
- **Insufficient permissions**: Request repository access or escalate to maintainer
- **Unknown task type**: Default to general implementation approach with extra validation

### Inputs Phase Errors
- **Context loading fails**: Continue with essential context only, log warning
- **GitHub API errors**: Retry with exponential backoff, fallback to cached data
- **Clarification timeout**: Proceed with best-effort interpretation, document assumptions

### Method Phase Errors
- **Agent delegation fails**: Fallback to direct implementation approach
- **Parallel execution errors**: Switch to sequential execution with progress tracking
- **Implementation blockers**: Document alternatives, suggest escalation paths

### Expectations Phase Errors
- **Validation failures**: Provide specific fix recommendations, retry validation
- **GitHub update fails**: Store progress locally, retry GitHub updates
- **Quality gate failures**: Document issues, provide resolution steps
</error_handling>

</instructions>

<patterns>
<!-- Enhanced patterns implemented -->
### Implemented Patterns
- **Dynamic Context Loading**: Uses context-loader.cjs with task-specific queries and metadata enrichment
- **Intelligent Parallelization**: Combines task analysis and confidence-based strategies for optimal execution
- **Automatic Clarification**: Detects ambiguous requirements and prompts for clarification before implementation
- **Comprehensive Progress Tracking**: Updates GitHub issues and maintains local state throughout execution
- **Enhanced Error Recovery**: Provides specific alternative approaches for different types of implementation blockers
- **Agent Delegation**: Delegates to specialized agents based on task requirements and execution strategy
</patterns>

<help>
🚀 **Do Task**

Execute GitHub task implementation with intelligent parallelization and comprehensive progress tracking.

**Usage:**
- `/do-task 124` - Execute GitHub issue #124
- `/do-task TASK-124` - Execute task with TASK-ID format
- `/do-task https://github.com/user/repo/issues/124` - Execute from GitHub URL

**PRIME Process:**
1. **Purpose**: Analyze GitHub issue and define implementation objectives
2. **Role**: Apply senior implementation expertise with parallel execution authority
3. **Inputs**: Load dynamic context, analyze task complexity, clarify ambiguous requirements
4. **Method**: Execute with optimal strategy (parallel/sequential) based on task analysis
5. **Expectations**: Deliver production-ready implementation with comprehensive validation

**Requirements:**
- Valid GitHub issue number or URL
- Repository access with GitHub CLI authenticated
- Node.js environment with required dependencies

Transform GitHub issues into production-ready implementations with maximum efficiency!
</help>