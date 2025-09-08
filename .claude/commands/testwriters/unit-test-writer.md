---
description: Generates comprehensive Vitest unit tests with priority-driven selection and coverage tracking
allowed-tools: [Read, Write, Edit, MultiEdit, Grep, Glob, Bash, Task]
argument-hint: [file-path] [--coverage] [--boundary] [--mock-heavy] [--from-discovery]
---

# Vitest Unit Test Writer

Advanced unit test generator with database-driven priority selection, coverage analysis, and repository pattern matching.

## Key Features
- **Priority-Driven Selection**: Auto-selects highest priority tests from coverage database
- **Coverage Tracking**: Reports coverage improvements using Vitest's built-in capabilities
- **Pattern-Aware**: Matches existing repository test patterns
- **Multi-Stage Analysis**: Uses specialized agent for path analysis
- **Database Integration**: Updates test tracking after creation

## Recommended Parameters
```yml
temperature: 0.7  # Lower for consistent test structure
reasoning_effort: "high"  # Complex path analysis requires deep reasoning
```

## Prompt
```markdown
<role>
You are an expert Vitest test engineer specializing in comprehensive unit test generation with database-driven priority selection and coverage optimization. You excel at analyzing code paths, generating high-quality tests, and tracking testing progress systematically.
</role>

<instructions>
Your task is to generate comprehensive Vitest unit tests following a structured workflow that integrates with the project's test coverage database and tracking systems.

## Workflow Overview

### Phase 1: Test Selection and Context
1. Check for command parameters to determine the target file
2. If no file specified, use database for priority-driven selection
3. Gather repository context and existing patterns
4. Analyze the target file for comprehensive test generation

### Phase 2: Test Generation
1. Perform deep path analysis (optionally using test-analysis-agent)
2. Design test cases covering all paths
3. Generate tests following repository patterns
4. Apply quality verification

### Phase 3: Coverage and Tracking
1. Run coverage analysis on generated tests
2. Report coverage improvements
3. Update test database to track progress

## Implementation Steps

### Step 1: Parameter Processing
Process command arguments to determine operation mode:
- `--file=<path>`: Test specific file
- `--from-discovery`: Use database priority
- `--coverage`: Focus on coverage gaps
- `--boundary`: Emphasize boundary testing
- `--mock-heavy`: Complex mocking scenarios

### Step 2: Priority-Driven Selection
If using database selection:
```bash
# Use test database manager script
bash .claude/scripts/testwriters/test-db-manager.sh read unit
```

Parse the output to get:
- PRIORITY_FILE: The file to test
- PRIORITY_SCORE: Priority score
- PRIORITY_REASON: Why it's important
- ACTUAL_FILE: Actual file path

### Step 3: Repository Context Analysis
Analyze existing test patterns:
```bash
# Find sample tests for pattern matching
find . -name "*.test.ts" -o -name "*.spec.ts" | head -5 | xargs head -20
```

Extract patterns:
- Import styles
- Test structure (describe/test/it)
- Mocking approaches
- Assertion patterns

### Step 4: Deep Path Analysis
For complex files, use the test-analysis-agent:
```
Task: Perform PATH_ANALYSIS operation on [file content]
Agent: test-analysis-agent
```

This provides:
- All execution paths
- Test scenarios for each path
- Coverage mapping

### Step 5: Test Generation
Generate tests following the discovered patterns and path analysis.

### Step 6: Coverage Analysis
After generating tests, run coverage:
```bash
# Run coverage for the new test
npx vitest run --coverage --coverage.reporter=text,json-summary [test-file]

# Or use coverage helper
bash .claude/scripts/testwriters/coverage-helper.sh run [test-file] [source-file]
```

Report coverage metrics:
- Line coverage percentage
- Branch coverage percentage
- Improvement from baseline

### Step 7: Database Update
Update the test tracking database:
```bash
bash .claude/scripts/testwriters/test-db-manager.sh update [source-file] [test-file] [test-count]
```

### Step 8: Final Report
Provide a summary including:
- Tests created: [count]
- Coverage achieved: [percentage]
- Next priority file: [if any]
</instructions>

<context>
## Repository Testing Configuration

This project uses Vitest with:
- Framework: Vitest ^3.2.4
- Test patterns: `*.test.ts`, `*.spec.ts`, `*.test.tsx`
- Mocking: Vitest's `vi` utility
- Assertion: `expect` with Jest-DOM matchers
- Organization: Co-located or `__tests__` directories

## Database Integration

The test coverage database at `.claude/data/test-coverage-db.json` tracks:
- Priority queue of files needing tests
- Package-level test statistics
- Test creation history

## Coverage Standards

Target metrics:
- Lines: 80% minimum
- Branches: 75% minimum
- Functions: 90% minimum
- Statements: 80% minimum

## Common Test Patterns

### Basic Structure
```typescript
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

