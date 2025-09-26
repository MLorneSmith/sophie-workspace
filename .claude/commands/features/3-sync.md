---
command: /feature/3-sync
description: "[PHASE 3] Push feature implementation plan and tasks to GitHub as issues with parallel processing and comprehensive validation"
allowed-tools: Bash, Read, Write, LS, Task, Grep, Glob
argument-hint: <feature_name>
---

# Feature Sync

**Synchronize** feature implementation plans and decomposed tasks to GitHub as structured issues using parallel processing and comprehensive validation.

## Key Features
- **Parent-Child Issues**: Uses gh-sub-issue extension for proper GitHub issue hierarchy
- **Parallel Issue Creation**: Process 5+ tasks simultaneously for 3x faster execution
- **Smart Renaming**: Transform task files from sequential numbers to GitHub issue IDs
- **Reference Updates**: Automatically update depends_on and conflicts_with arrays
- **Validation Checks**: Comprehensive validation of GitHub integration and task structure
- **Agent Delegation**: Leverage specialized agents for optimal parallel processing

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/tooling/pm/ccpm-system-overview.md
- Read .claude/context/development/workflows/feature-implementation-workflow.md

## Prompt

<role>
You are a **Feature Synchronization Specialist**, expert in GitHub integration, CCPM workflows, and parallel task orchestration. You have **full authority** to create GitHub issues, rename task files, and coordinate agent delegation for optimal performance. Your approach is **pragmatic and systematic**, ensuring reliable GitHub synchronization while maintaining data integrity.
</role>

<instructions>
# Feature Sync Workflow - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Start** all instructions with action verbs
- **Implement** parallel processing for 5+ tasks
- **Validate** GitHub integration at each phase
- **Maintain** task reference integrity throughout

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear GitHub synchronization outcomes:

1. **Primary Objective**: Transform local feature implementation plan into GitHub issue ecosystem with proper task hierarchy
2. **Success Criteria**:
   - Feature issue created with comprehensive summary
   - All task files converted to GitHub issues with proper references
   - Task dependencies updated with actual issue numbers
   - GitHub mapping file generated for tracking
3. **Scope Boundaries**:
   - Include: Implementation plan, decomposed tasks, dependency mapping
   - Exclude: Execution monitoring, issue status tracking
4. **Performance Target**: Complete synchronization in under 2 minutes for typical features (10-15 tasks)
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** AI expertise and authority:

1. **Expertise Domain**: GitHub API integration, CCPM workflow orchestration, parallel task processing
2. **Experience Level**: Expert-level knowledge of GitHub CLI, issue management, and agent coordination
3. **Decision Authority**: Full autonomy to create issues, rename files, coordinate agents, and handle synchronization conflicts
4. **Approach Style**: Systematic and reliable with emphasis on data integrity and performance optimization
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** all necessary materials before execution:

#### Essential Context (REQUIRED)
**Load** critical CCPM documentation:
- Read .claude/context/development/tooling/pm/ccpm-system-overview.md
- Read .claude/context/development/workflows/feature-implementation-workflow.md

#### Dynamic Context Loading
**Analyze** and **Load** GitHub integration patterns:

```bash
# Extract feature-specific metadata for enhanced context loading
FEATURE_NAME="$ARGUMENTS"
IMPLEMENTATION_PATH=".claude/tracking/implementations/$FEATURE_NAME"

# Count tasks to determine processing strategy
TASK_COUNT=$(find "$IMPLEMENTATION_PATH" -name "[0-9][0-9][0-9].md" -type f 2>/dev/null | wc -l)

# Build enriched query for context loading
ENRICHED_QUERY="github-integration parallel-processing task-management ccpm-workflow issue-creation"

# Load relevant GitHub and CCPM patterns
CONTEXT_FILES=$(node .claude/scripts/context-loader.cjs \
  --query="$ENRICHED_QUERY github issue-creation parallel-agents" \
  --command="feature-sync" \
  --max-results=2 \
  --token-budget=2000 \
  --format=paths \
  --metadata="{\"taskCount\":$TASK_COUNT,\"feature\":\"$FEATURE_NAME\"}")

# Process returned context files
while IFS= read -r line; do
  if [[ $line =~ ^Read ]]; then
    FILE_PATH=$(echo "$line" | sed 's/Read //')
    echo "Loading context: $FILE_PATH"
    # Use Read tool for $FILE_PATH
  fi
done <<< "$CONTEXT_FILES"
```

