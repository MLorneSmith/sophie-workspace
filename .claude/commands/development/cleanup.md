---
description: Execute comprehensive cleanup of debug files, test artifacts, and development reports with intelligent pattern detection and safety validation
category: workflow
allowed-tools: Bash(rm:*), Bash(git:*), Bash(echo:*), Bash(grep:*), Bash(ls:*), Bash(find:*), Bash(test:*), Edit, Glob, Task
argument-hint: "[auto|preview|aggressive]"
delegation-targets: git-expert, context-discovery-expert
mcp-tools: filesystem
---

# PURPOSE

Execute systematic cleanup of temporary debug files, test artifacts, and development reports that accumulate during coding sessions while maintaining repository integrity and preventing future accumulation.

**OUTCOME**: Clean repository free of debug artifacts with enhanced .gitignore patterns and documented cleanup audit trail.

# ROLE

**Execute** as a **Development Environment Cleanup Specialist** with expertise in:

## Core Competencies
- **Pattern Recognition**: Identify debug artifacts using advanced regex and filename patterns
- **Safety Protocols**: Distinguish temporary files from legitimate project assets with 99.9% accuracy
- **Git Workflow Integration**: Manage both tracked and untracked file cleanup safely
- **Repository Hygiene**: Implement preventive measures through .gitignore optimization
- **Audit Documentation**: Create comprehensive cleanup reports for team transparency

## Technical Authority
- **File System Analysis**: Deep understanding of development artifact patterns across languages
- **Git Repository Management**: Expert knowledge of staging, tracking, and removal operations
- **Risk Assessment**: Ability to categorize cleanup candidates by safety level and impact
- **Automation Strategy**: Design repeatable cleanup workflows with configurable safety levels
- **Performance Optimization**: Execute cleanup operations efficiently for large repositories

## Operational Standards
- **Zero Data Loss**: Never remove legitimate project files or configurations
- **Confirmation Protocols**: Require explicit approval for destructive operations
- **Rollback Capability**: Maintain recovery options for all cleanup operations
- **Documentation**: Generate detailed reports of all cleanup activities
- **Team Communication**: Provide clear categorization and reasoning for each cleanup decision

# INPUTS

**Execute** comprehensive workspace analysis using multi-source data collection:

## 1. Dynamic Context Discovery
```bash
# Delegate to context-discovery-expert for intelligent context loading
echo "🔍 Discovering cleanup-relevant context..."
```

Task: context-discovery-expert
Input: "cleanup debug temporary files development artifacts gitignore patterns safety"

## 2. Repository State Analysis
**Execute** complete repository status collection:
```bash
echo "📊 Analyzing repository state..."

# Check working directory status
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ Working directory is CLEAN"
  working_clean=true
else
  echo "⚠️ Working directory has UNCOMMITTED changes"
  working_clean=false
  git status --porcelain | head -10
fi

# Analyze cleanup mode
mode="${ARGUMENTS:-preview}"
echo "🔧 Cleanup mode: $mode"
case $mode in
  auto)
    echo "  → AUTO: Will delete after showing categorized list"
    safety_level="medium"
    ;;
  preview)
    echo "  → PREVIEW: Will show list and require confirmation"
    safety_level="high"
    ;;
  aggressive)
    echo "  → AGGRESSIVE: Will include additional patterns with confirmation"
    safety_level="low"
    ;;
  *)
    echo "  → DEFAULTING to preview mode"
    mode="preview"
    safety_level="high"
    ;;
esac
echo "🛡️ Safety level: $safety_level"
```

## 3. Comprehensive File System Scan
**Execute** systematic discovery of cleanup candidates:
```bash
echo "🔍 Scanning file system for cleanup candidates..."

# Get current directory structure
pwd
echo "📁 Current directory: $(pwd)"
echo "📁 Repository root: $(git rev-parse --show-toplevel 2>/dev/null || echo 'Not in git repo')"

# Check for temporary and debug patterns
find . -maxdepth 3 -type f \( \
  -name "analyze-*" -o \
  -name "debug-*" -o \
  -name "test-*" -o \
  -name "*-poc.*" -o \
  -name "*_SUMMARY.md" -o \
  -name "*_REPORT.md" -o \
  -name "temp-*" \
\) 2>/dev/null | head -20

echo "📈 Quick scan complete - detailed analysis in next phase"
```

## 4. Git Tracking Analysis
**Execute** comprehensive git status evaluation:
```bash
echo "📋 Analyzing git tracking status..."

# Untracked files analysis
untracked_count=$(git status --porcelain | grep "^??" | wc -l)
echo "📄 Untracked files: $untracked_count"

# Ignored files analysis
ignored_count=$(git status --ignored --porcelain | grep "^!!" | wc -l)
echo "🚫 Ignored files: $ignored_count"

# Modified files analysis
modified_count=$(git status --porcelain | grep "^.M" | wc -l)
echo "✏️ Modified files: $modified_count"

# Check for staged changes
staged_count=$(git status --porcelain | grep "^M" | wc -l)
echo "📋 Staged files: $staged_count"
```

## 5. Safety Validation
**Execute** critical safety checks before proceeding:
```bash
echo "🛡️ Executing safety validation..."

# Check for critical files that should never be deleted
critical_files=(".env" "package.json" "tsconfig.json" "README.md" "CLAUDE.md")
for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ Critical file protected: $file"
  fi
done

# Verify backup capability
if git rev-parse --git-dir >/dev/null 2>&1; then
  echo "✅ Git repository detected - recovery possible"
  echo "📌 Current commit: $(git rev-parse --short HEAD)"
else
  echo "⚠️ Not in git repository - limited recovery options"
fi

# Check available disk space
df -h . | tail -1 | awk '{print "💾 Available space: " $4}'
```

