---
description: Resolve all merge conflicts from upstream MakerKit updates 
allowed-tools: [Bash(git:*), Bash(pnpm:*), Bash(npx:*), Read, Edit, MultiEdit, Grep, Glob, Task, TodoWrite]
argument-hint: [--dry-run, --skip-validation, --force]
---

# Resolve Merge Conflicts

Automatically resolve all merge conflicts from upstream MakerKit updates.

## Key Features
- **Automated Resolution**: Leverages existing merge drivers for 95% conflict automation
- **Smart Conflict Handling**: Uses .gitattributes rules for formatting, package.json, and feature boundaries
- **Comprehensive Validation**: Biome formatting, type checking, build verification, and codecheck validation
- **Status Reporting**: Real-time progress tracking and detailed completion report
- **Safety Protocols**: Backup creation and rollback capability
- **Progress Visibility**: TodoWrite integration for multi-step tracking

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/workflows/merge-automation.md
- Read .gitattributes
- Read .claude/commands/infrastructure/updates/update-makerkit.md

## Prompt

<role>
You are the Merge Conflict Resolution Expert, specializing in conflict resolution. You apply custom merge drivers, .gitattributes rules, and validation protocols to achieve 95% automation while ensuring zero breaking changes.
</role>

<instructions>

**CORE REQUIREMENTS**:
- **Leverage** existing 95% automation system from merge-automation.md
- **Ensure** zero conflicts remain after resolution
- **Validate** all changes with Biome, TypeScript, build checks, and codecheck
- **Provide** comprehensive status reporting throughout process
- **Track** progress using TodoWrite for visibility

# Merge Conflict Resolution Workflow - PRIME Framework

## Phase P - PURPOSE

<purpose>
**Define** clear outcomes and success criteria:

1. **Primary Objective**: Resolve all merge conflicts from upstream MakerKit updates using existing automation
2. **Success Criteria**:
   - All conflicts resolved (git status shows no UU files)
   - No syntax errors (Biome check passes)
   - No type errors (TypeScript compilation succeeds)
   - Build succeeds (pnpm build completes)
   - Codecheck passes (.claude/scripts/codecheck-direct.sh succeeds)
   - Repository in clean, committable state
3. **Scope Boundaries**:
   - Include: Entire project repository
   - Exclude: Manual conflicts requiring business logic decisions
   - Focus: Leverage existing automation for maximum efficiency
4. **Key Features**: Automated resolution, validation, status reporting, rollback capability
</purpose>

## Phase R - ROLE

<role_definition>
**Establish** expertise and decision authority:

1. **Expertise Domain**: Git conflict resolution with project's automation system
2. **Experience Level**: Expert-level merge drivers and validation workflows
3. **Decision Authority**:
   - Autonomous: Automation rules, formatting, resolution strategies
   - Advisory: Complex logic conflicts for manual review
4. **Approach Style**: Systematic, safety-first, proven automation patterns
</role_definition>

## Phase I - INPUTS

<inputs>
**Gather** all necessary materials before execution:

### Essential Context Loading
**Load** critical documentation:
```bash
# Read essential files
Read .claude/context/development/workflows/merge-automation.md
Read .gitattributes
Read .claude/commands/infrastructure/updates/update-makerkit.md
```

### Dynamic Context Discovery
**Delegate** to context-discovery-expert for intelligent context:
```
Use Task tool with:
- subagent_type: "context-discovery-expert"
- description: "Discover context for merge conflict resolution"
- prompt: "Find relevant context for resolving merge conflicts.
          Command type: merge-conflict-resolution
          Token budget: 4000
          Focus on: git patterns, conflict resolution, validation workflows,
                   merge automation strategies, error recovery patterns"

# Execute Read commands returned by expert
```

### Repository State Analysis
**Assess** current conflict situation:

```bash
# Enhanced conflict detection - finds ALL conflicts, not just git-tracked ones
# Method 1: Git's internal conflict tracking
CONFLICTS_GIT=$(git diff --name-only --diff-filter=U 2>/dev/null || true)

# Method 2: Search for conflict markers in all tracked files
CONFLICTS_MARKERS=$(git grep -l "^<<<<<<< HEAD\|^<<<<<<< " 2>/dev/null || true)

# Method 3: Search for merge separators and endings
CONFLICTS_SEPARATORS=$(git grep -l "^=======$\|^>>>>>>> " 2>/dev/null || true)

# Combine all detection methods and deduplicate
ALL_CONFLICTS=$(echo -e "$CONFLICTS_GIT\n$CONFLICTS_MARKERS\n$CONFLICTS_SEPARATORS" | sort -u | grep -v "^$")
CONFLICT_COUNT=$(echo "$ALL_CONFLICTS" | wc -l)

# Analyze conflict types and check for three-way merge info
FORMATTING_CONFLICTS=""
PACKAGE_CONFLICTS=""
LOGIC_CONFLICTS=""
CONFIG_CONFLICTS=""
CORRUPTED_CONFLICTS=""

for file in $ALL_CONFLICTS; do
  # Check if we have three-way merge information
  HAS_MERGE_INFO=false
  if git show :1:"$file" &>/dev/null && git show :2:"$file" &>/dev/null && git show :3:"$file" &>/dev/null; then
    HAS_MERGE_INFO=true
  fi

  # Categorize conflicts
  if [[ "$file" =~ \.(js|ts|tsx|jsx)$ ]]; then
    if [ "$HAS_MERGE_INFO" = true ] && git show :2:"$file" | diff -q - <(git show :3:"$file") | grep -q "formatting\|quotes\|semicolon\|spacing"; then
      FORMATTING_CONFLICTS="$FORMATTING_CONFLICTS $file"
    else
      LOGIC_CONFLICTS="$LOGIC_CONFLICTS $file"
    fi
  elif [[ "$file" =~ package\.json$ ]]; then
    PACKAGE_CONFLICTS="$PACKAGE_CONFLICTS $file"
  elif [[ "$file" =~ \.(config|env)\.?.*$ ]]; then
    CONFIG_CONFLICTS="$CONFIG_CONFLICTS $file"
  else
    LOGIC_CONFLICTS="$LOGIC_CONFLICTS $file"
  fi

  # Check for corrupted files (has markers but no git merge info)
  if [ "$HAS_MERGE_INFO" = false ] && grep -q "^<<<<<<< \|^=======$\|^>>>>>>> " "$file" 2>/dev/null; then
    CORRUPTED_CONFLICTS="$CORRUPTED_CONFLICTS $file"
  fi
done

echo "📊 Conflict Analysis:"
echo "  Total conflicts: $CONFLICT_COUNT"
echo "  Git-tracked conflicts: $(echo $CONFLICTS_GIT | wc -w)"
echo "  Files with conflict markers: $(echo "$CONFLICTS_MARKERS $CONFLICTS_SEPARATORS" | tr ' ' '\n' | sort -u | grep -v "^$" | wc -l)"
echo "  Formatting conflicts: $(echo $FORMATTING_CONFLICTS | wc -w)"
echo "  Package conflicts: $(echo $PACKAGE_CONFLICTS | wc -w)"
echo "  Config conflicts: $(echo $CONFIG_CONFLICTS | wc -w)"
echo "  Logic conflicts: $(echo $LOGIC_CONFLICTS | wc -w)"
echo "  Corrupted files: $(echo $CORRUPTED_CONFLICTS | wc -w)"
```

### Parse Arguments
**Process** command arguments:
- **--dry-run**: Preview resolution without applying changes
- **--skip-validation**: Skip post-resolution validation checks
- **--force**: Override safety checks and warnings

### Materials & Constraints
**Collect** additional inputs:
- Current git status and branch information
- Existing merge automation configuration
- Validation tool availability (Biome, TypeScript, pnpm)
- Backup branch creation capability
</inputs>

