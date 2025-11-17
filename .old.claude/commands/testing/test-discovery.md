---
description: "Discover test gaps and generate prioritized testing strategies with intelligent coverage analysis"
allowed-tools: [Bash, Read, Write, Grep, Glob, Task, TodoWrite, mcp__context7__*, mcp__postgres__*, mcp__newrelic__*]
argument-hint: "[--update] [--priority=p1|p2|p3] [--recent] [--report] [--delegate] [--packages=name]"
delegation-targets: ["testing-expert", "nodejs-expert", "database-expert"]
mcp-tools: ["context7", "postgres", "newrelic"]
category: testing
---

# Test Discovery

Discover test gaps and generate actionable testing strategies with intelligent coverage analysis and domain-specific validation.

## Key Features

- **Accurate Test Discovery**: Aligned with vitest and playwright configs
- **Coverage Mapping**: Source-to-test file relationships
- **Priority Scoring**: Business criticality and change frequency
- **Git-Aware Analysis**: Recent changes and high-churn detection
- **Database Management**: Persistent coverage tracking

## Dynamic Context Loading
<!-- Load context based on discovery scope -->

### Core Testing Context

```bash
# Load testing fundamentals
context_files=(
  ".claude/context/standards/testing-standards.md"
  ".claude/docs/testing/context/testing-fundamentals.md"
  "vitest.config.ts"
  "playwright.config.ts"
)

for file in "${context_files[@]}"; do
  [ -f "$file" ] && echo "Loading: $file" || echo "⚠️ Missing: $file"
done
```

### Package-Specific Context

```bash
# Load package-specific testing patterns
if [[ -n "$PACKAGES" ]]; then
  for pkg in ${PACKAGES//,/ }; do
    pkg_test_config="packages/features/$pkg/test-config.md"
    [ -f "$pkg_test_config" ] && echo "Loading package config: $pkg_test_config"
  done
fi
```

### MCP Context Discovery

```bash
# Load testing domain knowledge
mcp__context7__get-library-docs --context7CompatibleLibraryID "/testing/vitest" --topic "test-discovery"
mcp__context7__get-library-docs --context7CompatibleLibraryID "/testing/playwright" --topic "coverage-analysis"
```

## Prompt

<role>
Execute the role of Advanced Test Coverage Intelligence Agent, specializing in comprehensive test gap discovery, risk-based prioritization, and strategic coverage optimization. Apply domain expertise to ensure critical business logic receives appropriate test coverage while maximizing development efficiency.
</role>

<instructions>
# Test Discovery Workflow

**EXECUTE CORE REQUIREMENTS**:

- Discover all test files with 100% accuracy across Vitest and Playwright frameworks
- Generate comprehensive source-to-test mapping with coverage confidence scores
- Calculate business-risk weighted priorities using multi-factor algorithms
- Implement persistent tracking with historical trend analysis
- Produce actionable recommendations with implementation strategies and effort estimates
- Validate results through comprehensive quality gates and error handling

## 1. PURPOSE - Establish Strategic Testing Objectives

<purpose>
**Mission**: Execute comprehensive test gap discovery to maximize coverage impact and minimize testing effort through intelligent prioritization and domain-specific validation.

**Strategic Outcomes**:

- Achieve complete test file discovery across all testing frameworks (Vitest, Playwright, Jest)
- Generate precise source-to-test mapping with coverage metrics and gap analysis
- Calculate risk-weighted priority scores using business criticality, change frequency, and complexity factors
- Identify critical coverage gaps in high-risk components (auth, payments, AI features)
- Produce actionable testing recommendations with implementation strategies
- Establish baseline metrics for continuous coverage tracking and improvement

**Success Validation**:

- 100% test file discovery accuracy validated against framework configurations
- Source mapping covers all testable files with confidence scores
- Priority algorithm incorporates business impact, technical risk, and change patterns
- Critical gaps identified with remediation timelines
- Coverage database updated with historical trend analysis
- Performance metrics show analysis completion within 60 seconds for codebases up to 10k files

**Domain Integration**:

- Validate test patterns against testing framework best practices via Context7
- Monitor test execution performance and failure patterns via New Relic
- Track test metadata and coverage history in PostgreSQL for trend analysis
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

## 3. INPUTS - Execute Discovery Configuration