# METHOD

**Execute** systematic cleanup using intelligent pattern matching and safety protocols:

## Phase 1: **Execute** Advanced Pattern Recognition and File Discovery

**Identify** cleanup candidates using comprehensive pattern analysis:

```bash
echo "🔍 EXECUTING comprehensive pattern scanning..."

# Define enhanced cleanup patterns with risk levels
declare -A cleanup_patterns=(
  # High confidence patterns (safe to auto-delete)
  ["debug_scripts"]="analyze-*.js analyze-*.ts debug-*.js debug-*.ts research-*.js research-*.ts"
  ["temp_test_files"]="test-*.js test-*.ts test-*.sh quick-test.* verify-*.md temp-test-*"
  ["poc_artifacts"]="*-poc.* poc-*.* *_poc.* proof-of-concept-*.* prototype-*.*"
  ["analysis_reports"]="*-analysis.md *_ANALYSIS.md analysis-*.md research-*.md"

  # Medium confidence patterns (require confirmation)
  ["test_examples"]="*-test.js *-test.ts *-test.sh *-examples.js *-examples.ts example-*.*"
  ["status_reports"]="*_SUMMARY.md *_REPORT.md *_CHECKLIST.md *_COMPLETE.md *_GUIDE.md"
  ["temp_directories"]="temp-*/ test-*/ debug-*/ analyze-*/"

  # Low confidence patterns (aggressive mode only)
  ["backup_files"]="*.bak *.backup *.old *.orig *~"
  ["log_files"]="*.log debug.txt error.txt output.txt"
  ["cache_files"]="*.cache .cache-* *.tmp .DS_Store"
)

# Initialize categorized file arrays
declare -a high_confidence_files=()
declare -a medium_confidence_files=()
declare -a low_confidence_files=()
declare -a untracked_files=()
declare -a ignored_files=()
declare -a committed_files=()

# Execute pattern matching for untracked files
echo "🎯 SCANNING untracked files..."
while IFS= read -r line; do
  if [[ "$line" =~ ^\?\?[[:space:]]+(.+)$ ]]; then
    file="${BASH_REMATCH[1]}"
    confidence_level=""

    # Check against high confidence patterns
    for pattern in ${cleanup_patterns["debug_scripts"]} ${cleanup_patterns["temp_test_files"]} ${cleanup_patterns["poc_artifacts"]} ${cleanup_patterns["analysis_reports"]}; do
      if [[ "$file" == $pattern ]]; then
        high_confidence_files+=("$file")
        confidence_level="high"
        break
      fi
    done

    # Check against medium confidence patterns if not already matched
    if [ -z "$confidence_level" ]; then
      for pattern in ${cleanup_patterns["test_examples"]} ${cleanup_patterns["status_reports"]} ${cleanup_patterns["temp_directories"]}; do
        if [[ "$file" == $pattern ]]; then
          medium_confidence_files+=("$file")
          confidence_level="medium"
          break
        fi
      done
    fi

    # Check against low confidence patterns if aggressive mode
    if [ -z "$confidence_level" ] && [ "$mode" = "aggressive" ]; then
      for pattern in ${cleanup_patterns["backup_files"]} ${cleanup_patterns["log_files"]} ${cleanup_patterns["cache_files"]}; do
        if [[ "$file" == $pattern ]]; then
          low_confidence_files+=("$file")
          confidence_level="low"
          break
        fi
      done
    fi

    # Add to general untracked if any match found
    if [ -n "$confidence_level" ]; then
      untracked_files+=("$file")
    fi
  fi
done < <(git status --porcelain)

echo "📊 DISCOVERED ${#high_confidence_files[@]} high-confidence cleanup candidates"
echo "📊 DISCOVERED ${#medium_confidence_files[@]} medium-confidence cleanup candidates"
echo "📊 DISCOVERED ${#low_confidence_files[@]} low-confidence cleanup candidates"

# Execute ignored files analysis
echo "🚫 SCANNING ignored files..."
while IFS= read -r line; do
  if [[ "$line" =~ ^!![[:space:]]+(.+)$ ]]; then
    file="${BASH_REMATCH[1]}"
    # Verify file still exists and matches cleanup patterns
    if [ -e "$file" ]; then
      for category in "${!cleanup_patterns[@]}"; do
        for pattern in ${cleanup_patterns[$category]}; do
          if [[ "$file" == $pattern ]]; then
            ignored_files+=("$file")
            break 2
          fi
        done
      done
    fi
  fi
done < <(git status --ignored --porcelain)

echo "📊 DISCOVERED ${#ignored_files[@]} ignored cleanup candidates"

# Execute committed files scan (only if working directory is clean)
if [ "$working_clean" = true ]; then
  echo "🔍 SCANNING committed files for cleanup patterns..."

  # Use git ls-files for performance on large repositories
  while IFS= read -r file; do
    for category in "debug_scripts" "temp_test_files" "poc_artifacts" "analysis_reports"; do
      for pattern in ${cleanup_patterns[$category]}; do
        if [[ "$file" == $pattern ]]; then
          committed_files+=("$file")
          break 2
        fi
      done
    done
  done < <(git ls-files)

  echo "📊 DISCOVERED ${#committed_files[@]} committed cleanup candidates"
else
  echo "⚠️ SKIPPING committed file scan - working directory has changes"
fi

# Calculate totals for summary
total_candidates=$((${#high_confidence_files[@]} + ${#medium_confidence_files[@]} + ${#low_confidence_files[@]} + ${#ignored_files[@]} + ${#committed_files[@]}))
echo "🎯 TOTAL: $total_candidates cleanup candidates discovered"
```

