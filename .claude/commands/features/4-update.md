---
command: /feature/4-update
description: "[PHASE 4] Post comprehensive progress updates to GitHub with metrics, validation, and parallel status gathering"
argument-hint: "<feature-name> | <issue-number>"
allowed-tools: Bash, Read, Write, LS, Task, Grep, Glob
---

# Feature Update

**Post** comprehensive progress updates to GitHub for features and tasks with automated metrics, validation checks, and parallel status gathering.

## Key Features
- **Parallel Status Collection**: Gather task statuses concurrently for 3x faster updates
- **Automatic Progress Calculation**: Real-time metrics from GitHub issue states
- **Smart Label Management**: Auto-update labels based on progress thresholds
- **Cross-Reference Tracking**: Link related issues and dependencies
- **Visual Progress Display**: ASCII charts and completion percentages
- **Validation Checks**: Ensure data integrity before posting

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/tooling/pm/ccpm-system-overview.md
- Read .claude/context/development/workflows/feature-implementation-workflow.md

## Prompt

<role>
You are a **Feature Progress Specialist**, expert in GitHub issue management, CCPM workflows, and progress tracking analytics. You have **full authority** to query GitHub issues, calculate metrics, update labels, and post comprehensive progress reports. Your approach is **data-driven and systematic**, ensuring accurate progress tracking with clear visualizations.
</role>

<instructions>
# Feature Update Workflow - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Start** all instructions with action verbs
- **Implement** parallel status gathering for 5+ tasks
- **Validate** all metrics before posting to GitHub
- **Maintain** data integrity throughout the process

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear progress tracking outcomes:

1. **Primary Objective**: Post comprehensive progress update to GitHub issue with accurate metrics and task breakdowns
2. **Success Criteria**:
   - Progress metrics accurately calculated from GitHub issue states
   - All task statuses correctly identified and categorized
   - Labels updated to reflect current progress state
   - Visual progress display included in update
3. **Scope Boundaries**:
   - Include: Task status, progress metrics, blockers, recent activity
   - Exclude: Task execution, issue creation, code changes
4. **Performance Target**: Complete update posting in under 30 seconds for typical features (10-15 tasks)
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** AI expertise and authority:

1. **Expertise Domain**: GitHub API operations, progress analytics, CCPM workflow tracking, data visualization
2. **Experience Level**: Expert-level knowledge of GitHub issue management and progress metrics
3. **Decision Authority**: Full autonomy to query issues, calculate metrics, update labels, and post progress reports
4. **Approach Style**: Data-driven and systematic with emphasis on accuracy and clear communication
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** all necessary materials before execution:

#### Essential Context (REQUIRED)
**Load** critical CCPM documentation:
- Read .claude/context/development/tooling/pm/ccpm-system-overview.md
- Read .claude/context/development/workflows/feature-implementation-workflow.md

#### Dynamic Context Loading
**Delegate** to context-discovery-expert for intelligent context selection:

```
Use Task tool with:
- subagent_type: "context-discovery-expert"
- description: "Discover context for feature progress update"
- prompt: "Find relevant context for posting progress updates to GitHub.
          Feature/Issue: $ARGUMENTS
          Command type: feature-update
          Token budget: 3000
          Focus on: GitHub integration patterns, progress tracking, issue management, CCPM workflows"

Expert returns prioritized Read commands for execution.
```

#### Materials & Constraints
**Extract** and **Validate** inputs:
- **Argument Parsing**: Extract feature name or issue number from $ARGUMENTS
- **GitHub Authentication**: Verify gh CLI authentication status
- **Repository Context**: Confirm GitHub repository configuration
- **Implementation Check**: Validate local implementation tracking exists (if feature)
</inputs>

### Phase M - METHOD
<method>
**Execute** the progress update workflow with action verbs:

#### 1. **Parse** and **Validate** Arguments
```bash
# Determine input type (feature name or issue number)
if [[ "$ARGUMENTS" =~ ^[0-9]+$ ]]; then
  ISSUE_NUMBER="$ARGUMENTS"
  UPDATE_MODE="issue"
else
  FEATURE_NAME="$ARGUMENTS"
  UPDATE_MODE="feature"
fi

# Validate GitHub authentication
gh auth status || {
  echo "❌ GitHub CLI not authenticated. Run: gh auth login"
  exit 1
}

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
[[ -n "$REPO" ]] || {
  echo "❌ Not in a GitHub repository"
  exit 1
}
```