<inputs>
### Initialize Environment and Parse Arguments
```bash
# Start performance tracking
START_TIME=$(date +%s)

# Parse and validate command options

parse_discovery_arguments() {
  echo "⚙️ Parsing discovery options..."

# Initialize defaults

  UPDATE_MODE=false
  TEST_TYPE="all"
  PRIORITY="all"
  RECENT_MODE=false
  GENERATE_REPORT=false
  USE_AGENT=false
  PACKAGES=""
  VERBOSE=false

  while [[ $# -gt 0 ]]; do
    case $1 in
      --update)
        UPDATE_MODE=true
        echo "  🔄 Database update mode enabled"
        ;;
      --type=*)
        TEST_TYPE="${1#*=}"
        validate_test_type "$TEST_TYPE"
        echo "  🎯 Test type filter: $TEST_TYPE"
        ;;
      --priority=*)
        PRIORITY="${1#*=}"
        validate_priority_level "$PRIORITY"
        echo "  📊 Priority filter: $PRIORITY"
        ;;
      --recent)
        RECENT_MODE=true
        echo "  📅 Recent changes mode enabled"
        ;;
      --report)
        GENERATE_REPORT=true
        echo "  📋 Report generation enabled"
        ;;
      --delegate)
        USE_AGENT=true
        echo "  🤖 Agent delegation enabled"
        ;;
      --packages=*)
        PACKAGES="${1#*=}"
        validate_packages "$PACKAGES"
        echo "  📦 Package filter: $PACKAGES"
        ;;
      --verbose)
        VERBOSE=true
        echo "  🔍 Verbose output enabled"
        ;;
      --help|-h)
        display_help
        exit 0
        ;;
      *)
        log_error "ERROR" "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
    esac
    shift
  done
}

# Validate input parameters

validate_test_type() {
  local type="$1"
  case "$type" in
    "all"|"unit"|"integration"|"e2e"|"vitest"|"playwright")
      return 0
      ;;
    *)
      log_error "ERROR" "Invalid test type: $type. Valid options: all, unit, integration, e2e, vitest, playwright"
      exit 1
      ;;
  esac
}

validate_priority_level() {
  local priority="$1"
  case "$priority" in
    "all"|"p1"|"p2"|"p3"|"critical"|"high"|"medium"|"low")
      return 0
      ;;
    *)
      log_error "ERROR" "Invalid priority level: $priority. Valid options: all, p1, p2, p3, critical, high, medium, low"
      exit 1
      ;;
  esac
}

validate_packages() {
  local packages="$1"
  IFS=',' read -ra PACKAGE_LIST <<< "$packages"

  for pkg in "${PACKAGE_LIST[@]}"; do
    if [[ ! -d "packages/features/$pkg" ]] && [[ ! -d "apps/$pkg" ]]; then
      log_error "WARNING" "Package directory not found: $pkg"
    fi
  done
}

```

### Load and Validate Test Configurations
```bash
# Extract configuration patterns with validation
load_test_configurations() {
  echo "📋 Loading test configurations..."

  # Extract Vitest configuration
  extract_vitest_config() {
    local config_file="$1"

    # Try multiple extraction methods
    local pattern=""

    # Method 1: Extract include patterns
    pattern=$(grep -E "include:\s*\[" "$config_file" | sed -n 's/.*include:\s*\[\([^\]]*\)\].*/\1/p' | tr -d '"'\'', ')

    if [[ -z "$pattern" ]]; then
      # Method 2: Extract test patterns from glob
      pattern=$(grep -E "\*\*\/\*\.(test|spec)\.(ts|tsx|js|jsx)" "$config_file" | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
    fi

    if [[ -z "$pattern" ]]; then
      # Method 3: Default fallback
      pattern="**/*.{test,spec}.{ts,tsx}"
      log_error "WARNING" "Could not extract vitest patterns from $config_file, using default: $pattern"
    fi

    echo "$pattern"
  }

  # Extract Playwright configuration
  extract_playwright_config() {
    local config_file="$1"

    # Try multiple extraction methods
    local testdir=""

    # Method 1: Extract testDir
    testdir=$(grep -E "testDir:\s*['\"]" "$config_file" | sed "s/.*testDir:\s*['\"]\([^'\"]*\)['\"].*/\1/")

    if [[ -z "$testdir" ]]; then
      # Method 2: Look for projects with testDir
      testdir=$(grep -A 5 "projects:" "$config_file" | grep -E "testDir:\s*['\"]" | head -1 | sed "s/.*testDir:\s*['\"]\([^'\"]*\)['\"].*/\1/")
    fi

    if [[ -z "$testdir" ]]; then
      # Method 3: Default fallback
      testdir="tests"
      log_error "WARNING" "Could not extract playwright testDir from $config_file, using default: $testdir"
    fi

    echo "$testdir"
  }

  # Load configurations with fallbacks
  if [[ -f "vitest.config.ts" ]]; then
    VITEST_PATTERN=$(extract_vitest_config "vitest.config.ts")
  elif [[ -f "vitest.config.js" ]]; then
    VITEST_PATTERN=$(extract_vitest_config "vitest.config.js")
  else
    VITEST_PATTERN="**/*.{test,spec}.{ts,tsx}"
    log_error "WARNING" "No vitest config found, using default pattern: $VITEST_PATTERN"
  fi

  if [[ -f "playwright.config.ts" ]]; then
    PLAYWRIGHT_DIR=$(extract_playwright_config "playwright.config.ts")
  elif [[ -f "playwright.config.js" ]]; then
    PLAYWRIGHT_DIR=$(extract_playwright_config "playwright.config.js")
  else
    PLAYWRIGHT_DIR="tests"
    log_error "WARNING" "No playwright config found, using default directory: $PLAYWRIGHT_DIR"
  fi

  echo "  ✅ Vitest pattern: $VITEST_PATTERN"
  echo "  ✅ Playwright directory: $PLAYWRIGHT_DIR"
}
```