## Phase 2: **Display** Categorized Results with Risk Assessment

**Present** comprehensive cleanup analysis with safety categorization:

```bash
echo ""
echo "🗑️ CLEANUP ANALYSIS RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Calculate total space to be freed
total_size_bytes=0
total_files=0

# Function to get human-readable file size and accumulate bytes
calculate_size() {
  local file="$1"
  if [ -e "$file" ]; then
    local size_bytes=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
    local size_human=$(ls -lh "$file" 2>/dev/null | awk '{print $5}' || echo "0B")
    total_size_bytes=$((total_size_bytes + size_bytes))
    echo "$size_human"
  else
    echo "0B"
  fi
}

# Display high confidence files (safe to auto-delete)
if [ ${#high_confidence_files[@]} -gt 0 ]; then
  echo ""
  echo "🎯 HIGH CONFIDENCE (Safe to auto-delete):"
  for file in "${high_confidence_files[@]}"; do
    size=$(calculate_size "$file")
    category=""
    # Determine category for display
    for cat in "debug_scripts" "temp_test_files" "poc_artifacts" "analysis_reports"; do
      for pattern in ${cleanup_patterns[$cat]}; do
        if [[ "$file" == $pattern ]]; then
          case $cat in
            "debug_scripts") category="[DEBUG]" ;;
            "temp_test_files") category="[TEST]" ;;
            "poc_artifacts") category="[POC]" ;;
            "analysis_reports") category="[ANALYSIS]" ;;
          esac
          break 2
        fi
      done
    done
    echo "  ✅ $category $file ($size)"
    total_files=$((total_files + 1))
  done
fi

# Display medium confidence files (require confirmation)
if [ ${#medium_confidence_files[@]} -gt 0 ]; then
  echo ""
  echo "⚠️ MEDIUM CONFIDENCE (Requires confirmation):"
  for file in "${medium_confidence_files[@]}"; do
    size=$(calculate_size "$file")
    category=""
    for cat in "test_examples" "status_reports" "temp_directories"; do
      for pattern in ${cleanup_patterns[$cat]}; do
        if [[ "$file" == $pattern ]]; then
          case $cat in
            "test_examples") category="[EXAMPLE]" ;;
            "status_reports") category="[REPORT]" ;;
            "temp_directories") category="[TEMP-DIR]" ;;
          esac
          break 2
        fi
      done
    done
    echo "  ⚠️ $category $file ($size)"
    total_files=$((total_files + 1))
  done
fi

# Display low confidence files (aggressive mode only)
if [ ${#low_confidence_files[@]} -gt 0 ]; then
  echo ""
  echo "🔥 LOW CONFIDENCE (Aggressive mode - verify manually):"
  for file in "${low_confidence_files[@]}"; do
    size=$(calculate_size "$file")
    category=""
    for cat in "backup_files" "log_files" "cache_files"; do
      for pattern in ${cleanup_patterns[$cat]}; do
        if [[ "$file" == $pattern ]]; then
          case $cat in
            "backup_files") category="[BACKUP]" ;;
            "log_files") category="[LOG]" ;;
            "cache_files") category="[CACHE]" ;;
          esac
          break 2
        fi
      done
    done
    echo "  🔥 $category $file ($size)"
    total_files=$((total_files + 1))
  done
fi

# Display ignored files
if [ ${#ignored_files[@]} -gt 0 ]; then
  echo ""
  echo "🚫 IGNORED FILES (Already in .gitignore - disk cleanup only):"
  for file in "${ignored_files[@]}"; do
    size=$(calculate_size "$file")
    echo "  🚫 [IGNORED] $file ($size)"
    total_files=$((total_files + 1))
  done
fi

# Display committed files requiring git rm
if [ ${#committed_files[@]} -gt 0 ]; then
  echo ""
  echo "📝 COMMITTED FILES (Require 'git rm' and commit):"
  for file in "${committed_files[@]}"; do
    size=$(calculate_size "$file")
    echo "  📝 [TRACKED] $file ($size)"
    total_files=$((total_files + 1))
  done
  echo ""
  echo "⚠️ NOTE: These files are tracked by git and require explicit removal"
fi

# Display comprehensive summary
echo ""
echo "📊 CLEANUP SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔢 Total files: $total_files"

# Convert bytes to human readable
if [ $total_size_bytes -gt 1073741824 ]; then
  total_size_human="$(echo "scale=1; $total_size_bytes / 1073741824" | bc)GB"
elif [ $total_size_bytes -gt 1048576 ]; then
  total_size_human="$(echo "scale=1; $total_size_bytes / 1048576" | bc)MB"
elif [ $total_size_bytes -gt 1024 ]; then
  total_size_human="$(echo "scale=1; $total_size_bytes / 1024" | bc)KB"
else
  total_size_human="${total_size_bytes}B"
fi

echo "💾 Total space to free: $total_size_human"
echo "🛡️ Safety level: $safety_level"
echo "🔧 Cleanup mode: $mode"

# Show safety assessment
if [ ${#high_confidence_files[@]} -gt 0 ]; then
  echo "✅ ${#high_confidence_files[@]} files safe for automatic removal"
fi
if [ ${#medium_confidence_files[@]} -gt 0 ]; then
  echo "⚠️ ${#medium_confidence_files[@]} files require manual confirmation"
fi
if [ ${#low_confidence_files[@]} -gt 0 ]; then
  echo "🔥 ${#low_confidence_files[@]} files in aggressive mode - review carefully"
fi
if [ ${#committed_files[@]} -gt 0 ]; then
  echo "📝 ${#committed_files[@]} tracked files need git removal"
fi
```

