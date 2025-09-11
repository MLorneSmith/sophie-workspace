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
- **Context-Driven**: Loads project-specific Vitest patterns and guidelines

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
3. Load project-specific Vitest context and guidelines
4. Gather repository context and existing patterns
5. Analyze the target file for comprehensive test generation

### Phase 2: Test Generation
1. Perform deep path analysis (optionally using test-analysis-agent)
2. Design test cases covering all paths
3. Generate tests following repository patterns and loaded context
4. Apply quality verification

### Phase 3: Coverage and Tracking
1. Run coverage analysis on generated tests
2. Report coverage improvements
3. Update test database to track progress

## Implementation Steps

### Step 0: Ensure Correct Working Directory
CRITICAL: All paths in this command are relative to the project root. Always start by ensuring you're in the correct directory:
```bash
# Navigate to project root - this is REQUIRED for all subsequent commands
cd $(git rev-parse --show-toplevel) 2>/dev/null || cd /home/msmith/projects/2025slideheroes
```

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
# IMPORTANT: Always navigate to project root first to ensure scripts work
cd $(git rev-parse --show-toplevel) 2>/dev/null || cd /home/msmith/projects/2025slideheroes

# Use test database manager script (from project root)
bash .claude/scripts/testwriters/test-db-manager.sh read unit
```

Parse the output to get:
- PRIORITY_FILE: The file to test
- PRIORITY_SCORE: Priority score
- PRIORITY_REASON: Why it's important
- ACTUAL_FILE: Actual file path

### Step 3: Load Vitest Context and Guidelines
Load the project-specific Vitest testing context:
```
# Read the Vitest context file for patterns and best practices
Read: .claude/context/tools/vitest-unit-testing.md
```

Extract from the context:
- Testing infrastructure (utilities, helpers, custom matchers)
- Project-specific patterns and conventions
- Mocking strategies and approaches
- Coverage requirements and standards
- Common test patterns for this codebase
- Test structure templates
- Helper functions and utilities

### Step 4: Repository Context Analysis
Analyze existing test patterns:
```bash
# Find sample tests for pattern matching
find . -name "*.test.ts" -o -name "*.spec.ts" | head -5 | xargs head -20
```

Combine with loaded context to validate:
- Consistency with project patterns
- Proper use of testing utilities
- Alignment with established conventions

### Step 5: Deep Path Analysis
For complex files, use the test-analysis-agent:
```
Task: Perform PATH_ANALYSIS operation on [file content]
Agent: test-analysis-agent
```

This provides:
- All execution paths
- Test scenarios for each path
- Coverage mapping

### Step 6: Test Generation
Generate tests by:
1. Applying patterns from the loaded Vitest context
2. Using project-specific test helpers and utilities
3. Following established mocking strategies
4. Implementing proper test structure (AAA pattern)
5. Leveraging enhanceAction patterns for server actions
6. Using appropriate mock types (vi.mock, vi.fn, vi.spyOn)

### Step 7: Coverage Analysis
After generating tests, run coverage:
```bash
# Ensure we're in project root
cd $(git rev-parse --show-toplevel) 2>/dev/null || cd /home/msmith/projects/2025slideheroes

# Run coverage for the new test
npx vitest run --coverage --coverage.reporter=text,json-summary [test-file]

# Or use coverage helper (from project root)
bash .claude/scripts/testwriters/coverage-helper.sh run [test-file] [source-file]
```

Report coverage metrics:
- Line coverage percentage
- Branch coverage percentage
- Improvement from baseline
- Comparison to project thresholds (70% minimum)

### Step 8: Database Update
Update the test tracking database:
```bash
# Ensure we're in project root
cd $(git rev-parse --show-toplevel) 2>/dev/null || cd /home/msmith/projects/2025slideheroes

# Update database (from project root)
bash .claude/scripts/testwriters/test-db-manager.sh update [source-file] [test-file] [test-count]
```

### Step 9: Final Report
Provide a summary including:
- Tests created: [count]
- Coverage achieved: [percentage]
- Next priority file: [if any]
- Context patterns applied: [list key patterns used]
- Test helpers utilized: [list helpers from context]
</instructions>

<context>
## Database Integration

The test coverage database at `.claude/tracking/test-data/test-coverage-db.json` tracks:
- Priority queue of files needing tests
- Package-level test statistics  
- Test creation history
- Coverage improvements over time

## Priority Scoring Algorithm

Files are prioritized based on:
1. **Business criticality**: Core features and user-facing functionality
2. **Code complexity**: Cyclomatic complexity and branching
3. **Change frequency**: Recently modified or frequently updated files
4. **Current coverage**: Files with lowest existing coverage
5. **Dependencies**: Files that many others depend on

## Test Database Schema

```json
{
  "priorities": {
    "unit": [
      {
        "file": "path/to/file.ts",
        "score": 95,
        "reason": "Core auth logic, 0% coverage",
        "complexity": "high",
        "lastModified": "2025-01-01"
      }
    ]
  },
  "history": {
    "created": [
      {
        "source": "file.ts",
        "test": "file.test.ts",
        "testCount": 12,
        "coverage": 85,
        "timestamp": "2025-01-01T10:00:00Z"
      }
    ]
  }
}
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
6. Consider TypeScript type variations

