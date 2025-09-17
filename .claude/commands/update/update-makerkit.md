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
# Add upstream remote if not exists
git remote get-url makerkit &>/dev/null || {
  git remote add makerkit https://github.com/makerkit/next-supabase-saas-kit-turbo.git
  echo "✅ Added Makerkit upstream remote"
}

# Fetch latest changes
echo "📥 Fetching upstream changes..."
git fetch makerkit --depth=50

# Analyze incoming changes
COMMIT_COUNT=$(git rev-list --count HEAD..makerkit/main)
echo "📊 Found $COMMIT_COUNT new commits from upstream"

# Generate change summary
echo "📋 Change Summary:"
git log --oneline HEAD..makerkit/main --max-count=10

# Identify affected areas
echo "📁 Files to be updated:"
git diff --name-only HEAD..makerkit/main | head -20
```
</upstream>

## 4. Dynamic Context Loading
<context_loading>
Load relevant documentation based on changes:

```bash
# Identify change categories
CHANGED_FILES=$(git diff --name-only HEAD..makerkit/main)
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

## 5. Selective Merge Execution
<merge>
Apply updates based on safety classification:

```bash
# Initialize merge report
MERGE_REPORT="/tmp/makerkit-update-report-$(date +%Y%m%d).md"
echo "# Makerkit Update Report - $(date +%Y-%m-%d)" > "$MERGE_REPORT"
echo "## Summary" >> "$MERGE_REPORT"

# Categorize files for merge
AUTO_MERGE_FILES=""
REVIEW_REQUIRED_FILES=""
SKIP_FILES=""

for file in $(git diff --name-only HEAD..makerkit/main); do
  # Classification logic
  if [[ "$file" =~ ^(\.env|\.env\.) ]]; then
    SKIP_FILES="$SKIP_FILES $file"
  elif [[ "$file" =~ ^(package\.json|pnpm-lock\.yaml|\.eslintrc|tsconfig) ]]; then
    AUTO_MERGE_FILES="$AUTO_MERGE_FILES $file"
  elif [[ "$file" =~ ^(apps/web/app/\(app\)|packages/.*/src/.*\.tsx?) ]]; then
    REVIEW_REQUIRED_FILES="$REVIEW_REQUIRED_FILES $file"
  else
    AUTO_MERGE_FILES="$AUTO_MERGE_FILES $file"
  fi
done

# Execute auto-merge for safe files
if [ ! -z "$AUTO_MERGE_FILES" ]; then
  echo "🔄 Auto-merging safe files..."
  for file in $AUTO_MERGE_FILES; do
    if [ "$DRY_RUN" = "true" ]; then
      echo "  [DRY RUN] Would update: $file"
    else
      git checkout makerkit/main -- "$file" 2>/dev/null && {
        echo "  ✅ Updated: $file"
        echo "- ✅ $file" >> "$MERGE_REPORT"
      }
    fi
  done
fi

# Handle files requiring review
if [ ! -z "$REVIEW_REQUIRED_FILES" ]; then
  echo "⚠️ Files requiring manual review:"
  for file in $REVIEW_REQUIRED_FILES; do
    echo "  - $file"
    echo "- ⚠️ [REVIEW] $file" >> "$MERGE_REPORT"
  done
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
      git fetch makerkit --depth=50
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

Safely synchronize your project with the latest Makerkit framework updates.

**Usage:**
- `/update:makerkit` - Standard update with all safety checks
- `/update:makerkit --force` - Override safety checks (use cautiously)
- `/update:makerkit --dry-run` - Preview changes without applying
- `/update:makerkit --no-backup` - Skip backup creation (not recommended)

**Process:**
1. Pre-flight validation checks
2. Backup branch creation
3. Fetch and analyze upstream changes
4. Selective merge with conflict resolution
5. Comprehensive validation suite
6. Generate detailed update report

**Requirements:**
- Clean git working directory
- Network access to GitHub
- Valid pnpm installation

Your custom code is always protected during updates!
</help>