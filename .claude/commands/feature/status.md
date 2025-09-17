---
description: Check comprehensive implementation status of features with GitHub integration
allowed-tools: [Bash, Read, LS, mcp__github__*, Task]
argument-hint: <feature_name> - e.g., "auth", "payments", "admin-dashboard"
---

# Feature Status

Track feature implementation progress from specification to completion with GitHub integration.

## Key Features
- **Complete Workflow Tracking**: Spec → Plan → Tasks → Implementation
- **GitHub Integration**: Real-time issue and PR status
- **Progress Metrics**: Task completion percentages
- **Dependency Analysis**: Execution order visualization
- **Next Step Guidance**: Actionable recommendations

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/systems/pm/ccpm-system-overview.md
- Read .claude/rules/feature-workflow.md

## Prompt

<role>
You are the Feature Progress Tracker, providing comprehensive status updates on feature implementation. Your expertise covers local tracking, GitHub synchronization, and workflow orchestration.
</role>

<instructions>
# Feature Status Workflow

**CORE REQUIREMENTS**:
- Provide accurate implementation status
- Track progress across all phases
- Integrate GitHub issue states
- Calculate completion metrics
- Suggest actionable next steps

## 1. PURPOSE - Define Status Objectives
<purpose>
**Primary Goal**: Provide comprehensive feature implementation status and guidance

**Success Criteria**:
- All workflow phases checked
- GitHub status synchronized
- Progress accurately calculated
- Dependencies analyzed
- Clear next steps provided

**Measurable Outcomes**:
- Implementation phase identified
- Completion percentage calculated
- Blockers highlighted
- Action items listed
</purpose>

## 2. ROLE - Progress Tracking Expert
<role_definition>
**Expertise Areas**:
- Feature workflow management
- Progress tracking
- GitHub API integration
- Dependency analysis
- Project coordination

**Authority**:
- Query implementation status
- Calculate progress metrics
- Identify blockers
- Recommend next actions
- Coordinate workflow steps
</role_definition>

## 3. INPUTS - Parse Feature Request
<inputs>
1. **Extract feature name**:
   ```bash
   FEATURE_NAME="$ARGUMENTS"

   if [ -z "$FEATURE_NAME" ]; then
     echo "❌ Error: Feature name required"
     echo "Usage: /feature:status <feature_name>"
     echo "Available features:"
     ls .claude/implementations/ 2>/dev/null | head -5
     exit 1
   fi

   echo "📋 Feature Status: $FEATURE_NAME"
   echo "================================"
   ```

2. **Check feature existence**:
   ```bash
   # Verify feature exists somewhere
   SPEC_EXISTS=false
   PLAN_EXISTS=false
   TASKS_EXIST=false

   [ -f ".claude/specs/$FEATURE_NAME.md" ] && SPEC_EXISTS=true
   [ -f ".claude/implementations/$FEATURE_NAME/plan.md" ] && PLAN_EXISTS=true
   [ -d ".claude/implementations/$FEATURE_NAME" ] && TASKS_EXIST=true

   if [ "$SPEC_EXISTS" = false ] && [ "$PLAN_EXISTS" = false ]; then
     echo "❌ Feature not found: $FEATURE_NAME"
     echo "💡 Create new feature: /feature:spec $FEATURE_NAME"
     exit 1
   fi
   ```

3. **Load GitHub configuration**:
   ```bash
   # Check GitHub CLI availability
   if command -v gh &> /dev/null; then
     GH_AVAILABLE=true
     GH_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
   else
     GH_AVAILABLE=false
   fi
   ```
</inputs>

## 4. METHOD - Comprehensive Status Check
<method>
### Step 1: Local File Status
Check specification and planning files:
```bash
echo "📁 Local Files"
echo "--------------"

# Specification status
if [ -f ".claude/specs/$FEATURE_NAME.md" ]; then
  echo "✅ Specification exists"

  # Extract metadata
  SPEC_STATUS=$(grep '^status:' ".claude/specs/$FEATURE_NAME.md" | cut -d: -f2- | xargs)
  SPEC_CREATED=$(grep '^created:' ".claude/specs/$FEATURE_NAME.md" | cut -d: -f2- | xargs)

  echo "   Status: ${SPEC_STATUS:-draft}"
  echo "   Created: ${SPEC_CREATED:-unknown}"
else
  echo "❌ No specification"
  echo "   Run: /feature:spec $FEATURE_NAME"
fi

# Implementation plan status
if [ -f ".claude/implementations/$FEATURE_NAME/plan.md" ]; then
  echo "✅ Implementation plan exists"

  # Extract progress
  PLAN_PROGRESS=$(grep '^progress:' ".claude/implementations/$FEATURE_NAME/plan.md" | cut -d: -f2- | xargs)
  echo "   Progress: ${PLAN_PROGRESS:-0}%"

  # GitHub sync status
  GITHUB_URL=$(grep '^github:' ".claude/implementations/$FEATURE_NAME/plan.md" | cut -d: -f2- | xargs)
  if [ -n "$GITHUB_URL" ] && [[ "$GITHUB_URL" != *"Will be"* ]]; then
    echo "   GitHub: $GITHUB_URL"
  else
    echo "   GitHub: Not synced"
  fi
else
  echo "❌ No implementation plan"
  echo "   Run: /feature:plan $FEATURE_NAME"
fi
```

