# Test Discovery Command (Improved)

Usage: `/test-discovery [options]`

This command analyzes your codebase to identify and prioritize tests that need to be written, maintaining a comprehensive test coverage database.

## Quick Usage

```bash
/test-discovery                      # Full analysis with priority ranking
/test-discovery --update            # Update existing test database
/test-discovery --type=unit         # Focus on unit test gaps
/test-discovery --priority=p1       # Show only P1 business critical gaps
/test-discovery --recent            # Focus on recently changed files
/test-discovery --report            # Generate detailed coverage report
/test-discovery --delegate          # Use test-discovery agent for deep analysis
```

## 1. Accurate Test Discovery

### 1.1 Primary Test Locations

```bash
# VITEST TESTS (Unit/Integration)
# Primary pattern from vitest.config.ts: **/*.{test,spec}.{js,ts,jsx,tsx}
echo "=== Vitest Test Discovery ===" && \
find apps/web packages -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/.next/*" \
  ! -path "*/coverage/*" \
  ! -path "*/supabase/tests/*" \
  ! -path "*/e2e/*" | wc -l

# PLAYWRIGHT TESTS (E2E)  
# From playwright.config.ts testDir: ./tests
echo "=== Playwright E2E Test Discovery ===" && \
find apps/e2e/tests -name "*.spec.ts" -o -name "*.e2e.ts" | wc -l

# COUNT INDIVIDUAL TEST CASES (not just files)
echo "=== Individual Test Cases ===" && \
find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.e2e.ts" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  -print0 | xargs -0 grep -h "^\s*\(it\|test\|it\.skip\|test\.skip\|it\.only\|test\.only\)(" 2>/dev/null | wc -l

# COUNT TEST SUITES
echo "=== Test Suites (describe blocks) ===" && \
find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" -o -name "*.e2e.ts" \) \
  ! -path "*/node_modules/*" \
  -print0 | xargs -0 grep -h "^\s*describe(" 2>/dev/null | wc -l
```

### 1.2 Source File Discovery (Requiring Tests)

```bash
# Count source files per package/app
for location in apps/web packages/features packages/ai-gateway packages/supabase packages/database-webhooks; do
  echo "=== $location ===" && \
  find "$location" -type f \( -name "*.ts" -o -name "*.tsx" \) \
    ! -name "*.test.*" \
    ! -name "*.spec.*" \
    ! -name "*.d.ts" \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    ! -path "*/.next/*" 2>/dev/null | wc -l
done

# Critical untested packages
echo "=== Critical Packages Without Tests ===" && \
for pkg in admin auth payments accounts billing team-accounts; do
  src_count=$(find packages/features/$pkg -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.test.*" ! -name "*.spec.*" 2>/dev/null | wc -l)
  test_count=$(find packages/features/$pkg -type f \( -name "*.test.*" -o -name "*.spec.*" \) 2>/dev/null | wc -l)
  echo "$pkg: $src_count source files, $test_count test files"
done
```

### 1.3 Test Coverage Mapping

```bash
# Create test coverage map (source file -> test file relationships)
echo "=== Test Coverage Mapping ===" && \
for src_file in $(find apps/web packages/features -name "*.ts" -o -name "*.tsx" | grep -v test | grep -v spec | head -20); do
  base_name=$(basename "$src_file" | sed 's/\.\(ts\|tsx\)$//')
  dir_name=$(dirname "$src_file")
  
  # Look for corresponding test files
  test_files=$(find "$dir_name" -maxdepth 2 \( \
    -name "${base_name}.test.ts" -o \
    -name "${base_name}.test.tsx" -o \
    -name "${base_name}.spec.ts" -o \
    -name "${base_name}.spec.tsx" \
  \) 2>/dev/null)
  
  if [ -z "$test_files" ]; then
    echo "❌ MISSING: $src_file"
  else
    test_count=$(echo "$test_files" | xargs grep -h "^\s*\(it\|test\)(" 2>/dev/null | wc -l)
    echo "✅ TESTED: $src_file ($test_count tests)"
  fi
done
```

## 2. Git-Based Priority Analysis

### 2.1 Recent Changes & High-Churn Files

