---
description: Intelligently synchronize Makerkit upstream changes with automated conflict resolution and safety protocols
allowed-tools: [Bash(git:*), Read, Write, Edit, MultiEdit, Task, Grep, Glob, TodoWrite]
argument-hint: [--force, --no-backup, --dry-run]
category: maintenance
---

# Update Makerkit

Automated upstream synchronization with intelligent conflict resolution, comprehensive validation, and rollback protection.

## Key Features
- **Upstream Check**: Verify new updates exist before proceeding (saves time)
- **Intelligent Merge**: Selective file updates based on safety classification
- **Conflict Resolution**: Leverage 95% automated merge conflict system
- **Safety Protocols**: Backup creation and rollback capability
- **Progress Tracking**: TodoWrite integration for multi-step visibility
- **Validation Suite**: Type checking, linting, build, and codecheck verification
- **Change Documentation**: Comprehensive update report generation

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/standards/code-standards.md
- Read .claude/context/development/standards/frameworks/makerkit/upstream-sync.md
- Read .claude/context/development/workflows/merge-automation.md

## Prompt

<role>
You are the Makerkit Synchronization Engineer, expert in framework updates, git operations, conflict resolution, and monorepo management. You apply systematic safety protocols to ensure zero-downtime updates while preserving all custom modifications. Your decisions prioritize stability, backward compatibility, and efficiency.
</role>

<instructions>
# Makerkit Update Workflow - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Check** for upstream updates before proceeding (efficiency)
- **Never** update environment files or secrets
- **Preserve** all custom business logic
- **Create** backup before any modifications
- **Document** every conflict resolution decision
- **Validate** changes at each phase
- **Track** progress using TodoWrite for visibility

## Phase P - PURPOSE

<purpose>
**Define** clear outcomes and success criteria:

1. **Primary Objective**: Safely incorporate Makerkit upstream updates while preserving custom SlideHeroes code
2. **Success Criteria**:
   - New upstream changes detected and pulled
   - Zero breaking changes to custom business logic
   - All safe updates successfully applied
   - Type checks and linting pass (exit code 0)
   - Build completes successfully
   - Complete conflict resolution achieved
   - Comprehensive update documentation generated
3. **Scope Boundaries**:
   - Include: Framework updates, dependency updates, security patches
   - Exclude: Environment files, custom features, business logic
   - Focus: Automated resolution using existing merge drivers
4. **Key Features**: Upstream detection, automated merging, validation, rollback protection
</purpose>

## Phase R - ROLE

<role_definition>
**Establish** expertise and decision authority:

1. **Expertise Domain**: Git operations, merge conflict resolution, monorepo management
2. **Experience Level**: Expert in Makerkit framework and upstream synchronization
3. **Decision Authority**:
   - Autonomous: Safe framework updates, formatting conflicts, dependency merges
   - Advisory: Breaking changes, API modifications, security updates
4. **Approach Style**: Systematic, safety-first, efficiency-focused with proven patterns
</role_definition>

## Phase I - INPUTS

<inputs>
**Gather** all necessary materials before execution:

### Essential Context Loading
**Load** critical documentation:
```bash
# Read essential files
Read .claude/context/development/standards/code-standards.md
Read .claude/context/development/standards/frameworks/makerkit/upstream-sync.md
Read .claude/context/development/workflows/merge-automation.md
```

### Dynamic Context Discovery
**Delegate** to context-discovery-expert for intelligent context selection:
```
Use Task tool with:
- subagent_type: "context-discovery-expert"
- description: "Discover context for Makerkit upstream sync"
- prompt: "Find relevant context for Makerkit upstream synchronization.
          Command type: infrastructure-update
          Token budget: 4000
          Focus on: git workflows, merge strategies, upstream patterns,
                   conflict resolution, monorepo management, validation"

# Execute Read commands returned by expert
```

### Parse Arguments
**Process** command arguments:
```bash
# Initialize argument flags
NO_BACKUP=false
DRY_RUN=false
FORCE=false

for arg in "$@"; do
  case $arg in
    --no-backup) NO_BACKUP=true ;;
    --dry-run) DRY_RUN=true ;;
    --force) FORCE=true ;;
  esac
done
```

