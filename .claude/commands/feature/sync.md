---
allowed-tools: Bash, Read, Write, LS, Task
---

# Feature Sync

Push feature implementation plan and tasks to GitHub as issues.

## Usage
```
/feature:sync <feature_name>
```

## Quick Check

```bash
# Verify implementation plan exists
test -f .claude/implementations/$ARGUMENTS/plan.md || echo "❌ Implementation plan not found. Run: /feature:plan $ARGUMENTS"

# Count task files
ls .claude/implementations/$ARGUMENTS/*.md 2>/dev/null | grep -v plan.md | wc -l
```

If no tasks found: "❌ No tasks to sync. Run: /feature:decompose $ARGUMENTS"

## Instructions

### 0. Check Remote Repository

Ensure we're not syncing to a template repository:

```bash
# Check if remote origin is valid
remote_url=$(git remote get-url origin 2>/dev/null || echo "")
if [[ -z "$remote_url" ]]; then
  echo "❌ ERROR: No git remote configured!"
  echo "Set up your repository: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
  exit 1
fi

# Ensure we're in the correct project repository
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
if [[ -z "$repo" ]]; then
  echo "❌ ERROR: Not in a GitHub repository or gh CLI not authenticated"
  echo "Authenticate with: gh auth login"
  exit 1
fi
```

### 1. Create Feature Implementation Issue

Strip frontmatter and prepare GitHub issue body:
```bash
# Extract content without frontmatter
sed '1,/^---$/d; 1,/^---$/d' .claude/implementations/$ARGUMENTS/plan.md > /tmp/feature-body-raw.md

# Process the content to remove internal sections and format for GitHub
awk '
  /^## Tasks Created/ {
    in_tasks=1
    next
  }
  /^## / && in_tasks {
    in_tasks=0
    # When we hit the next section after Tasks Created, add summary
    if (total_tasks) {
      print "## Implementation Summary\n"
      print "**Total tasks**: " total_tasks
      print "**Parallel tasks**: " parallel_tasks " (can be worked on simultaneously)"
      print "**Sequential tasks**: " sequential_tasks " (have dependencies)"
      if (total_effort) print "**Estimated effort**: " total_effort " hours"
      print ""
    }
  }
  /^Total tasks:/ && in_tasks { total_tasks = $3; next }
  /^Parallel tasks:/ && in_tasks { parallel_tasks = $3; next }
  /^Sequential tasks:/ && in_tasks { sequential_tasks = $3; next }
  /^Estimated total effort:/ && in_tasks {
    gsub(/^Estimated total effort: /, "")
    total_effort = $0
    next
  }
  !in_tasks { print }
  END {
    # If we were still in tasks section at EOF, add summary
    if (in_tasks && total_tasks) {
      print "## Implementation Summary\n"
      print "**Total tasks**: " total_tasks
      print "**Parallel tasks**: " parallel_tasks
      print "**Sequential tasks**: " sequential_tasks
      if (total_effort) print "**Estimated effort**: " total_effort
    }
  }
' /tmp/feature-body-raw.md > /tmp/feature-body.md

# Add reference to specification
echo "" >> /tmp/feature-body.md
echo "---" >> /tmp/feature-body.md
echo "📋 **Specification**: .claude/specs/$ARGUMENTS.md" >> /tmp/feature-body.md
echo "📁 **Implementation**: .claude/implementations/$ARGUMENTS/" >> /tmp/feature-body.md

# Create feature implementation issue with labels
feature_number=$(gh issue create \
  --title "Feature: $ARGUMENTS" \
  --body-file /tmp/feature-body.md \
  --label "feature,implementation,feature:$ARGUMENTS" \
  --json number -q .number)

echo "✅ Created feature issue: #$feature_number"
```

Store the returned issue number for plan frontmatter update.

### 2. Create Task Sub-Issues

Check if gh-sub-issue extension is available:
```bash
if gh extension list | grep -q "yahsan2/gh-sub-issue"; then
  use_subissues=true
  echo "✅ Using gh-sub-issue for hierarchical task creation"
else
  use_subissues=false
  echo "ℹ️ gh-sub-issue not installed. Using standard issues with references."
  echo "   To install: gh extension install yahsan2/gh-sub-issue"
fi
```