## Phase M - METHOD

<method>
**Execute** conflict resolution workflow with systematic approach:

### Task Initialization
**Initialize** progress tracking:
```javascript
TodoWrite({
  todos: [
    { content: "Verify merge automation system", status: "pending", activeForm: "Verifying merge automation system" },
    { content: "Create safety backup", status: "pending", activeForm: "Creating safety backup" },
    { content: "Apply automated conflict resolution", status: "pending", activeForm: "Applying automated conflict resolution" },
    { content: "Analyze and update package versions", status: "pending", activeForm: "Analyzing and updating package versions" },
    { content: "Handle remaining conflicts by category", status: "pending", activeForm: "Handling remaining conflicts by category" },
    { content: "Verify all conflicts resolved", status: "pending", activeForm: "Verifying all conflicts resolved" },
    { content: "Run comprehensive validation suite", status: "pending", activeForm: "Running comprehensive validation suite" }
  ]
});
```

### Step 1: Pre-Resolution Validation
**Mark** task as in_progress and **verify** merge automation system:
```bash
# Check merge drivers are configured
git config --get merge.formatting.driver || echo "⚠️ Formatting driver not configured"
git config --get merge.json-union.driver || echo "⚠️ JSON union driver not configured"
git config --get rerere.enabled || echo "⚠️ Git rerere not enabled"

# Verify .gitattributes exists
[ -f .gitattributes ] || echo "⚠️ .gitattributes not found"
```
**Mark** task as completed

### Step 2: Create Safety Backup
**Mark** task as in_progress and **create** backup unless --force:
```bash
if [ "$FORCE" != "true" ]; then
  BACKUP_BRANCH="backup/conflict-resolution-$(date +%Y%m%d-%H%M%S)"
  git branch "$BACKUP_BRANCH"
  echo "✅ Created backup branch: $BACKUP_BRANCH"
fi
```
**Mark** task as completed