## Phase 3: **Execute** Risk-Based Cleanup Operations

**Perform** cleanup based on safety assessment and user confirmation:

```bash
echo ""
echo "🚀 CLEANUP EXECUTION PHASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Early exit if no files to clean
if [ $total_files -eq 0 ]; then
  echo "✅ No cleanup candidates found - workspace is already clean!"
  exit 0
fi

# Determine cleanup strategy based on mode and safety level
perform_cleanup=false
cleanup_timestamp=$(date '+%Y-%m-%d_%H-%M-%S')

case "$mode" in
  auto)
    echo ""
    echo "🤖 AUTO MODE: Analyzing files for automatic cleanup..."
    if [ ${#high_confidence_files[@]} -gt 0 ]; then
      echo "✅ Will auto-delete ${#high_confidence_files[@]} high-confidence files"
      perform_cleanup=true
      auto_only=true
    else
      echo "⚠️ No high-confidence files found - switching to preview mode"
      mode="preview"
    fi
    ;;

  aggressive)
    echo ""
    echo "🔥 AGGRESSIVE MODE: Including all detected patterns"
    echo "⚠️ This will delete ${total_files} files totaling ${total_size_human}"
    echo ""
    echo "FILES TO DELETE:"
    # Show condensed list for aggressive mode
    [ ${#high_confidence_files[@]} -gt 0 ] && echo "  🎯 High confidence: ${#high_confidence_files[@]} files"
    [ ${#medium_confidence_files[@]} -gt 0 ] && echo "  ⚠️ Medium confidence: ${#medium_confidence_files[@]} files"
    [ ${#low_confidence_files[@]} -gt 0 ] && echo "  🔥 Low confidence: ${#low_confidence_files[@]} files"
    [ ${#ignored_files[@]} -gt 0 ] && echo "  🚫 Ignored files: ${#ignored_files[@]} files"
    [ ${#committed_files[@]} -gt 0 ] && echo "  📝 Committed files: ${#committed_files[@]} files"
    echo ""
    echo "❓ CONFIRM: Delete ALL identified files? This cannot be undone! (yes/no)"
    read -r response
    if [ "$response" = "yes" ]; then
      perform_cleanup=true
      auto_only=false
    else
      echo "❌ Aggressive cleanup cancelled"
      perform_cleanup=false
    fi
    ;;

  preview|*)
    echo ""
    echo "🔍 PREVIEW MODE: Review and confirm cleanup"
    echo "💾 Space to free: ${total_size_human} across ${total_files} files"
    echo ""

    # Offer granular options in preview mode
    if [ ${#high_confidence_files[@]} -gt 0 ]; then
      echo "❓ Delete ${#high_confidence_files[@]} high-confidence files (recommended)? (y/n)"
      read -r response
      if [ "$response" = "y" ]; then
        perform_cleanup=true
        auto_only=true
      fi
    fi

    if [ "$perform_cleanup" = false ] && [ $((${#medium_confidence_files[@]} + ${#low_confidence_files[@]} + ${#ignored_files[@]})) -gt 0 ]; then
      echo "❓ Delete ALL ${total_files} identified files? (y/n)"
      read -r response
      if [ "$response" = "y" ]; then
        perform_cleanup=true
        auto_only=false
      fi
    fi

    if [ "$perform_cleanup" = false ]; then
      echo "❌ Cleanup cancelled by user"
    fi
    ;;
esac

# Execute cleanup if approved
if [ "$perform_cleanup" = true ]; then
  echo ""
  echo "🧹 EXECUTING CLEANUP OPERATIONS..."
  echo "⏰ Started at: $(date)"

  # Create cleanup audit log
  cleanup_log="/tmp/cleanup_${cleanup_timestamp}.log"
  echo "# Cleanup Log - $(date)" > "$cleanup_log"
  echo "# Mode: $mode, Safety Level: $safety_level" >> "$cleanup_log"
  echo "# Repository: $(pwd)" >> "$cleanup_log"
  echo "" >> "$cleanup_log"

  cleanup_success=0
  cleanup_errors=0

  # Function to safely remove file/directory with logging
  safe_remove() {
    local file="$1"
    local category="$2"

    if [ -e "$file" ]; then
      local size_before=$(calculate_size "$file")

      if [ -d "$file" ]; then
        if rm -rf "$file" 2>/dev/null; then
          echo "  ✅ $category Removed directory: $file ($size_before)"
          echo "REMOVED_DIR: $file ($size_before)" >> "$cleanup_log"
          cleanup_success=$((cleanup_success + 1))
        else
          echo "  ❌ $category Failed to remove directory: $file"
          echo "FAILED_DIR: $file ($(ls -ld "$file" 2>/dev/null | awk '{print $1}'))" >> "$cleanup_log"
          cleanup_errors=$((cleanup_errors + 1))
        fi
      else
        if rm -f "$file" 2>/dev/null; then
          echo "  ✅ $category Removed file: $file ($size_before)"
          echo "REMOVED_FILE: $file ($size_before)" >> "$cleanup_log"
          cleanup_success=$((cleanup_success + 1))
        else
          echo "  ❌ $category Failed to remove file: $file"
          echo "FAILED_FILE: $file ($(ls -l "$file" 2>/dev/null | awk '{print $1}'))" >> "$cleanup_log"
          cleanup_errors=$((cleanup_errors + 1))
        fi
      fi
    else
      echo "  ⚠️ $category File not found (already removed?): $file"
      echo "NOT_FOUND: $file" >> "$cleanup_log"
    fi
  }

  # Remove high confidence files (always safe)
  if [ ${#high_confidence_files[@]} -gt 0 ]; then
    echo ""
    echo "🎯 Removing high-confidence files..."
    for file in "${high_confidence_files[@]}"; do
      safe_remove "$file" "[HIGH]"
    done
  fi

  # Remove other files if not in auto-only mode
  if [ "$auto_only" = false ]; then
    # Remove medium confidence files
    if [ ${#medium_confidence_files[@]} -gt 0 ]; then
      echo ""
      echo "⚠️ Removing medium-confidence files..."
      for file in "${medium_confidence_files[@]}"; do
        safe_remove "$file" "[MEDIUM]"
      done
    fi

    # Remove low confidence files (aggressive mode)
    if [ ${#low_confidence_files[@]} -gt 0 ]; then
      echo ""
      echo "🔥 Removing low-confidence files..."
      for file in "${low_confidence_files[@]}"; do
        safe_remove "$file" "[LOW]"
      done
    fi

    # Remove ignored files
    if [ ${#ignored_files[@]} -gt 0 ]; then
      echo ""
      echo "🚫 Removing ignored files..."
      for file in "${ignored_files[@]}"; do
        safe_remove "$file" "[IGNORED]"
      done
    fi
  fi

  # Handle committed files with git rm
  if [ ${#committed_files[@]} -gt 0 ] && [ "$auto_only" = false ]; then
    echo ""
    echo "📝 Removing tracked files from git..."
    for file in "${committed_files[@]}"; do
      if git rm "$file" 2>/dev/null; then
        echo "  ✅ [TRACKED] Git removed: $file"
        echo "GIT_REMOVED: $file" >> "$cleanup_log"
        cleanup_success=$((cleanup_success + 1))
      else
        echo "  ❌ [TRACKED] Failed to git rm: $file"
        echo "GIT_FAILED: $file" >> "$cleanup_log"
        cleanup_errors=$((cleanup_errors + 1))
      fi
    done

    if [ $cleanup_errors -eq 0 ] && [ ${#committed_files[@]} -gt 0 ]; then
      echo ""
      echo "💡 NEXT STEP: Commit the removals:"
      echo "   git commit -m \"chore: remove temporary debug and test files - cleanup $cleanup_timestamp\""
    fi
  fi

  # Final cleanup summary
  echo ""
  echo "🏁 CLEANUP COMPLETED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Successfully removed: $cleanup_success items"
  [ $cleanup_errors -gt 0 ] && echo "❌ Failed to remove: $cleanup_errors items"
  echo "📋 Cleanup log: $cleanup_log"
  echo "⏰ Completed at: $(date)"

  # Show post-cleanup git status
  echo ""
  echo "📊 POST-CLEANUP REPOSITORY STATUS:"
  git status --porcelain | head -10

else
  echo ""
  echo "❌ CLEANUP CANCELLED - No files were removed"
fi
```