### Step 2: Task Analysis
Analyze task decomposition:
```bash
# Task counting
TASK_FILES=$(ls .claude/implementations/$FEATURE_NAME/[0-9]*.md 2>/dev/null)
TASK_COUNT=$(echo "$TASK_FILES" | wc -w)

if [ $TASK_COUNT -gt 0 ]; then
  echo "✅ Tasks decomposed: $TASK_COUNT tasks"

  # Check GitHub sync
  if ls .claude/implementations/$FEATURE_NAME/[0-9][0-9][0-9]*.md &>/dev/null; then
    echo "   ✅ Synced to GitHub"
  else
    echo "   ⏳ Not synced"
    echo "   Run: /feature:sync $FEATURE_NAME"
  fi

  # Parallel vs sequential
  PARALLEL_COUNT=$(grep -l '^parallel: true' $TASK_FILES 2>/dev/null | wc -l)
  SEQUENTIAL_COUNT=$((TASK_COUNT - PARALLEL_COUNT))

  echo "   Execution: $PARALLEL_COUNT parallel, $SEQUENTIAL_COUNT sequential"
else
  echo "❌ No tasks created"
  echo "   Run: /feature:decompose $FEATURE_NAME"
fi
```

### Step 3: GitHub Integration
Query GitHub for real-time status:
```bash
if [ "$GH_AVAILABLE" = true ] && [ -f ".claude/implementations/$FEATURE_NAME/github-mapping.md" ]; then
  echo ""
  echo "🐙 GitHub Status"
  echo "----------------"

  # Extract feature issue number
  FEATURE_ISSUE=$(grep '^**Feature**:' ".claude/implementations/$FEATURE_NAME/github-mapping.md" | \
    sed 's/.*#\([0-9]*\).*/\1/')

  if [ -n "$FEATURE_ISSUE" ]; then
    # Get feature issue state
    FEATURE_STATE=$(gh issue view "$FEATURE_ISSUE" --json state,title -q '.state' 2>/dev/null)
    FEATURE_TITLE=$(gh issue view "$FEATURE_ISSUE" --json title -q '.title' 2>/dev/null)

    echo "Feature #$FEATURE_ISSUE: $FEATURE_STATE"
    echo "Title: $FEATURE_TITLE"

    # Count task states
    OPEN_TASKS=0
    CLOSED_TASKS=0
    IN_PROGRESS=0

    # Process each task
    TASK_NUMBERS=$(grep '^- #' ".claude/implementations/$FEATURE_NAME/github-mapping.md" | \
      sed 's/^- #\([0-9]*\).*/\1/')

    for task_num in $TASK_NUMBERS; do
      TASK_DATA=$(gh issue view "$task_num" --json state,labels 2>/dev/null)

      if [ -n "$TASK_DATA" ]; then
        TASK_STATE=$(echo "$TASK_DATA" | jq -r '.state')
        LABELS=$(echo "$TASK_DATA" | jq -r '.labels[].name' | tr '\n' ' ')

        case "$TASK_STATE" in
          OPEN)
            if [[ "$LABELS" =~ "in-progress" ]]; then
              ((IN_PROGRESS++))
            else
              ((OPEN_TASKS++))
            fi
            ;;
          CLOSED)
            ((CLOSED_TASKS++))
            ;;
        esac
      fi
    done

    # Calculate metrics
    TOTAL_TASKS=$((OPEN_TASKS + IN_PROGRESS + CLOSED_TASKS))
    if [ $TOTAL_TASKS -gt 0 ]; then
      PROGRESS=$((CLOSED_TASKS * 100 / TOTAL_TASKS))

      echo ""
      echo "📊 Progress: $PROGRESS% ($CLOSED_TASKS/$TOTAL_TASKS)"
      echo "   ✅ Completed: $CLOSED_TASKS"
      echo "   🔄 In Progress: $IN_PROGRESS"
      echo "   📋 Open: $OPEN_TASKS"

      # Show burndown
      if [ $CLOSED_TASKS -gt 0 ]; then
        VELOCITY=$((CLOSED_TASKS * 100 / TOTAL_TASKS))
        echo "   📈 Velocity: ${VELOCITY}% completion rate"
      fi
    fi
  fi
fi
```