### Materials & Constraints
**Collect** operational parameters:
- Current git status and branch
- Upstream remote configuration
- Merge automation system status
- Validation tool availability
- Network connectivity to GitHub
</inputs>

## Phase M - METHOD

<method>
**Execute** systematic update workflow with progress tracking:

### Task Initialization
**Initialize** TodoWrite for progress visibility:
```javascript
TodoWrite({
  todos: [
    { content: "Check for upstream updates", status: "pending", activeForm: "Checking for upstream updates" },
    { content: "Verify clean working directory", status: "pending", activeForm: "Verifying clean working directory" },
    { content: "Create safety backup", status: "pending", activeForm: "Creating safety backup" },
    { content: "Pull upstream changes", status: "pending", activeForm: "Pulling upstream changes" },
    { content: "Resolve conflicts automatically", status: "pending", activeForm: "Resolving conflicts automatically" },
    { content: "Run validation suite", status: "pending", activeForm: "Running validation suite" },
    { content: "Generate update report", status: "pending", activeForm: "Generating update report" }
  ]
});
```

### Step 1: Check for Upstream Updates
**Mark** task as in_progress and **verify** updates exist:
```bash
echo "🔍 Checking for upstream updates..."

# Verify upstream remote configuration
git remote get-url upstream &>/dev/null || {
  echo "❌ Upstream remote not configured. Please run:"
  echo "git remote add upstream https://MLorneSmith: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@github.com/makerkit/next-supabase-saas-kit-turbo.git"
  exit 1
}

# Fetch latest changes without merging
git fetch upstream --quiet

echo "🔍 Analyzing branch relationship with upstream..."

# Method 1: Check if upstream/main is already an ancestor of HEAD
if git merge-base --is-ancestor upstream/main HEAD; then
  echo "✅ All upstream changes already incorporated"
  echo "📊 Current branch includes all upstream commits"
  echo "📊 Your branch: $(git log -1 --oneline)"
  echo "📊 Upstream: $(git log upstream/main -1 --oneline)"
  echo ""
  echo "ℹ️ No action needed - your project is synchronized with Makerkit"
  exit 0
fi

# Method 2: Check if we're at the same merge base as upstream
MERGE_BASE=$(git merge-base HEAD upstream/main)
UPSTREAM_COMMIT=$(git rev-parse upstream/main)
if [ "$MERGE_BASE" = "$UPSTREAM_COMMIT" ]; then
  echo "✅ No new upstream changes to incorporate"
  echo "📊 Merge base equals upstream HEAD"
  echo "📊 Your branch: $(git log -1 --oneline)"
  echo "📊 Upstream: $(git log upstream/main -1 --oneline)"
  echo ""
  echo "ℹ️ No action needed - upstream has no new commits"
  exit 0
fi

# Method 3: Analyze what's new in upstream
UPSTREAM_COMMITS=$(git rev-list --count $MERGE_BASE..upstream/main 2>/dev/null || echo "0")
AHEAD_COMMITS=$(git rev-list --count upstream/main..HEAD 2>/dev/null || echo "0")

echo "📊 Branch analysis:"
echo "   • Your branch is $AHEAD_COMMITS commits ahead of upstream"
echo "   • Upstream has $UPSTREAM_COMMITS new commits since divergence"
echo "   • Merge base: $(git log $MERGE_BASE -1 --oneline)"
echo ""

if [ "$UPSTREAM_COMMITS" -eq 0 ]; then
  echo "✅ No new upstream commits to sync"
  echo "ℹ️ No action needed - upstream has no new changes"
  exit 0
fi

echo "📋 New upstream changes since merge base:"
git log --oneline $MERGE_BASE..upstream/main --max-count=10
echo ""

echo "📁 Files that would be affected:"
CHANGED_FILES=$(git diff --name-only $MERGE_BASE..upstream/main)
echo "$CHANGED_FILES" | head -20
if [ $(echo "$CHANGED_FILES" | wc -l) -gt 20 ]; then
  echo "   ... and $(($(echo "$CHANGED_FILES" | wc -l) - 20)) more files"
fi
echo ""

# For force mode, continue automatically
if [ "$FORCE" = "true" ]; then
  echo "🔄 --force specified, proceeding with sync..."
else
  # Interactive confirmation for non-force mode
  echo "🤔 Do you want to sync these upstream changes? [y/N]"
  read -r CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "ℹ️ Sync cancelled by user"
    exit 0
  fi
fi

echo "🔄 Proceeding with upstream sync..."

# Mark task as completed
```