Count task files to determine strategy:
```bash
task_count=$(ls .claude/implementations/$ARGUMENTS/[0-9][0-9][0-9].md 2>/dev/null | wc -l)
echo "📊 Found $task_count tasks to sync"
```

### For Small Batches (< 5 tasks): Sequential Creation

```bash
if [ "$task_count" -lt 5 ]; then
  echo "Creating tasks sequentially..."
  
  for task_file in .claude/implementations/$ARGUMENTS/[0-9][0-9][0-9].md; do
    [ -f "$task_file" ] || continue
    
    # Extract task name from frontmatter
    task_name=$(grep '^name:' "$task_file" | sed 's/^name: *//')
    
    # Extract task metadata
    task_size=$(grep -E '^- Size:' "$task_file" | sed 's/.*Size: *//')
    task_parallel=$(grep '^parallel:' "$task_file" | sed 's/^parallel: *//')
    
    # Strip frontmatter from task content
    sed '1,/^---$/d; 1,/^---$/d' "$task_file" > /tmp/task-body.md
    
    # Add parent reference if not using sub-issues
    if [ "$use_subissues" = false ]; then
      echo "" >> /tmp/task-body.md
      echo "---" >> /tmp/task-body.md
      echo "**Parent Feature**: #$feature_number" >> /tmp/task-body.md
    fi
    
    # Create sub-issue or regular issue with labels
    if [ "$use_subissues" = true ]; then
      task_number=$(gh sub-issue create \
        --parent "$feature_number" \
        --title "$task_name" \
        --body-file /tmp/task-body.md \
        --label "task,feature:$ARGUMENTS,size:$task_size" \
        --json number -q .number)
    else
      task_number=$(gh issue create \
        --title "Task: $task_name" \
        --body-file /tmp/task-body.md \
        --label "task,feature:$ARGUMENTS,size:$task_size" \
        --json number -q .number)
    fi
    
    # Record mapping for renaming
    echo "$task_file:$task_number" >> /tmp/task-mapping.txt
    echo "  ✅ Created task #$task_number: $task_name"
  done
fi
```

### For Larger Batches (≥ 5 tasks): Parallel Creation

```bash
if [ "$task_count" -ge 5 ]; then
  echo "Creating $task_count tasks in parallel..."
  
  # Prepare for parallel execution
  mkdir -p /tmp/feature-sync-batches
  
  # Split tasks into batches of 3-4
  batch_size=3
  batch_num=1
  file_count=0
  
  for task_file in .claude/implementations/$ARGUMENTS/[0-9][0-9][0-9].md; do
    [ -f "$task_file" ] || continue
    
    echo "$task_file" >> /tmp/feature-sync-batches/batch-$batch_num.txt
    file_count=$((file_count + 1))
    
    if [ $file_count -ge $batch_size ]; then
      batch_num=$((batch_num + 1))
      file_count=0
    fi
  done
  
  echo "📦 Split into $batch_num batches for parallel processing"
fi
```

Use Task tool for parallel creation:
```yaml
Task:
  description: "Create GitHub tasks batch {X}"
  subagent_type: "general-purpose"
  prompt: |
    Create GitHub issues for tasks in feature $ARGUMENTS
    Parent feature issue: #$feature_number
    
    Tasks to process (from batch file):
    /tmp/feature-sync-batches/batch-{X}.txt
    
    For each task file:
    1. Extract task name, size, and parallel flag from frontmatter
    2. Strip frontmatter using: sed '1,/^---$/d; 1,/^---$/d'
    3. If gh-sub-issue available:
       gh sub-issue create --parent $feature_number --title "$task_name" \
         --body-file /tmp/task-body.md --label "task,feature:$ARGUMENTS,size:$size"
    4. Otherwise:
       gh issue create --title "Task: $task_name" \
         --body-file /tmp/task-body.md --label "task,feature:$ARGUMENTS,size:$size"
    5. Record: task_file:issue_number in /tmp/batch-{X}-mapping.txt
    
    Return mapping of files to issue numbers.
```

Consolidate results from parallel agents:
```bash
# Collect all mappings from agents
cat /tmp/batch-*/mapping.txt >> /tmp/task-mapping.txt
```

