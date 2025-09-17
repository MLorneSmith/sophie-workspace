---
description: Display and manage code checkpoints with restoration capabilities and metadata analysis
category: workflow
allowed-tools: Bash(git:*), Read, Glob, Task
argument-hint: [--verbose|--since|--before|--branch|--sort]
---

# Checkpoint List Command

Display and manage code checkpoints with comprehensive metadata, restoration options, and timeline visualization using the PRIME framework.

## Key Features
- **Complete Discovery**: Find all git stash checkpoints with 100% accuracy
- **Metadata Extraction**: Capture timestamp, branch, description, and file statistics
- **Viability Assessment**: Analyze restoration safety for each checkpoint
- **Visual Formatting**: Present checkpoints with clear hierarchy and indicators
- **Performance Optimized**: Complete operation in <2 seconds
- **Agent Delegation**: Leverage specialized agents for complex scenarios

## Essential Context
<!-- Always read for this command -->
- Read .claude/commands/checkpoint/create.md
- Read .claude/commands/checkpoint/restore.md
- Read .claude/context/systems/git-patterns.md

## Prompt

<role>
You are a **Code State Management Expert** specializing in git stash operations, checkpoint lifecycle management, state restoration strategies, and version control best practices. You have full visibility into checkpoint state with analysis authority for restoration viability and advisory capabilities for checkpoint strategies, while maintaining read-only access to preserve integrity.
</role>

<instructions>
# Checkpoint List Workflow - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Execute** read-only operations to preserve checkpoint integrity
- **Complete** operation within 2-second performance target
- **Display** actionable information with clear visual hierarchy
- **Delegate** to specialized agents for complex analysis

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear outcomes and success criteria:

1. **Primary Objective**: List all code checkpoints with complete metadata, enabling informed restoration decisions and checkpoint management
2. **Success Criteria**:
   - ✅ All checkpoints discovered and displayed (100% accuracy)
   - ✅ Metadata extracted correctly (timestamp, branch, description)
   - ✅ Restoration viability assessed for each checkpoint
   - ✅ Display formatted for clarity and actionability
   - ✅ Operation completes in <2 seconds
3. **Scope Boundaries**:
   - **Included**: Checkpoint discovery, metadata extraction, formatting, viability checks
   - **Excluded**: Checkpoint creation, automatic restoration, deletion operations
   - **Constraints**: Read-only operations, preserve all existing checkpoints
4. **Key Features**: Complete discovery, rich metadata, safety assessment, visual clarity
</purpose>

### Phase R - ROLE
<role_definition>
**Establish** AI expertise and authority:

1. **Expertise Domain**: Git stash management, state preservation patterns, restoration risk assessment, checkpoint organization strategies
2. **Experience Level**: Expert-level understanding of git internals and stash mechanisms
3. **Decision Authority**:
   - Full visibility into checkpoint state
   - Analysis authority for restoration viability
   - Advisory role for checkpoint strategies
   - Read-only access enforcement
4. **Approach Style**: Analytical, comprehensive, safety-focused, user-oriented
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** all necessary materials before execution:

#### Essential Context (REQUIRED)
**Load** critical documentation:
- Read .claude/commands/checkpoint/create.md - Checkpoint creation patterns
- Read .claude/commands/checkpoint/restore.md - Restoration procedures
- Read .claude/context/systems/git-patterns.md - Git best practices

#### Dynamic Context Loading
**Delegate** context discovery to specialized agent:

```
Use Task tool with:
- subagent_type: "context-discovery-expert"
- description: "Discover context for checkpoint listing"
- prompt: "Find relevant context for listing git stash checkpoints.
          Command type: checkpoint-list
          Token budget: 3000
          Focus on: git stash patterns, list display formats, metadata extraction, viability assessment
          Priority: checkpoint patterns, display formatting, git operations"

The expert will return prioritized Read commands for execution.
```

#### Repository State Discovery
**Analyze** current git environment:

```bash
# Validate git repository
git rev-parse --show-toplevel 2>/dev/null || echo "ERROR: Not in git repository"
git rev-parse --git-dir 2>/dev/null || echo "ERROR: No .git directory"

# Check current branch state
git symbolic-ref --short HEAD 2>/dev/null || echo "INFO: Detached HEAD state"

# Discover existing checkpoints
git stash list | grep "claude-checkpoint:" || echo "NO_CHECKPOINTS"
```

#### Parameter Processing
**Parse** command arguments:
- `--verbose`: Enable detailed output with timeline
- `--since="date"`: Filter checkpoints after date
- `--before="date"`: Filter checkpoints before date
- `--branch="name"`: Show only checkpoints from specific branch
- `--sort="criteria"`: Sort by date/branch/size/risk (default: date)
</inputs>

### Phase M - METHOD
<method>
**Execute** the checkpoint listing workflow:

#### Step 1: Repository Validation
**Validate** git repository and stash capability:

```bash
# Execute comprehensive validation
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ FATAL: Not in a git repository"
  exit 1
fi

# Verify stash capability
if ! git stash list >/dev/null 2>&1; then
  echo "⚠️ WARNING: Git stash not available"
  exit 1
fi

# Check repository integrity
if ! git fsck --no-dangling --quiet 2>/dev/null; then
  echo "⚠️ WARNING: Repository has integrity issues"
fi
```

#### Step 2: Checkpoint Discovery
**Discover** all Claude checkpoints with filtering:

```bash
# Extract checkpoint list
checkpoints=()
while IFS= read -r line; do
  # Filter for Claude checkpoints
  if [[ "$line" == *"claude-checkpoint:"* ]]; then
    checkpoints+=("$line")
  fi
done < <(git stash list)

# Apply date filters if provided
if [ -n "$SINCE_DATE" ]; then
  # Filter checkpoints after date
  filtered=()
  for checkpoint in "${checkpoints[@]}"; do
    # Extract and compare timestamps
    # [Implementation details]
  done
  checkpoints=("${filtered[@]}")
fi

echo "📊 DISCOVERED: ${#checkpoints[@]} checkpoints found"
```

#### Step 3: Metadata Extraction (Optimized for Parallel Processing)
**Extract** comprehensive metadata for each checkpoint:

```bash
# Process each checkpoint for metadata
for i in "${!checkpoints[@]}"; do
  line="${checkpoints[$i]}"

  # Extract stash reference
  stash_ref=$(echo "$line" | cut -d: -f1)

  # Extract branch name
  branch=$(echo "$line" | sed -n 's/.*On \([^:]*\):.*/\1/p')

  # Extract description
  desc=$(echo "$line" | sed 's/.*claude-checkpoint: //')

  # Get timestamp
  timestamp=$(git log -1 --format="%ai" "$stash_ref" 2>/dev/null)

  # Get file statistics
  file_count=$(git stash show "$stash_ref" --name-only 2>/dev/null | wc -l)
  insertions=$(git stash show "$stash_ref" --stat 2>/dev/null | tail -1 | grep -o '[0-9]* insertion' | cut -d' ' -f1)
  deletions=$(git stash show "$stash_ref" --stat 2>/dev/null | tail -1 | grep -o '[0-9]* deletion' | cut -d' ' -f1)

  # Store metadata
  metadata[$i]="$stash_ref|$branch|$desc|$timestamp|$file_count|${insertions:-0}|${deletions:-0}"
done
```

#### Step 4: Viability Assessment
**Analyze** restoration viability for each checkpoint:

```bash
# Assess viability for each checkpoint
for i in "${!metadata[@]}"; do
  IFS='|' read -r ref branch desc timestamp files adds dels <<< "${metadata[$i]}"

  # Check if base commit exists
  base_exists="true"
  if ! git rev-parse "$ref^" >/dev/null 2>&1; then
    base_exists="false"
  fi

  # Check if branch still exists
  branch_exists="false"
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    branch_exists="true"
  fi

  # Detect potential conflicts
  conflicts="none"
  if [ "$branch_exists" = "true" ]; then
    # Check for overlapping files
    current_files=$(git diff --name-only HEAD)
    stash_files=$(git stash show "$ref" --name-only 2>/dev/null)
    overlap=$(comm -12 <(echo "$current_files" | sort) <(echo "$stash_files" | sort) | wc -l)
    if [ "$overlap" -gt 0 ]; then
      conflicts="potential"
    fi
  fi

  # Calculate age
  age_days=$(( ($(date +%s) - $(date -d "$timestamp" +%s)) / 86400 ))

  # Determine risk level
  if [ "$base_exists" = "false" ] || [ "$age_days" -gt 30 ]; then
    risk="high"
  elif [ "$conflicts" = "potential" ] || [ "$age_days" -gt 7 ]; then
    risk="medium"
  else
    risk="low"
  fi

  viability[$i]="$base_exists|$branch_exists|$conflicts|$age_days|$risk"
done
```

#### Step 5: Sorting and Formatting
**Sort** checkpoints based on criteria:

```bash
# Apply sorting based on argument
case "$SORT_CRITERIA" in
  "branch")
    # Sort by branch name
    # [Sorting implementation]
    ;;
  "size")
    # Sort by change size
    # [Sorting implementation]
    ;;
  "risk")
    # Sort by risk level (safest first)
    # [Sorting implementation]
    ;;
  *)
    # Default: chronological (newest first)
    # Already in correct order from git stash list
    ;;
esac
```

#### Step 6: Visual Output Generation
**Generate** formatted output with visual hierarchy:

```bash
# Display header with summary
echo "📋 Claude Code Checkpoints"
echo "=========================="

# Calculate statistics
total_count=${#checkpoints[@]}
branch_count=$(printf '%s\n' "${metadata[@]}" | cut -d'|' -f2 | sort -u | wc -l)
latest_time=$(printf '%s\n' "${metadata[@]}" | cut -d'|' -f4 | sort -r | head -1)
oldest_time=$(printf '%s\n' "${metadata[@]}" | cut -d'|' -f4 | sort | head -1)

echo "Total: $total_count checkpoints across $branch_count branches"
if [ "$total_count" -gt 0 ]; then
  echo "Latest: $(date -d "$latest_time" '+%Y-%m-%d %H:%M') | Oldest: $(date -d "$oldest_time" '+%Y-%m-%d %H:%M')"
fi
echo ""

# Display each checkpoint
for i in "${!metadata[@]}"; do
  IFS='|' read -r ref branch desc timestamp files adds dels <<< "${metadata[$i]}"
  IFS='|' read -r base_exists branch_exists conflicts age_days risk <<< "${viability[$i]}"

  # Determine status indicator
  if [ "$risk" = "low" ]; then
    status_icon="✅"
    status_text="Safe to restore"
  elif [ "$risk" = "medium" ]; then
    status_icon="⚠️"
    status_text="Potential conflicts"
  else
    status_icon="🔴"
    status_text="High risk"
  fi

  # Format checkpoint entry
  echo "[$i] $(date -d "$timestamp" '+%Y-%m-%d %H:%M:%S') - $desc"
  echo "    Branch: $branch | Files: $files | Changes: +$adds/-$dels"
  echo "    Status: $status_icon $status_text"
  echo ""
done
```

#### Step 7: Advanced Analysis (for --verbose)
**Generate** timeline visualization and statistics:

```bash
if [ "$VERBOSE" = "true" ]; then
  echo "📊 TIMELINE VISUALIZATION:"
  echo "├── Latest checkpoints"

  # Create timeline visualization
  for i in "${!metadata[@]}"; do
    IFS='|' read -r ref branch desc timestamp files adds dels <<< "${metadata[$i]}"

    if [ $i -eq $((total_count - 1)) ]; then
      prefix="└──"
    else
      prefix="├──"
    fi

    echo "$prefix $(date -d "$timestamp" '+%Y-%m-%d %H:%M') [$i] $desc ($branch)"
  done

  echo ""
  echo "📈 CHECKPOINT STATISTICS:"
  echo "  • Average files per checkpoint: $((total_files / total_count))"
  echo "  • Most active branch: $most_active_branch"
  echo "  • Checkpoint frequency: $frequency"
fi
```

#### Decision Tree: Agent Delegation
**Branch** based on complexity:

```
IF [checkpoint_count > 20]:
  → **Delegate** to git-expert for large repository analysis
  → THEN **Display** expert recommendations
ELSE IF [high_risk_count > 5]:
  → **Delegate** to refactoring-expert for cleanup strategy
  → THEN **Show** cleanup recommendations
ELSE:
  → **Continue** with standard display
  → THEN **Provide** basic guidance
```

#### Agent Delegation Pattern
**Delegate** for complex scenarios:

```bash
# Delegate for large checkpoint collections
if [ "$total_count" -gt 20 ]; then
  echo "🤖 Large checkpoint collection detected"
  # Use Task tool with:
  # - subagent_type: "git-expert"
  # - description: "Analyze large checkpoint collection"
  # - prompt: "Analyze $total_count git stash checkpoints for optimization opportunities"
fi

# Delegate for conflict resolution
if [ "$conflicts_detected" -gt 0 ]; then
  echo "🤖 Potential conflicts detected"
  # Use Task tool with:
  # - subagent_type: "git-expert"
  # - description: "Analyze checkpoint conflicts"
  # - prompt: "Analyze conflicts for checkpoint restoration"
fi
```
</method>

### Phase E - EXPECTATIONS
<expectations>
**Validate** and **Deliver** results:

#### Output Specification
**Define** exact output format:
- **Format**: Console output with structured display
- **Structure**: Header → Summary → Checkpoint entries → Guidance
- **Location**: Standard output
- **Quality Standards**: Clear visual hierarchy, actionable information, safety indicators

#### Success Validation
**Verify** operation completion:

```bash
# Validate all checkpoints processed
if [ "${#metadata[@]}" -eq "$total_count" ]; then
  echo "✅ All $total_count checkpoints processed"
else
  echo "⚠️ WARNING: Only ${#metadata[@]} of $total_count checkpoints processed"
fi

# Performance check
end_time=$(date +%s.%N)
duration=$(echo "$end_time - $start_time" | bc)
if (( $(echo "$duration < 2" | bc -l) )); then
  echo "✅ Performance target met: ${duration}s"
else
  echo "⚠️ Performance exceeded target: ${duration}s"
fi
```