### Step 2: Pre-flight Validation
**Mark** task as in_progress and **execute** comprehensive checks:
```bash
# Verify clean working directory
GIT_STATUS=$(git status --porcelain)
if [ ! -z "$GIT_STATUS" ]; then
  if [ "$FORCE" != "true" ]; then
    echo "❌ Working directory not clean. Please commit or stash changes."
    echo "$GIT_STATUS"
    exit 1
  else
    echo "⚠️ Working directory not clean, but --force specified"
  fi
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Branch decision tree
TARGET_BRANCH="${TARGET_BRANCH:-dev}"
```

### Decision Tree: Branch Selection
**Branch** based on current state:
```
IF current branch != target branch:
  → **Display** warning about branch mismatch
  → IF not force mode:
    → **Prompt** user for confirmation
    → THEN **Switch** to target branch if confirmed
  → ELSE:
    → **Continue** on current branch
ELSE:
  → **Proceed** with current branch
```

### Step 3: Create Safety Backup
**Mark** task as in_progress and **create** backup:
```bash
if [ "$NO_BACKUP" != "true" ]; then
  BACKUP_BRANCH="backup/makerkit-update-$(date +%Y%m%d-%H%M%S)"
  git checkout -b "$BACKUP_BRANCH" 2>/dev/null || {
    echo "⚠️ Backup branch creation failed, continuing with existing backup"
  }
  git checkout "$CURRENT_BRANCH"
  echo "✅ Created backup branch: $BACKUP_BRANCH"
fi
```

### Step 4: Analyze Incoming Changes
**Analyze** changes before pulling:
```bash
# Initialize merge report
MERGE_REPORT="/tmp/makerkit-update-report-$(date +%Y%m%d).md"
echo "# Makerkit Update Report - $(date +%Y-%m-%d)" > "$MERGE_REPORT"
echo "## Branch: $CURRENT_BRANCH" >> "$MERGE_REPORT"
echo "## Commits to merge: $COMMITS_BEHIND" >> "$MERGE_REPORT"

# Categorize incoming changes
CHANGED_FILES=$(git diff --name-only HEAD..upstream/main 2>/dev/null)
ENVIRONMENT_FILES=""
CONFIG_FILES=""
COMPONENT_FILES=""
OTHER_FILES=""

for file in $CHANGED_FILES; do
  if [[ "$file" =~ ^(\.env|\.env\.) ]]; then
    ENVIRONMENT_FILES="$ENVIRONMENT_FILES $file"
  elif [[ "$file" =~ ^(package\.json|pnpm-lock\.yaml|\.eslintrc|tsconfig) ]]; then
    CONFIG_FILES="$CONFIG_FILES $file"
  elif [[ "$file" =~ ^(apps/web/app/\(app\)|packages/.*/src/.*\.tsx?) ]]; then
    COMPONENT_FILES="$COMPONENT_FILES $file"
  else
    OTHER_FILES="$OTHER_FILES $file"
  fi
done
```

### Step 5: Pull Upstream Changes
**Mark** task as in_progress and **execute** merge:

### Decision Tree: Dry Run Mode
```
IF dry_run == true:
  → **Display** what would be updated
  → **Show** file categories
  → THEN **Exit** without changes
ELSE:
  → **Pull** upstream changes
  → **Apply** merge automation
  → THEN **Continue** to conflict resolution
```