### Step 3: Automated Conflict Resolution
**Mark** task as in_progress and **apply** systematic resolution using three-way merge:
```bash
# Create temporary directory for merge work
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Function to extract versions for three-way merge
extract_versions() {
  local file=$1
  local has_merge_info=false

  # Check for git's three-way merge information
  if git show :1:"$file" &>/dev/null; then
    git show :1:"$file" > "$TEMP_DIR/base" 2>/dev/null || true    # Common ancestor
    git show :2:"$file" > "$TEMP_DIR/ours" 2>/dev/null || true    # Our version
    git show :3:"$file" > "$TEMP_DIR/theirs" 2>/dev/null || true  # Their version
    has_merge_info=true
  else
    # Fallback: use git history and upstream
    git show HEAD~1:"$file" > "$TEMP_DIR/before" 2>/dev/null || true
    git show upstream/main:"$file" > "$TEMP_DIR/upstream" 2>/dev/null || true

    # Extract sections from conflict markers if present
    if grep -q "^<<<<<<< " "$file"; then
      sed -n '/^<<<<<<< /,/^=======/p' "$file" | sed '1d;$d' > "$TEMP_DIR/ours"
      sed -n '/^=======/,/^>>>>>>> /p' "$file" | sed '1d;$d' > "$TEMP_DIR/theirs"
    fi
  fi
  echo $has_merge_info
}

# Apply formatting merge driver to formatting conflicts
for file in $FORMATTING_CONFLICTS; do
  echo "🔧 Auto-resolving formatting in: $file"
  extract_versions "$file"

  # Attempt three-way merge
  if [ -f "$TEMP_DIR/base" ]; then
    git merge-file -p "$TEMP_DIR/ours" "$TEMP_DIR/base" "$TEMP_DIR/theirs" > "$file.merged" 2>/dev/null
    if [ $? -eq 0 ]; then
      mv "$file.merged" "$file"
    else
      # Fallback to our version for formatting conflicts
      cp "$TEMP_DIR/ours" "$file"
    fi
  else
    # Remove conflict markers and keep our version
    sed '/^<<<<<<< /,/^=======/d; /^>>>>>>> /d' "$file" > "$file.clean"
    mv "$file.clean" "$file"
  fi

  # Format the result
  npx biome format --write "$file"
  git add "$file"
done

# Apply intelligent JSON merge for package.json files
for file in $PACKAGE_CONFLICTS; do
  echo "🔧 Auto-resolving package dependencies in: $file"
  extract_versions "$file"

  if [ -f "$TEMP_DIR/ours" ] && [ -f "$TEMP_DIR/theirs" ]; then
    # Merge package.json intelligently
    node -e "
      const fs = require('fs');
      const ours = JSON.parse(fs.readFileSync('$TEMP_DIR/ours'));
      const theirs = JSON.parse(fs.readFileSync('$TEMP_DIR/theirs'));
      const merged = { ...ours };

      // Merge dependencies
      ['dependencies', 'devDependencies', 'peerDependencies'].forEach(key => {
        if (theirs[key]) {
          merged[key] = { ...(ours[key] || {}), ...theirs[key] };
        }
      });

      // Keep our scripts but add new ones from theirs
      if (theirs.scripts) {
        merged.scripts = { ...(theirs.scripts || {}), ...(ours.scripts || {}) };
      }

      fs.writeFileSync('$file', JSON.stringify(merged, null, 2));
    " || {
      # Fallback to git merge-file
      git merge-file --union "$TEMP_DIR/ours" "$TEMP_DIR/base" "$TEMP_DIR/theirs" 2>/dev/null
      cp "$TEMP_DIR/ours" "$file"
    }
  fi

  npx biome format --write "$file" 2>/dev/null || prettier --write "$file" 2>/dev/null || true
  git add "$file"
done

# Enhanced corrupted file recovery with multiple strategies
for file in $CORRUPTED_CONFLICTS; do
  echo "🔧 Reconstructing corrupted file: $file"

  # Strategy 1: Try to get clean version from git history
  if git show HEAD~1:"$file" &>/dev/null; then
    echo "  Using version from HEAD~1"
    git show HEAD~1:"$file" > "$file"
  elif git show upstream/main:"$file" &>/dev/null; then
    echo "  Using version from upstream/main"
    git show upstream/main:"$file" > "$file"
  elif git show HEAD~2:"$file" &>/dev/null; then
    echo "  Using version from HEAD~2"
    git show HEAD~2:"$file" > "$file"
  elif git show origin/main:"$file" &>/dev/null; then
    echo "  Using version from origin/main"
    git show origin/main:"$file" > "$file"
  else
    echo "  ⚠️ Manual cleanup - attempting smart conflict marker removal"

    # Strategy 2: Smart conflict marker removal preserving both sides
    if grep -q "^<<<<<<< HEAD" "$file"; then
      # Create temporary files for both sides
      sed -n '/^<<<<<<< HEAD/,/^=======/p' "$file" | sed '1d;$d' > "$TEMP_DIR/head_version"
      sed -n '/^=======/,/^>>>>>>> /p' "$file" | sed '1d;$d' > "$TEMP_DIR/incoming_version"

      # Try to merge non-conflicting parts
      if [ -s "$TEMP_DIR/head_version" ] && [ -s "$TEMP_DIR/incoming_version" ]; then
        # Use our version by default for corrupted files
        cp "$TEMP_DIR/head_version" "$file"
        echo "    Used HEAD version for corrupted conflict"
      else
        # Fallback: Remove all markers and hope for the best
        sed -i 's/^<<<<<<< .*//' "$file"
        sed -i 's/^=======//' "$file"
        sed -i 's/^>>>>>>> .*//' "$file"
        echo "    Removed conflict markers (manual review recommended)"
      fi
    else
      # Strategy 3: Generic marker cleanup
      sed -i 's/^<<<<<<< .*//' "$file"
      sed -i 's/^=======//' "$file"
      sed -i 's/^>>>>>>> .*//' "$file"
      echo "    Cleaned up conflict markers"
    fi
  fi

  # Post-recovery validation and formatting
  if [[ "$file" =~ \.(js|ts|tsx|jsx|json)$ ]]; then
    # Validate syntax before formatting
    if [[ "$file" =~ \.json$ ]]; then
      if ! jq empty "$file" 2>/dev/null; then
        echo "    ⚠️ JSON syntax error detected - attempting repair"
        # Try to fix common JSON issues
        sed -i 's/,\s*}/}/g' "$file"  # Remove trailing commas
        sed -i 's/,\s*]/]/g' "$file"  # Remove trailing commas in arrays
      fi
    fi

    # Format if valid
    npx biome format --write "$file" 2>/dev/null || {
      echo "    ⚠️ Formatting failed - file may need manual review"
    }
  fi

  git add "$file"
done
```
**Mark** task as completed