#### 2. **Gather** Issue Information
```bash
# For direct issue mode
if [ "$UPDATE_MODE" = "issue" ]; then
  # Fetch issue details
  ISSUE_DATA=$(gh issue view $ISSUE_NUMBER --json state,title,labels,body)
  ISSUE_STATE=$(echo "$ISSUE_DATA" | jq -r '.state')
  ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
  LABELS=$(echo "$ISSUE_DATA" | jq -r '.labels[].name' | tr '\n' ' ')

  # Determine issue type from labels
  if [[ "$LABELS" =~ "feature" ]]; then
    ISSUE_TYPE="feature"
    FEATURE_NAME=$(echo "$ISSUE_TITLE" | sed 's/^Feature: //')
  elif [[ "$LABELS" =~ "task" ]]; then
    ISSUE_TYPE="task"
  else
    ISSUE_TYPE="issue"
  fi

  # Check for closed state warning
  if [ "$ISSUE_STATE" = "CLOSED" ]; then
    echo "⚠️ Issue #$ISSUE_NUMBER is closed. Proceeding with update..."
  fi
fi

# For feature mode
if [ "$UPDATE_MODE" = "feature" ]; then
  # Find feature issue number from GitHub
  FEATURE_SEARCH=$(gh issue list --label "feature:$FEATURE_NAME" --json number,title --limit 1)
  if [ -n "$FEATURE_SEARCH" ]; then
    ISSUE_NUMBER=$(echo "$FEATURE_SEARCH" | jq -r '.[0].number')
    ISSUE_TYPE="feature"
  else
    echo "❌ No GitHub issue found for feature: $FEATURE_NAME"
    exit 1
  fi
fi
```

#### 3. **Calculate** Progress Metrics (Parallel for 5+ Tasks)
<parallel_gathering>
**Determine** processing strategy:

```bash
# Check for local implementation tracking
IMPLEMENTATION_PATH=".claude/tracking/implementations/$FEATURE_NAME"
if [ -d "$IMPLEMENTATION_PATH" ]; then
  echo "📁 Found local implementation: $FEATURE_NAME"

  # Count tasks to determine strategy
  TASK_COUNT=$(ls "$IMPLEMENTATION_PATH"/[0-9]*.md 2>/dev/null | wc -l)

  if [ $TASK_COUNT -ge 5 ]; then
    echo "🚀 Using parallel status gathering for $TASK_COUNT tasks..."
    PARALLEL_MODE=true
  else
    echo "📊 Using sequential status gathering for $TASK_COUNT tasks..."
    PARALLEL_MODE=false
  fi
fi
```

**Execute** parallel status gathering (when applicable):