### Initialize Database and MCP Connections

```bash
# Setup persistent storage and external integrations
initialize_database_and_mcp() {
  echo "💾 Initializing database and MCP connections..."

  # Setup database path
  DB_PATH=".claude/tracking/test-data/test-coverage-db.json"
  mkdir -p "$(dirname "$DB_PATH")"

  # Check existing database
  check_existing_database() {
    if [[ -f "$DB_PATH" ]]; then
      echo "  📊 Found existing database"

      # Validate database integrity
      if jq empty "$DB_PATH" 2>/dev/null; then
        LAST_UPDATE=$(jq -r '.lastUpdated // "never"' "$DB_PATH")
        LAST_VERSION=$(jq -r '.version // "1.0"' "$DB_PATH")
        echo "    Last updated: $LAST_UPDATE"
        echo "    Database version: $LAST_VERSION"

        # Create backup before updates
        if [[ "$UPDATE_MODE" == "true" ]]; then
          cp "$DB_PATH" "${DB_PATH}.backup"
          echo "    ✅ Database backup created"
        fi
      else
        log_error "WARNING" "Corrupted database detected, will recreate"
        recover_database "$DB_PATH"
      fi
    else
      echo "  🆕 Will create new database"
    fi
  }

  # Initialize MCP connections
  initialize_mcp_connections() {
    echo "  🔌 Initializing MCP connections..."

    # Test Context7 for testing documentation
    if command -v mcp__context7__resolve-library-id >/dev/null 2>&1; then
      echo "    ✅ Context7 MCP available"
      USE_CONTEXT7=true

      # Load testing framework documentation
      load_testing_documentation
    else
      log_error "WARNING" "Context7 MCP not available"
      USE_CONTEXT7=false
    fi

    # Test PostgreSQL for advanced analytics
    if command -v mcp__postgres__pg_execute_query >/dev/null 2>&1; then
      echo "    ✅ PostgreSQL MCP available"
      USE_POSTGRES=true

      # Setup test analytics schema
      setup_test_analytics_schema
    else
      log_error "WARNING" "PostgreSQL MCP not available"
      USE_POSTGRES=false
    fi

    # Test New Relic for performance monitoring
    if command -v mcp__newrelic__query_newrelic_logs >/dev/null 2>&1; then
      echo "    ✅ New Relic MCP available"
      USE_NEWRELIC=true

      # Load test performance metrics
      load_test_performance_metrics
    else
      log_error "WARNING" "New Relic MCP not available"
      USE_NEWRELIC=false
    fi
  }

  check_existing_database
  initialize_mcp_connections
}

# Load testing framework documentation
load_testing_documentation() {
  if [[ "$USE_CONTEXT7" == "true" ]]; then
    echo "    📚 Loading testing documentation..."

    # Load Vitest documentation
    mcp__context7__resolve-library-id --libraryName "vitest" | \
      jq -r '.selectedLibraryId' | \
      xargs -I {} mcp__context7__get-library-docs --context7CompatibleLibraryID {} --topic "test-discovery" --tokens 2000

    # Load Playwright documentation
    mcp__context7__resolve-library-id --libraryName "playwright" | \
      jq -r '.selectedLibraryId' | \
      xargs -I {} mcp__context7__get-library-docs --context7CompatibleLibraryID {} --topic "coverage-analysis" --tokens 2000
  fi
}

# Setup test analytics in PostgreSQL
setup_test_analytics_schema() {
  if [[ "$USE_POSTGRES" == "true" ]]; then
    echo "    📊 Setting up test analytics schema..."

    # Create test coverage tracking table
    mcp__postgres__pg_execute_sql --sql "
      CREATE TABLE IF NOT EXISTS test_coverage_history (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        total_source_files INTEGER,
        total_test_files INTEGER,
        coverage_percentage DECIMAL(5,2),
        critical_gaps INTEGER,
        project_hash VARCHAR(64),
        analysis_metadata JSONB
      )
    " --expectRows false
  fi
}

# Load test performance metrics from New Relic
load_test_performance_metrics() {
  if [[ "$USE_NEWRELIC" == "true" ]]; then
    echo "    ⚡ Loading test performance metrics..."

    # Query test execution times
    mcp__newrelic__query_newrelic_logs --nrql "
      SELECT average(duration), count(*)
      FROM TestRun
      WHERE appName = 'slideheroes'
      AND testType IN ('unit', 'integration', 'e2e')
      SINCE 7 days ago
    "
  fi
}
```

</inputs>

## 4. METHOD - Execute Systematic Discovery Process

