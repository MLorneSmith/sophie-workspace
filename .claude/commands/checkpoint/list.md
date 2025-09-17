---
description: Display and manage code checkpoints with restoration capabilities and metadata analysis
category: workflow
allowed-tools: Bash(git:*), Read, Glob, Task
argument-hint: [--verbose|--since|--before]
mcp-tools: mcp__code-reasoning__code-reasoning
---

# Checkpoint List Command

Display and manage code checkpoints with comprehensive metadata, restoration options, and timeline visualization.

## 1. PURPOSE

Define the strategic objective and measurable success criteria.

### Primary Objective
List all code checkpoints with complete metadata, enabling informed restoration decisions and checkpoint management.

### Success Criteria
- ✅ All checkpoints discovered and displayed (100% accuracy)
- ✅ Metadata extracted correctly (timestamp, branch, description)
- ✅ Restoration viability assessed for each checkpoint
- ✅ Display formatted for clarity and actionability
- ✅ Operation completes in <2 seconds

### Scope Boundaries
- **Included**: Checkpoint discovery, metadata extraction, formatting, viability checks
- **Excluded**: Checkpoint creation, automatic restoration, deletion operations
- **Constraints**: Read-only operations, preserve all existing checkpoints

## 2. ROLE

You are a **Code State Management Expert** with deep expertise in:
- Git stash operations and internals
- Checkpoint lifecycle management
- State restoration strategies
- Version control best practices

### Authority Level
- **Full visibility** into checkpoint state
- **Analysis authority** for restoration viability
- **Advisory role** for checkpoint strategies
- **Read-only access** to preserve integrity

### Expertise Domains
- Git stash management
- State preservation patterns
- Restoration risk assessment
- Checkpoint organization strategies

## 3. INSTRUCTIONS

Execute these action-oriented steps for comprehensive checkpoint listing.

### Phase 1: Discovery & Extraction

1. **Validate** git repository and stash availability:
   ```bash
   git rev-parse --show-toplevel || exit 1
   git stash list >/dev/null 2>&1 || echo "No stash capability"
   ```

2. **Discover** all Claude checkpoints:
   ```bash
   git stash list | grep "claude-checkpoint:" || echo "NO_CHECKPOINTS"
   ```

3. **Extract** metadata for each checkpoint:
   ```bash
   while IFS= read -r line; do
     # Extract stash reference: stash@{n}
     stash_ref=$(echo "$line" | cut -d: -f1)

     # Extract branch name
     branch=$(echo "$line" | sed -n 's/.*On \([^:]*\):.*/\1/p')

     # Extract description
     desc=$(echo "$line" | sed 's/.*claude-checkpoint: //')

     # Get timestamp
     timestamp=$(git log -1 --format="%ai" "$stash_ref" 2>/dev/null)

     # Get file statistics
     stats=$(git stash show --stat "$stash_ref" 2>/dev/null | tail -1)
   done
   ```

4. **Analyze** checkpoint viability:
   - Check if base commit still exists
   - Detect potential conflicts with current HEAD
   - Calculate age and relevance

### Phase 2: Formatting & Presentation

5. **Sort** checkpoints by criteria:
   - Default: Chronological (newest first)
   - Optional: By branch, by size, by description

6. **Format** output with visual hierarchy:
   ```bash
   # Header with summary
   echo "📋 Claude Code Checkpoints"
   echo "=========================="
   echo "Total: $count checkpoints across $branch_count branches"
   echo ""

   # Detailed listing
   for checkpoint in "${checkpoints[@]}"; do
     echo "[${index}] ${timestamp} - ${description}"
     echo "    Branch: ${branch} | Files: ${file_count} | Changes: +${additions}/-${deletions}"
     echo "    Status: ${viability_status}"
   done
   ```

7. **Provide** restoration guidance:
   ```bash
   echo ""
   echo "💡 To restore: /checkpoint/restore [n]"
   echo "📝 To create: /checkpoint <description>"
   ```

### Phase 3: Advanced Analysis

8. **Generate** timeline visualization for `--verbose`:
   ```text
   Timeline:
   ├── 2025-01-15 14:30 [2] Auth refactor checkpoint (main)
   ├── 2025-01-15 10:15 [1] Pre-deployment state (develop)
   └── 2025-01-14 16:45 [0] Feature complete (feature/api)
   ```

9. **Calculate** checkpoint statistics:
   - Average checkpoint size
   - Most active branch
   - Checkpoint frequency

10. **Recommend** checkpoint management actions:
    - Old checkpoints to consider removing
    - Missing checkpoint opportunities
    - Restoration risk assessments

## 4. MATERIALS

Context, constraints, and patterns for checkpoint listing.

### Dynamic Context Loading

