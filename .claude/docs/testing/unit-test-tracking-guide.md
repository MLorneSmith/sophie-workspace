# Unit Test Tracking Guide

## Overview

This guide explains how to track unit test progress using our two-tier documentation system:

1. **Main Checklist** (`unit-test-checklist.md`) - High-level progress tracking
2. **Test Case Files** (`test-cases/` directory) - Detailed test planning for each file

## Test Documentation Structure

### Main Checklist

- Location: `.claude/docs/testing/unit-test-checklist.md`
- Purpose: Bird's-eye view of testing progress across the entire codebase
- Updates: When starting/completing test files

### Test Case Files

- Location: `.claude/docs/testing/test-cases/` (mirrors source structure)
- Purpose: Detailed test planning and case tracking for individual files
- Updates: As you plan and implement specific test cases

### Directory Structure Example

```
.claude/docs/testing/
├── unit-test-checklist.md          # Main progress tracker
├── test-case-template.md           # Template for new test case files
├── test-cases/                     # Detailed test case tracking
│   ├── apps/
│   │   ├── web/
│   │   │   └── app/
│   │   │       └── home/
│   │   │           └── (user)/
│   │   │               ├── ai/
│   │   │               │   ├── canvas/
│   │   │               │   │   ├── _actions/
│   │   │               │   │   │   ├── generate-ideas.test-cases.md
│   │   │               │   │   │   └── generate-outline.test-cases.md
│   │   │               │   │   └── _lib/
│   │   │               │   │       └── utils/
│   │   │               │   │           └── normalize-editor-content.test-cases.md
│   │   │               │   └── storyboard/
│   │   │               │       └── _lib/
│   │   │               │           └── services/
│   │   │               │               └── storyboard-service.test-cases.md
│   │   └── payload/
│   │       └── src/
│   │           ├── collections/
│   │           │   └── CourseLessons.test-cases.md
│   │           └── lib/
│   │               └── request-deduplication.test-cases.md
│   └── README.md
└── scripts/
    └── analyze-test-coverage.sh    # Coverage analysis script
```

## Workflow

### 1. Starting a New Test File

#### Step 1: Update Main Checklist

Change the checkbox from `[ ]` to `[~]` to indicate work in progress:

```markdown
- [~] `_actions/generate-ideas.ts` 🚧
  - **Priority**: Critical
  - **Test Coverage**: 0%
  - **Test File**: `_actions/generate-ideas.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/canvas/_actions/generate-ideas.test-cases.md>)
  - **Dependencies to Mock**: AI Gateway Client, Cost Tracking
  - **Estimated Effort**: 2-3 hours
```

#### Step 2: Create Test Case Tracking File

```bash
# Create directory structure
mkdir -p .claude/docs/testing/test-cases/apps/web/app/home/\(user\)/ai/canvas/_actions/

# Copy template
cp .claude/docs/testing/test-case-template.md \
   .claude/docs/testing/test-cases/apps/web/app/home/\(user\)/ai/canvas/_actions/generate-ideas.test-cases.md
```

#### Step 3: Customize Test Case File

Fill in specific test cases for the file you're testing.

### 2. Tracking Progress

#### In the Main Checklist

Use these status indicators:

- `[ ]` - Not started
- `[~]` - In progress 🚧
- `[x]` - Completed ✅
- `[~]` with **🚧 BLOCKED** - Blocked by external dependency

#### In Test Case Files

Each test case file should include:

```markdown
# Test Cases: generate-ideas.ts

## Status Summary

- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: In Progress
- **Total Test Cases**: 8
- **Completed Test Cases**: 3
- **Coverage**: 37.5%

## Test Cases Checklist

### Core Functionality

- [x] **Test Case**: Valid prompt generates ideas array
  - **Status**: ✅ Complete
  - **Actual Effort**: 30 min
- [~] **Test Case**: Handles multiple idea generation
  - **Status**: 🟡 In Progress
  - **Notes**: Complex mock setup required