<method>
### Step 1: Execute Test File Discovery
Discover all test files across frameworks:
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

### Step 2: Analyze Source File Coverage
Identify and categorize files requiring test coverage:
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

### Step 3: Execute Coverage Mapping

Generate comprehensive source-to-test file relationships:

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

### Step 4: Calculate Priority Scoring

Compute risk-weighted priority scores using business impact algorithms:

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

### Step 5: Perform Git-Based Change Analysis

Analyze recent modifications and identify high-risk patterns:

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

### Step 6: Execute Database Persistence

Persist analysis results and update historical tracking:

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

## 5. EXPECTATIONS - Validation & Quality Assurance

<expectations>
### Comprehensive Validation Checks
```bash
# Validate discovery completeness
validate_discovery_results() {
  local errors=0

# Check test file discovery accuracy

  echo "🔍 Validating test discovery..."

# Verify against vitest config patterns

  vitest_pattern=$(grep -o '"include":\s*\[[^\]]*\]' vitest.config.ts | head -1)
  if [[ -z "$vitest_pattern" ]]; then
    echo "❌ ERROR: Cannot extract vitest test patterns"
    ((errors++))
  fi

# Verify against playwright config

  playwright_dir=$(grep -o 'testDir:\s*["'\'''][^"'\''']*["'\''']' playwright.config.ts | cut -d"'" -f2)
  if [[ -z "$playwright_dir" ]] || [[ ! -d "$playwright_dir" ]]; then
    echo "❌ ERROR: Invalid playwright test directory: $playwright_dir"
    ((errors++))
  fi

# Validate source file mapping

  mapped_files=$(echo "${!COVERAGE_MAP[@]}" | wc -w)
  total_source=$(echo "$SOURCE_FILES" | wc -l)

  if [[ $mapped_files -lt $((total_source * 95 / 100)) ]]; then
    echo "❌ ERROR: Low mapping coverage: $mapped_files/$total_source files mapped"
    ((errors++))
  fi

# Validate priority scoring

  for item in "${SORTED_QUEUE[@]:0:5}"; do
    IFS=':' read -r score file <<< "$item"
    if [[ $score -lt 10 ]] || [[ $score -gt 100 ]]; then
      echo "❌ ERROR: Invalid priority score for $file: $score"
      ((errors++))
    fi
  done

# Database integrity check

  if [[ -f "$DB_PATH" ]]; then
    if ! jq empty "$DB_PATH" 2>/dev/null; then
      echo "❌ ERROR: Invalid JSON in coverage database"
      ((errors++))
    fi
  fi

# MCP integration validation

  check_mcp_availability

  return $errors
}

# Check MCP server availability

check_mcp_availability() {
  echo "🔌 Validating MCP integrations..."

# Test Context7 connection

  if ! mcp__context7__resolve-library-id --libraryName "vitest" >/dev/null 2>&1; then
    echo "⚠️ WARNING: Context7 MCP not available - skipping documentation lookup"
  fi

# Test PostgreSQL connection

  if ! mcp__postgres__pg_execute_query --operation "select" --query "SELECT 1" >/dev/null 2>&1; then
    echo "⚠️ WARNING: PostgreSQL MCP not available - using local database"
  fi

# Test New Relic connection

  if ! mcp__newrelic__query_newrelic_logs --nrql "SELECT count(*) FROM Log" >/dev/null 2>&1; then
    echo "⚠️ WARNING: New Relic MCP not available - skipping performance metrics"
  fi
}

```

### Enhanced Report Generation
```bash
generate_comprehensive_report() {
  local report_path="reports/$(date +%Y-%m-%d)/test-discovery-report.md"
  mkdir -p "$(dirname "$report_path")"

  cat > "$report_path" << EOF
# Test Discovery Analysis Report

**Generated**: $(date '+%Y-%m-%d %H:%M:%S UTC')
**Command**: test-discovery $*
**Analysis Duration**: ${ANALYSIS_DURATION}s

## Executive Summary

### Coverage Metrics
| Metric | Value | Status |
|--------|-------|--------|
| Total Source Files | $(echo "$SOURCE_FILES" | wc -l) | 📊 |
| Total Test Files | $(echo "$VITEST_FILES $E2E_FILES" | wc -w) | 📊 |
| Total Test Cases | $TEST_CASES | 📊 |
| Files Without Tests | $(echo "${COVERAGE_MAP[@]}" | grep -c "NONE:0") | $([ $(echo "${COVERAGE_MAP[@]}" | grep -c "NONE:0") -gt 50 ] && echo "⚠️" || echo "✅") |
| Coverage Percentage | $(calculate_coverage_percentage)% | $([ $(calculate_coverage_percentage) -lt 70 ] && echo "❌" || echo "✅") |

### Critical Risk Assessment
$(assess_critical_risks)

## Priority Queue (Top 15)
$(generate_priority_table)

## Domain-Specific Analysis
$(generate_domain_analysis)

## Actionable Recommendations
$(generate_recommendations)

## Implementation Timeline
$(generate_timeline)

## Database Updates
- Coverage database: $([ -f "$DB_PATH" ] && echo "✅ Updated" || echo "❌ Failed")
- Historical trends: $(check_trend_analysis)
- Performance tracking: $(check_performance_metrics)
EOF

  echo "📋 Report generated: $report_path"
}
```