### Step 4: Dependency Analysis
Analyze task dependencies:
```bash
if [ $TASK_COUNT -gt 0 ]; then
  echo ""
  echo "🔗 Execution Plan"
  echo "-----------------"

  # Find ready tasks
  echo "✅ Ready to start:"
  READY_COUNT=0

  for task_file in $TASK_FILES; do
    DEPENDS_ON=$(grep '^depends_on:' "$task_file" | cut -d: -f2- | xargs)

    if [ -z "$DEPENDS_ON" ] || [ "$DEPENDS_ON" = "[]" ]; then
      TASK_NAME=$(grep '^name:' "$task_file" | cut -d: -f2- | xargs)
      TASK_NUM=$(basename "$task_file" .md)
      PARALLEL=$(grep '^parallel:' "$task_file" | cut -d: -f2- | xargs)

      if [ "$PARALLEL" = "true" ]; then
        echo "  ⚡ #$TASK_NUM: $TASK_NAME (parallel)"
      else
        echo "  📍 #$TASK_NUM: $TASK_NAME"
      fi
      ((READY_COUNT++))
    fi
  done

  [ $READY_COUNT -eq 0 ] && echo "  None - check dependencies"

  # Show blocked tasks
  BLOCKED_COUNT=0
  for task_file in $TASK_FILES; do
    DEPENDS_ON=$(grep '^depends_on:' "$task_file" | cut -d: -f2- | xargs)

    if [ -n "$DEPENDS_ON" ] && [ "$DEPENDS_ON" != "[]" ]; then
      if [ $BLOCKED_COUNT -eq 0 ]; then
        echo ""
        echo "⏳ Blocked by dependencies:"
      fi

      TASK_NAME=$(grep '^name:' "$task_file" | cut -d: -f2- | xargs)
      TASK_NUM=$(basename "$task_file" .md)
      echo "  #$TASK_NUM: $TASK_NAME → $DEPENDS_ON"
      ((BLOCKED_COUNT++))
    fi
  done
fi
```

### Step 5: Time Estimates
Calculate time estimates:
```bash
if [ -f ".claude/implementations/$FEATURE_NAME/plan.md" ]; then
  echo ""
  echo "⏱️ Time Estimates"
  echo "-----------------"

  # Extract estimates
  TOTAL_EFFORT=$(grep 'Estimated total effort:' ".claude/implementations/$FEATURE_NAME/plan.md" | \
    tail -1 | cut -d: -f2- | xargs)

  if [ -n "$TOTAL_EFFORT" ]; then
    echo "Total effort: $TOTAL_EFFORT"

    # Calculate remaining
    if [ -n "$PROGRESS" ]; then
      REMAINING=$((100 - PROGRESS))
      echo "Remaining: ~${REMAINING}% of effort"
    fi
  fi

  # Show velocity if available
  if [ $CLOSED_TASKS -gt 0 ] && [ -n "$TOTAL_EFFORT" ]; then
    echo "Average per task: $((${TOTAL_EFFORT%h*} / TOTAL_TASKS))h"
  fi
fi
```
</method>

## 5. EXPECTATIONS - Summary & Actions
<expectations>
### Generate Summary Report
Provide comprehensive status:
```bash
echo ""
echo "📋 Summary"
echo "----------"

# Determine overall status
if [ "$SPEC_EXISTS" = false ]; then
  STATUS="Not started"
  NEXT_ACTION="/feature:spec $FEATURE_NAME"
elif [ "$PLAN_EXISTS" = false ]; then
  STATUS="Specification ready"
  NEXT_ACTION="/feature:plan $FEATURE_NAME"
elif [ $TASK_COUNT -eq 0 ]; then
  STATUS="Planning complete"
  NEXT_ACTION="/feature:decompose $FEATURE_NAME"
elif [ ! -f ".claude/implementations/$FEATURE_NAME/github-mapping.md" ]; then
  STATUS="Ready for GitHub"
  NEXT_ACTION="/feature:sync $FEATURE_NAME"
elif [ -n "$PROGRESS" ]; then
  if [ $PROGRESS -eq 100 ]; then
    STATUS="✅ Complete!"
    NEXT_ACTION="Review and close"
  else
    STATUS="🚧 In Progress ($PROGRESS%)"
    NEXT_ACTION="Continue implementation"
  fi
else
  STATUS="Ready to implement"
  NEXT_ACTION="Start first task"
fi

echo "Status: $STATUS"
echo "Next: $NEXT_ACTION"
```