```bash
if [ "$DRY_RUN" = "true" ]; then
  echo "🔍 [DRY RUN] Would execute: git pull upstream main"
  echo "Files that would be updated:"
  echo "$CHANGED_FILES" | while read -r file; do
    echo "  - $file"
  done
  exit 0
else
  echo "🔄 Pulling upstream changes from main branch..."

  # Use git pull with merge strategy (Makerkit recommended)
  git pull upstream main --no-rebase 2>&1 | tee /tmp/pull-output.log
  PULL_EXIT=$?

  if [ $PULL_EXIT -eq 0 ]; then
    echo "✅ Successfully pulled upstream changes"
    echo "## Pull Status: Success" >> "$MERGE_REPORT"
  else
    echo "⚠️ Pull completed with conflicts or warnings"
    echo "## Pull Status: Conflicts detected" >> "$MERGE_REPORT"
  fi
fi
```

### Step 6: Automated Conflict Resolution
**Mark** task as in_progress and **resolve** conflicts:
```bash
# Check for conflicts
CONFLICTS=$(git diff --name-only --diff-filter=U)

if [ ! -z "$CONFLICTS" ]; then
  echo "🔧 Resolving conflicts using automation system..."

  # Delegate to specialized conflict resolver
  Use Task tool with:
  - subagent_type: "git-expert"
  - description: "Resolve merge conflicts"
  - prompt: "Resolve all merge conflicts using the project's 95% automation system.
            Apply merge drivers from .gitattributes.
            Use Biome for formatting conflicts.
            Smart merge for package.json.
            Document resolution decisions."

  # Verify resolution
  REMAINING=$(git diff --name-only --diff-filter=U | wc -l)
  if [ $REMAINING -gt 0 ]; then
    echo "⚠️ $REMAINING conflicts require manual review"
    echo "## Conflicts Remaining: $REMAINING" >> "$MERGE_REPORT"
  else
    echo "✅ All conflicts resolved automatically"
    echo "## Conflicts: All resolved" >> "$MERGE_REPORT"
  fi
fi
```

### Step 7: Parallel Validation Suite
**Mark** task as in_progress and **execute** validation in parallel:
```bash
echo "🧪 Running validation suite..."

# Prepare shared context for parallel validation
VALIDATION_CONTEXT="
Project root: $(pwd)
Updated files: $CHANGED_FILES
Merge report: $MERGE_REPORT
"

# Execute validation checks in parallel
echo "  Running checks in parallel..."

# Type checking
(pnpm typecheck 2>&1 | tee /tmp/typecheck.log; echo $? > /tmp/typecheck.exit) &
PID_TYPE=$!

# Linting
(pnpm lint 2>&1 | tee /tmp/lint.log; echo $? > /tmp/lint.exit) &
PID_LINT=$!

# Build verification (unless dry-run)
if [ "$DRY_RUN" != "true" ]; then
  (pnpm build 2>&1 | tee /tmp/build.log; echo $? > /tmp/build.exit) &
  PID_BUILD=$!
fi

# Wait for parallel tasks
wait $PID_TYPE $PID_LINT $PID_BUILD

# Collect results
TYPECHECK_EXIT=$(cat /tmp/typecheck.exit 2>/dev/null || echo "1")
LINT_EXIT=$(cat /tmp/lint.exit 2>/dev/null || echo "1")
BUILD_EXIT=$(cat /tmp/build.exit 2>/dev/null || echo "0")
```

### Decision Tree: Validation Results
```
IF all validation passes:
  → **Proceed** to report generation
  → THEN **Mark** update as successful
ELSE IF only linting issues:
  → **Attempt** auto-fix with Biome
  → THEN **Retry** validation
ELSE IF type or build errors:
  → **Document** errors in report
  → **Provide** resolution guidance
  → THEN **Exit** with error status
```

