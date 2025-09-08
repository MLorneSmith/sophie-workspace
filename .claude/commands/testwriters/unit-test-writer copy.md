Coverage improvement reporting back to the user# Unit Test Writer Agent

Usage: `/unit-test-writer [options]`

This specialized agent writes comprehensive unit tests using coverage-guided iterative prompting and advanced LLM techniques to ensure high-quality, maintainable tests.

## Quick Usage

```bash
/unit-test-writer                                  # Auto-select highest priority unit test from database
/unit-test-writer --file=path/to/file.ts          # Write unit tests for specific file
/unit-test-writer --coverage                       # Focus on uncovered lines
/unit-test-writer --boundary                       # Emphasize boundary value testing
/unit-test-writer --mock-heavy                     # Complex mocking scenarios
/unit-test-writer --from-discovery                 # Use test-discovery recommendations
/unit-test-writer --package=admin                  # Write tests for entire package
```

## 0. Priority-Driven Test Selection (NEW)

### 0.1 Read Test Coverage Database

```bash
# Find the project root and database path
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
DB_PATH="$PROJECT_ROOT/.claude/data/test-coverage-db.json"

# Read the test coverage database to identify highest priority unit tests
if [ -f "$DB_PATH" ]; then
  echo "🔍 Reading test coverage database from: $DB_PATH"
  
  # Extract highest priority unit test from database
  PRIORITY_FILE=$(jq -r '.priorityQueue[] | select(.testType == "unit") | .file' "$DB_PATH" | head -1)
  PRIORITY_SCORE=$(jq -r '.priorityQueue[] | select(.testType == "unit") | .score' "$DB_PATH" | head -1)
  PRIORITY_REASON=$(jq -r '.priorityQueue[] | select(.testType == "unit") | .reason' "$DB_PATH" | head -1)
  SUGGESTED_TESTS=$(jq -r '.priorityQueue[] | select(.testType == "unit") | .suggestedTests[]' "$DB_PATH" | head -5)
  
  echo "📊 Highest Priority Unit Test:"
  echo "   File: $PRIORITY_FILE"
  echo "   Score: $PRIORITY_SCORE/100"
  echo "   Reason: $PRIORITY_REASON"
  echo "   Suggested Tests:"
  echo "$SUGGESTED_TESTS" | while read test; do echo "     - $test"; done
  
  # Determine the actual file location
  if [ -f "$PROJECT_ROOT/$PRIORITY_FILE" ]; then
    ACTUAL_FILE="$PROJECT_ROOT/$PRIORITY_FILE"
  else
    # Try to find the file if path is incorrect
    FILENAME=$(basename "$PRIORITY_FILE")
    ACTUAL_FILE=$(find "$PROJECT_ROOT" -name "$FILENAME" -type f 2>/dev/null | head -1)
    if [ -n "$ACTUAL_FILE" ]; then
      echo "   📍 Found file at: $ACTUAL_FILE"
    fi
  fi
else
  echo "⚠️  No test coverage database found at: $DB_PATH"
  echo "   Run /test-discovery first to generate the database."
fi
```

### 0.2 Auto-Selection Logic

```typescript
interface TestPriority {
  file: string;
  package: string;
  testType: 'unit' | 'integration' | 'e2e';
  score: number;
  reason: string;
  suggestedTests: string[];
  context?: {
    recentlyModified: boolean;
    securityCritical: boolean;
    highChurn: boolean;
    dependencies: string[];
  };
}

async function selectNextUnitTest(): Promise<TestPriority | null> {
  // Read test coverage database
  const dbPath = '.claude/data/test-coverage-db.json';
  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  No test coverage database. Run /test-discovery first.');
    return null;
  }
  
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  
  // Filter for unit tests only
  const unitTests = db.priorityQueue.filter(item => item.testType === 'unit');
  
  if (unitTests.length === 0) {
    console.log('✅ All priority unit tests completed!');
    return null;
  }
  
  // Return highest priority
  const priority = unitTests[0];
  console.log(`🎯 Selected: ${priority.file} (Score: ${priority.score}/100)`);
  console.log(`📝 Reason: ${priority.reason}`);
  
  return priority;
}
```