## Phase 4: **Optimize** .gitignore Prevention Patterns

**Update** repository configuration to prevent future accumulation:

```bash
if [ "$perform_cleanup" = true ] && [ $cleanup_success -gt 0 ]; then
  echo ""
  echo "🛡️ GITIGNORE OPTIMIZATION PHASE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Analyze which patterns were actually cleaned to suggest relevant .gitignore entries
  declare -a patterns_needed=()

  # Check if we need debug patterns
  if [ ${#high_confidence_files[@]} -gt 0 ] || [ ${#medium_confidence_files[@]} -gt 0 ]; then
    patterns_needed+=(
      "# Debug and analysis artifacts"
      "analyze-*.js"
      "analyze-*.ts"
      "debug-*.js"
      "debug-*.ts"
      "research-*.js"
      "research-*.ts"
      "*-analysis.md"
      "analysis-*.md"
      ""
    )
  fi

  # Check if we need test patterns
  test_files_found=false
  for file in "${high_confidence_files[@]}" "${medium_confidence_files[@]}"; do
    if [[ "$file" == test-* ]] || [[ "$file" == *-test.* ]] || [[ "$file" == quick-test.* ]]; then
      test_files_found=true
      break
    fi
  done

  if [ "$test_files_found" = true ]; then
    patterns_needed+=(
      "# Temporary test artifacts"
      "test-*.js"
      "test-*.ts"
      "test-*.sh"
      "*-test.js"
      "*-test.ts"
      "*-test.sh"
      "quick-test.*"
      "verify-*.md"
      "*-examples.js"
      "*-examples.ts"
      "temp-test-*"
      ""
    )
  fi

  # Check if we need POC patterns
  poc_files_found=false
  for file in "${high_confidence_files[@]}" "${medium_confidence_files[@]}"; do
    if [[ "$file" == *-poc.* ]] || [[ "$file" == poc-* ]] || [[ "$file" == proof-of-concept-* ]]; then
      poc_files_found=true
      break
    fi
  done

  if [ "$poc_files_found" = true ]; then
    patterns_needed+=(
      "# Proof of concept artifacts"
      "*-poc.*"
      "poc-*.*"
      "*_poc.*"
      "proof-of-concept-*.*"
      "prototype-*.*"
      ""
    )
  fi

  # Check if we need report patterns
  report_files_found=false
  for file in "${high_confidence_files[@]}" "${medium_confidence_files[@]}"; do
    if [[ "$file" == *_SUMMARY.md ]] || [[ "$file" == *_REPORT.md ]] || [[ "$file" == *_GUIDE.md ]]; then
      report_files_found=true
      break
    fi
  done

  if [ "$report_files_found" = true ]; then
    patterns_needed+=(
      "# Status reports and summaries"
      "*_SUMMARY.md"
      "*_REPORT.md"
      "*_CHECKLIST.md"
      "*_COMPLETE.md"
      "*_GUIDE.md"
      "*_ANALYSIS.md"
      ""
    )
  fi

  # Add aggressive mode patterns if they were used
  if [ "$mode" = "aggressive" ] && [ ${#low_confidence_files[@]} -gt 0 ]; then
    patterns_needed+=(
      "# Temporary system files"
      "*.tmp"
      "*.bak"
      "*.backup"
      "*.old"
      "*.orig"
      "*~"
      "*.cache"
      ".cache-*"
      ".DS_Store"
      "debug.txt"
      "error.txt"
      "output.txt"
      ""
    )
  fi

  # Add temp directory patterns
  temp_dirs_found=false
  for file in "${high_confidence_files[@]}" "${medium_confidence_files[@]}"; do
    if [[ "$file" == temp-*/ ]] || [[ "$file" == debug-*/ ]] || [[ "$file" == analyze-*/ ]]; then
      temp_dirs_found=true
      break
    fi
  done

  if [ "$temp_dirs_found" = true ]; then
    patterns_needed+=(
      "# Temporary directories"
      "temp-*/"
      "debug-*/"
      "analyze-*/"
      "test-*/"
      "!test/"
      "!tests/"
      "!__tests__/"
      ""
    )
  fi

  # Show suggested patterns
  if [ ${#patterns_needed[@]} -gt 0 ]; then
    echo ""
    echo "📝 RECOMMENDED .gitignore patterns based on cleanup:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    for pattern in "${patterns_needed[@]}"; do
      echo "$pattern"
    done
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    echo ""
    echo "❓ Add these patterns to .gitignore to prevent future accumulation? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
      # Check current .gitignore
      if [ ! -f ".gitignore" ]; then
        echo "📄 Creating new .gitignore file..."
        touch .gitignore
      fi

      # Add header and patterns
      echo "" >> .gitignore
      echo "# Development artifacts (added by /dev/cleanup on $(date '+%Y-%m-%d %H:%M:%S'))" >> .gitignore

      # Add patterns, checking for duplicates
      patterns_added=0
      for pattern in "${patterns_needed[@]}"; do
        if [ -n "$pattern" ] && [[ "$pattern" != \#* ]] && ! grep -qF "$pattern" .gitignore 2>/dev/null; then
          echo "$pattern" >> .gitignore
          patterns_added=$((patterns_added + 1))
        elif [ -n "$pattern" ] && [[ "$pattern" == \#* ]]; then
          # Add comment lines
          echo "$pattern" >> .gitignore
        fi
      done

      if [ $patterns_added -gt 0 ]; then
        echo "✅ Added $patterns_added new patterns to .gitignore"
        echo "📋 Review changes: git diff .gitignore"
      else
        echo "ℹ️ All patterns were already present in .gitignore"
        # Remove the header we just added since no patterns were added
        head -n -1 .gitignore > .gitignore.tmp && mv .gitignore.tmp .gitignore
      fi

      # Suggest committing .gitignore changes
      if git status --porcelain .gitignore | grep -q "M .gitignore"; then
        echo ""
        echo "💡 RECOMMENDED: Commit .gitignore changes:"
        echo "   git add .gitignore"
        echo "   git commit -m \"chore: update .gitignore to prevent debug artifact accumulation\""
      fi
    else
      echo "⏭️ Skipped .gitignore update"
    fi
  else
    echo "ℹ️ No new .gitignore patterns needed based on cleanup"
  fi

  # Final recommendations
  echo ""
  echo "🎯 PREVENTION RECOMMENDATIONS:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "• 📅 Run '/dev/cleanup preview' weekly to maintain clean workspace"
  echo "• 🎯 Use '/dev/cleanup auto' for automated high-confidence cleanup"
  echo "• 📝 Commit important files promptly to avoid accidental removal"
  echo "• 🗂️ Use 'reports/' directory for persistent analysis documents"
  echo "• 🧪 Use standard 'test/' or 'tests/' directories for permanent tests"

else
  echo ""
  echo "⏭️ SKIPPING .gitignore optimization - no cleanup was performed"
fi
```

