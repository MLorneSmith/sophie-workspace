---
description: Clean up debug files, test artifacts, and status reports created during development
category: workflow
allowed-tools: Bash(rm:*), Bash(git:*), Bash(echo:*), Bash(grep:*), Bash(ls:*), Bash(find:*), Bash(test:*), Edit, Glob
argument-hint: "[auto|preview|aggressive]"
delegation-targets: git-expert
---

# PURPOSE

Identify and remove temporary debug files, test artifacts, and development reports that accumulate during coding sessions to maintain a clean workspace.

**OUTCOME**: Clean repository free of debug artifacts with updated .gitignore patterns to prevent future accumulation.

# ROLE

Adopt the role of a **Development Environment Janitor** who:
- Identifies temporary and debug artifacts accurately
- Distinguishes between temporary files and legitimate project files
- Provides clear categorization of cleanup candidates
- Updates .gitignore patterns to prevent future accumulation
- Maintains safety by requiring confirmation before deletion

# INPUTS

Analyze the current workspace state and cleanup candidates:

## 1. Git Repository Status
!`git status --porcelain | head -20`

## 2. Ignored Files Check
!`git status --ignored --porcelain | grep "^!!" | head -20`

## 3. Working Directory State
```bash
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ Working directory is CLEAN"
  working_clean=true
else
  echo "⚠️ Working directory has changes"
  working_clean=false
fi
```

## 4. Cleanup Mode
```bash
mode="${ARGUMENTS:-preview}"
echo "🔧 Cleanup mode: $mode"
case $mode in
  auto) echo "  → Will delete after showing list" ;;
  preview) echo "  → Will show list and ask for confirmation" ;;
  aggressive) echo "  → Will include more file patterns" ;;
  *) echo "  → Defaulting to preview mode" ;;
esac
```

## 5. Current Directory Contents
!`ls -la | head -20`

# METHOD

Execute the cleanup analysis and removal process:

## Phase 1: Identify Cleanup Candidates

```bash
echo "🔍 Scanning for cleanup candidates..."

# Define cleanup patterns
debug_patterns="analyze-*.js analyze-*.ts debug-*.js debug-*.ts research-*.js research-*.ts *-analysis.md"
test_patterns="test-*.js test-*.ts test-*.sh *-test.js *-test.ts *-test.sh quick-test.* verify-*.md *-examples.js *-examples.ts"
poc_patterns="*-poc.* poc-*.* *_poc.* proof-of-concept-*.*"
report_patterns="*_SUMMARY.md *_REPORT.md *_CHECKLIST.md *_COMPLETE.md *_GUIDE.md *_ANALYSIS.md"
temp_dirs="temp-* test-*"

# Find untracked files
untracked_files=()
while IFS= read -r line; do
  if [[ "$line" =~ ^\?\?[[:space:]]+(.+)$ ]]; then
    file="${BASH_REMATCH[1]}"
    # Check if file matches cleanup patterns
    for pattern in $debug_patterns $test_patterns $poc_patterns $report_patterns; do
      if [[ "$file" == $pattern ]]; then
        untracked_files+=("$file")
        break
      fi
    done
  fi
done < <(git status --porcelain)

echo "📊 Found ${#untracked_files[@]} untracked cleanup candidates"

# Find ignored files
ignored_files=()
while IFS= read -r line; do
  if [[ "$line" =~ ^!![[:space:]]+(.+)$ ]]; then
    file="${BASH_REMATCH[1]}"
    ignored_files+=("$file")
  fi
done < <(git status --ignored --porcelain)

echo "📊 Found ${#ignored_files[@]} ignored files"

# Check for committed cleanup candidates if working directory is clean
committed_files=()
if [ "$working_clean" = true ]; then
  echo "🔍 Checking committed files for cleanup patterns..."

  for file in $(git ls-files); do
    for pattern in $debug_patterns $test_patterns $poc_patterns $report_patterns; do
      if [[ "$file" == $pattern ]]; then
        committed_files+=("$file")
        break
      fi
    done
  done

  echo "📊 Found ${#committed_files[@]} committed cleanup candidates"
fi
```

## Phase 2: Categorize and Display Candidates