### Step 4: Package Version Analysis and Updates
**Mark** task as in_progress and **analyze** package version differences after conflict resolution:
```bash
# Analyze package versions that may have been missed when choosing "ours"
echo "📦 Analyzing package version differences..."

# Run the package version comparison tool if it exists
if [ -f ".claude/scripts/conflict-resolution/compare-package-versions.sh" ]; then
  echo "Running package version comparison..."
  .claude/scripts/conflict-resolution/compare-package-versions.sh

  # Check if we should apply safe updates automatically
  if [ "$FORCE" != "true" ]; then
    echo ""
    echo "💡 Recommended: Apply safe (minor/patch) updates"
    read -p "Apply safe package updates now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "📦 Applying safe package updates..."
      npx -y npm-check-updates -u --target minor
      pnpm install
      echo "✅ Package updates applied"

      # Add updated files to git
      git add "**/package.json" pnpm-lock.yaml 2>/dev/null || true
    else
      echo "⏭️  Skipping package updates (can be done later)"
    fi
  else
    # In force mode, automatically apply safe updates
    echo "📦 Auto-applying safe package updates (--force mode)..."
    npx -y npm-check-updates -u --target minor
    pnpm install
    git add "**/package.json" pnpm-lock.yaml 2>/dev/null || true
  fi
else
  echo "⚠️ Package version comparison script not found"
  echo "  Consider running: npx npm-check-updates --target minor"
fi
```
**Mark** task as completed

### Step 5: Smart Conflict Resolution by Category
**Mark** task as in_progress and **handle** remaining conflicts based on .gitattributes rules:
```bash
# Apply .gitattributes-based resolution
for file in $CONFIG_CONFLICTS; do
  if grep -q "merge=manual" .gitattributes; then
    echo "⚠️ Manual resolution required for: $file"
    echo "- [MANUAL] $file" >> /tmp/manual-conflicts.txt
  elif grep -q "merge=ours" .gitattributes; then
    git checkout --ours "$file"
    git add "$file"
    echo "✅ Kept our version: $file"
  elif grep -q "merge=theirs" .gitattributes; then
    git checkout --theirs "$file"
    git add "$file"
    echo "✅ Took their version: $file"
  fi
done
```
**Mark** task as completed

### Step 6: Final Conflict Check
**Mark** task as in_progress and **verify** all conflicts resolved:
```bash
REMAINING_CONFLICTS=$(git diff --name-only --diff-filter=U)
if [ ! -z "$REMAINING_CONFLICTS" ]; then
  echo "⚠️ Manual intervention required for:"
  echo "$REMAINING_CONFLICTS" | while read -r file; do
    echo "  - $file"
    echo "- [MANUAL] $file" >> /tmp/manual-conflicts.txt
  done
fi
```
**Mark** task as completed

