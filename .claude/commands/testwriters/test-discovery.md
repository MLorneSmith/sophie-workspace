---
description: Analyze codebase to identify and prioritize missing tests with intelligent coverage mapping
allowed-tools: [Bash, Read, Write, Grep, Glob, Task, mcp__github__*]
argument-hint: [options] - e.g., "--update", "--priority=p1", "--recent", "--report"
category: testing
---

# Test Discovery

Comprehensive test coverage analysis with intelligent prioritization and coverage tracking.

## Key Features
- **Accurate Test Discovery**: Aligned with vitest and playwright configs
- **Coverage Mapping**: Source-to-test file relationships
- **Priority Scoring**: Business criticality and change frequency
- **Git-Aware Analysis**: Recent changes and high-churn detection
- **Database Management**: Persistent coverage tracking

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/standards/testing-standards.md
- Read .claude/docs/testing/context/testing-fundamentals.md
- Read vitest.config.ts
- Read playwright.config.ts

## Prompt

<role>
You are the Test Coverage Analyst, specializing in test gap identification, coverage analysis, and test prioritization. Your expertise ensures critical code paths have appropriate test coverage.
</role>

<instructions>
# Test Discovery Workflow

**CORE REQUIREMENTS**:
- Accurately identify all test files and cases
- Map source files to test coverage
- Prioritize based on business impact
- Track coverage over time
- Generate actionable recommendations

## 1. PURPOSE - Define Discovery Objectives
<purpose>
**Primary Goal**: Identify test gaps and prioritize test creation for maximum impact

**Success Criteria**:
- All test files accurately discovered
- Source-to-test mapping complete
- Priority scores calculated
- Coverage gaps identified
- Recommendations generated

**Measurable Outcomes**:
- Test coverage percentage
- Critical gap count
- Priority queue generated
- Coverage trends tracked
</purpose>

## 2. ROLE - Test Coverage Expert
<role_definition>
**Expertise Areas**:
- Test discovery patterns
- Coverage analysis
- Risk assessment
- Priority algorithms
- Testing strategies

**Authority**:
- Define test priorities
- Identify critical gaps
- Recommend test strategies
- Update coverage database
- Generate coverage reports
</role_definition>

## 3. INPUTS - Parse Discovery Options
<inputs>
1. **Parse command options**:
   ```bash
   # Parse arguments
   while [[ $# -gt 0 ]]; do
     case $1 in
       --update) UPDATE_MODE=true ;;
       --type=*) TEST_TYPE="${1#*=}" ;;
       --priority=*) PRIORITY="${1#*=}" ;;
       --recent) RECENT_MODE=true ;;
       --report) GENERATE_REPORT=true ;;
       --delegate) USE_AGENT=true ;;
       --packages=*) PACKAGES="${1#*=}" ;;
       *) echo "Unknown option: $1" ;;
     esac
     shift
   done
   ```

2. **Load test configurations**:
   ```bash
   # Extract test patterns from configs
   VITEST_PATTERN=$(grep -o "test:.*{.*}" vitest.config.ts | head -1)
   PLAYWRIGHT_DIR=$(grep -o "testDir:.*" playwright.config.ts | cut -d"'" -f2)

   echo "📋 Test Configurations:"
   echo "  Vitest: $VITEST_PATTERN"
   echo "  Playwright: $PLAYWRIGHT_DIR"
   ```

3. **Check existing database**:
   ```bash
   DB_PATH=".claude/tracking/test-data/test-coverage-db.json"
   if [ -f "$DB_PATH" ]; then
     echo "📊 Found existing database"
     LAST_UPDATE=$(jq -r '.lastUpdated' "$DB_PATH")
     echo "  Last updated: $LAST_UPDATE"
   else
     echo "🆕 Will create new database"
   fi
   ```
</inputs>

## 4. METHOD - Systematic Discovery Process
<method>
### Step 1: Test File Discovery
Locate all test files:
```bash
# Parallel test discovery
echo "🔍 Discovering test files..."

# Vitest tests
VITEST_FILES=$(find apps/web packages -type f \
  \( -name "*.test.ts" -o -name "*.test.tsx" \
     -name "*.spec.ts" -o -name "*.spec.tsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/.next/*")

# Playwright tests
E2E_FILES=$(find apps/e2e/tests -type f \
  \( -name "*.spec.ts" -o -name "*.e2e.ts" \))

# Count test cases
TEST_CASES=$(echo "$VITEST_FILES $E2E_FILES" | \
  xargs grep -h "^\s*\(it\|test\|it\.skip\|test\.skip\|it\.only\|test\.only\)(" | wc -l)

# Count test suites
TEST_SUITES=$(echo "$VITEST_FILES $E2E_FILES" | \
  xargs grep -h "^\s*describe(" | wc -l)

echo "📊 Discovery Results:"
echo "  Vitest files: $(echo "$VITEST_FILES" | wc -l)"
echo "  E2E files: $(echo "$E2E_FILES" | wc -l)"
echo "  Total test cases: $TEST_CASES"
echo "  Total test suites: $TEST_SUITES"
```