```bash
echo ""
echo "🗑️ CLEANUP ANALYSIS RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Display untracked files
if [ ${#untracked_files[@]} -gt 0 ]; then
  echo ""
  echo "📄 Untracked Files (safe to delete):"
  for file in "${untracked_files[@]}"; do
    size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}')
    echo "  • $file ($size)"
  done
fi

# Display ignored files
if [ ${#ignored_files[@]} -gt 0 ]; then
  echo ""
  echo "🚫 Ignored Files (already in .gitignore):"
  for file in "${ignored_files[@]}"; do
    size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}')
    echo "  • $file ($size)"
  done
fi

# Display committed files (if clean)
if [ ${#committed_files[@]} -gt 0 ]; then
  echo ""
  echo "⚠️ Committed Files (require git rm):"
  for file in "${committed_files[@]}"; do
    size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}')
    echo "  • $file ($size)"
  done
fi

# Calculate total
total_files=$((${#untracked_files[@]} + ${#ignored_files[@]} + ${#committed_files[@]}))
echo ""
echo "📊 Total: $total_files file(s) identified for cleanup"
```

## Phase 3: Execute Cleanup Based on Mode

```bash
# Determine action based on mode
case "$mode" in
  auto)
    echo ""
    echo "🚀 Auto-cleanup mode - proceeding with deletion..."
    perform_cleanup=true
    ;;

  aggressive)
    echo ""
    echo "⚠️ Aggressive mode - including additional patterns"
    # Add more aggressive patterns
    echo "Finding additional temporary files..."
    find . -name "*.tmp" -o -name "*.bak" -o -name "*.log" 2>/dev/null | head -20
    echo ""
    echo "❓ Delete all identified files? (y/n)"
    read -r response
    [ "$response" = "y" ] && perform_cleanup=true || perform_cleanup=false
    ;;

  preview|*)
    echo ""
    echo "❓ Proceed with cleanup? (y/n)"
    read -r response
    [ "$response" = "y" ] && perform_cleanup=true || perform_cleanup=false
    ;;
esac

if [ "$perform_cleanup" = true ]; then
  echo ""
  echo "🧹 Performing cleanup..."

  # Delete untracked files
  for file in "${untracked_files[@]}"; do
    if [ -d "$file" ]; then
      rm -rf "$file" && echo "  ✅ Removed directory: $file"
    else
      rm -f "$file" && echo "  ✅ Removed file: $file"
    fi
  done

  # Delete ignored files
  for file in "${ignored_files[@]}"; do
    if [ -d "$file" ]; then
      rm -rf "$file" && echo "  ✅ Removed ignored directory: $file"
    else
      rm -f "$file" && echo "  ✅ Removed ignored file: $file"
    fi
  done

  # Handle committed files
  if [ ${#committed_files[@]} -gt 0 ]; then
    echo ""
    echo "📝 Removing committed files from git..."
    for file in "${committed_files[@]}"; do
      git rm "$file" && echo "  ✅ Git removed: $file"
    done
    echo ""
    echo "💡 Remember to commit these removals:"
    echo "   git commit -m 'chore: remove temporary debug and test files'"
  fi
else
  echo ""
  echo "❌ Cleanup cancelled"
fi
```

## Phase 4: Update .gitignore

```bash
if [ "$perform_cleanup" = true ] && [ ${#untracked_files[@]} -gt 0 ]; then
  echo ""
  echo "📝 Suggested .gitignore patterns:"
  echo ""
  cat << 'EOF'
# Debug and analysis files
analyze-*.js
analyze-*.ts
debug-*.js
debug-*.ts
research-*.js
research-*.ts
*-analysis.md

# Temporary test files
test-*.js
test-*.ts
test-*.sh
*-test.js
*-test.ts
*-test.sh
quick-test.*
verify-*.md
*-examples.js
*-examples.ts

# POC files
*-poc.*
poc-*.*
*_poc.*
proof-of-concept-*.*

# Temporary directories
temp-*/
test-*/
!test/           # Preserve standard test directory
!tests/          # Preserve standard tests directory

# Reports and summaries
*_SUMMARY.md
*_REPORT.md
*_CHECKLIST.md
*_COMPLETE.md
*_GUIDE.md
*_ANALYSIS.md
EOF

  echo ""
  echo "❓ Add these patterns to .gitignore? (y/n)"
  read -r response
  if [ "$response" = "y" ]; then
    # Add patterns to .gitignore if not already present
    patterns_to_add=""
    for pattern in "analyze-*.js" "debug-*.js" "*_SUMMARY.md" "temp-*/"; do
      if ! grep -q "^$pattern" .gitignore 2>/dev/null; then
        patterns_to_add="$patterns_to_add\n$pattern"
      fi
    done

    if [ -n "$patterns_to_add" ]; then
      echo -e "\n# Development artifacts (added by /dev/cleanup)$patterns_to_add" >> .gitignore
      echo "✅ Updated .gitignore"
    else
      echo "ℹ️ Patterns already in .gitignore"
    fi
  fi
fi
```