### 0.3 Test Execution Guidance

```bash
# Determine how to run the test based on package structure
determine_test_command() {
  local test_file="$1"
  local PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
  
  echo "🧪 Determining test execution strategy..."
  
  # Check if file is in a package with its own package.json
  local package_dir=$(dirname "$test_file")
  while [ "$package_dir" != "$PROJECT_ROOT" ] && [ "$package_dir" != "/" ]; do
    if [ -f "$package_dir/package.json" ]; then
      echo "   ✅ Found package.json in: $package_dir"
      echo "   Run: cd $package_dir && pnpm test"
      return 0
    fi
    package_dir=$(dirname "$package_dir")
  done
  
  # Check for workspace test commands
  if [ -f "$PROJECT_ROOT/package.json" ]; then
    # Try to determine package name for filter
    local package_name=$(echo "$test_file" | grep -oE "packages/[^/]+/[^/]+" | cut -d'/' -f3)
    if [ -n "$package_name" ]; then
      echo "   📦 Package: $package_name"
      echo "   Run: pnpm --filter $package_name test"
      echo "   Or: pnpm vitest run $test_file"
    else
      echo "   Run from project root: pnpm vitest run $test_file"
    fi
  fi
  
  # Provide alternative commands
  echo ""
  echo "   Alternative test commands:"
  echo "   - Direct vitest: npx vitest run $test_file"
  echo "   - Watch mode: npx vitest watch $test_file"
  echo "   - With coverage: npx vitest run --coverage $test_file"
}
```

### 0.4 Database Update After Test Creation

```bash
# After successfully creating tests, update the database
update_test_database() {
  local file="$1"
  local test_file="$2"
  local test_count="$3"
  
  # Use absolute path to database
  local PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
  local DB_PATH="$PROJECT_ROOT/.claude/data/test-coverage-db.json"
  
  if [ -f "$DB_PATH" ]; then
    # Remove from priority queue
    jq --arg file "$file" '.priorityQueue = [.priorityQueue[] | select(.file != $file)]' \
      "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
    
    # Update package stats
    local package=$(dirname "$file" | sed 's|.*/packages/features/||' | cut -d'/' -f1)
    jq --arg pkg "$package" --arg testFile "$test_file" --argjson count "$test_count" \
      '.packages[$pkg].testFiles += 1 | .packages[$pkg].testCases += $count' \
      "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
    
    # Update timestamp
    jq --arg updated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '.lastUpdated = $updated' \
      "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
    
    echo "✅ Updated test coverage database"
    echo "   Removed $file from priority queue"
    echo "   Added $test_count tests to $package package"
    
    # Show next priority
    local NEXT_FILE=$(jq -r '.priorityQueue[] | select(.testType == "unit") | .file' "$DB_PATH" | head -1)
    if [ -n "$NEXT_FILE" ]; then
      echo "   📌 Next priority: $NEXT_FILE"
    else
      echo "   🎉 All priority unit tests completed!"
    fi
  fi
}
```

## 1. Repository Context Analysis

### 1.1 Pattern Detection

```bash
# Analyze existing test patterns
echo "Analyzing existing unit test patterns..."

# Find sample unit tests for pattern matching
find apps/web/src -name "*.test.ts" -o -name "*.spec.ts" | head -5 | while read file; do
  echo "Sample test pattern from: $file"
  head -50 "$file"
done

# Detect testing framework
grep -h "import.*from.*vitest\|jest\|mocha" apps/web/src/**/*.test.ts 2>/dev/null | head -5

# Detect common testing utilities
grep -h "import.*test-utils\|test-helpers\|testing-library" apps/web/src/**/*.test.ts 2>/dev/null | head -5
```

### 1.2 Repository Context Extraction