### Step 2: Source File Analysis
Identify files needing tests:
```bash
# Find source files
SOURCE_FILES=$(find apps/web packages/features -type f \
  \( -name "*.ts" -o -name "*.tsx" \) \
  ! -name "*.test.*" \
  ! -name "*.spec.*" \
  ! -name "*.d.ts" \
  ! -path "*/node_modules/*")

# Critical packages analysis
for pkg in admin auth payments accounts billing; do
  SRC_COUNT=$(find packages/features/$pkg -name "*.ts" -o -name "*.tsx" | \
    grep -v -E "(test|spec)" | wc -l)
  TEST_COUNT=$(find packages/features/$pkg -name "*.test.*" -o -name "*.spec.*" | wc -l)

  if [ $TEST_COUNT -eq 0 ] && [ $SRC_COUNT -gt 0 ]; then
    echo "⚠️ CRITICAL: $pkg has $SRC_COUNT files with NO tests"
  fi
done
```

### Step 3: Coverage Mapping
Map source to test files:
```bash
# Create coverage map
declare -A COVERAGE_MAP

for src_file in $SOURCE_FILES; do
  BASE_NAME=$(basename "$src_file" | sed 's/\.\(ts\|tsx\)$//')
  DIR_NAME=$(dirname "$src_file")

  # Look for test files
  TEST_FILE=$(find "$DIR_NAME" -maxdepth 2 \
    \( -name "${BASE_NAME}.test.*" -o -name "${BASE_NAME}.spec.*" \) \
    2>/dev/null | head -1)

  if [ -n "$TEST_FILE" ]; then
    TEST_COUNT=$(grep -c "^\s*\(it\|test\)(" "$TEST_FILE" 2>/dev/null || echo 0)
    COVERAGE_MAP["$src_file"]="$TEST_FILE:$TEST_COUNT"
  else
    COVERAGE_MAP["$src_file"]="NONE:0"
  fi
done
```

### Step 4: Priority Scoring
Calculate test priorities:
```bash
# Priority scoring function
calculate_priority() {
  local file=$1
  local score=0

  # Business criticality (0-40)
  case "$file" in
    *admin*) ((score+=40)) ;;
    *auth*|*payments*) ((score+=35)) ;;
    *ai/canvas*|*ai/storyboard*) ((score+=30)) ;;
    *features*) ((score+=20)) ;;
    *) ((score+=10)) ;;
  esac

  # Recent changes (0-30)
  CHANGES=$(git log --oneline -n 10 -- "$file" 2>/dev/null | wc -l)
  ((score += CHANGES * 3))
  [ $score -gt 70 ] && score=70  # Cap at 70 (40+30)

  # High churn (0-20)
  CHURN=$(git log --format='' --name-only -n 100 -- "$file" | wc -l)
  ((score += CHURN / 5))
  [ $score -gt 90 ] && score=90  # Cap at 90 (40+30+20)

  # No tests bonus (0-10)
  [ "${COVERAGE_MAP[$file]}" = "NONE:0" ] && ((score+=10))

  echo $score
}

# Build priority queue
PRIORITY_QUEUE=()
for src_file in "${!COVERAGE_MAP[@]}"; do
  if [ "${COVERAGE_MAP[$src_file]}" = "NONE:0" ]; then
    PRIORITY=$(calculate_priority "$src_file")
    PRIORITY_QUEUE+=("$PRIORITY:$src_file")
  fi
done

# Sort by priority
IFS=$'\n' SORTED_QUEUE=($(sort -rn <<< "${PRIORITY_QUEUE[*]}"))
```

### Step 5: Git-Based Analysis
Analyze recent changes:
```bash
if [ "$RECENT_MODE" = true ]; then
  echo "📅 Analyzing recent changes..."

  # Files changed in last 10 commits
  RECENT_FILES=$(git diff --name-only HEAD~10 -- '*.ts' '*.tsx' | \
    grep -v -E '(test|spec)')

  for file in $RECENT_FILES; do
    if [ -f "$file" ] && [ "${COVERAGE_MAP[$file]}" = "NONE:0" ]; then
      echo "⚠️ Recently changed, no tests: $file"
    fi
  done

  # High-churn analysis
  echo "🔥 High-churn files:"
  git log --format='' --name-only -n 200 -- '*.ts' '*.tsx' | \
    grep -v -E '(test|spec)' | \
    sort | uniq -c | sort -rn | head -10 | \
    while read count file; do
      [ -f "$file" ] && [ "${COVERAGE_MAP[$file]}" = "NONE:0" ] && \
        echo "  $count changes: $file ❌"
    done
fi
```