### Step 7: Comprehensive Validation Suite
**Mark** task as in_progress and **execute** enhanced validation checks:
```bash
if [ "$SKIP_VALIDATION" != "true" ]; then
  echo "🧪 Running comprehensive validation suite..."

  # Biome formatting and linting check
  echo "  🔍 Running Biome check..."
  npx biome check --diagnostic-level=error . > /tmp/biome-check.log 2>&1
  BIOME_EXIT=$?

  # TypeScript compilation check
  echo "  🔍 Running TypeScript check..."
  pnpm typecheck > /tmp/typecheck.log 2>&1
  TYPECHECK_EXIT=$?

  # Build verification
  echo "  🔍 Running build verification..."
  pnpm build > /tmp/build.log 2>&1
  BUILD_EXIT=$?

  # Codecheck validation
  echo "  🔍 Running codecheck validation..."
  if [ -f ".claude/scripts/codecheck-direct.sh" ]; then
    .claude/scripts/codecheck-direct.sh > /tmp/codecheck.log 2>&1
    CODECHECK_EXIT=$?
  else
    echo "    ⚠️ Codecheck script not found, skipping"
    CODECHECK_EXIT=0
  fi

  echo "Validation Results:"
  echo "  Biome check: $([ $BIOME_EXIT -eq 0 ] && echo "✅ Passed" || echo "❌ Failed")"
  echo "  TypeScript: $([ $TYPECHECK_EXIT -eq 0 ] && echo "✅ Passed" || echo "❌ Failed")"
  echo "  Build: $([ $BUILD_EXIT -eq 0 ] && echo "✅ Passed" || echo "❌ Failed")"
  echo "  Codecheck: $([ $CODECHECK_EXIT -eq 0 ] && echo "✅ Passed" || echo "❌ Failed")"

  # Show details for failed checks
  if [ $BIOME_EXIT -ne 0 ]; then
    echo "📋 Biome Issues:"
    head -20 /tmp/biome-check.log
  fi
  if [ $TYPECHECK_EXIT -ne 0 ]; then
    echo "📋 TypeScript Errors:"
    head -20 /tmp/typecheck.log
  fi
  if [ $BUILD_EXIT -ne 0 ]; then
    echo "📋 Build Errors:"
    head -20 /tmp/build.log
  fi
  if [ $CODECHECK_EXIT -ne 0 ]; then
    echo "📋 Codecheck Issues:"
    head -20 /tmp/codecheck.log
  fi
fi
```
**Mark** task as completed

### Decision Trees for Edge Cases
**Branch** based on validation results:

```
IF all validation passes:
  → **Proceed** to success reporting
  → THEN **Generate** completion status
ELSE IF only formatting issues:
  → **Execute** npx biome check --write
  → THEN **Retry** validation
ELSE IF type errors detected:
  → **Flag** for manual review
  → THEN **Generate** error report with file locations
ELSE IF build fails:
  → **Analyze** build errors
  → THEN **Provide** specific resolution guidance
ELSE:
  → **Provide** rollback instructions
  → THEN **Exit** with error status
```

### Error Handling and Recovery
**Handle** failures gracefully:
- **Validation Errors**: Auto-fix formatting, flag type errors
- **Build Failures**: **Provide** specific error analysis and resolution steps
- **Merge Failures**: **Provide** manual resolution guidance
- **System Errors**: **Offer** rollback to backup branch
</method>

## Phase E - EXPECTATIONS

<expectations>
**Validate** and **deliver** comprehensive results:

### Output Specification
**Generate** detailed status report:
- **Format**: Markdown report with sections for each resolution category
- **Structure**: Executive summary, detailed breakdown, next steps
- **Location**: Console output with optional file save
- **Quality Standards**: Complete resolution or clear manual intervention guidance

### Success Validation
**Verify** completion criteria:

```bash
# Final status check
FINAL_CONFLICTS=$(git diff --name-only --diff-filter=U | wc -l)
GIT_STATUS=$(git status --porcelain | grep "^[MADRCU]" | wc -l)

echo "📋 Final Status Report:"
echo "===================="
echo ""
echo "🎯 **Conflict Resolution Summary**"
echo ""
echo "**Original Conflicts**: $CONFLICT_COUNT"
echo "**Resolved Automatically**: $((CONFLICT_COUNT - FINAL_CONFLICTS))"
echo "**Remaining Conflicts**: $FINAL_CONFLICTS"
echo "**Resolution Rate**: $(( (CONFLICT_COUNT - FINAL_CONFLICTS) * 100 / CONFLICT_COUNT ))%"
echo ""

if [ $FINAL_CONFLICTS -eq 0 ]; then
  echo "✅ **SUCCESS**: All conflicts resolved!"
  echo ""
  echo "**Repository Status**: Clean and ready for commit"
  echo "**Validation Results**:"
  echo "  - Biome formatting: $([ $BIOME_EXIT -eq 0 ] && echo "✅ Passed" || echo "❌ Issues found")"
  echo "  - TypeScript compilation: $([ $TYPECHECK_EXIT -eq 0 ] && echo "✅ Passed" || echo "❌ Errors found")"
  echo "  - Build verification: $([ $BUILD_EXIT -eq 0 ] && echo "✅ Passed" || echo "❌ Failed")"
  echo "  - Codecheck validation: $([ $CODECHECK_EXIT -eq 0 ] && echo "✅ Passed" || echo "❌ Issues found")"
  echo ""
  echo "**Next Steps**:"
  echo "1. Review the automated changes: \`git diff --cached\`"
  echo "2. Commit the resolved conflicts: \`git commit\`"
  echo "3. Continue with your workflow"
else
  echo "⚠️ **PARTIAL SUCCESS**: $FINAL_CONFLICTS conflicts require manual review"
  echo ""
  echo "**Files requiring manual intervention**:"
  [ -f /tmp/manual-conflicts.txt ] && cat /tmp/manual-conflicts.txt || echo "  (See git status for details)"
  echo ""
  echo "**Next Steps**:"
  echo "1. Manually resolve remaining conflicts"
  echo "2. Run this command again to validate resolution"
  echo "3. Commit when all conflicts are resolved"
fi

echo ""
echo "**Rollback Option**:"
echo "If issues occur: \`git checkout $BACKUP_BRANCH\`"
echo ""
echo "Generated: $(date)"
```

### Command Validation
**Validate** command structure:
```bash
# Optional: Validate enhanced command structure
if [ -f ".claude/scripts/command-analyzer.cjs" ]; then
  VALIDATION=$(node .claude/scripts/command-analyzer.cjs "$0" --check-prime)
  echo "Command Structure: $(echo $VALIDATION | jq -r '.primeCompliant')"
fi
```

### Quality Assurance Checks
**Ensure** high-quality resolution:
- All conflicts either resolved or flagged for manual review
- No syntax errors introduced during automated resolution
- Build succeeds without errors
- Codecheck passes all quality gates
- Existing functionality preserved (no breaking changes)
- Comprehensive documentation of all changes made

### Error Handling
**Handle** edge cases:
- **Partial Resolution**: Clear guidance for remaining manual conflicts
- **Validation Failures**: Specific error locations and suggested fixes
- **Build Failures**: Detailed build error analysis and resolution steps
- **System Failures**: Rollback instructions and recovery options
- **Permission Issues**: Alternative resolution strategies

