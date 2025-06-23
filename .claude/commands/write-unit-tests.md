# Write Unit Tests Command

Usage: `/write-unit-tests [number_of_files]` (default: 1)

When the user asks you to write unit tests, follow this sequence:

## 1. Adopt Role

First, load the unit test writer role to set the appropriate context:

```
/read .claude/context/roles/unit-test-writer.md
```

## 2. Read Context Docs

After adopting the role, read the consolidated testing documentation:

- `.claude/docs/testing/context/testing-fundamentals.md` - Core principles, AAA pattern, naming conventions
- `.claude/docs/testing/context/mocking-and-typescript.md` - All mocking patterns and TypeScript-specific guidance
- `.claude/docs/testing/context/testing-examples.md` - Concrete examples from this project

## 3. Review Test Strategy

Read the strategy and tracking files to understand the current state:

- `.claude/docs/testing/unit-testing-prioritization-plan.md` - Understand priorities and which files to focus on
- `.claude/docs/testing/unit-test-checklist.md` - Review what needs testing and current progress
- `.claude/docs/testing/unit-test-tracking-guide.md` - Understand the workflow and tracking process

## 4. Status Check

Before implementing:

1. Identify which file(s) the user wants tested
2. Check the current status in `.claude/docs/testing/unit-test-checklist.md`
3. Look for existing test case documentation in `.claude/docs/testing/test-cases/`
4. Update the main checklist status from `[ ]` to `[~]` (in progress)

## 5. Implement

### 5.1 Create Test Case Documentation

If it doesn't exist, create a test case tracking file using the template:

1. Copy `.claude/docs/testing/test-case-template.md`
2. Save it to `.claude/docs/testing/test-cases/[mirror-source-path]/[filename].test-cases.md`
3. Customize the template with specific test cases for the target file

### 5.2 Analyze the Source File

Read and analyze the target source file to:

- Identify all exported functions/classes
- Determine external dependencies that need mocking
- List edge cases and error scenarios
- Note any business logic that needs special attention

### 5.3 Write the Test File

Create the actual test file colocated with the source:

- File: `[filename].test.ts` (same directory as source)
- Follow the patterns from the context docs
- Use Vitest as specified in project standards
- Mock all external dependencies
- Implement comprehensive test cases

#### TypeScript Type Safety Quick Reference

Refer to `.claude/docs/testing/context/mocking-and-typescript.md` for comprehensive TypeScript patterns including:

- Complete type mocks with helper functions
- React Query mock helpers
- Correct Vitest generics usage
- Safe property access patterns
- Complex type casting solutions

**Critical**: Always verify TypeScript compilation before marking tests complete.

### 5.4 Verify TypeScript Compilation

**CRITICAL**: Before marking tests complete, verify they pass TypeScript compilation:

```bash
pnpm --filter web typecheck
```

Fix any TypeScript errors immediately using the patterns above. Tests that fail TypeScript compilation will break CI/CD pipelines.

### 5.5 Update Documentation

After implementing tests:

1. Update `.claude/docs/testing/unit-test-checklist.md`: Change `[~]` to `[x]` when complete
2. Update the test case tracking file with completed test cases
3. Note actual effort vs. estimated effort
4. Document any newly discovered edge cases

## Context Window Management

### Batch Size Control

- **Parameter**: `number_of_files` - How many test files to create in this session
- **Default**: 1 file if no parameter specified
- **Recommended**: 1-3 files for complex business logic, up to 5 for simple utilities

### Processing Strategy

1. Identify the next N highest priority files from the checklist
2. Process them in priority order
3. After completing the specified number of files, provide a summary
4. Update all tracking documentation
5. Suggest next steps or ask if user wants to continue

### Signs to Stop Early (Override Batch Size)

If you notice these indicators, complete the current file and stop:

- Responses becoming less detailed
- Forgetting earlier decisions or patterns
- Difficulty maintaining consistent code quality
- Unable to recall project-specific patterns

When stopping early:

1. Complete the current test file
2. Update tracking documentation for completed files
3. Explain why you're stopping (context management)
4. Suggest starting a new conversation to continue

## Key Workflow Notes

- **Batch processing**: Work on the specified number of files, then pause
- Always start with the highest priority files from the checklist
- Follow the two-tier documentation system (main checklist + detailed test cases)
- Focus on pure functions first, then business logic with mocked dependencies
- Aim for 80%+ coverage on Priority 1 & 2 areas
- Update tracking documentation in real-time as you work
- Proactively manage context by respecting batch limits