# EXPECTATIONS

## Success Criteria
- ✅ All temporary debug files identified
- ✅ Clear categorization of cleanup candidates
- ✅ User confirmation obtained before deletion
- ✅ Files removed cleanly without errors
- ✅ .gitignore updated to prevent recurrence
- ✅ Git repository remains in consistent state

## Target Cleanup Patterns

### Debug & Analysis Files
- `analyze-*.js`, `analyze-*.ts` - Analysis scripts
- `debug-*.js`, `debug-*.ts` - Debug scripts
- `research-*.js`, `research-*.ts` - Research scripts
- `*-analysis.md` - Analysis documents

### Test Artifacts
- `test-*.js`, `test-*.ts`, `test-*.sh` - Temporary test scripts
- `*-test.js`, `*-test.ts`, `*-test.sh` - Test scripts with suffix
- `quick-test.*` - Quick test files
- `verify-*.md` - Verification documents
- `*-examples.js`, `*-examples.ts` - Example files

### POC Files
- `*-poc.*` - Proof of concept files
- `poc-*.*` - POC with prefix
- `*_poc.*` - POC with underscore
- `proof-of-concept-*.*` - Verbose POC naming

### Reports & Summaries
- `*_SUMMARY.md` - Summary reports
- `*_REPORT.md` - Various reports
- `*_CHECKLIST.md` - Checklist documents
- `*_COMPLETE.md` - Completion markers
- `*_GUIDE.md` - Temporary guides
- `*_ANALYSIS.md` - Analysis reports

### Temporary Directories
- `temp-*` - Temporary directories
- `test-*` - Temporary test directories (not standard `test/` or `tests/`)

## Verification Commands
```bash
# Verify cleanup completed
git status --porcelain | grep -E "(debug-|analyze-|test-|poc-|_SUMMARY|_REPORT)" | wc -l

# Check .gitignore was updated
grep -E "(debug-|analyze-|test-.*\.js)" .gitignore

# Confirm no important files deleted
ls -la src/ test/ tests/ 2>/dev/null
```

## Safety Rules

### NEVER Delete
- Committed files (unless working directory is clean)
- CHANGELOG.md, README.md, AGENTS.md, CLAUDE.md
- Core directories: `src/`, `dist/`, `scripts/`, `node_modules/`
- Standard test directories: `test/`, `tests/`, `__tests__/`
- Configuration files: `.env`, `package.json`, `tsconfig.json`

### Always Safe to Delete
- Untracked files matching cleanup patterns
- Ignored files already in .gitignore
- Empty temporary directories
- Debug scripts and analysis files

## Error Handling

### Common Issues

1. **Permission Denied**
   - Solution: Check file ownership and permissions
   - Alternative: Use `sudo rm` with caution

2. **File in Use**
   - Solution: Close any processes using the file
   - Check: `lsof | grep filename`

3. **Git Index Lock**
   - Solution: Remove `.git/index.lock` if present
   - Command: `rm -f .git/index.lock`

4. **Accidental Deletion**
   - Recovery: Use `git restore` for tracked files
   - Check: `git reflog` for recent commits

## Help

### Usage Examples

```bash
# Preview mode (default) - shows files and asks confirmation
/dev/cleanup

# Auto mode - deletes after showing list
/dev/cleanup auto

# Aggressive mode - includes more patterns
/dev/cleanup aggressive
```

### Cleanup Workflow

1. **Run in preview mode first**
   ```bash
   /dev/cleanup preview
   ```

2. **Review the list carefully**
   - Ensure no important files are included
   - Check file sizes for unusually large files

3. **Approve or modify**
   - Type 'y' to proceed with all
   - Or manually delete specific files

4. **Update .gitignore**
   - Accept suggested patterns
   - Or manually edit .gitignore

5. **Commit changes**
   ```bash
   git add .gitignore
   git commit -m "chore: update .gitignore for dev artifacts"
   ```

### Best Practices

- Run cleanup regularly (weekly or after major development)
- Always use preview mode first
- Keep reports in `reports/` directory
- Use meaningful filenames that don't match cleanup patterns
- Commit important files promptly to avoid accidental deletion

### Related Commands
- `/git/status` - Check repository state
- `/checkpoint/create` - Create backup before cleanup
- `git clean -n` - Preview untracked file removal
- `git clean -fd` - Force remove untracked files/directories