### 3. Update Task Files with Issue Numbers

First, build a mapping of old numbers to new issue IDs:
```bash
# Create mapping from old task numbers (001, 002, etc.) to new issue IDs
> /tmp/id-mapping.txt
while IFS=: read -r task_file task_number; do
  # Extract old number from filename
  old_num=$(basename "$task_file" .md)
  echo "$old_num:$task_number" >> /tmp/id-mapping.txt
done < /tmp/task-mapping.txt

echo "📝 Updating task references..."
```

Then rename files and update all references:
```bash
# Process each task file
while IFS=: read -r task_file task_number; do
  new_name="$(dirname "$task_file")/${task_number}.md"
  
  # Read the file content
  content=$(cat "$task_file")
  
  # Update depends_on and conflicts_with references
  while IFS=: read -r old_num new_num; do
    # Update arrays like [001, 002] to use new issue numbers
    content=$(echo "$content" | sed "s/\b$old_num\b/$new_num/g")
  done < /tmp/id-mapping.txt
  
  # Write updated content to new file
  echo "$content" > "$new_name"
  
  # Remove old file if different from new
  [ "$task_file" != "$new_name" ] && rm "$task_file"
  
  # Update github field in frontmatter
  repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
  github_url="https://github.com/$repo/issues/$task_number"
  current_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Update frontmatter
  sed -i.bak "/^github:/c\github: $github_url" "$new_name"
  sed -i.bak "/^updated:/c\updated: $current_date" "$new_name"
  rm "${new_name}.bak"
  
  echo "  ✅ Renamed: $(basename $task_file) → $(basename $new_name)"
done < /tmp/task-mapping.txt
```

### 4. Update Feature Issue with Task List

If NOT using gh-sub-issue, add task list to feature issue:

```bash
if [ "$use_subissues" = false ]; then
  echo "📋 Adding task list to feature issue..."
  
  # Get current feature body
  gh issue view $feature_number --json body -q .body > /tmp/feature-update.md
  
  # Append task list
  echo "" >> /tmp/feature-update.md
  echo "## Tasks" >> /tmp/feature-update.md
  
  # Add each task with checkbox
  while IFS=: read -r task_file task_number; do
    task_name=$(grep '^name:' "$task_file" | sed 's/^name: *//')
    echo "- [ ] #${task_number} - ${task_name}" >> /tmp/feature-update.md
  done < /tmp/task-mapping.txt
  
  # Update feature issue
  gh issue edit $feature_number --body-file /tmp/feature-update.md
  echo "✅ Updated feature issue with task list"
fi
```

### 5. Update Implementation Plan File

Update the plan file with GitHub URL and real task IDs:

#### 5a. Update Frontmatter
```bash
# Get repo info
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
feature_url="https://github.com/$repo/issues/$feature_number"
current_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Update plan frontmatter
sed -i.bak "/^github:/c\github: $feature_url" .claude/implementations/$ARGUMENTS/plan.md
sed -i.bak "/^updated:/c\updated: $current_date" .claude/implementations/$ARGUMENTS/plan.md
rm .claude/implementations/$ARGUMENTS/plan.md.bak

echo "✅ Updated implementation plan with GitHub URL"
```