```bash
# Files changed in last 10 commits without tests
echo "=== Recently Changed Files Needing Tests ===" && \
git diff --name-only HEAD~10 -- '*.ts' '*.tsx' | \
  grep -v '.test.' | \
  grep -v '.spec.' | \
  while read file; do
    if [ -f "$file" ]; then
      test_file=$(find $(dirname "$file") -maxdepth 2 -name "$(basename "$file" | sed 's/\.\(ts\|tsx\)$//').test.*" -o -name "$(basename "$file" | sed 's/\.\(ts\|tsx\)$//').spec.*" 2>/dev/null | head -1)
      if [ -z "$test_file" ]; then
        echo "⚠️  $file (NO TESTS)"
      fi
    fi
  done

# High-churn files (modified frequently = high test value)
echo "=== High-Churn Files Analysis ===" && \
git log --format='' --name-only -n 200 -- '*.ts' '*.tsx' | \
  grep -v '.test.' | \
  grep -v '.spec.' | \
  sort | uniq -c | sort -rn | head -20 | \
  while read count file; do
    if [ -f "$file" ]; then
      test_exists=$(find $(dirname "$file") -maxdepth 2 -name "$(basename "$file" | sed 's/\.\(ts\|tsx\)$//').test.*" -o -name "$(basename "$file" | sed 's/\.\(ts\|tsx\)$//').spec.*" 2>/dev/null | head -1)
      if [ -z "$test_exists" ]; then
        echo "$count changes: $file ❌ NO TESTS"
      else
        echo "$count changes: $file ✅ HAS TESTS"
      fi
    fi
  done
```

## 3. Test Database Management

### 3.1 Database Update Logic

```bash
# Update existing database with fresh scan results
if [ "$1" = "--update" ] && [ -f ".claude/tracking/test-data/test-coverage-db.json" ]; then
  echo "📊 Updating existing test coverage database..."
  
  # Backup existing database
  cp .claude/tracking/test-data/test-coverage-db.json .claude/tracking/test-data/test-coverage-db.backup.json
  
  # Extract existing priority adjustments and custom data
  EXISTING_PRIORITIES=$(jq '.priorityQueue' .claude/tracking/test-data/test-coverage-db.json)
  EXISTING_RECOMMENDATIONS=$(jq '.recommendations' .claude/tracking/test-data/test-coverage-db.json)
  
  # Perform fresh scan (counts would be updated here)
  echo "🔍 Scanning for current test files..."
  VITEST_COUNT=$(find apps/web packages -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | grep -v node_modules | wc -l)
  E2E_COUNT=$(find apps/e2e/tests -name "*.spec.ts" | wc -l)
  TEST_CASES=$(find . -name "*.test.*" -o -name "*.spec.*" | xargs grep -h "^\s*\(it\|test\)(" 2>/dev/null | wc -l)
  
  # Update database with fresh counts while preserving priorities
  jq --argjson vitest "$VITEST_COUNT" \
     --argjson e2e "$E2E_COUNT" \
     --argjson cases "$TEST_CASES" \
     --arg updated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
     '.summary.vitestFiles = $vitest |
      .summary.playwrightFiles = $e2e |
      .summary.totalTestFiles = ($vitest + $e2e) |
      .summary.totalTestCases = $cases |
      .lastUpdated = $updated' \
     .claude/tracking/test-data/test-coverage-db.json > tmp.json && mv tmp.json .claude/tracking/test-data/test-coverage-db.json
  
  echo "✅ Database updated with latest test counts"
  echo "   Vitest files: $VITEST_COUNT"
  echo "   E2E files: $E2E_COUNT"
  echo "   Total test cases: $TEST_CASES"
  echo "   Backup saved to: test-coverage-db.backup.json"
else
  echo "🆕 Creating new test coverage database..."
  # Full scan and create new database
fi
```

### 3.2 Enhanced Database Schema

```json
{
  "version": "2.0",
  "lastUpdated": "2025-01-06T10:00:00Z",
  "testRunnerConfig": {
    "vitest": {
      "configPath": "apps/web/vitest.config.ts",
      "pattern": "**/*.{test,spec}.{js,ts,jsx,tsx}",
      "excludes": ["node_modules", "dist", ".next", "coverage", "supabase/tests", "e2e"]
    },
    "playwright": {
      "configPath": "apps/e2e/playwright.config.ts",
      "testDir": "apps/e2e/tests",
      "pattern": "*.spec.ts"
    }
  },
  "summary": {
    "totalSourceFiles": 500,
    "totalTestFiles": 37,
    "totalTestCases": 597,
    "totalTestSuites": 139,
    "filesWithTests": 120,
    "filesWithoutTests": 380,
    "coverageByType": {
      "unit": { "files": 19, "tests": 434 },
      "e2e": { "files": 18, "tests": 163 }
    },
    "criticalGaps": []
  },
  "packages": {
    "apps/web": {
      "sourceFiles": 150,
      "testFiles": 17,
      "testCases": 400,
      "coverage": { "line": 65, "branch": 55, "function": 70 }
    },
    "apps/e2e": {
      "sourceFiles": 0,
      "testFiles": 18,
      "testCases": 163,
      "testType": "e2e"
    },
    "packages/features/admin": {
      "sourceFiles": 25,
      "testFiles": 0,
      "testCases": 0,
      "priority": "P1",
      "riskScore": 95
    }
  },
  "testGaps": [],
  "priorityQueue": []
}
```