### Quality Gates

```bash
# Enforce quality standards
enforce_quality_gates() {
  local gate_failures=0

  # Gate 1: Minimum coverage threshold
  coverage_pct=$(calculate_coverage_percentage)
  if [[ $coverage_pct -lt 60 ]]; then
    echo "❌ GATE FAILURE: Coverage below 60% ($coverage_pct%)"
    ((gate_failures++))
  fi

  # Gate 2: Critical package coverage
  for pkg in "admin" "auth" "payments"; do
    pkg_tests=$(find "packages/features/$pkg" -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l)
    if [[ $pkg_tests -eq 0 ]]; then
      echo "❌ GATE FAILURE: No tests found for critical package: $pkg"
      ((gate_failures++))
    fi
  done

  # Gate 3: High-risk file coverage
  high_risk_untested=$(echo "${SORTED_QUEUE[@]:0:5}" | grep -c ":")
  if [[ $high_risk_untested -gt 3 ]]; then
    echo "❌ GATE FAILURE: Too many high-risk files without tests: $high_risk_untested"
    ((gate_failures++))
  fi

  return $gate_failures
}
```

### Success Criteria Validation

```bash
# Final validation checklist
validate_success_criteria() {
  echo "✅ VALIDATION CHECKLIST:"

  # Discovery completeness
  echo "📋 Test Discovery: $([ $(echo "$VITEST_FILES $E2E_FILES" | wc -w) -gt 0 ] && echo "✅ Complete" || echo "❌ Failed")"

  # Mapping accuracy
  echo "🗺️ Coverage Mapping: $([ ${#COVERAGE_MAP[@]} -gt 0 ] && echo "✅ Complete" || echo "❌ Failed")"

  # Priority calculation
  echo "🎯 Priority Scoring: $([ ${#SORTED_QUEUE[@]} -gt 0 ] && echo "✅ Complete" || echo "❌ Failed")"

  # Database persistence
  echo "💾 Database Update: $([ -f "$DB_PATH" ] && echo "✅ Complete" || echo "❌ Failed")"

  # Report generation
  echo "📊 Report Generation: $([ -f "reports/$(date +%Y-%m-%d)/test-discovery-report.md" ] && echo "✅ Complete" || echo "❌ Failed")"

  # Performance validation
  echo "⚡ Performance: $([ ${ANALYSIS_DURATION:-999} -lt 60 ] && echo "✅ Under 60s" || echo "⚠️ Slow")"
}
```

</expectations>

## Agent Delegation Strategy

<delegation>
### Execute Intelligent Agent Coordination
```bash
# Determine optimal delegation strategy
execute_agent_delegation() {
  if [[ "$USE_AGENT" == "true" ]]; then
    echo "🤖 Executing intelligent agent delegation..."

    # Assess analysis complexity
    source_file_count=$(echo "$SOURCE_FILES" | wc -l)
    package_count=$(echo "$PACKAGES" | tr ',' '\n' | wc -l)

    # Choose appropriate delegation strategy
    if [[ $source_file_count -gt 1000 ]] || [[ $package_count -gt 5 ]]; then
      execute_parallel_delegation
    else
      execute_single_agent_delegation
    fi
  fi
}

# Execute parallel agent coordination

execute_parallel_delegation() {
  echo "⚡ Launching parallel agent analysis..."

# Delegate to testing expert for framework analysis

  Task --description "Test framework pattern analysis" \
       --agent "testing-expert" \
       --context "$(generate_testing_context)" \
       --prompt "Analyze test patterns, identify anti-patterns, recommend improvements for discovered test gaps" &

# Delegate to nodejs expert for dependency analysis

  Task --description "Node.js dependency impact analysis" \
       --agent "nodejs-expert" \
       --context "$(generate_dependency_context)" \
       --prompt "Analyze package dependencies affecting test coverage, identify integration test requirements" &

# Delegate to database expert for data layer testing

  Task --description "Database layer test coverage analysis" \
       --agent "database-expert" \
       --context "$(generate_database_context)" \
       --prompt "Analyze database operations requiring test coverage, recommend integration test strategies" &

# Wait for all agents to complete

  wait
  echo "✅ Parallel delegation completed"
}

# Execute single agent deep analysis

execute_single_agent_delegation() {
  echo "🎯 Launching focused expert analysis..."

  Task --description "Comprehensive test discovery with expert analysis" \
       --agent "testing-expert" \
       --context "$(generate_comprehensive_context)" \
       --prompt "
         Execute deep test discovery analysis:
         1. Validate test file discovery against framework configurations
         2. Analyze test case distribution and coverage patterns
         3. Calculate business-risk weighted priority scores
         4. Identify critical coverage gaps in auth, payments, AI features
         5. Generate implementation roadmap with effort estimates
         6. Recommend testing strategies for each identified gap

         Context: $(pwd)
         Scope: ${PACKAGES:-all packages}
         Analysis Type: ${TEST_TYPE}
         Priority Filter: ${PRIORITY}
         Recent Changes: ${RECENT_MODE}
       "
}

# Generate context for agent delegation

generate_testing_context() {
  cat << EOF
Project: SlideHeroes AI Presentation Platform
Frameworks: Vitest (unit/integration), Playwright (E2E)
Key Packages: auth, payments, ai-canvas, admin
Test Patterns: $VITEST_PATTERN
E2E Directory: $PLAYWRIGHT_DIR
Source Files: $(echo "$SOURCE_FILES" | wc -l)
EOF
}

generate_dependency_context() {
  cat << EOF
Monorepo Structure: pnpm workspace
Core Dependencies: Next.js 14, Supabase, TypeScript
Package Count: $(find packages -name "package.json" | wc -l)
Test Dependencies: $(grep -r "@testing\|vitest\|playwright" package.json | wc -l)
EOF
}

generate_database_context() {
  cat << EOF
Database: PostgreSQL via Supabase
ORM: Prisma/Supabase SDK
Data Layer: $(find . -name "*.sql" -o -name "*database*" -o -name "*schema*" | wc -l) files
RLS Policies: $(grep -r "CREATE POLICY" . | wc -l)
EOF
}

```
</delegation>