## Test Data Generation

For each path:
- Valid inputs satisfying constraints
- Boundary values at edges
- Invalid inputs for error paths
- Edge cases: null, undefined, empty, max values
- Type-specific edge cases from TypeScript

## Coverage Improvement Process

1. Run initial coverage analysis
2. Identify uncovered lines/branches
3. Generate targeted tests for gaps
4. Re-run coverage to verify improvement
5. Compare against project thresholds (70% minimum)

## Database Operations

```bash
# IMPORTANT: Always ensure you're in project root first
cd $(git rev-parse --show-toplevel) 2>/dev/null || cd /home/msmith/projects/2025slideheroes

# Check next priority
bash .claude/scripts/testwriters/test-db-manager.sh read

# Update after test creation
bash .claude/scripts/testwriters/test-db-manager.sh update [source] [test] [count]

# View statistics
bash .claude/scripts/testwriters/test-db-manager.sh stats

# Reset priorities
bash .claude/scripts/testwriters/test-db-manager.sh reset
```
</execution_tips>

<self_reflection>
Before finalizing tests, verify:

## Test Quality
- ✓ All imports exist and are correct
- ✓ Mock types match function signatures  
- ✓ Test names describe behavior clearly
- ✓ Assertions test expected behavior
- ✓ Follows patterns from Vitest context file

## Coverage Completeness
- ✓ All execution paths tested
- ✓ Boundary values covered
- ✓ Error scenarios handled
- ✓ Async operations tested properly
- ✓ Meets 70% minimum thresholds

## Context Application
- ✓ Loaded Vitest context file successfully
- ✓ Applied project-specific test helpers
- ✓ Used appropriate mocking strategies
- ✓ Followed AAA pattern structure
- ✓ Leveraged enhanceAction patterns

## Database Integration
- ✓ Priority file correctly identified
- ✓ Coverage metrics calculated
- ✓ Database updated after creation
- ✓ Next priority reported
- ✓ History tracked properly

If any check fails, revise before presenting.
</self_reflection>

<help>
## Correct Usage

This command excels at:
- Priority-driven test generation from coverage database
- Comprehensive unit tests with high coverage
- Tracking test creation progress
- Applying project-specific Vitest patterns
- Systematic coverage improvement

## How to Use

1. Run command with desired options
2. Answer clarifying questions
3. Command loads Vitest context automatically
4. Review generated tests
5. Command runs coverage analysis
6. Database automatically updated

## Command Options

- No args: Auto-select from database
- `--file=<path>`: Test specific file
- `--from-discovery`: Use discovery results
- `--coverage`: Focus on coverage gaps
- `--boundary`: Boundary value emphasis
- `--mock-heavy`: Complex mocking

## Integration Features

- **Context**: Loads `.claude/context/tools/vitest-unit-testing.md` for patterns
- **Database**: Tracks progress in `.claude/tracking/test-data/test-coverage-db.json`
- **Coverage**: Uses Vitest's built-in coverage reporting
- **Scripts**: Leverages helper scripts in `.claude/scripts/testwriters/`
- **Agent**: Uses test-analysis-agent for complex path analysis

## Best Practices

- Run `/test-discovery` first to populate database
- Review generated tests before committing
- Monitor coverage improvements
- Update tests as code evolves
- Leverage project context for consistency

## Troubleshooting

- **Script not found**: Ensure you're in project root with `cd $(git rev-parse --show-toplevel)`
- **No database**: Run `/test-discovery` first
- **Can't find file**: Check database path accuracy
- **Low coverage**: Use `--coverage` flag for targeted improvement
- **Complex code**: Agent performs deep path analysis automatically
- **Missing context**: Ensure `.claude/context/tools/vitest-unit-testing.md` exists
- **Mock issues**: Review mocking patterns in loaded context
- **Path errors**: All `.claude/` paths are relative to project root - always navigate there first
</help>
```