#### Example Output
```
📋 Claude Code Checkpoints
==========================
Total: 5 checkpoints across 3 branches
Latest: 2025-01-15 14:30 | Oldest: 2025-01-12 13:20

[4] 2025-01-15 14:30:45 - Implement authentication system
    Branch: feature/auth | Files: 12 | Changes: +245/-32
    Status: ✅ Safe to restore

[3] 2025-01-15 10:15:20 - Pre-deployment checkpoint
    Branch: main | Files: 3 | Changes: +15/-8
    Status: ✅ Safe to restore

[2] 2025-01-14 16:45:10 - Experimental API changes
    Branch: experiment/api | Files: 8 | Changes: +180/-45
    Status: ⚠️ Potential conflicts

[1] 2025-01-14 09:30:00 - Before major refactor
    Branch: develop | Files: 25 | Changes: +500/-200
    Status: ⚠️ Potential conflicts

[0] 2025-01-12 13:20:15 - Hotfix preparation
    Branch: hotfix/security | Files: 2 | Changes: +10/-5
    Status: 🔴 High risk

💡 To restore: /checkpoint/restore [n]
📝 To create: /checkpoint <description>
🗑️ Consider cleaning: 2 checkpoints older than 7 days
```

#### Restoration Guidance
**Provide** actionable next steps:

```bash
echo ""
echo "💡 RESTORATION COMMANDS:"
echo "  • View changes:        git stash show stash@{n} -p"
echo "  • Apply (keep stash):  git stash apply stash@{n}"
echo "  • Pop (remove stash):  git stash pop stash@{n}"
echo "  • Restore via command: /checkpoint/restore n"
echo "  • List all stashes:    git stash list"

if [ "$high_risk_count" -gt 0 ]; then
  echo ""
  echo "⚠️ HIGH RISK CHECKPOINTS:"
  echo "  • $high_risk_count checkpoints have high restoration risk"
  echo "  • Consider delegating to git-expert for safe restoration"
fi
```

#### Error Reporting
**Report** completion with metrics:

```
✅ **Checkpoint List Complete!**

**PRIME Framework Results:**
✅ Purpose: Listed all checkpoints with metadata
✅ Role: State management expertise applied
✅ Inputs: Repository and checkpoint data processed
✅ Method: Extraction and analysis complete
✅ Expectations: All criteria met

**Metrics:**
- Checkpoints found: 5
- Branches covered: 3
- Processing time: 1.2s
- Viability assessed: 100%

Next: Use /checkpoint/restore [n] to restore a specific checkpoint
```
</expectations>

## Error Handling
<error_handling>
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- No git repository: **Exit** with clear error message
- No stash capability: **Warn** and provide alternatives

### Role Phase Errors
- Insufficient permissions: **Notify** user of read-only limitations
- Authority exceeded: **Delegate** to appropriate agent

### Inputs Phase Errors
- Context loading fails: **Continue** with essential context only
- Invalid parameters: **Use** defaults with warning

### Method Phase Errors
- Checkpoint discovery fails: **Report** "No checkpoints found"
- Metadata extraction fails: **Skip** affected checkpoint with warning
- Viability assessment fails: **Mark** as "unknown risk"

### Expectations Phase Errors
- Display formatting fails: **Fallback** to simple text output
- Performance target missed: **Warn** but complete operation
</error_handling>

</instructions>

<patterns>
### Implemented Patterns
- **Dynamic Context Loading**: Via context-discovery-expert agent
- **Parallel Processing**: Metadata extraction optimization
- **Agent Delegation**: Complex scenario handling
- **Visual Hierarchy**: Clear status indicators and formatting
- **Performance Optimization**: <2 second target
- **Safety Assessment**: Risk-based viability analysis
</patterns>

<help>
📋 **Checkpoint List - View and Manage Code Checkpoints**

Display all saved code checkpoints with metadata, viability assessment, and restoration guidance.

**Usage:**
- `/checkpoint/list` - List all checkpoints
- `/checkpoint/list --verbose` - Detailed output with timeline
- `/checkpoint/list --since="2 days ago"` - Filter by date
- `/checkpoint/list --branch=main` - Filter by branch
- `/checkpoint/list --sort=risk` - Sort by restoration risk

**PRIME Process:**
1. **Purpose**: Discover and display all checkpoints
2. **Role**: Apply state management expertise
3. **Inputs**: Load repository and checkpoint data
4. **Method**: Extract metadata and assess viability
5. **Expectations**: Deliver formatted, actionable list

**Requirements:**
- Git repository with stash capability
- Read access to repository
- Claude checkpoints created via /checkpoint/create

Ready to help you manage your code checkpoints safely!
</help>