## Error Handling & Recovery
<error_handling>
### Comprehensive Error Management
```bash
# Initialize error tracking
ERROR_LOG="/tmp/test-discovery-errors-$(date +%s).log"
ERROR_COUNT=0
WARNING_COUNT=0

# Error logging function
log_error() {
  local level="$1"
  local message="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  echo "[$timestamp] $level: $message" | tee -a "$ERROR_LOG"

  case "$level" in
    "ERROR") ((ERROR_COUNT++)) ;;
    "WARNING") ((WARNING_COUNT++)) ;;
  esac
}

# Handle critical failures
handle_critical_error() {
  local error_msg="$1"
  log_error "ERROR" "$error_msg"

  # Attempt graceful degradation
  echo "🔄 Attempting recovery..."

  # Create minimal report with error details
  cat > "reports/$(date +%Y-%m-%d)/test-discovery-error-report.md" << EOF
# Test Discovery Error Report

**Error Time**: $(date)
**Error Message**: $error_msg
**Recovery Actions**: See error log at $ERROR_LOG

## Partial Results
$(generate_partial_results)
EOF

  exit 1
}

# Validate prerequisites
validate_prerequisites() {
  echo "🔧 Validating prerequisites..."

  # Check required tools
  for tool in "jq" "git" "find" "grep"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      handle_critical_error "Required tool not found: $tool"
    fi
  done

  # Check file permissions
  if [[ ! -r "." ]]; then
    handle_critical_error "Cannot read current directory"
  fi

  # Check available disk space
  available_space=$(df . | tail -1 | awk '{print $4}')
  if [[ $available_space -lt 100000 ]]; then  # 100MB
    log_error "WARNING" "Low disk space: ${available_space}KB available"
  fi
}

# Configuration validation and fallbacks
validate_configurations() {
  echo "⚙️ Validating test configurations..."

  # Vitest configuration
  if [[ ! -f "vitest.config.ts" ]] && [[ ! -f "vitest.config.js" ]]; then
    log_error "WARNING" "No vitest config found, using default patterns"
    VITEST_PATTERN="**/*.{test,spec}.{ts,tsx,js,jsx}"
  else
    # Extract patterns from config
    if [[ -f "vitest.config.ts" ]]; then
      VITEST_PATTERN=$(extract_vitest_patterns "vitest.config.ts")
    else
      VITEST_PATTERN=$(extract_vitest_patterns "vitest.config.js")
    fi

    if [[ -z "$VITEST_PATTERN" ]]; then
      log_error "WARNING" "Could not extract vitest patterns, using defaults"
      VITEST_PATTERN="**/*.{test,spec}.{ts,tsx}"
    fi
  fi

  # Playwright configuration
  if [[ ! -f "playwright.config.ts" ]] && [[ ! -f "playwright.config.js" ]]; then
    log_error "WARNING" "No playwright config found, using default directory"
    PLAYWRIGHT_DIR="tests"
  else
    PLAYWRIGHT_DIR=$(extract_playwright_dir)
    if [[ -z "$PLAYWRIGHT_DIR" ]]; then
      log_error "WARNING" "Could not extract playwright directory, using default"
      PLAYWRIGHT_DIR="tests"
    fi
  fi
}

# Git repository validation
validate_git_repository() {
  echo "📝 Validating git repository..."

  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    log_error "WARNING" "Not a git repository, disabling git-based analysis"
    RECENT_MODE=false
    GIT_AVAILABLE=false
    return 1
  fi

  # Check if we can access git log
  if ! git log -1 --oneline >/dev/null 2>&1; then
    log_error "WARNING" "Cannot access git history, disabling change analysis"
    RECENT_MODE=false
  fi

  GIT_AVAILABLE=true
  return 0
}

# Database recovery procedures
recover_database() {
  local db_path="$1"

  echo "💾 Attempting database recovery..."

  # Check if backup exists
  if [[ -f "${db_path}.backup" ]]; then
    log_error "WARNING" "Restoring from backup database"
    cp "${db_path}.backup" "$db_path"
    return 0
  fi

  # Create minimal database structure
  log_error "WARNING" "Creating new database with minimal structure"
  cat > "$db_path" << 'EOF'
{
  "version": "2.0",
  "lastUpdated": "",
  "summary": {
    "totalSourceFiles": 0,
    "totalTestFiles": 0,
    "totalTestCases": 0,
    "totalTestSuites": 0,
    "filesWithoutTests": 0
  },
  "priorityQueue": [],
  "criticalGaps": [],
  "errors": ["Database recovered from corruption"]
}
EOF

  return 0
}

# Performance monitoring and limits
monitor_performance() {
  local start_time="$1"
  local current_time=$(date +%s)
  local elapsed=$((current_time - start_time))

  # Warn if taking too long
  if [[ $elapsed -gt 300 ]]; then  # 5 minutes
    log_error "WARNING" "Analysis taking longer than expected: ${elapsed}s"
  fi

  # Kill if taking way too long
  if [[ $elapsed -gt 600 ]]; then  # 10 minutes
    log_error "ERROR" "Analysis timeout after ${elapsed}s"
    handle_critical_error "Analysis timeout exceeded"
  fi
}

# MCP error handling
handle_mcp_errors() {
  # Context7 fallback
  if ! command -v mcp__context7__resolve-library-id >/dev/null 2>&1; then
    log_error "WARNING" "Context7 MCP not available - using local documentation"
    USE_CONTEXT7=false
  fi

  # PostgreSQL fallback
  if ! command -v mcp__postgres__pg_execute_query >/dev/null 2>&1; then
    log_error "WARNING" "PostgreSQL MCP not available - using JSON database"
    USE_POSTGRES=false
  fi

  # New Relic fallback
  if ! command -v mcp__newrelic__query_newrelic_logs >/dev/null 2>&1; then
    log_error "WARNING" "New Relic MCP not available - skipping performance metrics"
    USE_NEWRELIC=false
  fi
}

# Final error summary
generate_error_summary() {
  if [[ $ERROR_COUNT -gt 0 ]] || [[ $WARNING_COUNT -gt 0 ]]; then
    echo "⚠️ Analysis completed with issues:"
    echo "   Errors: $ERROR_COUNT"
    echo "   Warnings: $WARNING_COUNT"
    echo "   Error log: $ERROR_LOG"

    # Add error summary to report
    if [[ -f "reports/$(date +%Y-%m-%d)/test-discovery-report.md" ]]; then
      cat >> "reports/$(date +%Y-%m-%d)/test-discovery-report.md" << EOF

## Error Summary
- Errors encountered: $ERROR_COUNT
- Warnings generated: $WARNING_COUNT
- Error log location: $ERROR_LOG

### Error Details
$(tail -20 "$ERROR_LOG" | sed 's/^/    /')
EOF
    fi
  else
    echo "✅ Analysis completed without errors"
  fi
}
```