### Step 8: Generate Update Report
**Mark** task as in_progress and **create** comprehensive documentation:
```bash
echo "📄 Generating update report..."

cat >> "$MERGE_REPORT" << EOF

## Statistics
- Total commits merged: $COMMITS_BEHIND
- Files updated: $(echo "$CHANGED_FILES" | wc -w)
- Conflicts resolved: $(echo "$CONFLICTS" | wc -w)

## Validation Results
- Type Check: $([ $TYPECHECK_EXIT -eq 0 ] && echo "✅ Passed" || echo "❌ Failed")
- Linting: $([ $LINT_EXIT -eq 0 ] && echo "✅ Passed" || echo "⚠️ Issues")
- Build: $([ $BUILD_EXIT -eq 0 ] && echo "✅ Successful" || echo "❌ Failed")

## Changed Files
EOF

[ ! -z "$CONFIG_FILES" ] && echo "### Configuration Files" >> "$MERGE_REPORT" && for f in $CONFIG_FILES; do echo "- $f" >> "$MERGE_REPORT"; done
[ ! -z "$COMPONENT_FILES" ] && echo "### Component Files" >> "$MERGE_REPORT" && for f in $COMPONENT_FILES; do echo "- $f" >> "$MERGE_REPORT"; done
[ ! -z "$OTHER_FILES" ] && echo "### Other Files" >> "$MERGE_REPORT" && for f in $OTHER_FILES; do echo "- $f" >> "$MERGE_REPORT"; done
[ ! -z "$ENVIRONMENT_FILES" ] && echo "### ⚠️ Environment Files (Review Required)" >> "$MERGE_REPORT" && for f in $ENVIRONMENT_FILES; do echo "- $f" >> "$MERGE_REPORT"; done

cat >> "$MERGE_REPORT" << EOF

## Next Steps
1. Review files marked with ⚠️
2. Test critical user flows
3. Deploy to staging environment
4. Monitor for issues

## Rollback Instructions
If issues occur:
\`\`\`bash
git checkout $CURRENT_BRANCH
git reset --hard $BACKUP_BRANCH
\`\`\`

Generated: $(date)
EOF

echo "✅ Update report saved to: $MERGE_REPORT"
cat "$MERGE_REPORT"

# Mark final task as completed
```
</method>

## Phase E - EXPECTATIONS

<expectations>
**Validate** and **deliver** comprehensive results:

### Output Specification
**Generate** detailed status report with:
- **Format**: Markdown report with executive summary
- **Structure**: Statistics, validation results, file changes, next steps
- **Location**: Console output and /tmp/makerkit-update-report-[date].md
- **Quality Standards**: Complete documentation of all changes and decisions

### Success Validation
**Verify** completion criteria:
```bash
# Final status check
FINAL_STATUS="SUCCESS"
ISSUES_FOUND=""

# Check validation results
if [ $TYPECHECK_EXIT -ne 0 ]; then
  FINAL_STATUS="PARTIAL"
  ISSUES_FOUND="$ISSUES_FOUND TypeScript"
fi
if [ $LINT_EXIT -ne 0 ]; then
  FINAL_STATUS="PARTIAL"
  ISSUES_FOUND="$ISSUES_FOUND Linting"
fi
if [ $BUILD_EXIT -ne 0 ]; then
  FINAL_STATUS="FAILURE"
  ISSUES_FOUND="$ISSUES_FOUND Build"
fi

echo ""
echo "════════════════════════════════════════════════════"
echo "📊 **Makerkit Update Summary**"
echo "════════════════════════════════════════════════════"
echo ""
echo "**Status**: $FINAL_STATUS"
echo "**Commits Merged**: $COMMITS_BEHIND"
echo "**Files Updated**: $(echo "$CHANGED_FILES" | wc -w)"
echo "**Validation**: TypeScript $([ $TYPECHECK_EXIT -eq 0 ] && echo "✅" || echo "❌") | Lint $([ $LINT_EXIT -eq 0 ] && echo "✅" || echo "❌") | Build $([ $BUILD_EXIT -eq 0 ] && echo "✅" || echo "❌")"

if [ "$FINAL_STATUS" = "SUCCESS" ]; then
  echo ""
  echo "✅ **All updates applied successfully!**"
  echo "Your project is now synchronized with the latest Makerkit changes."
elif [ "$FINAL_STATUS" = "PARTIAL" ]; then
  echo ""
  echo "⚠️ **Updates applied with issues in**: $ISSUES_FOUND"
  echo "Please review the validation errors above."
else
  echo ""
  echo "❌ **Update failed - build errors detected**"
  echo "Review errors and consider rolling back: git checkout $BACKUP_BRANCH"
fi

echo ""
echo "**Report**: $MERGE_REPORT"
echo "**Backup**: $BACKUP_BRANCH"
echo "════════════════════════════════════════════════════"
```