```typescript
interface RepositoryContext {
  testingFramework: 'vitest' | 'jest' | 'mocha';
  mockingLibrary: 'vitest' | 'jest' | 'sinon';
  testFilePattern: string; // e.g., "*.test.ts" or "*.spec.ts"
  testLocation: 'colocated' | 'separate'; // same dir or __tests__ dir
  commonImports: string[];
  testUtilities: string[];
  namingConventions: {
    describe: string; // e.g., "ClassName" or "path/to/file"
    test: string; // e.g., "should..." or "test that..."
  };
  assertionStyle: 'expect' | 'assert' | 'should';
}

async function extractRepositoryContext(): Promise<RepositoryContext> {
  // Analyze existing tests to understand patterns
  const existingTests = await findExistingTests();
  const context = await analyzeTestPatterns(existingTests);
  
  return {
    testingFramework: detectFramework(existingTests),
    mockingLibrary: detectMockingLibrary(existingTests),
    testFilePattern: detectFilePattern(existingTests),
    testLocation: detectTestLocation(existingTests),
    commonImports: extractCommonImports(existingTests),
    testUtilities: findTestUtilities(existingTests),
    namingConventions: extractNamingPatterns(existingTests),
    assertionStyle: detectAssertionStyle(existingTests)
  };
}
```

## 2. Multi-Stage Path Constraint Analysis (SymPrompt)

### 2.1 Stage 1: Path Analysis Prompt

```
STAGE 1 - PATH ANALYSIS PROMPT:
You are analyzing code for comprehensive unit testing. Identify ALL execution paths.

CODE TO ANALYZE:
[CODE_BLOCK]

ANALYSIS REQUIRED:
1. List all conditional branches (if/else, switch, ternary)
2. Identify all loop conditions and exit points
3. Note all early returns and their conditions
4. Identify all exception throwing points
5. Map all async operations and their resolution/rejection paths

OUTPUT FORMAT:
Path 1: [entry] -> [condition1:true] -> [operation] -> [return]
  Constraints: param1 > 0, param2 !== null
  Coverage: Lines 5-10
  
Path 2: [entry] -> [condition1:false] -> [throw Error]
  Constraints: param1 <= 0
  Coverage: Lines 5, 11-12

[Continue for all paths...]
```

### 2.2 Stage 2: Test Input Generation

```
STAGE 2 - TEST INPUT GENERATION PROMPT:
Based on the path analysis, generate specific test inputs.

PATH CONSTRAINTS FROM STAGE 1:
[PATH_ANALYSIS_RESULTS]

For each path, generate:
1. Valid inputs that satisfy the constraints
2. Boundary values at constraint edges
3. Invalid inputs that should trigger error paths
4. Edge cases (null, undefined, empty, max values)

OUTPUT FORMAT:
Path 1 Test Inputs:
- Normal case: { param1: 10, param2: "test" }
- Boundary min: { param1: 1, param2: "" }
- Boundary max: { param1: Number.MAX_SAFE_INTEGER, param2: "a".repeat(1000) }

Path 2 Test Inputs:
- Trigger condition: { param1: 0, param2: null }
- Below boundary: { param1: -1, param2: undefined }
```

### 2.3 Stage 3: Test Implementation

```
STAGE 3 - TEST IMPLEMENTATION PROMPT:
Using repository context and test inputs, generate comprehensive unit tests.

REPOSITORY CONTEXT:
Testing Framework: [FRAMEWORK]
Mocking Library: [MOCK_LIB]
File Pattern: [PATTERN]
Common Imports: [IMPORTS]
Test Utilities: [UTILITIES]

TEST INPUTS FROM STAGE 2:
[TEST_INPUTS]

EXISTING TEST PATTERNS:
[SAMPLE_TESTS]

REQUIREMENTS:
✅ Follow AAA pattern (Arrange-Act-Assert) with clear comments
✅ Use descriptive test names: test_[method]_[scenario]_[expected]
✅ Mock all external dependencies
✅ Include boundary value tests
✅ Test error conditions with proper error matching
✅ Use existing test utilities and helpers
✅ Match repository's assertion style

COVERAGE TARGETS:
- All paths from Stage 1 must be tested
- Each test should cover exactly one path
- Include tests for concurrent/async scenarios
```

