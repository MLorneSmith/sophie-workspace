---
description: Intelligently synchronize Makerkit upstream changes with automated conflict resolution and safety protocols
allowed-tools: [Bash(git:*), Read, Write, Edit, Task, Grep, Glob]
argument-hint: [--force, --no-backup, --dry-run]
category: maintenance
---

# Update Makerkit

Automated upstream synchronization with intelligent conflict resolution, comprehensive validation, and rollback protection.

## Key Features
- **Intelligent Merge**: Selective file updates based on safety rules
- **Conflict Resolution**: Automated handling of common merge conflicts
- **Safety Protocols**: Backup creation and rollback capability
- **Validation Suite**: Type checking, linting, and build verification
- **Change Documentation**: Comprehensive update report generation

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/standards/code-standards.md
- Read .claude/context/standards/makerkit/upstream-sync.md

## Prompt

<purpose>
You are executing a Makerkit upstream synchronization to safely incorporate framework updates while preserving custom project code. Success is measured by:
- Zero breaking changes to custom business logic
- All safe updates successfully applied
- Passing type checks and linting
- Complete conflict resolution
- Comprehensive update documentation
</purpose>

<role>
You are the Makerkit Synchronization Engineer, expert in framework updates, git operations, conflict resolution, and monorepo management. You apply systematic safety protocols to ensure zero-downtime updates while preserving all custom modifications. Your decisions prioritize stability and backward compatibility.
</role>

<instructions>
# Makerkit Update Workflow

**CORE REQUIREMENTS**:
- Never update environment files or secrets
- Preserve all custom business logic
- Create backup before any modifications
- Document every conflict resolution decision
- Validate changes at each phase

## 1. Pre-flight Validation
<validation>
Execute comprehensive pre-update checks:

```bash
# Verify clean working directory
GIT_STATUS=$(git status --porcelain)
if [ ! -z "$GIT_STATUS" ]; then
  echo "❌ Working directory not clean. Please commit or stash changes."
  echo "$GIT_STATUS"
  exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# CRITICAL: Verify we're on the intended branch for updates
TARGET_BRANCH="${TARGET_BRANCH:-dev}"  # Default to dev, can be overridden
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
  echo "⚠️ Warning: Currently on branch '$CURRENT_BRANCH', not '$TARGET_BRANCH'"
  echo "The upstream pull will merge into the current branch."
  read -p "Continue on '$CURRENT_BRANCH'? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "ℹ️ Switching to $TARGET_BRANCH branch..."
    git checkout "$TARGET_BRANCH" || {
      echo "❌ Failed to switch to $TARGET_BRANCH"
      exit 1
    }
    CURRENT_BRANCH="$TARGET_BRANCH"
  fi
fi

# Verify repository health
git fsck --no-progress 2>&1 | grep -q "error" && {
  echo "❌ Repository integrity check failed"
  exit 1
}

echo "✅ Pre-flight checks passed"
```
</validation>

## 2. Backup Creation
<backup>
Create safety backup unless --no-backup flag provided:

```bash
# Parse arguments
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

# Create backup branch
if [ "$NO_BACKUP" != "true" ]; then
  BACKUP_BRANCH="backup/makerkit-update-$(date +%Y-%m-%d-%H%M%S)"
  git checkout -b "$BACKUP_BRANCH" 2>/dev/null || {
    echo "⚠️ Backup branch creation failed, continuing with existing backup"
  }
  echo "✅ Created backup branch: $BACKUP_BRANCH"
fi
```
</backup>

## 3. Upstream Setup & Analysis
<upstream>
Configure and analyze upstream changes:

```bash
# Verify upstream remote configuration
# Expected configuration:
# upstream   https://MLorneSmith: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@github.com/makerkit/next-supabase-saas-kit-turbo.git
git remote get-url upstream &>/dev/null || {
  echo "❌ Upstream remote not configured. Please run:"
  echo "git remote add upstream https://MLorneSmith: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@github.com/makerkit/next-supabase-saas-kit-turbo.git"
  exit 1
}

echo "✅ Upstream remote verified"

# Fetch latest changes
echo "📥 Fetching upstream changes..."
git fetch upstream

# Analyze incoming changes before pulling
COMMIT_COUNT=$(git rev-list --count HEAD..upstream/main 2>/dev/null || echo "0")
echo "📊 Found $COMMIT_COUNT new commits from upstream"

# Generate change summary
echo "📋 Change Summary:"
git log --oneline HEAD..upstream/main --max-count=10 2>/dev/null || echo "No new commits"

# Identify affected areas
echo "📁 Files to be updated:"
git diff --name-only HEAD..upstream/main 2>/dev/null | head -20 || echo "No file changes detected"
```
</upstream>

## 4. Dynamic Context Loading
<context_loading>
Load relevant documentation based on changes:

```bash
# Identify change categories
CHANGED_FILES=$(git diff --name-only HEAD..upstream/main)
CHANGE_CATEGORIES=""

echo "$CHANGED_FILES" | grep -q "packages/" && CHANGE_CATEGORIES="$CHANGE_CATEGORIES packages"
echo "$CHANGED_FILES" | grep -q "apps/" && CHANGE_CATEGORIES="$CHANGE_CATEGORIES apps"
echo "$CHANGED_FILES" | grep -q "supabase/" && CHANGE_CATEGORIES="$CHANGE_CATEGORIES database"
echo "$CHANGED_FILES" | grep -q ".github/" && CHANGE_CATEGORIES="$CHANGE_CATEGORIES ci"

# Load context for affected areas
if [ ! -z "$CHANGE_CATEGORIES" ]; then
  echo "🔍 Loading context for: $CHANGE_CATEGORIES"
  # Read relevant documentation files based on categories
fi
```
</context_loading>

## 5. Pull Upstream Changes (Makerkit Recommended Approach)
<merge>
Pull and merge upstream changes using Makerkit's recommended approach:

```bash
# Initialize merge report
MERGE_REPORT="/tmp/makerkit-update-report-$(date +%Y%m%d).md"
echo "# Makerkit Update Report - $(date +%Y-%m-%d)" > "$MERGE_REPORT"
echo "## Summary" >> "$MERGE_REPORT"
echo "## Branch: $CURRENT_BRANCH" >> "$MERGE_REPORT"

# Store list of changed files before pull
CHANGED_FILES=$(git diff --name-only HEAD..upstream/main 2>/dev/null)

# Categorize files that will be updated
ENVIRONMENT_FILES=""
CONFIG_FILES=""
COMPONENT_FILES=""
OTHER_FILES=""

for file in $CHANGED_FILES; do
  # Categorize for reporting
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

# Execute pull with merge strategy
if [ "$DRY_RUN" = "true" ]; then
  echo "🔍 [DRY RUN] Would execute: git pull upstream main"
  echo "Files that would be updated:"
  echo "$CHANGED_FILES" | while read -r file; do
    echo "  - $file"
  done
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

  # Document the changes
  echo "## Changed Files" >> "$MERGE_REPORT"
  [ ! -z "$CONFIG_FILES" ] && echo "### Configuration Files" >> "$MERGE_REPORT" && for f in $CONFIG_FILES; do echo "- $f" >> "$MERGE_REPORT"; done
  [ ! -z "$COMPONENT_FILES" ] && echo "### Component Files" >> "$MERGE_REPORT" && for f in $COMPONENT_FILES; do echo "- $f" >> "$MERGE_REPORT"; done
  [ ! -z "$OTHER_FILES" ] && echo "### Other Files" >> "$MERGE_REPORT" && for f in $OTHER_FILES; do echo "- $f" >> "$MERGE_REPORT"; done
  [ ! -z "$ENVIRONMENT_FILES" ] && echo "### ⚠️ Environment Files (Review Required)" >> "$MERGE_REPORT" && for f in $ENVIRONMENT_FILES; do echo "- $f" >> "$MERGE_REPORT"; done
fi
```
</merge>

## 6. Conflict Resolution
<conflicts>
Handle merge conflicts intelligently:

```bash
# Check for conflicts
CONFLICTS=$(git diff --name-only --diff-filter=U)

if [ ! -z "$CONFLICTS" ]; then
  echo "🔧 Resolving conflicts..."

  for file in $CONFLICTS; do
    echo "  Processing conflict in: $file"

    # Determine resolution strategy
    if [[ "$file" =~ package\.json ]]; then
      # Smart package.json merge
      echo "    Merging package.json dependencies..."
      # Implement intelligent dependency merging
      # Preserve custom dependencies while updating shared ones
    elif [[ "$file" =~ \.config\. ]]; then
      # Configuration file merge
      echo "    Merging configuration file..."
      # Prefer upstream for framework configs
      # Preserve custom project configs
    else
      # Flag for manual resolution
      echo "    ⚠️ Manual resolution required for: $file"
      echo "- ⚠️ [CONFLICT] $file" >> "$MERGE_REPORT"
    fi
  done
fi
```
</conflicts>

## 7. Validation Suite
<validation_suite>
Run comprehensive validation checks:

```bash
echo "🧪 Running validation suite..."

# Type checking
echo "  Running type checks..."
pnpm typecheck 2>&1 | tee /tmp/typecheck.log
TYPECHECK_EXIT=$?

if [ $TYPECHECK_EXIT -ne 0 ]; then
  echo "  ❌ Type checking failed"
  echo "## Type Check Errors" >> "$MERGE_REPORT"
  cat /tmp/typecheck.log >> "$MERGE_REPORT"
else
  echo "  ✅ Type checking passed"
fi

# Linting
echo "  Running linter..."
pnpm lint 2>&1 | tee /tmp/lint.log
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ]; then
  echo "  ⚠️ Linting issues found"
  echo "## Linting Issues" >> "$MERGE_REPORT"
  cat /tmp/lint.log >> "$MERGE_REPORT"
else
  echo "  ✅ Linting passed"
fi

# Build test (unless dry-run)
if [ "$DRY_RUN" != "true" ]; then
  echo "  Running build test..."
  pnpm build 2>&1 | tee /tmp/build.log
  BUILD_EXIT=$?

  if [ $BUILD_EXIT -ne 0 ]; then
    echo "  ❌ Build failed"
    echo "## Build Errors" >> "$MERGE_REPORT"
    cat /tmp/build.log >> "$MERGE_REPORT"
  else
    echo "  ✅ Build successful"
  fi
fi
```
</validation_suite>

## 8. Generate Update Report
<reporting>
Create comprehensive update documentation:

```bash
# Finalize report
echo "📄 Generating update report..."

cat >> "$MERGE_REPORT" << EOF

## Statistics
- Total commits merged: $COMMIT_COUNT
- Files updated: $(echo "$AUTO_MERGE_FILES" | wc -w)
- Files requiring review: $(echo "$REVIEW_REQUIRED_FILES" | wc -w)
- Files skipped: $(echo "$SKIP_FILES" | wc -w)
- Conflicts resolved: $(echo "$CONFLICTS" | wc -w)

## Validation Results
- Type Check: $([ $TYPECHECK_EXIT -eq 0 ] && echo "✅ Passed" || echo "❌ Failed")
- Linting: $([ $LINT_EXIT -eq 0 ] && echo "✅ Passed" || echo "⚠️ Issues")
- Build: $([ $BUILD_EXIT -eq 0 ] && echo "✅ Successful" || echo "❌ Failed")

## Next Steps
1. Review files marked with [REVIEW] status
2. Resolve any remaining conflicts
3. Test critical user flows
4. Deploy to staging environment
5. Monitor for issues

## Rollback Instructions
If issues occur, rollback using:
\`\`\`bash
git checkout $CURRENT_BRANCH
git branch -D $(git branch --show-current)
\`\`\`

Generated: $(date)
EOF

# Display report location
echo "✅ Update report saved to: $MERGE_REPORT"
cat "$MERGE_REPORT"
```
</reporting>

## 9. Error Recovery
<error_handling>
Implement comprehensive error handling:

```bash
# Set up error trap
trap 'handle_error $? $LINENO' ERR

handle_error() {
  local exit_code=$1
  local line_number=$2

  echo "❌ Error occurred at line $line_number (exit code: $exit_code)"

  # Attempt automatic recovery
  case $exit_code in
    1)
      echo "🔧 Attempting to resolve git conflicts..."
      git status --porcelain | grep "^UU" | awk '{print $2}' | xargs git add
      ;;
    2)
      echo "🔧 Network error, retrying fetch..."
      sleep 2
      git fetch upstream
      ;;
    *)
      echo "⚠️ Automatic recovery not available for this error"
      echo "📝 Manual intervention required"
      ;;
  esac

  # Provide recovery instructions
  echo ""
  echo "Recovery Options:"
  echo "1. Review the error above and fix manually"
  echo "2. Rollback to backup branch: git checkout $BACKUP_BRANCH"
  echo "3. Reset to original state: git reset --hard HEAD"
}
```
</error_handling>
</instructions>

<expectations>
Upon completion, you will have:
- All safe Makerkit updates applied successfully
- Zero breaking changes to custom code
- All validation checks passing (or issues documented)
- Comprehensive update report generated
- Clear next steps and rollback instructions provided
- Every conflict either resolved or flagged for review

Success is measured by:
- Type checking exit code: 0
- Critical business logic preserved: 100%
- Update report completeness: All sections filled
- Rollback capability verified: Yes
- No unexpected runtime errors
</expectations>

<help>
🔄 **Makerkit Update Manager**

Safely synchronize your project with the latest Makerkit framework updates using the official `git pull upstream main` approach.

**Usage:**
- `/update:makerkit` - Standard update with all safety checks
- `/update:makerkit --force` - Override safety checks (use cautiously)
- `/update:makerkit --dry-run` - Preview changes without applying
- `/update:makerkit --no-backup` - Skip backup creation (not recommended)

**Process:**
1. Pre-flight validation checks
2. Backup branch creation
3. Fetch and analyze upstream changes
4. Pull upstream main branch (Makerkit recommended approach)
5. Comprehensive validation suite
6. Generate detailed update report

**Pre-configured Remote:**
This project already has the upstream remote configured with authentication:
```
upstream   https://MLorneSmith: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@github.com/makerkit/next-supabase-saas-kit-turbo.git
```

**Requirements:**
- Clean git working directory
- Network access to GitHub
- Valid pnpm installation
- Upstream remote configured (already set up)

Your custom code is always protected during updates!
</help>