# EXPECTATIONS

**Validate** comprehensive cleanup execution with measurable outcomes:

## Success Criteria (Performance Targets)

### **Primary Objectives (Must Achieve)**
- ✅ **100% Pattern Recognition Accuracy**: All debug artifacts identified using confidence-based categorization
- ✅ **Zero Data Loss**: No legitimate project files removed (0 false positives)
- ✅ **Complete Safety Validation**: User confirmation obtained for all medium/low confidence operations
- ✅ **Clean Execution**: All approved files removed without filesystem errors
- ✅ **Repository Integrity**: Git working directory and staging area remain consistent
- ✅ **Audit Trail**: Complete cleanup log generated with timestamps and file details

### **Secondary Objectives (Should Achieve)**
- ✅ **Intelligent .gitignore Updates**: Patterns added based on actual cleanup results (not generic)
- ✅ **Performance Efficiency**: Cleanup completion in <30 seconds for repositories with <1000 files
- ✅ **Space Recovery**: Minimum 1MB disk space freed for meaningful cleanup operations
- ✅ **Context Integration**: Successfully utilized context-discovery-expert for enhanced pattern detection
- ✅ **User Experience**: Clear categorization and progress feedback throughout operation

### **Stretch Objectives (Could Achieve)**
- ✅ **Automated Prevention**: .gitignore patterns prevent 90%+ of future similar accumulation
- ✅ **Cross-Platform Compatibility**: Works on Linux, macOS, and WSL environments
- ✅ **Large Repository Support**: Handles repositories with 10,000+ files efficiently
- ✅ **Recovery Guidance**: Provides clear instructions for undoing accidental removals
- ✅ **Integration Workflow**: Recommends follow-up actions (commits, branch cleanup)