## 3. Chain of Verification (CoVe) Implementation

### 3.1 Initial Test Generation

```typescript
// Generate initial tests using multi-stage prompting
async function generateInitialTests(code: string, context: RepositoryContext) {
  // Stage 1: Path Analysis
  const paths = await analyzeExecutionPaths(code);
  
  // Stage 2: Input Generation
  const testInputs = await generateTestInputs(paths);
  
  // Stage 3: Test Implementation
  const initialTests = await implementTests(testInputs, context);
  
  return initialTests;
}
```

### 3.2 Verification Questions

```
VERIFICATION PROMPT:
Review the generated tests and answer these verification questions:

GENERATED TESTS:
[INITIAL_TESTS]

VERIFICATION CHECKLIST:
1. ✓/✗ Do all imported modules/functions actually exist in the codebase?
2. ✓/✗ Are the mock return types consistent with actual function signatures?
3. ✓/✗ Does each test name accurately describe what's being tested?
4. ✓/✗ Are all execution paths from the analysis covered?
5. ✓/✗ Do the assertions match the actual expected behavior?
6. ✓/✗ Are boundary values properly tested?
7. ✓/✗ Is the mocking strategy appropriate (not over-mocked)?
8. ✓/✗ Do async tests properly handle promises/callbacks?
9. ✓/✗ Are error messages and types correctly matched?
10. ✓/✗ Is the test isolated and doesn't depend on execution order?

For each ✗, explain the issue and how to fix it.
```

### 3.3 Test Refinement

```
REFINEMENT PROMPT:
Based on verification issues, generate corrected tests.

VERIFICATION ISSUES:
[ISSUES_FROM_STAGE_2]

CORRECTIONS NEEDED:
[SPECIFIC_FIXES]

Generate refined tests that address all verification issues while maintaining:
- Complete path coverage
- Proper mocking strategies
- Correct assertions
- Repository patterns and conventions
```

## 4. Coverage-Guided Iterative Improvement

### 4.1 Coverage Analysis Integration

```typescript
async function analyzeCoverageGaps(file: string, existingTests?: string) {
  // Run coverage analysis
  const coverageResult = await runCoverage(file, existingTests);
  
  // Identify uncovered lines
  const uncoveredLines = extractUncoveredLines(coverageResult);
  const uncoveredBranches = extractUncoveredBranches(coverageResult);
  
  return {
    uncoveredLines,
    uncoveredBranches,
    coveragePercentage: coverageResult.percentage,
    suggestions: generateCoverageSuggestions(uncoveredLines, uncoveredBranches)
  };
}
```

### 4.2 Iterative Coverage Improvement

```
COVERAGE-GUIDED PROMPT:
Current coverage is [PERCENTAGE]%. Generate additional tests for uncovered code.

UNCOVERED LINES:
[LINES_WITH_MARKERS]

UNCOVERED BRANCHES:
[BRANCH_CONDITIONS]

EXISTING TESTS:
[CURRENT_TESTS]

Focus on:
1. Lines [SPECIFIC_LINES] which handle error conditions
2. Branch condition at line [LINE]: [CONDITION] - needs false case
3. Async rejection path at line [LINE] - not tested

Generate ONLY the additional tests needed to cover these gaps.
Avoid duplicating existing test scenarios.
```

## 5. Advanced Testing Patterns

### 5.1 Boundary Value Testing