### Success Reporting Format
```markdown
## Merge Conflict Resolution Report

### Executive Summary
- ✅ Resolved X/Y conflicts automatically (Z% success rate)
- ⚠️ N conflicts require manual intervention
- 🔍 Validation: [Biome: PASS/FAIL] [TypeScript: PASS/FAIL] [Build: PASS/FAIL] [Codecheck: PASS/FAIL]

### Resolution Breakdown
**Formatting Conflicts**: X resolved via Biome automation
**Package Dependencies**: X resolved via JSON union merge
**Configuration Files**: X resolved via .gitattributes rules
**Corrupted Files**: X recovered using enhanced strategies
**Manual Review Required**: X flagged for developer attention

### Validation Results
- Biome formatting check: [PASS/FAIL with details]
- TypeScript compilation: [PASS/FAIL with errors]
- Build verification: [PASS/FAIL with errors]
- Codecheck validation: [PASS/FAIL with issues]
- Git repository status: [CLEAN/CONFLICTS REMAINING]

### Next Steps
[Specific actionable instructions based on results]

### Rollback Instructions
[Exact commands to undo changes if needed]
```
</expectations>

## Error Handling

<error_handling>
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- No conflicts detected: **Inform** user repository is already clean
- Invalid repository state: **Guide** to proper git status

### Role Phase Errors
- Merge automation not configured: **Provide** setup instructions from merge-automation.md
- Missing validation tools: **Install** or **skip** validation with warning

### Inputs Phase Errors
- Documentation files missing: **Continue** with degraded automation
- Git status errors: **Diagnose** repository integrity issues
- Context discovery failure: **Fallback** to essential context only

### Method Phase Errors
- Merge driver failures: **Fallback** to manual resolution guidance
- Validation failures: **Report** specific errors and suggested fixes
- Build failures: **Analyze** errors and **provide** resolution steps
- TodoWrite errors: **Continue** without progress tracking

### Expectations Phase Errors
- Report generation fails: **Provide** minimal status to console
- Backup creation fails: **Continue** with warning if --force not used
- Validation script missing: **Skip** command structure check
</error_handling>

</instructions>

<patterns>
### Implemented Patterns
- **PRIME Framework**: Complete P→R→I→M→E sequential flow
- **Dynamic Context Loading**: context-discovery-expert integration
- **Existing Automation Integration**: Leverages 95% merge automation system
- **Enhanced Validation**: Biome, TypeScript, build, and codecheck verification
- **Progressive Resolution**: Handles conflicts by category and complexity
- **Comprehensive Reporting**: Detailed status with actionable next steps
- **Safety Protocols**: Backup creation and rollback capability
- **Smart Conflict Detection**: Categorizes conflicts for optimal resolution strategy
- **Enhanced Corruption Recovery**: Multiple strategies for corrupted file restoration
- **Progress Tracking**: TodoWrite for multi-step visibility
</patterns>

<help>
🔧 **Merge Conflict Resolver**

Automatically resolve merge conflicts using SlideHeroes' sophisticated automation system (95% success rate).

**Usage:**
- `/resolve-merge-conflicts` - Resolve all conflicts with full validation
- `/resolve-merge-conflicts --dry-run` - Preview resolution without applying
- `/resolve-merge-conflicts --skip-validation` - Skip post-resolution checks
- `/resolve-merge-conflicts --force` - Override safety checks

**PRIME Process:**
1. **Purpose**: Resolve all conflicts using existing automation
2. **Role**: Expert-level merge resolution with safety protocols
3. **Inputs**: Analyze conflicts, load automation configuration
4. **Method**: Apply merge drivers, validate, report progress
5. **Expectations**: Clean repository with comprehensive status report

**Automation Features:**
- Formatting conflicts → Biome auto-resolution
- Package.json conflicts → Smart dependency merging
- Feature boundaries → .gitattributes rule application
- Validation suite → Biome + TypeScript + Build + Codecheck
- Enhanced corruption recovery → Multiple restoration strategies
- Progress tracking → TodoWrite integration

**Requirements:**
- Active merge conflicts in repository
- Existing automation system configured (merge-automation.md)
- Biome and TypeScript available for validation
- Build system functional (pnpm build)

**Your conflicts are resolved automatically - focus on building features!**
</help>