### Step 6: Database Update
Update coverage database:
```bash
if [ "$UPDATE_MODE" = true ] || [ ! -f "$DB_PATH" ]; then
  echo "💾 Updating coverage database..."

  # Create JSON structure
  cat > "$DB_PATH" << EOF
{
  "version": "2.0",
  "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "totalSourceFiles": $(echo "$SOURCE_FILES" | wc -l),
    "totalTestFiles": $(echo "$VITEST_FILES $E2E_FILES" | wc -w),
    "totalTestCases": $TEST_CASES,
    "totalTestSuites": $TEST_SUITES,
    "filesWithoutTests": $(echo "${COVERAGE_MAP[@]}" | grep -c "NONE:0")
  },
  "priorityQueue": [
$(for item in "${SORTED_QUEUE[@]:0:20}"; do
    IFS=':' read -r score file <<< "$item"
    echo "    {\"score\": $score, \"file\": \"$file\"},"
  done | sed '$ s/,$//')
  ],
  "criticalGaps": [
$(for pkg in admin auth payments; do
    if [ $(find packages/features/$pkg -name "*.test.*" | wc -l) -eq 0 ]; then
      echo "    \"packages/features/$pkg\","
    fi
  done | sed '$ s/,$//')
  ]
}
EOF

  echo "✅ Database updated"
fi
```
</method>

## 5. EXPECTATIONS - Deliverables & Reports
<expectations>
### Output Format
Generate comprehensive report:
```bash
if [ "$GENERATE_REPORT" = true ]; then
  cat << EOF
# Test Coverage Discovery Report

Generated: $(date)

## Summary
- Total Source Files: $(echo "$SOURCE_FILES" | wc -l)
- Total Test Files: $(echo "$VITEST_FILES $E2E_FILES" | wc -w)
- Total Test Cases: $TEST_CASES
- Files Without Tests: $(echo "${COVERAGE_MAP[@]}" | grep -c "NONE:0")
- Coverage Percentage: $(calculate_coverage_percentage)%

## Critical Gaps (P1)
$(for item in "${SORTED_QUEUE[@]:0:10}"; do
    IFS=':' read -r score file <<< "$item"
    echo "- [$score pts] $file"
  done)

## Recommendations
1. Immediately add tests for critical packages without coverage
2. Focus on high-churn files for regression prevention
3. Add tests for recently changed files
4. Consider E2E tests for critical user journeys

## Next Steps
- Use /testwriters:unit-test-writer for unit tests
- Use /testwriters:e2e-test-writer for E2E tests
- Run /test-discovery --update weekly to track progress
EOF
fi
```

### Success Metrics
✓ All test files discovered
✓ Coverage gaps identified
✓ Priority queue generated
✓ Database updated
✓ Report generated
</expectations>

## Agent Delegation
<delegation>
For complex analysis, delegate to specialized agent:
```bash
if [ "$USE_AGENT" = true ]; then
  echo "🤖 Delegating to test-discovery expert..."

  # Use Task tool
  invoke_task_tool \
    --description "Comprehensive test discovery analysis" \
    --subagent_type "testing-expert" \
    --prompt "
      Perform deep test discovery analysis:
      1. Scan all test locations (vitest & playwright)
      2. Count test files and individual cases
      3. Map source to test coverage
      4. Calculate risk scores
      5. Generate recommendations
      Context: $(pwd)
      Packages: ${PACKAGES:-all}
      Options: detailed analysis with complexity metrics
    "
fi
```
</delegation>

## Error Handling
<error_handling>
### Common Issues
1. **Permission denied**: Check file permissions
2. **Config not found**: Verify test config paths
3. **Git not available**: Skip git-based analysis
4. **Large codebase**: Use parallel processing

### Recovery Procedures
```bash
# Handle missing configs
if [ ! -f "vitest.config.ts" ]; then
  echo "⚠️ vitest.config.ts not found, using defaults"
  VITEST_PATTERN="**/*.{test,spec}.{ts,tsx}"
fi

# Handle git errors
if ! git status >/dev/null 2>&1; then
  echo "⚠️ Not a git repository, skipping git analysis"
  RECENT_MODE=false
fi

# Handle large file counts
if [ $(echo "$SOURCE_FILES" | wc -l) -gt 1000 ]; then
  echo "📦 Large codebase detected, using batched processing"
  # Process in chunks
fi
```
</error_handling>
</instructions>

<patterns>
### Discovery Patterns
- **Parallel Execution**: Run searches concurrently
- **Smart Caching**: Cache results for performance
- **Incremental Updates**: Update only changed files
- **Priority-Based**: Focus on high-value targets

### Anti-Patterns to Avoid
- Scanning node_modules
- Including build artifacts
- Missing test configurations
- Ignoring E2E tests
- Static priority scoring
</patterns>

<help>
🔍 **Test Discovery & Coverage Analyzer**

Identify and prioritize missing tests with intelligent coverage mapping.

**Usage:**
- `/test-discovery` - Full analysis with priorities
- `/test-discovery --update` - Update coverage database
- `/test-discovery --recent` - Focus on recent changes
- `/test-discovery --report` - Generate detailed report
- `/test-discovery --delegate` - Use expert agent

**Process:**
1. Discover all test files
2. Map source coverage
3. Calculate priorities
4. Identify critical gaps
5. Generate recommendations

**Features:**
- Accurate test discovery
- Coverage mapping
- Priority scoring
- Git-aware analysis
- Database tracking

Your guide to comprehensive test coverage!
</help>