</error_handling>
</instructions>

<patterns>
### Implementation Patterns
```bash
# Apply proven discovery patterns
apply_discovery_patterns() {
  echo "🏗️ Applying discovery patterns..."

# Pattern 1: Parallel Execution

  execute_parallel_searches() {
    # Run multiple searches concurrently
    find_vitest_files &
    find_playwright_files &
    find_source_files &
    analyze_git_changes &
    wait
  }

# Pattern 2: Smart Caching

  implement_smart_caching() {
    local cache_dir=".claude/cache/test-discovery"
    mkdir -p "$cache_dir"

    # Cache file lists if unchanged
    local git_hash=$(git rev-parse HEAD 2>/dev/null || echo "no-git")
    local cache_file="$cache_dir/files-$git_hash.json"

    if [[ -f "$cache_file" ]] && [[ $(find "$cache_file" -mmin -30) ]]; then
      echo "📋 Using cached file discovery"
      source "$cache_file"
    else
      execute_file_discovery
      cache_discovery_results "$cache_file"
    fi
  }

# Pattern 3: Incremental Updates

  implement_incremental_updates() {
    if [[ -f "$DB_PATH" ]] && [[ "$UPDATE_MODE" != "true" ]]; then
      # Only analyze changed files since last update
      local last_update=$(jq -r '.lastUpdated' "$DB_PATH")
      local changed_files=$(git diff --name-only "$last_update" HEAD 2>/dev/null || echo "")

      if [[ -n "$changed_files" ]]; then
        echo "🔄 Incremental update: $(echo "$changed_files" | wc -l) changed files"
        analyze_changed_files "$changed_files"
      else
        echo "✅ No changes since last update"
      fi
    fi
  }

# Pattern 4: Priority-Based Processing

  implement_priority_processing() {
    # Process high-priority packages first
    local priority_packages=("admin" "auth" "payments" "ai")

    for pkg in "${priority_packages[@]}"; do
      if [[ -d "packages/features/$pkg" ]]; then
        analyze_package_priority "$pkg"
      fi
    done
  }

  execute_parallel_searches
  implement_smart_caching
  implement_incremental_updates
  implement_priority_processing
}

```