```bash
# Load project-specific checkpoint patterns
CHECKPOINT_CONFIG=".claude/context/checkpoint-patterns.md"
if [ -f "$CHECKPOINT_CONFIG" ]; then
    source "$CHECKPOINT_CONFIG"
fi

# Check for checkpoint metadata file
CHECKPOINT_META=".claude/checkpoints/metadata.json"
if [ -f "$CHECKPOINT_META" ]; then
    # Merge with git stash data
    jq -r '.checkpoints[]' "$CHECKPOINT_META"
fi
```

### Checkpoint Classification

| Type | Pattern | Priority | Retention |
|------|---------|----------|-----------|
| **Feature Complete** | `feature-*-complete` | High | 30 days |
| **Pre-Deployment** | `pre-deploy-*` | Critical | 90 days |
| **Experiment** | `experiment-*` | Low | 7 days |
| **Hotfix** | `hotfix-*` | High | 14 days |
| **Refactor** | `refactor-*` | Medium | 21 days |

### Viability Assessment Matrix

```typescript
interface CheckpointViability {
  baseCommitExists: boolean;    // Can apply to base
  hasConflicts: boolean;        // Will cause conflicts
  branchExists: boolean;        // Target branch available
  ageInDays: number;            // How old
  filesModified: number;        // Scope of changes
  riskLevel: 'low' | 'medium' | 'high';
}
```

### Display Formatting Rules

1. **Color Coding** (when terminal supports):
   - 🟢 Green: Safe to restore (no conflicts)
   - 🟡 Yellow: May have conflicts
   - 🔴 Red: High risk or very old
   - ⚪ Gray: Archived/inactive

2. **Sorting Options**:
   ```bash
   --sort=date    # Default: newest first
   --sort=branch  # Group by branch
   --sort=size    # Largest changes first
   --sort=risk    # Safest first
   ```

## 5. EXPECTATIONS

Define success criteria, output format, and validation methods.

### Output Format

```text
📋 Claude Code Checkpoints
==========================
Total: 5 checkpoints across 3 branches
Latest: 2 hours ago | Oldest: 3 days ago

[4] 2025-01-15 14:30:45 - Implement authentication system
    Branch: feature/auth | Files: 12 | Changes: +245/-32
    Status: ✅ Safe to restore (no conflicts)

[3] 2025-01-15 10:15:20 - Pre-deployment checkpoint
    Branch: main | Files: 3 | Changes: +15/-8
    Status: ✅ Safe to restore

[2] 2025-01-14 16:45:10 - Experimental API changes
    Branch: experiment/api | Files: 8 | Changes: +180/-45
    Status: ⚠️ Potential conflicts (5 files modified since)

[1] 2025-01-14 09:30:00 - Before major refactor
    Branch: develop | Files: 25 | Changes: +500/-200
    Status: ⚠️ Branch diverged significantly

[0] 2025-01-12 13:20:15 - Hotfix preparation
    Branch: hotfix/security | Files: 2 | Changes: +10/-5
    Status: 🔴 Very old, branch deleted

💡 To restore: /checkpoint/restore [n]
📝 To create: /checkpoint <description>
🗑️  Consider cleaning: 2 checkpoints older than 7 days
```

### Validation Criteria

| Check | Success Indicator | Failure Action |
|-------|-------------------|----------------|
| Git repository | `git rev-parse` succeeds | Error: Not in git repository |
| Stash available | `git stash list` works | Error: Stash not available |
| Checkpoints exist | Grep finds matches | Show "No checkpoints found" |
| Metadata extraction | All fields populated | Use defaults for missing |
| Formatting | Output renders correctly | Fallback to simple format |

### Performance Benchmarks

- Checkpoint discovery: <0.5 seconds
- Metadata extraction: <0.5 seconds per checkpoint
- Viability analysis: <0.3 seconds per checkpoint
- Total operation: <2 seconds for up to 20 checkpoints

### Error Handling Matrix

```typescript
const errorHandlers = {
  "not a git repository": "Navigate to a git repository first",
  "no checkpoints found": "Create checkpoints with /checkpoint <description>",
  "stash corrupted": "Run git fsck to check repository integrity",
  "permission denied": "Check repository permissions",
  "invalid stash reference": "Checkpoint may have been deleted"
}
```

### Integration Points

- **Delegate to**: `git-expert` for complex restoration scenarios
- **MCP Tools**: `mcp__code-reasoning__code-reasoning` for conflict analysis
- **Related Commands**: `/checkpoint/create`, `/checkpoint/restore`, `/checkpoint/clean`

## Usage Examples

```bash
# List all checkpoints
/checkpoint/list

# Verbose output with timeline
/checkpoint/list --verbose

# Filter by date
/checkpoint/list --since="2 days ago"
/checkpoint/list --before="2025-01-14"

# Sort options
/checkpoint/list --sort=branch
/checkpoint/list --sort=size

# Show only specific branch
/checkpoint/list --branch=main
```

## Success Indicators

✅ All checkpoints discovered and listed
✅ Metadata accurately extracted
✅ Viability status correctly assessed
✅ Output clearly formatted
✅ Restoration guidance provided
✅ Performance within 2-second target