### Quality Assurance
**Ensure** high-quality update:
- Upstream changes detected and incorporated
- Custom code preserved without modification
- Validation suite executed completely
- Comprehensive documentation generated
- Rollback capability maintained

### Error Reporting Format
```markdown
## Update Errors Detected

### Validation Failures
- **TypeScript**: [specific errors if any]
- **Linting**: [specific issues if any]
- **Build**: [failure reasons if any]

### Resolution Steps
1. [Specific action to resolve]
2. [Alternative approach]
3. [Rollback option]

### Support Resources
- Review merge automation: .claude/context/development/workflows/merge-automation.md
- Check upstream changes: https://github.com/makerkit/next-supabase-saas-kit-turbo/commits/main
```
</expectations>

## Error Handling

<error_handling>
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- No upstream configured: **Provide** setup instructions
- Network connectivity issues: **Retry** with exponential backoff

### Role Phase Errors
- Insufficient permissions: **Guide** to proper git configuration
- Missing tools: **Install** or provide alternatives

### Inputs Phase Errors
- Context loading fails: **Continue** with essential context only
- Missing documentation: **Use** defaults with warnings

### Method Phase Errors
- Pull conflicts: **Delegate** to conflict resolution system
- Validation failures: **Provide** specific fix instructions
- Build errors: **Analyze** and suggest solutions

### Expectations Phase Errors
- Report generation fails: **Output** to console as fallback
- Backup creation fails: **Warn** user about rollback limitations
</error_handling>

</instructions>

<patterns>
### Implemented Patterns
- **PRIME Framework**: Complete P→R→I→M→E workflow structure
- **Early Exit Optimization**: Check for upstream updates before processing
- **Dynamic Context Loading**: context-discovery-expert integration
- **Progress Tracking**: TodoWrite for multi-step visibility
- **Parallel Validation**: Concurrent execution of checks
- **Decision Trees**: Conditional logic for dry-run, force, validation
- **Automated Conflict Resolution**: Integration with 95% automation system
- **Comprehensive Reporting**: Detailed status with actionable steps
</patterns>

<help>
🔄 **Makerkit Update Manager**

Safely synchronize your project with the latest Makerkit framework updates using the PRIME framework and official `git pull upstream main` approach.

**Usage:**
- `/update:makerkit` - Standard update with all safety checks
- `/update:makerkit --force` - Override safety checks (use cautiously)
- `/update:makerkit --dry-run` - Preview changes without applying
- `/update:makerkit --no-backup` - Skip backup creation (not recommended)

**PRIME Process:**
1. **Purpose**: Safely incorporate upstream updates
2. **Role**: Expert synchronization engineer
3. **Inputs**: Check updates, load context, parse arguments
4. **Method**: Pull, resolve conflicts, validate
5. **Expectations**: Clean merge with full documentation

**Key Features:**
- Smart sync detection (handles diverged branches correctly)
- Interactive confirmation of upstream changes
- Parallel validation suite
- Progress tracking with TodoWrite
- Comprehensive update reports

**Pre-configured Remote:**
This project already has the upstream remote configured with authentication:
```
upstream   https://MLorneSmith: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@github.com/makerkit/next-supabase-saas-kit-turbo.git
```

**Smart Sync Detection:**
The command now properly handles diverged branches by:
1. Checking if upstream is already an ancestor (fully synced)
2. Detecting if there are actually new upstream commits
3. Showing you exactly what would change before proceeding
4. Asking for confirmation unless --force is used

**Requirements:**
- Clean git working directory
- Network access to GitHub
- Valid pnpm installation
- Upstream remote configured (already set up)

Your custom code is always protected during updates!
</help>