```
BOUNDARY VALUE PROMPT:
Generate comprehensive boundary value tests.

FUNCTION SIGNATURE:
[FUNCTION_WITH_PARAMETERS]

BOUNDARY ANALYSIS:
For each parameter, test:
- Type boundaries (min/max for numbers, empty/max length for strings)
- Null/undefined handling
- Empty collections vs single item vs many items
- Date boundaries (past/present/future)
- Special values (0, -1, NaN, Infinity for numbers)

BOUNDARY TEST TEMPLATE:
describe('Boundary Value Tests', () => {
  test.each([
    ['minimum value', MIN_VALUE, EXPECTED],
    ['just above minimum', MIN_VALUE + 1, EXPECTED],
    ['just below maximum', MAX_VALUE - 1, EXPECTED],
    ['maximum value', MAX_VALUE, EXPECTED],
    ['below minimum', MIN_VALUE - 1, ERROR],
    ['above maximum', MAX_VALUE + 1, ERROR],
    ['null input', null, ERROR],
    ['undefined input', undefined, ERROR],
  ])('handles %s', (scenario, input, expected) => {
    // Test implementation
  });
});
```

### 5.2 Mocking Strategy Patterns

```
MOCKING STRATEGY PROMPT:
Generate tests with appropriate mocking strategies.

CODE TO TEST:
[CODE_BLOCK]

DEPENDENCIES IDENTIFIED:
- External API: [API_MODULE]
- Database: [DB_MODULE]
- File System: [FS_MODULE]
- Time-based: [DATE/TIMER]

MOCKING RULES:
1. Mock at system boundaries only
2. Use actual implementations for pure functions
3. Mock external I/O operations
4. Control time for deterministic tests
5. Verify mock interactions when behavior matters

MOCK IMPLEMENTATION PATTERNS:
// API Mock
vi.mock('@/services/api', () => ({
  fetchData: vi.fn()
}));

// Database Mock with behavior
const mockDb = {
  query: vi.fn().mockImplementation((sql) => {
    if (sql.includes('SELECT')) return Promise.resolve([{id: 1}]);
    if (sql.includes('INSERT')) return Promise.resolve({insertId: 1});
    return Promise.reject(new Error('DB Error'));
  })
};

// Time control
vi.useFakeTimers();
vi.setSystemTime(new Date('2025-01-06'));
```

### 5.3 Error Scenario Testing

```
ERROR TESTING PROMPT:
Generate comprehensive error handling tests.

ERROR SCENARIOS TO COVER:
1. Invalid input validation
2. External service failures
3. Timeout scenarios
4. Resource exhaustion
5. Permission/authorization errors
6. Network failures
7. Concurrent access issues

ERROR TEST PATTERNS:
// Input validation
test('throws ValueError for invalid email format', () => {
  expect(() => validateEmail('invalid')).toThrow(ValueError);
  expect(() => validateEmail('invalid')).toThrow('Invalid email format');
});

// External service failure with retry
test('retries on temporary service failure', async () => {
  const mockApi = vi.fn()
    .mockRejectedValueOnce(new Error('Service Unavailable'))
    .mockResolvedValueOnce({ data: 'success' });
    
  const result = await serviceWithRetry(mockApi);
  
  expect(mockApi).toHaveBeenCalledTimes(2);
  expect(result).toEqual({ data: 'success' });
});

// Timeout handling
test('handles operation timeout', async () => {
  const slowOperation = vi.fn(() => new Promise(resolve => 
    setTimeout(resolve, 5000)
  ));
  
  await expect(
    withTimeout(slowOperation(), 1000)
  ).rejects.toThrow('Operation timed out');
});
```

## 6. Template-Driven Test Generation

### 6.1 Project-Specific Template

```typescript
const TEST_TEMPLATE = `
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { [IMPORTS] } from '[SOURCE_PATH]';
[MOCK_IMPORTS]

[MOCK_SETUP]