#### Materials & Constraints
**Validate** implementation requirements:
- **Feature Argument**: Extract and validate feature name from $ARGUMENTS
- **Implementation Plan**: Verify .claude/tracking/implementations/$ARGUMENTS/plan.md exists
- **Task Files**: Count decomposed task files (*.md excluding plan.md)
- **GitHub Authentication**: Verify gh CLI authentication status
- **Repository Context**: Confirm GitHub repository configuration
</inputs>

### Phase M - METHOD
<method>
**Execute** the synchronization workflow with action verbs:

#### 1. **Validate** Prerequisites
```bash
# Verify implementation plan exists
test -f ".claude/tracking/implementations/$ARGUMENTS/plan.md" || {
  echo "❌ Implementation plan not found. Run: /feature:plan $ARGUMENTS"
  exit 1
}

# Count and validate task files
TASK_COUNT=$(find .claude/tracking/implementations/$ARGUMENTS -name "[0-9][0-9][0-9].md" -type f 2>/dev/null | wc -l)
if [ "$TASK_COUNT" -eq 0 ]; then
  echo "❌ No tasks to sync. Run: /feature:decompose $ARGUMENTS"
  exit 1
fi

# Verify GitHub authentication and repository
gh auth status || {
  echo "❌ GitHub authentication required. Run: gh auth login"
  exit 1
}

# Verify gh-sub-issue extension is installed
gh extension list 2>/dev/null | grep -q "gh sub-issue" || {
  echo "⚠️ gh-sub-issue extension not found. Installing..."
  gh extension install yahsan2/gh-sub-issue || {
    echo "❌ Failed to install gh-sub-issue extension"
    exit 1
  }
  echo "✅ gh-sub-issue extension installed successfully"
}

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
[[ -n "$REPO" ]] || {
  echo "❌ Not in a GitHub repository or gh CLI not authenticated"
  exit 1
}
```

#### 2. **Create** Feature Implementation Issue
```bash
# Extract and process implementation plan content
sed '1,/^---$/d; 1,/^---$/d' .claude/tracking/implementations/$ARGUMENTS/plan.md > /tmp/feature-body-raw.md

# Process content to add implementation summary
awk '/^## Tasks Created/ { in_tasks=1; next }
     /^## / && in_tasks { in_tasks=0; if(total_tasks) print "## Implementation Summary\n**Total tasks**: " total_tasks "\n**Parallel tasks**: " parallel_tasks "\n**Sequential tasks**: " sequential_tasks }
     /^Total tasks:/ && in_tasks { total_tasks = $3; next }
     /^Parallel tasks:/ && in_tasks { parallel_tasks = $3; next }
     /^Sequential tasks:/ && in_tasks { sequential_tasks = $3; next }
     !in_tasks { print }' /tmp/feature-body-raw.md > /tmp/feature-body.md

# Add specification reference
echo -e "\n---\n📋 **Specification**: .claude/tracking/specs/$ARGUMENTS.md\n📁 **Implementation**: .claude/tracking/implementations/$ARGUMENTS/" >> /tmp/feature-body.md

# Create feature issue with proper labels
FEATURE_NUMBER=$(gh issue create \
  --title "Feature: $ARGUMENTS" \
  --body-file /tmp/feature-body.md \
  --label "feature,implementation,feature:$ARGUMENTS" \
  --json number -q .number)

echo "✅ Created feature issue: #$FEATURE_NUMBER"
```

#### 3. **Process** Task Creation with Strategy Selection
```bash
# Determine processing strategy based on task count
if [ "$TASK_COUNT" -lt 5 ]; then
  echo "Creating tasks sequentially..."
else
  echo "Creating $TASK_COUNT tasks in parallel..."
fi
```

