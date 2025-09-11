---
allowed-tools: Bash, Read, LS
---

# Feature Status

Check the implementation status of a feature.

## Usage
```
/feature:status <feature_name>
```

## Instructions

### 1. Check Local Files

First, verify what exists locally:

```bash
echo "📋 Feature Status: $ARGUMENTS"
echo "================================"

# Check for specification
if [ -f ".claude/tracking/specs/$ARGUMENTS.md" ]; then
  echo "✅ Specification exists"
  
  # Extract status from frontmatter
  spec_status=$(grep '^status:' .claude/tracking/specs/$ARGUMENTS.md | sed 's/^status: *//')
  echo "   Status: $spec_status"
  
  # Get creation date
  spec_created=$(grep '^created:' .claude/tracking/specs/$ARGUMENTS.md | sed 's/^created: *//')
  echo "   Created: $spec_created"
else
  echo "❌ No specification found"
  echo "   Run: /feature:spec $ARGUMENTS"
fi

echo ""

# Check for implementation plan
if [ -f ".claude/tracking/implementations/$ARGUMENTS/plan.md" ]; then
  echo "✅ Implementation plan exists"
  
  # Extract progress from frontmatter
  plan_progress=$(grep '^progress:' .claude/tracking/implementations/$ARGUMENTS/plan.md | sed 's/^progress: *//')
  echo "   Progress: $plan_progress"
  
  # Check for GitHub sync
  github_url=$(grep '^github:' .claude/tracking/implementations/$ARGUMENTS/plan.md | sed 's/^github: *//')
  if [[ "$github_url" != *"Will be updated"* ]] && [[ -n "$github_url" ]]; then
    echo "   GitHub: $github_url"
  else
    echo "   GitHub: Not synced"
  fi
else
  echo "❌ No implementation plan found"
  echo "   Run: /feature:plan $ARGUMENTS"
fi

echo ""

# Check for tasks
task_count=$(ls .claude/tracking/implementations/$ARGUMENTS/[0-9]*.md 2>/dev/null | wc -l)
if [ "$task_count" -gt 0 ]; then
  echo "✅ Tasks decomposed: $task_count tasks"
  
  # Count by status if tasks have been synced
  if ls .claude/tracking/implementations/$ARGUMENTS/[0-9][0-9][0-9][0-9]*.md 2>/dev/null | head -1 > /dev/null; then
    echo "   ✅ Tasks synced to GitHub"
  else
    echo "   ⏳ Tasks not yet synced"
    echo "   Run: /feature:sync $ARGUMENTS"
  fi
  
  # Show parallel vs sequential breakdown
  parallel_count=$(grep -l '^parallel: true' .claude/tracking/implementations/$ARGUMENTS/[0-9]*.md 2>/dev/null | wc -l)
  sequential_count=$((task_count - parallel_count))
  echo "   Parallel: $parallel_count | Sequential: $sequential_count"
else
  echo "❌ No tasks created"
  echo "   Run: /feature:decompose $ARGUMENTS"
fi
```

### 2. Check GitHub Status (if synced)

If the feature has been synced to GitHub:

```bash
# Check if we have a GitHub mapping
if [ -f ".claude/tracking/implementations/$ARGUMENTS/github-mapping.md" ]; then
  echo ""
  echo "GitHub Integration"
  echo "-----------------"
  
  # Extract feature issue number
  feature_issue=$(grep '^**Feature**:' .claude/tracking/implementations/$ARGUMENTS/github-mapping.md | sed 's/.*#\([0-9]*\).*/\1/')
  
  if [ -n "$feature_issue" ]; then
    # Get issue status from GitHub
    echo "Fetching GitHub status..."
    
    # Get feature issue details
    feature_state=$(gh issue view $feature_issue --json state -q .state 2>/dev/null || echo "unknown")
    echo "Feature Issue #$feature_issue: $feature_state"
    
    # Count task statuses
    open_tasks=0
    closed_tasks=0
    
    # Get all task issue numbers
    task_numbers=$(grep '^- #' .claude/tracking/implementations/$ARGUMENTS/github-mapping.md | sed 's/^- #\([0-9]*\).*/\1/')
    
    for task_num in $task_numbers; do
      task_state=$(gh issue view $task_num --json state -q .state 2>/dev/null || echo "unknown")
      if [ "$task_state" = "OPEN" ]; then
        open_tasks=$((open_tasks + 1))
      elif [ "$task_state" = "CLOSED" ]; then
        closed_tasks=$((closed_tasks + 1))
      fi
    done
    
    total_github_tasks=$((open_tasks + closed_tasks))
    if [ $total_github_tasks -gt 0 ]; then
      progress=$((closed_tasks * 100 / total_github_tasks))
      echo "Task Progress: $closed_tasks/$total_github_tasks ($progress%)"
      echo "  ✅ Closed: $closed_tasks"
      echo "  🔄 Open: $open_tasks"
    fi
  fi
fi
```

### 3. Show Execution Plan

Display suggested execution order based on dependencies:

```bash
if [ "$task_count" -gt 0 ]; then
  echo ""
  echo "Execution Plan"
  echo "--------------"
  
  # Find tasks with no dependencies (can start immediately)
  echo "📌 Can start now (no dependencies):"
  for task_file in .claude/tracking/implementations/$ARGUMENTS/[0-9]*.md; do
    [ -f "$task_file" ] || continue
    
    depends_on=$(grep '^depends_on:' "$task_file" | sed 's/^depends_on: *//')
    if [ "$depends_on" = "[]" ] || [ -z "$depends_on" ]; then
      task_name=$(grep '^name:' "$task_file" | sed 's/^name: *//')
      task_num=$(basename "$task_file" .md)
      parallel=$(grep '^parallel:' "$task_file" | sed 's/^parallel: *//')
      
      if [ "$parallel" = "true" ]; then
        echo "  ⚡ #$task_num: $task_name (parallel)"
      else
        echo "  📍 #$task_num: $task_name"
      fi
    fi
  done
  
  # Show tasks with dependencies
  has_deps=false
  for task_file in .claude/tracking/implementations/$ARGUMENTS/[0-9]*.md; do
    [ -f "$task_file" ] || continue
    
    depends_on=$(grep '^depends_on:' "$task_file" | sed 's/^depends_on: *//')
    if [ "$depends_on" != "[]" ] && [ -n "$depends_on" ]; then
      if [ "$has_deps" = false ]; then
        echo ""
        echo "⏳ Waiting on dependencies:"
        has_deps=true
      fi
      
      task_name=$(grep '^name:' "$task_file" | sed 's/^name: *//')
      task_num=$(basename "$task_file" .md)
      echo "  #$task_num: $task_name (depends on: $depends_on)"
    fi
  done
fi
```

### 4. Summary Report

Generate a comprehensive status summary:

```bash
echo ""
echo "Summary"
echo "-------"

# Calculate overall status
if [ ! -f ".claude/tracking/specs/$ARGUMENTS.md" ]; then
  echo "📋 Status: Not started"
  echo "🎯 Next step: /feature:spec $ARGUMENTS"
elif [ ! -f ".claude/tracking/implementations/$ARGUMENTS/plan.md" ]; then
  echo "📋 Status: Specification complete"
  echo "🎯 Next step: /feature:plan $ARGUMENTS"
elif [ "$task_count" -eq 0 ]; then
  echo "📋 Status: Planning complete"
  echo "🎯 Next step: /feature:decompose $ARGUMENTS"
elif [ ! -f ".claude/tracking/implementations/$ARGUMENTS/github-mapping.md" ]; then
  echo "📋 Status: Ready for GitHub sync"
  echo "🎯 Next step: /feature:sync $ARGUMENTS"
else
  # Calculate progress based on closed tasks
  if [ -n "$closed_tasks" ] && [ "$total_github_tasks" -gt 0 ]; then
    if [ "$closed_tasks" -eq "$total_github_tasks" ]; then
      echo "📋 Status: ✅ Complete!"
    else
      echo "📋 Status: 🚧 In Progress ($progress% complete)"
      echo "🎯 Next step: Work on open tasks"
    fi
  else
    echo "📋 Status: Ready for implementation"
    echo "🎯 Next step: Start working on tasks"
  fi
fi

# Show time estimates if available
if [ -f ".claude/tracking/implementations/$ARGUMENTS/plan.md" ]; then
  total_effort=$(grep 'Estimated total effort:' .claude/tracking/implementations/$ARGUMENTS/plan.md | tail -1 | sed 's/.*: *//')
  if [ -n "$total_effort" ]; then
    echo "⏱️ Total effort: $total_effort"
  fi
fi
```

### 5. Quick Actions

Suggest relevant commands based on current status:

```bash
echo ""
echo "Quick Actions"
echo "-------------"

# Suggest actions based on status
if [ ! -f ".claude/tracking/specs/$ARGUMENTS.md" ]; then
  echo "• Create specification: /feature:spec $ARGUMENTS"
elif [ ! -f ".claude/tracking/implementations/$ARGUMENTS/plan.md" ]; then
  echo "• Create plan: /feature:plan $ARGUMENTS"
  echo "• Review spec: /read .claude/tracking/specs/$ARGUMENTS.md"
elif [ "$task_count" -eq 0 ]; then
  echo "• Decompose tasks: /feature:decompose $ARGUMENTS"
  echo "• Review plan: /read .claude/tracking/implementations/$ARGUMENTS/plan.md"
elif [ ! -f ".claude/tracking/implementations/$ARGUMENTS/github-mapping.md" ]; then
  echo "• Sync to GitHub: /feature:sync $ARGUMENTS"
  echo "• Review tasks: ls .claude/tracking/implementations/$ARGUMENTS/*.md"
else
  # Show task-specific actions
  if [ -n "$feature_issue" ]; then
    echo "• View on GitHub: gh issue view $feature_issue --web"
    echo "• View all tasks: gh issue list --label feature:$ARGUMENTS"
  fi
  
  # Find first open task
  for task_file in .claude/tracking/implementations/$ARGUMENTS/[0-9]*.md; do
    [ -f "$task_file" ] || continue
    
    task_num=$(basename "$task_file" .md)
    task_state=$(gh issue view $task_num --json state -q .state 2>/dev/null || echo "OPEN")
    
    if [ "$task_state" = "OPEN" ]; then
      echo "• Start next task: /do-task $task_num"
      break
    fi
  done
fi

echo ""
echo "• Full status check: /feature:status $ARGUMENTS"
echo "• List all features: ls .claude/tracking/specs/"
```

## Error Handling

Handle common scenarios gracefully:
- Feature doesn't exist
- GitHub CLI not authenticated
- Network issues when checking GitHub
- Partial implementation states

## Output Format

The status command provides:
1. Local file status (spec, plan, tasks)
2. GitHub synchronization status
3. Task progress tracking
4. Execution plan based on dependencies
5. Summary with next steps
6. Quick action commands

This gives a complete overview of where the feature stands in the implementation workflow.