## **Validate** Target Cleanup Categories

### **High Confidence (Auto-Delete Safe)**
**Pattern Examples**:
```bash
# Debug scripts and analysis
analyze-database.js          [DEBUG] - SQL analysis script
debug-api-calls.ts          [DEBUG] - API debugging utility
research-performance.js     [DEBUG] - Performance research script
api-analysis.md            [ANALYSIS] - API endpoint analysis

# Temporary test artifacts
test-integration.js         [TEST] - Temporary integration test
quick-test.html            [TEST] - Quick HTML test file
verify-upload.md           [TEST] - Upload verification doc
temp-test-auth.ts          [TEST] - Temporary auth test
```

### **Medium Confidence (Requires Confirmation)**
**Pattern Examples**:
```bash
# Test examples and status reports
auth-examples.js           [EXAMPLE] - Authentication examples
upload-test.sh             [EXAMPLE] - Upload test script
feature_SUMMARY.md         [REPORT] - Feature summary report
api_CHECKLIST.md          [REPORT] - API implementation checklist
temp-uploads/              [TEMP-DIR] - Temporary upload directory
```

### **Low Confidence (Aggressive Mode Only)**
**Pattern Examples**:
```bash
# System files and backups
config.json.bak            [BACKUP] - Config backup file
debug.log                  [LOG] - Debug log file
.cache-webpack             [CACHE] - Webpack cache directory
.DS_Store                  [CACHE] - macOS system file
```

## **Execute** Comprehensive Validation Checks

### **Pre-Cleanup Validation**
```bash
# Verify context discovery integration
echo "🔍 VALIDATING: Context discovery successful"
[ "$?" -eq 0 ] && echo "✅ Context discovery completed" || echo "❌ Context discovery failed"

# Validate git repository state
echo "🔍 VALIDATING: Git repository integrity"
git status --porcelain | wc -l | awk '{if($1<100) print "✅ Repository state: " $1 " changes"; else print "⚠️ Repository state: " $1 " changes (review needed)"}'

# Confirm safety mechanisms
echo "🔍 VALIDATING: Safety mechanisms active"
[ "$safety_level" = "high" ] && echo "✅ High safety level active" || echo "⚠️ Safety level: $safety_level"

# Verify pattern detection
echo "🔍 VALIDATING: Pattern detection accuracy"
total_patterns=$((${#high_confidence_files[@]} + ${#medium_confidence_files[@]} + ${#low_confidence_files[@]}))
[ $total_patterns -gt 0 ] && echo "✅ Detected $total_patterns cleanup candidates" || echo "ℹ️ No cleanup candidates found"
```

### **Post-Cleanup Validation**
```bash
# Verify cleanup completion
echo "🔍 VALIDATING: Cleanup operation results"
if [ "$perform_cleanup" = true ]; then
  echo "✅ Cleanup executed: $cleanup_success successful, $cleanup_errors failed"

  # Validate no critical files were removed
  critical_files=(".env" "package.json" "tsconfig.json" "README.md" "CLAUDE.md")
  for file in "${critical_files[@]}"; do
    [ -f "$file" ] && echo "✅ Critical file preserved: $file" || echo "⚠️ Critical file missing: $file"
  done

  # Confirm git repository is still functional
  git status >/dev/null 2>&1 && echo "✅ Git repository functional" || echo "❌ Git repository corrupted"

  # Validate .gitignore updates
  if git status --porcelain .gitignore | grep -q "M .gitignore"; then
    echo "✅ .gitignore updated with relevant patterns"
  else
    echo "ℹ️ .gitignore unchanged (no new patterns needed)"
  fi
else
  echo "ℹ️ No cleanup performed - validation skipped"
fi
```

### **Performance Validation**
```bash
# Measure execution efficiency
echo "🔍 VALIDATING: Performance metrics"
if [ "$perform_cleanup" = true ]; then
  # Calculate time efficiency (if tracked)
  echo "⏱️ Cleanup duration: Available in cleanup log"

  # Measure space recovered
  if [ $total_size_bytes -gt 1048576 ]; then
    echo "✅ Significant space recovered: $total_size_human"
  elif [ $total_size_bytes -gt 1024 ]; then
    echo "✅ Moderate space recovered: $total_size_human"
  else
    echo "ℹ️ Minimal space recovered: $total_size_human"
  fi

  # Validate pattern coverage
  coverage_percent=$(echo "scale=1; $cleanup_success * 100 / $total_candidates" | bc 2>/dev/null || echo "100")
  echo "📊 Cleanup coverage: ${coverage_percent}% ($cleanup_success/$total_candidates files)"
fi
```

## **Confirm** Error Handling and Recovery

### **Common Error Scenarios**
1. **Permission Denied**: Files locked by running processes
   - **Detection**: `rm` command returns exit code 1
   - **Recovery**: Show locked processes with `lsof` suggestions
   - **Validation**: Verify only problematic files skipped

2. **Git Index Lock**: `.git/index.lock` prevents git operations
   - **Detection**: `git rm` fails with lock error
   - **Recovery**: Automatically remove stale lock files >5 minutes old
   - **Validation**: Confirm git operations resume normally

3. **Critical File False Positive**: Important file matched cleanup pattern
   - **Detection**: File in protected paths (`src/`, `node_modules/`, etc.)
   - **Recovery**: Skip file and update pattern exclusions
   - **Validation**: Log false positive for pattern refinement