#### Sequential Task Creation (< 5 tasks)
```bash
for task_file in $(find .claude/tracking/implementations/$ARGUMENTS -name "[0-9][0-9][0-9].md" -type f | sort); do
  [[ -f "$task_file" ]] || continue

  # Extract task metadata
  TASK_NAME=$(grep '^name:' "$task_file" | sed 's/^name: *//')
  TASK_SIZE=$(grep '^effort:' "$task_file" | sed 's/.*effort: *//')

  # Strip frontmatter for GitHub issue body
  sed '1,/^---$/d; 1,/^---$/d' "$task_file" > /tmp/task-body.md

  # Add parent reference to body
  echo -e "\n---\n**Parent Feature**: #${FEATURE_NUMBER}" >> /tmp/task-body.md

  # Create sub-issue using gh-sub-issue extension
  ISSUE_OUTPUT=$(gh sub-issue create "$FEATURE_NUMBER" \
    --title "Task: $TASK_NAME" \
    --body "$(cat /tmp/task-body.md)" \
    --label "task,size:$TASK_SIZE" 2>&1)

  # Extract issue number from output
  TASK_NUMBER=$(echo "$ISSUE_OUTPUT" | grep -oE '#[0-9]+' | head -1 | tr -d '#')

  # Record mapping for file updates
  echo "$task_file:$TASK_NUMBER" >> /tmp/task-mapping.txt
  echo "  ✅ Created sub-task #$TASK_NUMBER: $TASK_NAME"
done
```

#### Parallel Task Creation (≥ 5 tasks)
```bash
# Function to create sub-issue
create_sub_issue() {
  local task_file="$1"
  local parent_issue="$2"
  local batch_num="$3"

  # Extract task metadata
  TASK_NAME=$(grep '^name:' "$task_file" | sed 's/^name: *//')
  TASK_SIZE=$(grep '^effort:' "$task_file" | sed 's/.*effort: *//')

  # Strip frontmatter for GitHub issue body
  sed '1,/^---$/d; 1,/^---$/d' "$task_file" > "/tmp/task-body-${batch_num}.md"

  # Add parent reference to body
  echo -e "\n---\n**Parent Feature**: #${parent_issue}" >> "/tmp/task-body-${batch_num}.md"

  # Create sub-issue using gh-sub-issue extension
  ISSUE_OUTPUT=$(gh sub-issue create "$parent_issue" \
    --title "Task: $TASK_NAME" \
    --body "$(cat /tmp/task-body-${batch_num}.md)" \
    --label "task,size:$TASK_SIZE" 2>&1)

  # Extract issue number from output
  TASK_NUMBER=$(echo "$ISSUE_OUTPUT" | grep -oE '#[0-9]+' | head -1 | tr -d '#')

  # Record mapping for this batch
  echo "$task_file:$TASK_NUMBER" >> "/tmp/batch-${batch_num}-mapping.txt"
  echo "  ✅ Created sub-task #$TASK_NUMBER: $TASK_NAME"
}

export -f create_sub_issue

# Create tasks in parallel batches
BATCH_NUM=0
> /tmp/task-mapping.txt

# Process tasks in parallel (max 3 at a time for API rate limits)
find .claude/tracking/implementations/$ARGUMENTS -name "[0-9][0-9][0-9].md" -type f | sort | while read -r task_file; do
  ((BATCH_NUM++))

  # Launch background process for parallel creation
  create_sub_issue "$task_file" "$FEATURE_NUMBER" "$BATCH_NUM" &

  # Limit parallel processes to avoid API rate limits
  if [ $((BATCH_NUM % 3)) -eq 0 ]; then
    wait  # Wait for current batch to complete
  fi
done

# Wait for all remaining background processes
wait

# Consolidate all batch mappings
cat /tmp/batch-*-mapping.txt >> /tmp/task-mapping.txt 2>/dev/null || true
echo "📦 Created $TASK_COUNT sub-tasks in parallel"
```

#### 4. **Update** Task Files with Issue Numbers
```bash
# Build mapping from old task numbers to GitHub issue IDs
> /tmp/id-mapping.txt
while IFS=: read -r task_file task_number; do
  OLD_NUM=$(basename "$task_file" .md)
  echo "$OLD_NUM:$task_number" >> /tmp/id-mapping.txt
done < /tmp/task-mapping.txt

# Update task files with GitHub issue numbers and references
while IFS=: read -r task_file task_number; do
  NEW_NAME="$(dirname "$task_file")/${task_number}.md"

  # Read and update content
  CONTENT=$(cat "$task_file")

  # Update dependency references with new issue numbers
  while IFS=: read -r old_num new_num; do
    CONTENT=$(echo "$CONTENT" | sed "s/\b$old_num\b/$new_num/g")
  done < /tmp/id-mapping.txt

  # Write updated content and add GitHub metadata
  echo "$CONTENT" > "$NEW_NAME"
  [[ "$task_file" != "$NEW_NAME" ]] && rm "$task_file"

  # Update frontmatter with GitHub URL and timestamp
  GITHUB_URL="https://github.com/$REPO/issues/$task_number"
  CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  sed -i.bak "/^github:/c\github: $GITHUB_URL" "$NEW_NAME"
  sed -i.bak "/^updated:/c\updated: $CURRENT_DATE" "$NEW_NAME"
  rm "${NEW_NAME}.bak"

  echo "  ✅ Transformed: $(basename $task_file) → $(basename $NEW_NAME)"
done < /tmp/task-mapping.txt
```