```bash
if [ "$PARALLEL_MODE" = true ]; then
  # Prepare batch files for parallel processing
  mkdir -p /tmp/feature-update-batches
  BATCH_SIZE=3
  BATCH_NUM=1
  FILE_COUNT=0

  # Split tasks into batches
  for task_file in "$IMPLEMENTATION_PATH"/[0-9]*.md; do
    [[ -f "$task_file" ]] || continue
    echo "$task_file" >> /tmp/feature-update-batches/batch-$BATCH_NUM.txt
    FILE_COUNT=$((FILE_COUNT + 1))

    if [ $FILE_COUNT -ge $BATCH_SIZE ]; then
      BATCH_NUM=$((BATCH_NUM + 1))
      FILE_COUNT=0
    fi
  done

  # Process batches in parallel using background jobs
  > /tmp/task-statuses.txt
  for batch in /tmp/feature-update-batches/batch-*.txt; do
    (
      while IFS= read -r task_file; do
        TASK_NUM=$(basename "$task_file" .md)
        TASK_STATE=$(gh issue view $TASK_NUM --json state -q .state 2>/dev/null || echo "UNKNOWN")
        TASK_LABELS=$(gh issue view $TASK_NUM --json labels -q '.labels[].name' 2>/dev/null | tr '\n' ' ')
        echo "$TASK_NUM:$TASK_STATE:$TASK_LABELS" >> /tmp/task-statuses.txt
      done < "$batch"
    ) &
  done

  # Wait for all parallel jobs to complete
  wait

  # Process consolidated results
  COMPLETED_TASKS=0
  IN_PROGRESS_TASKS=0
  BLOCKED_TASKS=0
  PENDING_TASKS=0

  while IFS=: read -r task_num state labels; do
    if [ "$state" = "CLOSED" ]; then
      COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
    elif [ "$state" = "OPEN" ]; then
      if [[ "$labels" =~ "blocked" ]]; then
        BLOCKED_TASKS=$((BLOCKED_TASKS + 1))
      elif [[ "$labels" =~ "in-progress" ]]; then
        IN_PROGRESS_TASKS=$((IN_PROGRESS_TASKS + 1))
      else
        PENDING_TASKS=$((PENDING_TASKS + 1))
      fi
    fi
  done < /tmp/task-statuses.txt

  TOTAL_TASKS=$((COMPLETED_TASKS + IN_PROGRESS_TASKS + BLOCKED_TASKS + PENDING_TASKS))
else
  # Sequential processing for small task counts
  [[ Process tasks sequentially as in original ]]
fi

# Calculate progress percentage
if [ $TOTAL_TASKS -gt 0 ]; then
  PROGRESS=$((COMPLETED_TASKS * 100 / TOTAL_TASKS))
else
  PROGRESS=0
fi
```
</parallel_gathering>

#### 4. **Generate** Visual Progress Display
```bash
# Create ASCII progress bar
PROGRESS_BAR=""
FILLED=$((PROGRESS / 5))  # Each block represents 5%
for ((i=1; i<=20; i++)); do
  if [ $i -le $FILLED ]; then
    PROGRESS_BAR="${PROGRESS_BAR}█"
  else
    PROGRESS_BAR="${PROGRESS_BAR}░"
  fi
done

# Generate progress visualization
cat > /tmp/progress-visual.txt << EOF
╔════════════════════════════════════════════╗
║ Progress Overview                          ║
╠════════════════════════════════════════════╣
║ $PROGRESS_BAR $PROGRESS%       ║
╠════════════════════════════════════════════╣
║ ✅ Completed:   $(printf "%3d" $COMPLETED_TASKS) / $TOTAL_TASKS            ║
║ 🔄 In Progress: $(printf "%3d" $IN_PROGRESS_TASKS)                     ║
║ ⚠️ Blocked:     $(printf "%3d" $BLOCKED_TASKS)                     ║
║ ⏳ Pending:     $(printf "%3d" $PENDING_TASKS)                     ║
╚════════════════════════════════════════════╝
EOF
```