```

### 3. Completing a Test File

#### Update Main Checklist

```markdown
- [x] `_lib/utils/normalize-editor-content.ts` ✅
  - **Priority**: Critical (Pure Functions)
  - **Test Coverage**: 95%
  - **Test File**: `_lib/utils/normalize-editor-content.test.ts`
  - **Test Cases**: [Detailed plan](<test-cases/apps/web/app/home/(user)/ai/canvas/_lib/utils/normalize-editor-content.test-cases.md>)
  - **Dependencies to Mock**: None
  - **Estimated Effort**: 2 hours
  - **Actual Effort**: 2.5 hours ⏱️
```

#### Update Test Case File

Mark all test cases complete and add final notes.

### 4. Weekly Maintenance

#### Run Coverage Analysis

```bash
./.claude/scripts/analyze-test-coverage.sh
```

#### Update Progress Overview

```markdown
## Progress Overview

- Total Files: 127
- Files with Tests: 15
- Coverage: 11.8%
- Last Updated: 2025-01-06
```

#### Review Quality

Add quality indicators to completed tests:

- ⭐ Excellent coverage and edge cases
- ✅ Good coverage, meets requirements
- 🟡 Basic coverage, needs improvement

### 5. Discovering New Test Cases

When you discover new cases during implementation:

```markdown
### Core Functionality

- [x] **Test Case**: Original test case
- [x] **Test Case**: **Added**: Unicode character handling
  - **Discovered**: During implementation
  - **Reason**: Found edge case with emoji processing
```

## Naming Conventions

### Test Case Files

- **Pattern**: `[original-filename].test-cases.md`
- **Example**: `generate-ideas.ts` → `generate-ideas.test-cases.md`

### Test Files (in source)

- **Pattern**: `[original-filename].test.ts`
- **Location**: Colocated with source file

## Best Practices

### 1. Real-Time Updates

- Update tracking files as you work, not after
- Mark test cases complete immediately upon implementation

### 2. Detailed Test Cases

- Be specific about inputs and expected outputs
- Document edge cases discovered during implementation

### 3. Time Tracking

- Track actual effort vs estimates
- Use this data to improve future estimates

### 4. Dependency Documentation

- List all mocked dependencies
- Note any complex mock setups for future reference

### 5. Link Everything

- Main checklist links to test case files
- Test case files reference the actual test file
- Include links to related documentation

## Quick Commands

### Find all test case tracking files

```bash
find .claude/docs/testing/test-cases -name "*.test-cases.md"
```

### Find test cases without implementation

```bash
find .claude/docs/testing/test-cases -name "*.test-cases.md" | while read f; do
  source_path=$(echo $f | sed 's|.claude/docs/testing/test-cases/||' | sed 's|.test-cases.md|.ts|')
  test_path="${source_path%.ts}.test.ts"
  if [ ! -f "$test_path" ]; then
    echo "Missing test for: $source_path"
  fi
done
```

### Create new test case file

```bash
# Function to create test case file with proper directory structure
create_test_case() {
  source_file=$1
  test_case_dir=".claude/docs/testing/test-cases/$(dirname $source_file)"
  test_case_file="$test_case_dir/$(basename $source_file .ts).test-cases.md"

  mkdir -p "$test_case_dir"
  cp .claude/docs/testing/test-case-template.md "$test_case_file"
  echo "Created: $test_case_file"
}

# Usage
create_test_case "apps/web/app/home/(user)/ai/canvas/_actions/generate-ideas.ts"
```

## Integration with CI/CD

When tests are integrated with CI:

1. Add coverage badges to main checklist
2. Link to CI test reports from test case files
3. Document any flaky tests or environment-specific issues

```markdown
- [x] `file.ts` ✅ ![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
  - **CI Status**: Passing
  - **Known Issues**: Timeout on Windows CI runners
```