## 4. Test Discovery Agent Integration

### 4.1 Agent Delegation Pattern

```typescript
// When complex analysis is needed, delegate to specialized agent
interface TestDiscoveryAgentTask {
  command: 'full-analysis' | 'update-database' | 'generate-report' | 'find-gaps';
  options: {
    includeMetrics: boolean;
    analyzeComplexity: boolean;
    checkDependencies: boolean;
    generateRecommendations: boolean;
  };
  context: {
    recentChanges: string[];
    highChurnFiles: string[];
    criticalPackages: string[];
  };
}

// Trigger agent for deep analysis
async function delegateToTestDiscoveryAgent(task: TestDiscoveryAgentTask) {
  return await Task({
    subagent_type: 'test-discovery-expert',
    description: 'Analyze test coverage comprehensively',
    prompt: `
      Perform comprehensive test discovery analysis:
      1. Scan all test locations accurately (vitest & playwright configs)
      2. Count both test files AND individual test cases
      3. Map source files to their test files
      4. Calculate risk scores based on:
         - Business criticality (P1/P2/P3)
         - Recent changes (git history)
         - Code complexity
         - Dependency count
      5. Generate actionable recommendations
      6. Update test coverage database
      
      Context: ${JSON.stringify(task.context)}
      Options: ${JSON.stringify(task.options)}
    `
  });
}
```

## 5. Efficient Search Strategies

### 5.1 Parallel Discovery Pattern

```bash
# Run all discovery commands in parallel for speed
(
  echo "Starting parallel test discovery..." &
  
  # Vitest tests
  find apps/web packages -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | grep -v node_modules > /tmp/vitest-files.txt &
  
  # Playwright tests
  find apps/e2e/tests -name "*.spec.ts" -o -name "*.e2e.ts" > /tmp/playwright-files.txt &
  
  # Source files needing tests
  find apps/web packages/features -name "*.ts" -o -name "*.tsx" | grep -v -E "(test|spec|\.d\.ts)" > /tmp/source-files.txt &
  
  # Count test cases
  find . -name "*.test.*" -o -name "*.spec.*" | xargs grep -h "^\s*\(it\|test\)(" | wc -l > /tmp/test-count.txt &
  
  wait
  echo "Discovery complete!"
)

# Aggregate results
cat /tmp/vitest-files.txt /tmp/playwright-files.txt | wc -l
```

### 5.2 Smart Caching

```typescript
interface TestDiscoveryCache {
  timestamp: Date;
  ttl: number; // seconds
  data: {
    testFiles: string[];
    testCounts: Map<string, number>;
    sourceFiles: string[];
    coverageMap: Map<string, string[]>; // source -> test files
  };
}

// Cache discovery results for 1 hour
const CACHE_TTL = 3600;
const CACHE_PATH = '.claude/cache/test-discovery.json';
```

## 6. Priority Scoring Algorithm (Updated)

```typescript
function calculateTestPriority(file: string): number {
  let score = 0;
  
  // Business criticality based on package location (0-40 points)
  if (file.includes('packages/features/admin')) score += 40;
  else if (file.includes('packages/features/auth')) score += 35;
  else if (file.includes('packages/features/payments')) score += 35;
  else if (file.includes('ai/canvas') || file.includes('ai/storyboard')) score += 30;
  else if (file.includes('packages/features')) score += 20;
  else score += 10;
  
  // Recent changes (0-30 points)
  const recentlyChanged = getGitChangesInDays(file, 10);
  score += Math.min(30, recentlyChanged * 10);
  
  // High churn (0-20 points)
  const changeFrequency = getChangeFrequency(file, 30);
  score += Math.min(20, changeFrequency * 2);
  
  // Missing tests entirely (0-10 points)
  if (!hasAnyTests(file)) score += 10;
  
  return score; // Max 100 points
}
```

## Usage Examples

```bash
# Quick discovery with accurate counts
/test-discovery

# Deep analysis with agent
/test-discovery --delegate

# Focus on critical packages
/test-discovery --packages=admin,auth,payments

# Generate report for recently changed files
/test-discovery --recent --days=7 --report

# Update database only
/test-discovery --update --no-report
```

## Key Improvements

1. **Accurate Test Locations**: Aligned with vitest.config.ts and playwright.config.ts
2. **Individual Test Counting**: Counts actual test cases, not just files
3. **Test Mapping**: Maps source files to their test files
4. **Parallel Execution**: Runs discovery in parallel for speed
5. **Agent Integration**: Option to delegate complex analysis
6. **Smart Caching**: Caches results to avoid repeated scans
7. **Git-Aware Priority**: Uses git history for intelligent prioritization