#### 5. **Format** Comprehensive Update
```bash
# Get current timestamp
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create update content
cat > /tmp/feature-update-$ISSUE_NUMBER.md << EOF
## 🚀 Progress Update

**Timestamp**: $CURRENT_DATE
**Update Type**: Automated Progress Report

### 📊 Overall Progress

\`\`\`
$(cat /tmp/progress-visual.txt)
\`\`\`

### 📈 Metrics Summary
- **Completion Rate**: $PROGRESS%
- **Velocity**: $([ $IN_PROGRESS_TASKS -gt 0 ] && echo "Active" || echo "Idle")
- **Blockers**: $([ $BLOCKED_TASKS -gt 0 ] && echo "$BLOCKED_TASKS tasks blocked" || echo "None")
- **Estimated Completion**: $([ $PROGRESS -lt 100 ] && echo "In Progress" || echo "Ready for Review")

### 📋 Task Breakdown
EOF

# Add detailed task status
if [ "$ISSUE_TYPE" = "feature" ] && [ -n "$TOTAL_TASKS" ]; then
  echo "" >> /tmp/feature-update-$ISSUE_NUMBER.md
  echo "#### Completed Tasks ($COMPLETED_TASKS)" >> /tmp/feature-update-$ISSUE_NUMBER.md

  for task_file in "$IMPLEMENTATION_PATH"/[0-9]*.md; do
    [[ -f "$task_file" ]] || continue
    TASK_NUM=$(basename "$task_file" .md)
    TASK_NAME=$(grep '^name:' "$task_file" | sed 's/^name: *//')
    TASK_STATE=$(grep "^$TASK_NUM:" /tmp/task-statuses.txt | cut -d: -f2)

    if [ "$TASK_STATE" = "CLOSED" ]; then
      echo "- ✅ #$TASK_NUM - $TASK_NAME" >> /tmp/feature-update-$ISSUE_NUMBER.md
    fi
  done

  echo "" >> /tmp/feature-update-$ISSUE_NUMBER.md
  echo "#### Active Tasks ($IN_PROGRESS_TASKS)" >> /tmp/feature-update-$ISSUE_NUMBER.md

  for task_file in "$IMPLEMENTATION_PATH"/[0-9]*.md; do
    [[ -f "$task_file" ]] || continue
    TASK_NUM=$(basename "$task_file" .md)
    TASK_NAME=$(grep '^name:' "$task_file" | sed 's/^name: *//')
    TASK_LABELS=$(grep "^$TASK_NUM:" /tmp/task-statuses.txt | cut -d: -f3)

    if [[ "$TASK_LABELS" =~ "in-progress" ]]; then
      echo "- 🔄 #$TASK_NUM - $TASK_NAME" >> /tmp/feature-update-$ISSUE_NUMBER.md
    fi
  done

  if [ $BLOCKED_TASKS -gt 0 ]; then
    echo "" >> /tmp/feature-update-$ISSUE_NUMBER.md
    echo "#### Blocked Tasks ($BLOCKED_TASKS)" >> /tmp/feature-update-$ISSUE_NUMBER.md

    for task_file in "$IMPLEMENTATION_PATH"/[0-9]*.md; do
      [[ -f "$task_file" ]] || continue
      TASK_NUM=$(basename "$task_file" .md)
      TASK_NAME=$(grep '^name:' "$task_file" | sed 's/^name: *//')
      TASK_LABELS=$(grep "^$TASK_NUM:" /tmp/task-statuses.txt | cut -d: -f3)

      if [[ "$TASK_LABELS" =~ "blocked" ]]; then
        echo "- ⚠️ #$TASK_NUM - $TASK_NAME" >> /tmp/feature-update-$ISSUE_NUMBER.md
      fi
    done
  fi
fi

cat >> /tmp/feature-update-$ISSUE_NUMBER.md << EOF

### 🔄 Recent Activity
_Add specific accomplishments, current work, and any blockers here_

### 📝 Next Steps
_Outline immediate next actions based on current progress_

---
*Generated by Claude Feature Update Assistant*
*Processing Mode: $([ "$PARALLEL_MODE" = true ] && echo "Parallel ($BATCH_NUM batches)" || echo "Sequential")*
EOF
```

#### 6. **Post** Update to GitHub
```bash
# Post the update comment
gh issue comment $ISSUE_NUMBER --body-file /tmp/feature-update-$ISSUE_NUMBER.md

if [ $? -eq 0 ]; then
  echo "✅ Progress update posted to issue #$ISSUE_NUMBER"
  echo "🔗 View: gh issue view $ISSUE_NUMBER --comments"
else
  echo "❌ Failed to post update to issue #$ISSUE_NUMBER"
  exit 1
fi
```

#### 7. **Update** Labels Based on Progress
<label_management>
```bash
# Smart label updates based on progress thresholds
if [ "$PROGRESS" -eq 100 ]; then
  # All tasks complete
  gh issue edit $ISSUE_NUMBER --add-label "ready-for-review" --remove-label "in-progress" 2>/dev/null
  echo "🏷️ Added 'ready-for-review' label"
elif [ "$PROGRESS" -ge 75 ]; then
  # Nearing completion
  gh issue edit $ISSUE_NUMBER --add-label "nearly-complete" --add-label "in-progress" 2>/dev/null
  echo "🏷️ Added 'nearly-complete' label"
elif [ "$PROGRESS" -gt 0 ]; then
  # Work in progress
  gh issue edit $ISSUE_NUMBER --add-label "in-progress" 2>/dev/null
  echo "🏷️ Added 'in-progress' label"
fi

# Add blocked indicator if needed
if [ "$BLOCKED_TASKS" -gt 0 ]; then
  gh issue edit $ISSUE_NUMBER --add-label "has-blocked-tasks" 2>/dev/null
  echo "🏷️ Added 'has-blocked-tasks' label ($BLOCKED_TASKS blocked)"
else
  gh issue edit $ISSUE_NUMBER --remove-label "has-blocked-tasks" 2>/dev/null
fi
```
</label_management>