### Quick Actions Menu
Provide actionable commands:
```bash
echo ""
echo "🚀 Quick Actions"
echo "----------------"

# Context-specific actions
case "$STATUS" in
  "Not started")
    echo "• Create spec: /feature:spec $FEATURE_NAME"
    echo "• View examples: ls .claude/specs/*.md | head -3"
    ;;
  "Specification ready")
    echo "• Create plan: /feature:plan $FEATURE_NAME"
    echo "• Review spec: cat .claude/specs/$FEATURE_NAME.md"
    ;;
  "Planning complete")
    echo "• Decompose: /feature:decompose $FEATURE_NAME"
    echo "• Review plan: cat .claude/implementations/$FEATURE_NAME/plan.md"
    ;;
  "Ready for GitHub")
    echo "• Sync: /feature:sync $FEATURE_NAME"
    echo "• Review tasks: ls .claude/implementations/$FEATURE_NAME/*.md"
    ;;
  *"Progress"*)
    if [ -n "$FEATURE_ISSUE" ]; then
      echo "• View on GitHub: gh issue view $FEATURE_ISSUE --web"
      echo "• View tasks: gh issue list --label feature:$FEATURE_NAME"
    fi

    # Find next task
    for task_num in $TASK_NUMBERS; do
      STATE=$(gh issue view "$task_num" --json state -q '.state' 2>/dev/null)
      if [ "$STATE" = "OPEN" ]; then
        echo "• Start task: /do-task $task_num"
        break
      fi
    done
    ;;
esac

# Always available
echo ""
echo "• Refresh: /feature:status $FEATURE_NAME"
echo "• List features: ls .claude/specs/"
```

### Success Indicators
✓ Status accurately reported
✓ Progress calculated
✓ Dependencies analyzed
✓ Next steps provided
✓ Quick actions listed
</expectations>

## Dynamic Context Loading
<context_loading>
Load feature-specific context:
```bash
# Load relevant context based on feature
if [ -f ".claude/specs/$FEATURE_NAME.md" ]; then
  FEATURE_TYPE=$(grep '^type:' ".claude/specs/$FEATURE_NAME.md" | cut -d: -f2- | xargs)

  node .claude/scripts/context-loader.cjs \
    --query="$FEATURE_TYPE feature status tracking" \
    --command="feature-status" \
    --max-results=2 \
    --format=paths
fi
```
</context_loading>

## Error Handling
<error_handling>
### Common Issues
1. **Feature not found**: Suggest creation
2. **GitHub not authenticated**: Skip GitHub checks
3. **Network issues**: Use cached data
4. **Partial states**: Handle gracefully

### Recovery Procedures
```bash
# Handle GitHub CLI errors
if ! gh auth status &>/dev/null; then
  echo "⚠️ GitHub CLI not authenticated"
  echo "💡 Run: gh auth login"
  GH_AVAILABLE=false
fi

# Handle missing directories
if [ ! -d ".claude/implementations/$FEATURE_NAME" ]; then
  mkdir -p ".claude/implementations/$FEATURE_NAME"
fi

# Handle corrupt files
for file in ".claude/implementations/$FEATURE_NAME"/*.md; do
  if [ -f "$file" ] && ! grep -q '^name:' "$file"; then
    echo "⚠️ Corrupt file detected: $file"
    echo "💡 Review and fix metadata"
  fi
done
```
</error_handling>
</instructions>

<patterns>
### Status Patterns
- **Progressive Enhancement**: Basic → Detailed → Interactive
- **Fail Gracefully**: Continue despite errors
- **Cache Results**: Avoid repeated API calls
- **Visual Indicators**: Icons for quick scanning

### Anti-Patterns to Avoid
- Blocking on network errors
- Incomplete status reports
- Missing next steps
- Stale cached data
- Unclear progress metrics
</patterns>

<help>
📊 **Feature Status Tracker**

Comprehensive feature implementation tracking with GitHub integration.

**Usage:**
- `/feature:status <name>` - Check feature status
- `/feature:status auth` - Specific feature

**Process:**
1. Check local files
2. Query GitHub status
3. Analyze dependencies
4. Calculate progress
5. Suggest next steps

**Features:**
- Complete workflow tracking
- Real-time GitHub status
- Progress visualization
- Dependency analysis
- Actionable recommendations

Your implementation progress dashboard!
</help>