describe('[DESCRIBE_BLOCK]', () => {
  let [VARIABLES];
  
  beforeEach(() => {
    [SETUP_CODE]
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('[METHOD_NAME]', () => {
    test('should [BEHAVIOR] when [CONDITION]', async () => {
      // Arrange
      [ARRANGE_CODE]
      
      // Act
      [ACT_CODE]
      
      // Assert
      [ASSERT_CODE]
    });
    
    test('should throw [ERROR] when [ERROR_CONDITION]', async () => {
      // Arrange
      [ERROR_ARRANGE]
      
      // Act & Assert
      await expect([ERROR_ACT]).rejects.toThrow([ERROR_TYPE]);
    });
  });
});
`;
```

### 6.2 Dynamic Template Population

```typescript
function populateTemplate(template: string, context: TestContext): string {
  return template
    .replace('[IMPORTS]', context.imports.join(', '))
    .replace('[SOURCE_PATH]', context.sourcePath)
    .replace('[MOCK_IMPORTS]', generateMockImports(context))
    .replace('[MOCK_SETUP]', generateMockSetup(context))
    .replace('[DESCRIBE_BLOCK]', context.describeBlock)
    .replace('[METHOD_NAME]', context.methodName)
    .replace('[BEHAVIOR]', context.expectedBehavior)
    .replace('[CONDITION]', context.testCondition)
    // ... continue for all placeholders
}
```

## 7. Hallucination Prevention

### 7.1 Explicit Grounding

```
GROUNDING PROMPT:
Generate tests using ONLY verified information.

SOURCE CODE:
[ACTUAL_CODE]

VERIFIED IMPORTS:
[CONFIRMED_IMPORTS]

VERIFIED TYPES:
[TYPE_DEFINITIONS]

CONSTRAINTS:
❌ DO NOT invent methods not shown in source code
❌ DO NOT assume return types not explicitly defined
❌ DO NOT create mock data that violates type definitions
❌ DO NOT reference non-existent test utilities

✅ ONLY use methods visible in provided code
✅ ONLY mock dependencies shown in imports
✅ ASK for clarification if types are ambiguous
✅ USE 'unknown' type if type cannot be determined

If information is missing, output:
"NEED CLARIFICATION: [specific information needed]"
```

### 7.2 Type-Safe Test Generation

```typescript
interface TypeSafeTestGeneration {
  sourceTypes: Map<string, TypeDefinition>;
  mockTypes: Map<string, TypeDefinition>;
  returnTypes: Map<string, TypeDefinition>;
}

async function generateTypeSafeTests(
  code: string,
  types: TypeSafeTestGeneration
): Promise<string> {
  // Validate all function calls against known types
  // Ensure mock return values match expected types
  // Verify assertion values are type-compatible
  
  return generateTestsWithTypeValidation(code, types);
}
```

## 8. Interactive Refinement

### 8.1 Clarification Protocol

```
CLARIFICATION PROMPT:
Before generating tests, I need to understand your testing requirements.

QUESTIONS:
1. What testing framework should I use? (detected: [DETECTED_FRAMEWORK])
2. Are there existing test utilities I should use? (found: [UTILITIES])
3. What level of mocking is appropriate?
   - Full isolation (mock everything)
   - Integration-friendly (mock only external services)
   - Minimal mocking (only mock I/O)
4. Are there specific edge cases or business rules to test?
5. Should I follow a specific test organization pattern?

Please provide answers or confirm the detected defaults.
```

### 8.2 Iterative Improvement

```typescript
async function iterativeTestRefinement(
  initialTests: string,
  feedback: string
): Promise<string> {
  const prompt = `
CURRENT TESTS:
${initialTests}

FEEDBACK:
${feedback}

REFINEMENT REQUIRED:
Based on the feedback, improve the tests by:
1. Addressing specific issues mentioned
2. Maintaining existing correct patterns
3. Improving test descriptions if unclear
4. Adjusting mocking strategy if needed
5. Adding missing test cases

Generate the refined version:
`;

  return await generateRefinedTests(prompt);
}
```

## 9. Command Workflow & Troubleshooting

### 9.1 Complete Workflow Example

```bash
# Step 1: Identify priority test
PROJECT_ROOT=$(git rev-parse --show-toplevel)
DB_PATH="$PROJECT_ROOT/.claude/data/test-coverage-db.json"
PRIORITY_FILE=$(jq -r '.priorityQueue[] | select(.testType == "unit") | .file' "$DB_PATH" | head -1)

# Step 2: Find actual file location
ACTUAL_FILE=$(find "$PROJECT_ROOT" -path "*$PRIORITY_FILE" -o -name "$(basename $PRIORITY_FILE)" | head -1)
echo "📍 Testing file: $ACTUAL_FILE"

# Step 3: Create test file
TEST_FILE="${ACTUAL_FILE%.ts}.test.ts"
echo "✍️  Creating test: $TEST_FILE"

# Step 4: Write tests (your generated content here)
# ... test generation ...

# Step 5: Determine test execution
if [ -f "$(dirname $TEST_FILE)/package.json" ]; then
  echo "Run: cd $(dirname $TEST_FILE) && pnpm test"
else
  echo "Run: pnpm vitest run $TEST_FILE"
fi

# Step 6: Update database
update_test_database "$PRIORITY_FILE" "$TEST_FILE" 40
```

### 9.2 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Can't find test-coverage-db.json | Use absolute path: `$PROJECT_ROOT/.claude/data/test-coverage-db.json` |
| Test file path incorrect in database | Use `find` to locate actual file: `find $PROJECT_ROOT -name "filename.ts"` |
| Don't know how to run tests | Check for package.json in parent dirs, use `pnpm vitest run` as fallback |
| Package has no test script | Run directly: `npx vitest run path/to/test.test.ts` |
| Tests created in wrong location | Place test next to source file: `${SOURCE_FILE%.ts}.test.ts` |

### 9.3 Quick Reference Commands

```bash
# Find project root
PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Database location
DB_PATH="$PROJECT_ROOT/.claude/data/test-coverage-db.json"

# Check next priority
jq -r '.priorityQueue[0] | "\(.file) (Score: \(.score))"' "$DB_PATH"

# Run specific test file
pnpm vitest run path/to/file.test.ts

# Run tests for a package
pnpm --filter package-name test

# Update database after test creation
jq '.packages["package-name"].testFiles += 1' "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
```

## 9.4 Execution Flow

```typescript
async function executeUnitTestWriter(options: Options) {
  // 1. Extract repository context
  const context = await extractRepositoryContext();
  
  // 2. Load source file
  const sourceCode = await readFile(options.file);
  
  // 3. Multi-stage path analysis
  const paths = await analyzeExecutionPaths(sourceCode);
  const testInputs = await generateTestInputs(paths);
  
  // 4. Generate initial tests
  const initialTests = await generateInitialTests(
    sourceCode,
    context,
    testInputs
  );
  
  // 5. Chain of Verification
  const verificationResults = await verifyTests(initialTests);
  const refinedTests = await refineTests(initialTests, verificationResults);
  
  // 6. Coverage analysis
  const coverage = await analyzeCoverage(refinedTests);
  
  // 7. Iterative improvement
  if (coverage.percentage < 80) {
    const additionalTests = await generateCoverageTests(
      sourceCode,
      coverage.gaps
    );
    refinedTests = mergeTests(refinedTests, additionalTests);
  }
  
  // 8. Write test file
  const testPath = getTestFilePath(options.file, context);
  await writeFile(testPath, refinedTests);
  
  // 9. Verify compilation
  await runTypeCheck(testPath);
  
  // 10. Update tracking
  await updateTestDatabase(options.file, 'unit', testPath);
}
```

## Usage Examples

```bash
# Basic usage
/unit-test-writer --file=services/payment.ts

# Coverage-focused
/unit-test-writer --file=utils/validator.ts --coverage

# Boundary testing emphasis
/unit-test-writer --file=models/user.ts --boundary

# Complex mocking scenario
/unit-test-writer --file=api/external-service.ts --mock-heavy

# From test discovery
/unit-test-writer --from-discovery

# Interactive mode
/unit-test-writer --file=core/engine.ts --interactive
```

## Key Features

- **Multi-stage path analysis** for comprehensive coverage
- **Chain of Verification** to prevent hallucinations
- **Repository-aware** context matching existing patterns
- **Coverage-guided** iterative improvement
- **Type-safe** test generation with validation
- **Template-driven** consistency across tests
- **Boundary value** testing emphasis
- **Smart mocking** strategies
- **Error scenario** comprehensive coverage
- **Interactive refinement** for complex cases