### **Recovery Instructions**
```bash
# If cleanup went wrong, recover with:
echo "🆘 RECOVERY OPTIONS:"
echo "1. Restore accidentally deleted committed files:"
echo "   git checkout HEAD -- <filename>"
echo ""
echo "2. Undo git rm operations (before commit):"
echo "   git reset HEAD <filename>"
echo "   git checkout -- <filename>"
echo ""
echo "3. View cleanup audit log:"
echo "   cat /tmp/cleanup_${cleanup_timestamp}.log"
echo ""
echo "4. Check git reflog for recent changes:"
echo "   git reflog --oneline -10"
```

## **Monitor** Long-term Effectiveness

### **Prevention Success Metrics**
- **Weekly Measurement**: Run cleanup and measure files found
  - Target: <10 files per week after .gitignore optimization
  - Alert: >50 files indicates pattern gaps or new artifact types

- **Repository Health**: Track git repository size growth
  - Target: Debug artifacts <1% of total repository size
  - Alert: Sudden size increases may indicate cleanup bypass

- **Team Adoption**: Monitor cleanup command usage
  - Target: Team runs cleanup weekly (voluntary or automated)
  - Success: Reduced support requests about "repository clutter"

### **Continuous Improvement Indicators**
- ✅ **Pattern Evolution**: New file patterns detected and added to cleanup logic
- ✅ **Performance Optimization**: Cleanup time decreases as patterns become more precise
- ✅ **Zero Incident Rate**: No legitimate files accidentally removed over 30-day period
- ✅ **User Satisfaction**: Positive feedback on cleanup safety and effectiveness
- ✅ **Integration Success**: Cleanup becomes part of regular development workflow

## **Execute** Quick Verification Commands

**Run** these commands to validate cleanup effectiveness:

### **Post-Cleanup Verification**
```bash
# Count remaining cleanup candidates (should be 0 or minimal)
git status --porcelain | grep -E "(debug-|analyze-|test-|poc-|_SUMMARY|_REPORT)" | wc -l

# Verify .gitignore patterns were added
grep -E "(debug-|analyze-|test-.*\.js)" .gitignore | head -5

# Confirm critical directories intact
ls -la src/ test/ tests/ 2>/dev/null | grep "^d" | wc -l

# Check repository health
git status --porcelain | wc -l | awk '{print "Repository changes: " $1}'

# Validate cleanup log exists
[ -f "/tmp/cleanup_$(date '+%Y-%m-%d')*.log" ] && echo "✅ Cleanup log available" || echo "ℹ️ No cleanup log found"
```

### **Safety Verification**
```bash
# Verify critical files preserved
critical_files=(".env" "package.json" "tsconfig.json" "README.md" "CLAUDE.md")
for file in "${critical_files[@]}"; do
  [ -f "$file" ] && echo "✅ $file" || echo "❌ MISSING: $file"
done

# Check for accidentally removed directories
protected_dirs=("src" "node_modules" ".git" "test" "tests")
for dir in "${protected_dirs[@]}"; do
  [ -d "$dir" ] && echo "✅ $dir/" || echo "⚠️ Directory missing: $dir/"
done
```

## **Reference** Command Usage Examples

### **Basic Usage Patterns**
```bash
# Safe preview mode (recommended for first use)
/dev/cleanup

# Automatic cleanup of high-confidence files only
/dev/cleanup auto

# Comprehensive cleanup including system files (use with caution)
/dev/cleanup aggressive
```

### **Recommended Workflow**
1. **Initial Assessment**: `/dev/cleanup preview` - Review what would be cleaned
2. **Targeted Cleanup**: Approve high-confidence files for automatic removal
3. **Manual Review**: Examine medium/low confidence files individually
4. **Pattern Updates**: Accept .gitignore suggestions to prevent future accumulation
5. **Commit Changes**: Add .gitignore updates to repository

### **Integration with Git Workflow**
```bash
# Before major feature work
/dev/cleanup auto                    # Clean up artifacts
git status                           # Verify clean state
git checkout -b feature/new-work     # Start fresh

# After development session
/dev/cleanup preview                 # Review accumulated files
git add important-files.js           # Commit legitimate work
/dev/cleanup auto                    # Clean up remaining artifacts
git commit -m "feat: implement X"   # Commit clean changes
```

### **Recovery and Troubleshooting**
```bash
# If important file was accidentally removed
git status                           # Check if file was tracked
git checkout HEAD -- filename       # Restore tracked file
git reflog --oneline -10            # Check recent git history

# If cleanup failed with errors
cat /tmp/cleanup_*latest*.log       # Review cleanup log
lsof | grep filename                # Check if file is in use
git status --ignored                # Check for permission issues
```

## **Monitor** Effectiveness Metrics

### **Success Indicators**
- ✅ Cleanup completes without errors in <30 seconds
- ✅ Space recovered is >1MB for meaningful cleanups
- ✅ Zero critical files accidentally removed
- ✅ .gitignore patterns prevent 90%+ of future accumulation
- ✅ Weekly cleanup finds <10 files after optimization

### **Quality Checkpoints**
- **Before Running**: Ensure working directory is committed or safely stashed
- **During Execution**: Review file categorization for accuracy
- **After Completion**: Verify git repository integrity and functionality
- **Long-term**: Monitor pattern effectiveness and adjust as needed

### **Team Adoption Goals**
- **Individual**: Run cleanup weekly or after intensive development sessions
- **Project**: Include cleanup in code review checklist for large PRs
- **Automation**: Consider adding cleanup to CI/CD pipeline for feature branches
- **Documentation**: Share cleanup patterns and safety rules with team members