### Anti-Pattern Prevention
```bash
# Prevent common discovery anti-patterns
prevent_antipatterns() {
  echo "🚫 Preventing anti-patterns..."

  # Anti-pattern 1: Avoid scanning node_modules
  validate_search_paths() {
    local excluded_paths=("node_modules" ".next" "dist" "build" "coverage")

    for path in "${excluded_paths[@]}"; do
      if echo "$SOURCE_FILES" | grep -q "$path"; then
        log_error "ERROR" "Anti-pattern detected: scanning $path directory"
        SOURCE_FILES=$(echo "$SOURCE_FILES" | grep -v "$path")
      fi
    done
  }

  # Anti-pattern 2: Ensure test configurations are loaded
  validate_test_configs() {
    if [[ -z "$VITEST_PATTERN" ]] || [[ -z "$PLAYWRIGHT_DIR" ]]; then
      log_error "ERROR" "Anti-pattern detected: missing test configuration validation"
      return 1
    fi
  }

  # Anti-pattern 3: Include all test types
  validate_test_inclusion() {
    local vitest_count=$(echo "$VITEST_FILES" | wc -l)
    local e2e_count=$(echo "$E2E_FILES" | wc -l)

    if [[ $vitest_count -eq 0 ]] && [[ -d "packages" ]]; then
      log_error "WARNING" "No Vitest files found - possible configuration issue"
    fi

    if [[ $e2e_count -eq 0 ]] && [[ -d "$PLAYWRIGHT_DIR" ]]; then
      log_error "WARNING" "No E2E files found - possible configuration issue"
    fi
  }

  # Anti-pattern 4: Ensure dynamic priority scoring
  validate_priority_algorithm() {
    # Verify priority scoring includes multiple factors
    local sample_score=$(calculate_priority "packages/features/auth/index.ts" 2>/dev/null || echo "0")

    if [[ $sample_score -eq 0 ]]; then
      log_error "ERROR" "Anti-pattern detected: static or broken priority scoring"
      return 1
    fi
  }

  validate_search_paths
  validate_test_configs
  validate_test_inclusion
  validate_priority_algorithm
}
```

</patterns>

<help>
🔍 **Advanced Test Discovery & Coverage Intelligence**

Execute comprehensive test gap discovery with AI-powered prioritization and domain-specific validation.

**Command Usage:**

```bash
# Execute full discovery analysis
/testing/test-discovery

# Update coverage database and generate report
/testing/test-discovery --update --report

# Analyze recent changes with expert delegation
/testing/test-discovery --recent --delegate

# Focus on specific packages with priority filtering
/testing/test-discovery --packages=auth,payments --priority=p1

# Verbose analysis with all features
/testing/test-discovery --update --report --recent --delegate --verbose
```

**Advanced Features:**

- 🎯 **Intelligent Discovery**: Framework-aware test file detection
- 🗺️ **Coverage Mapping**: Source-to-test relationship analysis
- 📊 **Risk-Based Scoring**: Business impact + technical complexity algorithms
- 🔄 **Git Integration**: Change frequency and churn analysis
- 🤖 **MCP Integration**: Context7, PostgreSQL, New Relic insights
- ⚡ **Performance Optimized**: Parallel processing + smart caching
- 📋 **Comprehensive Reports**: Actionable recommendations with timelines

**Workflow:**

1. **Discover** → Scan all test files across Vitest + Playwright
2. **Analyze** → Map source files to test coverage
3. **Prioritize** → Calculate risk-weighted scores
4. **Validate** → Quality gates and error handling
5. **Report** → Generate actionable insights
6. **Track** → Persist metrics for trend analysis

**Quality Assurance:**

- ✅ Validation checks at every step
- 🚫 Anti-pattern prevention
- 📈 Performance monitoring (< 60s for 10k files)
- 🔒 Error handling with graceful degradation
- 📊 Success metrics and quality gates

**MCP Integrations:**

- **Context7**: Load testing framework documentation
- **PostgreSQL**: Advanced analytics and historical tracking
- **New Relic**: Test performance and failure pattern analysis

Your intelligent guide to strategic test coverage!
</help>