#### 5b. Update Tasks Created Section
```bash
# Create updated Tasks Created section
cat > /tmp/tasks-section.md << 'EOF'
## Tasks Created
EOF

# Add each task with its real issue number
for task_file in .claude/implementations/$ARGUMENTS/[0-9]*.md; do
  [ -f "$task_file" ] || continue
  
  # Get issue number (filename without .md)
  issue_num=$(basename "$task_file" .md)
  
  # Get task metadata
  task_name=$(grep '^name:' "$task_file" | sed 's/^name: *//')
  parallel=$(grep '^parallel:' "$task_file" | sed 's/^parallel: *//')
  size=$(grep -E '^- Size:' "$task_file" | sed 's/.*Size: *//')
  
  # Add to tasks section
  echo "- [ ] #${issue_num} - ${task_name} (parallel: ${parallel}, size: ${size})" >> /tmp/tasks-section.md
done

# Add summary statistics
total_count=$(ls .claude/implementations/$ARGUMENTS/[0-9]*.md 2>/dev/null | wc -l)
parallel_count=$(grep -l '^parallel: true' .claude/implementations/$ARGUMENTS/[0-9]*.md 2>/dev/null | wc -l)
sequential_count=$((total_count - parallel_count))

cat >> /tmp/tasks-section.md << EOF

### Summary
Total tasks: ${total_count}
Parallel tasks: ${parallel_count}
Sequential tasks: ${sequential_count}
EOF

# Replace Tasks Created section in plan.md
cp .claude/implementations/$ARGUMENTS/plan.md .claude/implementations/$ARGUMENTS/plan.md.backup
awk '
  /^## Tasks Created/ {
    skip=1
    while ((getline line < "/tmp/tasks-section.md") > 0) print line
    close("/tmp/tasks-section.md")
  }
  /^## / && !/^## Tasks Created/ { skip=0 }
  !skip && !/^## Tasks Created/ { print }
' .claude/implementations/$ARGUMENTS/plan.md.backup > .claude/implementations/$ARGUMENTS/plan.md

rm .claude/implementations/$ARGUMENTS/plan.md.backup
rm /tmp/tasks-section.md
```

### 6. Create Mapping File

Create `.claude/implementations/$ARGUMENTS/github-mapping.md`:
```bash
# Create mapping file for reference
cat > .claude/implementations/$ARGUMENTS/github-mapping.md << EOF
# GitHub Issue Mapping

**Feature**: #${feature_number} - https://github.com/${repo}/issues/${feature_number}
**Created**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Tasks
EOF

# Add each task mapping
for task_file in .claude/implementations/$ARGUMENTS/[0-9]*.md; do
  [ -f "$task_file" ] || continue
  
  issue_num=$(basename "$task_file" .md)
  task_name=$(grep '^name:' "$task_file" | sed 's/^name: *//')
  
  echo "- #${issue_num}: ${task_name} - https://github.com/${repo}/issues/${issue_num}" >> .claude/implementations/$ARGUMENTS/github-mapping.md
done

echo "" >> .claude/implementations/$ARGUMENTS/github-mapping.md
echo "---" >> .claude/implementations/$ARGUMENTS/github-mapping.md
echo "Synced: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> .claude/implementations/$ARGUMENTS/github-mapping.md

echo "✅ Created GitHub mapping file"
```

### 7. Create Feature Branch

Create a feature branch for development:

```bash
# Ensure main is current
git checkout main
git pull origin main --ff-only 2>/dev/null || true

# Create feature branch
branch_name="feature/$ARGUMENTS"
git checkout -b "$branch_name" 2>/dev/null || git checkout "$branch_name"

echo "✅ Created/switched to branch: $branch_name"
```

### 8. Final Output

```
✅ Feature synced to GitHub successfully!

📊 Summary:
  - Feature Issue: #${feature_number} - ${ARGUMENTS}
  - Tasks Created: ${task_count} issues
  - Labels Applied: feature, task, feature:${ARGUMENTS}
  - Files Renamed: 001.md → ${issue_id}.md format
  - References Updated: depends_on/conflicts_with now use issue IDs
  - Branch: feature/${ARGUMENTS}

🔗 Links:
  - Feature: https://github.com/${repo}/issues/${feature_number}
  - Mapping: .claude/implementations/${ARGUMENTS}/github-mapping.md

📋 Next Steps:
  - Start implementation: /do-task ${first_task_number}
  - View feature status: gh issue view ${feature_number}
  - Track progress: /feature:status ${ARGUMENTS}
```

## Error Handling

If any issue creation fails:
- Report what succeeded
- Note what failed
- Don't attempt rollback (partial sync is acceptable)
- Provide recovery instructions

Common errors:
- **No GitHub auth**: Run `gh auth login`
- **No remote**: Set up with `git remote add origin <url>`
- **Rate limited**: Wait and retry later
- **Network issues**: Check connection and retry

## Important Notes

- Trust GitHub CLI authentication
- Don't pre-check for duplicate issues
- Update frontmatter only after successful creation
- Keep operations simple and atomic
- Use labels consistently for filtering/tracking