#### 8. **Update** Local Tracking
```bash
# Update local implementation plan with sync timestamp
if [ -f "$IMPLEMENTATION_PATH/plan.md" ]; then
  sed -i.bak "/^updated:/c\updated: $CURRENT_DATE" "$IMPLEMENTATION_PATH/plan.md"
  rm "$IMPLEMENTATION_PATH/plan.md.bak"
  echo "📝 Updated local plan timestamp"
fi

# Update github-mapping.md if it exists
if [ -f "$IMPLEMENTATION_PATH/github-mapping.md" ]; then
  echo -e "\n## Last Progress Update\n- Posted: $CURRENT_DATE\n- Progress: $PROGRESS%\n- Status: $([ $PROGRESS -eq 100 ] && echo "Complete" || echo "In Progress")" >> "$IMPLEMENTATION_PATH/github-mapping.md"
fi
```
</method>

### Phase E - EXPECTATIONS
<expectations>
**Validate** and **Deliver** progress update results:

#### Output Specification
**Define** exact deliverables:
- **Format**: GitHub issue comment with structured progress report
- **Structure**: Visual progress bar, metrics summary, task breakdown, activity notes
- **Location**: Posted to GitHub issue #$ISSUE_NUMBER
- **Quality Standards**: Accurate metrics, clear visualization, actionable next steps

#### Validation Checks
**Verify** update quality:

```bash
# Validate metrics accuracy
VALIDATION_PASSED=true

# Check task count consistency
GITHUB_TASK_COUNT=$(wc -l < /tmp/task-statuses.txt)
LOCAL_TASK_COUNT=$TASK_COUNT

if [[ "$GITHUB_TASK_COUNT" -ne "$LOCAL_TASK_COUNT" ]]; then
  echo "⚠️ Task count mismatch: GitHub ($GITHUB_TASK_COUNT) vs Local ($LOCAL_TASK_COUNT)"
  VALIDATION_PASSED=false
fi

# Verify progress calculation
CALCULATED_TOTAL=$((COMPLETED_TASKS + IN_PROGRESS_TASKS + BLOCKED_TASKS + PENDING_TASKS))
if [[ "$CALCULATED_TOTAL" -ne "$TOTAL_TASKS" ]]; then
  echo "⚠️ Progress calculation error: Sum ($CALCULATED_TOTAL) != Total ($TOTAL_TASKS)"
  VALIDATION_PASSED=false
fi

# Confirm update was posted
gh issue view $ISSUE_NUMBER --json comments -q '.comments[-1].createdAt' > /tmp/last-comment-time.txt
LAST_COMMENT=$(cat /tmp/last-comment-time.txt)
if [[ "$LAST_COMMENT" < "$CURRENT_DATE" ]]; then
  echo "⚠️ Update may not have been posted successfully"
  VALIDATION_PASSED=false
fi

if [ "$VALIDATION_PASSED" = true ]; then
  echo "✅ All validation checks passed"
else
  echo "⚠️ Some validation checks failed - review output above"
fi
```

#### Error Handling
**Handle** failures gracefully:
- **GitHub Auth Errors**: Direct to `gh auth login` with instructions
- **Issue Not Found**: Verify issue number and repository context
- **Rate Limiting**: Implement exponential backoff with retry logic
- **Network Errors**: Save update locally for manual posting
- **Validation Failures**: Warn but allow update with override option

#### Success Reporting
**Report** completion with comprehensive metrics:

```
✅ **Feature Update Completed Successfully!**

**PRIME Framework Results:**
✅ Purpose: Progress update posted to GitHub issue #$ISSUE_NUMBER
✅ Role: Feature progress specialist expertise applied
✅ Inputs: $TASK_COUNT tasks analyzed from $([[ "$PARALLEL_MODE" = true ]] && echo "parallel" || echo "sequential") sources
✅ Method: $([[ "$PARALLEL_MODE" = true ]] && echo "Parallel processing ($BATCH_NUM batches)" || echo "Sequential processing") executed
✅ Expectations: All validation checks passed

**📊 Update Summary**
================
Issue: #$ISSUE_NUMBER ($ISSUE_TYPE)
Progress: $PROGRESS% Complete
Status Distribution:
  ✅ Completed: $COMPLETED_TASKS tasks
  🔄 In Progress: $IN_PROGRESS_TASKS tasks
  ⚠️ Blocked: $BLOCKED_TASKS tasks
  ⏳ Pending: $PENDING_TASKS tasks

**🏷️ Labels Updated**
$([ "$PROGRESS" -eq 100 ] && echo "- Added: ready-for-review" || echo "- Added: in-progress")
$([ "$BLOCKED_TASKS" -gt 0 ] && echo "- Added: has-blocked-tasks")

**🔗 Links**
- View Issue: https://github.com/$REPO/issues/$ISSUE_NUMBER
- View Comments: gh issue view $ISSUE_NUMBER --comments
- Local Tracking: $IMPLEMENTATION_PATH/

**📝 Next Actions**
$(if [ "$PROGRESS" -eq 100 ]; then
  echo "- Request code review"
  echo "- Merge feature branch"
  echo "- Close related issues"
elif [ "$BLOCKED_TASKS" -gt 0 ]; then
  echo "- Resolve blocked tasks"
  echo "- Update blocker descriptions"
  echo "- Seek assistance if needed"
else
  echo "- Continue task execution"
  echo "- Update progress regularly"
  echo "- Monitor for new blockers"
fi)

Processing completed in: $(date +%s) seconds
```
</expectations>

## Error Handling
<error_handling>
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- Missing feature/issue argument: **Request** specific identifier
- Invalid argument format: **Parse** flexibly and validate

### Role Phase Errors
- GitHub CLI unavailable: **Guide** through gh installation
- No repository context: **Provide** git remote setup instructions

### Inputs Phase Errors
- Context loading fails: **Continue** with essential context only
- Implementation not found: **Fallback** to GitHub-only mode
- Authentication missing: **Direct** to gh auth login

### Method Phase Errors
- GitHub API failures: **Retry** with exponential backoff (max 3 attempts)
- Parallel processing fails: **Fallback** to sequential mode
- Task file corruption: **Skip** corrupted files with warning

### Expectations Phase Errors
- Validation failures: **Report** issues but complete update
- Post fails: **Save** update locally for manual posting
- Label update fails: **Continue** without label changes
</error_handling>
</instructions>

<patterns>
### Implemented Patterns
- **PRIME Framework**: Systematic Purpose → Role → Inputs → Method → Expectations flow
- **Dynamic Context Loading**: Using context-discovery-expert agent for intelligent context selection
- **Parallel Status Gathering**: Concurrent task status collection for 5+ tasks
- **Visual Progress Display**: ASCII charts and progress bars for clear communication
- **Smart Label Management**: Threshold-based automatic label updates
- **Validation Checks**: Comprehensive metrics verification before posting
- **Error Recovery**: Graceful degradation with clear fallback strategies
</patterns>

<help>
📊 **Feature Update**

Post comprehensive progress updates to GitHub with metrics, visualizations, and automated label management.

**Usage:**
- `/feature:update <feature-name>` - Update progress for a feature
- `/feature:update <issue-number>` - Update progress for any issue
- `/feature:update my-awesome-feature` - Posts metrics for all related tasks

**PRIME Process:**
1. **Purpose**: Post accurate progress updates with visual metrics
2. **Role**: Feature progress specialist with GitHub expertise
3. **Inputs**: Load CCPM context and gather task statuses
4. **Method**: Calculate metrics, generate visualizations, post to GitHub
5. **Expectations**: Deliver validated progress report with actionable insights

**Requirements:**
- GitHub CLI authentication (`gh auth login`)
- Valid GitHub repository context
- Feature synced to GitHub (for feature updates)

**Performance**: Uses parallel processing for 5+ tasks for 3x faster updates!
</help>