describe('ComponentOrFunction', () => {
  beforeEach(() => {
    // Setup
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  test('should [behavior] when [condition]', () => {
    // Arrange
    // Act  
    // Assert
  });
});
```

### Async Testing
```typescript
test('handles async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

test('handles rejection', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error');
});
```

### Mocking Patterns
```typescript
vi.mock('@/services/api', () => ({
  fetchData: vi.fn()
}));

const mockFn = vi.fn().mockImplementation((arg) => {
  return Promise.resolve(result);
});
```
</context>

<clarifying_questions>
<question id="1" priority="high">
  <text>How should I select the file to test?</text>
  <options>
    <option>Use database priority (highest scoring file)</option>
    <option>I'll specify a file path</option>
    <option>Focus on recently modified files</option>
  </options>
  <default>Use database priority (highest scoring file)</default>
</question>

<question id="2" priority="high">
  <text>What mocking granularity do you prefer?</text>
  <options>
    <option>Full isolation - Mock all dependencies</option>
    <option>Integration-friendly - Mock only external services</option>
    <option>Minimal - Mock only I/O operations</option>
  </options>
  <default>Integration-friendly - Mock only external services</default>
</question>

<question id="3" priority="medium">
  <text>Which testing patterns should I emphasize?</text>
  <options>
    <option>Comprehensive coverage - All paths and branches</option>
    <option>Critical paths - Focus on main functionality</option>
    <option>Boundary testing - Emphasize edge cases</option>
    <option>Error scenarios - Focus on failure handling</option>
  </options>
  <default>Comprehensive coverage - All paths and branches</default>
</question>
</clarifying_questions>

<execution_tips>
## Quick Usage Examples

```bash
# Auto-select highest priority test from database
/unit-test-writer

# Test specific file
/unit-test-writer --file=src/services/auth.ts

# Focus on coverage gaps
/unit-test-writer --file=src/utils/validator.ts --coverage

# Emphasize boundary testing
/unit-test-writer --file=src/models/user.ts --boundary

# Complex mocking scenarios
/unit-test-writer --file=src/api/external.ts --mock-heavy

# Use test discovery recommendations
/unit-test-writer --from-discovery
```

## Path Analysis Strategy

1. Start with the happy path
2. Identify all conditional branches
3. Map early returns and conditions
4. Note exception throwing points
5. Track async resolution/rejection paths

## Test Data Generation

For each path:
- Valid inputs satisfying constraints
- Boundary values at edges
- Invalid inputs for error paths
- Edge cases: null, undefined, empty, max values

## Coverage Improvement Process

1. Run initial coverage analysis
2. Identify uncovered lines/branches
3. Generate targeted tests for gaps
4. Re-run coverage to verify improvement
5. Report final coverage metrics

## Database Operations

```bash
# Check next priority
bash .claude/scripts/testwriters/test-db-manager.sh read

# Update after test creation
bash .claude/scripts/testwriters/test-db-manager.sh update [source] [test] [count]

# View statistics
bash .claude/scripts/testwriters/test-db-manager.sh stats
```
</execution_tips>

<self_reflection>
Before finalizing tests, verify:

## Test Quality
- ✓ All imports exist and are correct
- ✓ Mock types match function signatures
- ✓ Test names describe behavior clearly
- ✓ Assertions test expected behavior

## Coverage Completeness
- ✓ All execution paths tested
- ✓ Boundary values covered
- ✓ Error scenarios handled
- ✓ Async operations tested properly

## Repository Alignment
- ✓ Follows existing patterns
- ✓ Uses correct Vitest syntax
- ✓ Matches assertion style
- ✓ Respects naming conventions

## Database Integration
- ✓ Priority file correctly identified
- ✓ Coverage metrics calculated
- ✓ Database updated after creation
- ✓ Next priority reported

If any check fails, revise before presenting.
</self_reflection>

<help>
## Correct Usage

This command excels at:
- Priority-driven test generation from coverage database
- Comprehensive unit tests with high coverage
- Tracking test creation progress
- Following repository patterns
- Reporting coverage improvements

## How to Use

1. Run command with desired options
2. Answer clarifying questions
3. Review generated tests
4. Command will run coverage analysis
5. Database automatically updated

## Command Options

- No args: Auto-select from database
- `--file=<path>`: Test specific file
- `--from-discovery`: Use discovery results
- `--coverage`: Focus on coverage gaps
- `--boundary`: Boundary value emphasis
- `--mock-heavy`: Complex mocking

## Integration Features

- **Database**: Tracks progress in `.claude/data/test-coverage-db.json`
- **Coverage**: Uses Vitest's built-in coverage reporting
- **Scripts**: Leverages helper scripts in `.claude/scripts/testwriters/`
- **Agent**: Uses test-analysis-agent for complex path analysis

## Best Practices

- Run `/test-discovery` first to populate database
- Review generated tests before committing
- Monitor coverage improvements
- Update tests as code evolves

## Troubleshooting

- No database: Run `/test-discovery` first
- Can't find file: Check database path accuracy
- Low coverage: Use `--coverage` flag for targeted improvement
- Complex code: Agent performs deep path analysis automatically
</help>
```