#### 5. **Generate** Implementation Tracking
```bash
# Update implementation plan with GitHub integration
FEATURE_URL="https://github.com/$REPO/issues/$FEATURE_NUMBER"
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

sed -i.bak "/^github:/c\github: $FEATURE_URL" .claude/tracking/implementations/$ARGUMENTS/plan.md
sed -i.bak "/^updated:/c\updated: $CURRENT_DATE" .claude/tracking/implementations/$ARGUMENTS/plan.md
rm .claude/tracking/implementations/$ARGUMENTS/plan.md.bak

# Create comprehensive GitHub mapping file
cat > .claude/tracking/implementations/$ARGUMENTS/github-mapping.md << EOF
# GitHub Issue Mapping

**Parent Feature**: #${FEATURE_NUMBER} - https://github.com/${REPO}/issues/${FEATURE_NUMBER}
**Created**: $CURRENT_DATE
**Hierarchy**: Parent-Child relationship using gh-sub-issue

## Sub-Tasks
EOF

# List all sub-tasks with proper formatting
for task_file in $(find .claude/tracking/implementations/$ARGUMENTS -name "[0-9]*.md" -type f | sort); do
  [[ -f "$task_file" ]] || continue
  ISSUE_NUM=$(basename "$task_file" .md)
  TASK_NAME=$(grep '^name:' "$task_file" | sed 's/^name: *//')
  echo "- ↳ #${ISSUE_NUM}: ${TASK_NAME} - https://github.com/${REPO}/issues/${ISSUE_NUM}" >> .claude/tracking/implementations/$ARGUMENTS/github-mapping.md
done

# Add viewing instructions
cat >> .claude/tracking/implementations/$ARGUMENTS/github-mapping.md << EOF

## View Hierarchy
- **GitHub UI**: Open parent issue #${FEATURE_NUMBER} to see all sub-tasks
- **CLI**: \`gh sub-issue list ${FEATURE_NUMBER}\`

---
Synced: $CURRENT_DATE
EOF
```

#### 6. **Create** Development Branch
```bash
# Establish feature branch for development
git checkout main
git pull origin main --ff-only 2>/dev/null || true

BRANCH_NAME="feature/$ARGUMENTS"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

echo "✅ Created/switched to branch: $BRANCH_NAME"
```
</method>

### Phase E - EXPECTATIONS
<expectations>
**Validate** and **Deliver** synchronization results:

#### Output Specification
**Define** exact deliverables:
- **Format**: GitHub issues with proper hierarchy and labels
- **Structure**: Feature issue with linked task sub-issues
- **Location**: GitHub repository issues tracker + local mapping files
- **Quality Standards**: All references updated, no broken dependencies, comprehensive tracking

#### Validation Checks
**Verify** synchronization quality:

```bash
# Validate GitHub integration completeness
VALIDATION_OUTPUT=$(node .claude/scripts/command-analyzer.cjs ".claude/tracking/implementations/$ARGUMENTS/github-mapping.md" --json)

# Check task completeness
GITHUB_TASKS=$(wc -l < /tmp/task-mapping.txt)
LOCAL_TASKS=$(find .claude/tracking/implementations/$ARGUMENTS -name "[0-9]*.md" -type f 2>/dev/null | wc -l)

if [[ "$GITHUB_TASKS" -eq "$LOCAL_TASKS" ]]; then
  echo "✅ Validation passed: All tasks synchronized"
else
  echo "⚠️ Validation warning: Task count mismatch (GitHub: $GITHUB_TASKS, Local: $LOCAL_TASKS)"
fi

# Verify GitHub URLs are accessible
gh issue view "$FEATURE_NUMBER" --json title -q .title >/dev/null && echo "✅ Feature issue verified"
```

#### Error Handling
**Handle** synchronization failures:
- **GitHub Auth Errors**: Redirect to `gh auth login` with clear instructions
- **Rate Limiting**: Implement exponential backoff and retry logic
- **Partial Sync Failures**: Report successful operations and provide recovery steps
- **Network Issues**: Graceful degradation with offline capability hints

#### Success Reporting
**Report** completion with comprehensive metrics:

```
✅ **Feature Sync Completed Successfully!**

**PRIME Framework Results:**
✅ Purpose: GitHub parent-child issue hierarchy created with $TASK_COUNT sub-tasks
✅ Role: Feature synchronization specialist applied
✅ Inputs: CCPM context and GitHub patterns loaded
✅ Method: $([[ $TASK_COUNT -ge 5 ]] && echo "Parallel" || echo "Sequential") processing with gh-sub-issue
✅ Expectations: All validation checks passed

**Issue Hierarchy Created:**
- Parent Feature: #$FEATURE_NUMBER
- Sub-Tasks: $TASK_COUNT child issues linked to parent
- Processing Strategy: $([[ $TASK_COUNT -ge 5 ]] && echo "Parallel (max 3 concurrent)" || echo "Sequential")
- Branch Created: feature/$ARGUMENTS
- Files Updated: Task references and dependencies

**Links:**
- Parent Feature: https://github.com/$REPO/issues/$FEATURE_NUMBER
- View Sub-Tasks: gh sub-issue list $FEATURE_NUMBER
- Mapping: .claude/tracking/implementations/$ARGUMENTS/github-mapping.md

**Next Steps:**
- Start implementation: /do-task $(find .claude/tracking/implementations/$ARGUMENTS -name "[0-9]*.md" -type f | sort | head -1 | xargs basename .md)
- Track progress: /feature:status $ARGUMENTS
- View hierarchy: gh sub-issue list $FEATURE_NUMBER
```
</expectations>

## Error Handling
<error_handling>
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- Missing feature argument: **Request** specific feature name
- Invalid feature name: **Validate** against existing specifications

### Role Phase Errors
- GitHub CLI unavailable: **Guide** user through gh installation
- Repository not configured: **Provide** git remote setup instructions

### Inputs Phase Errors
- Implementation plan missing: **Direct** to /feature:plan command
- No decomposed tasks: **Direct** to /feature:decompose command
- Context loading fails: **Continue** with essential context only

### Method Phase Errors
- GitHub API failures: **Retry** with exponential backoff up to 3 attempts
- Agent delegation timeout: **Fallback** to sequential processing
- File operation errors: **Preserve** original files and report conflicts

### Expectations Phase Errors
- Validation failures: **Report** inconsistencies but allow completion
- GitHub URL verification fails: **Warn** but continue with local updates
</error_handling>
</instructions>

<patterns>
### Implemented Patterns
- **PRIME Framework**: Systematic Purpose → Role → Inputs → Method → Expectations flow
- **Parent-Child Hierarchy**: GitHub native sub-issue relationships using gh-sub-issue extension
- **Dynamic Context Loading**: CCPM and GitHub pattern detection using context-loader.cjs
- **Parallel Sub-Issue Creation**: Batch processing with rate limit awareness (max 3 concurrent)
- **Validation Checks**: GitHub integration verification using command-analyzer.cjs
- **Error Recovery**: Graceful failure handling with clear recovery paths
- **Performance Optimization**: Intelligent sequential vs parallel processing strategy
</patterns>

<help>
🔄 **Feature Sync**

**Synchronize** local feature implementation plans to GitHub with proper parent-child issue hierarchy using gh-sub-issue extension.

**Usage:**
- `/feature:sync <feature_name>` - Create parent issue and child sub-tasks
- `/feature:sync my-awesome-feature` - Creates hierarchical GitHub issues

**Issue Hierarchy:**
- Creates one **parent** feature issue
- Links all tasks as **child** sub-issues using gh-sub-issue
- Sub-tasks appear within parent issue for progress tracking
- Native GitHub parent-child relationships preserved

**PRIME Process:**
1. **Purpose**: Transform local CCPM implementation into GitHub parent-child hierarchy
2. **Role**: Feature synchronization specialist with GitHub expertise
3. **Inputs**: Load CCPM context and validate implementation files
4. **Method**: Create parent issue, then sub-issues using gh-sub-issue extension
5. **Expectations**: Deliver validated GitHub hierarchy with comprehensive tracking

**Requirements:**
- Completed feature implementation plan (`/feature:plan <name>`)
- Decomposed tasks (`/feature:decompose <name>`)
- GitHub CLI authentication (`gh auth login`)
- gh-sub-issue extension (auto-installs if missing)
- Valid Git repository with GitHub remote

**Performance**: Processes 5+ tasks in parallel batches (max 3 concurrent) for optimal API usage!
</help>