# Bug Diagnosis: Unit Test Failures and Configuration Issues

**ID**: ISSUE-pending
**Created**: 2025-11-27T16:45:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Three separate unit test issues were identified during `pnpm test:unit` execution: (1) a test-implementation mismatch in `pptx-generator.test.ts` where the test expects behavior that doesn't exist in the implementation, (2) a Vitest configuration error in `@kit/e2b` package caused by missing local config and incorrect workspace resolution, and (3) a placeholder test script in `slideheroes-claude-agent` that was never implemented.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: 22.16.0
- **Vitest Version**: 4.0.14
- **Last Working**: Unknown (likely always broken)

## Reproduction Steps

1. Run `pnpm test:unit` from the repository root
2. Observe three "failures":
   - `web:test` - 1 test fails in `pptx-generator.test.ts`
   - `@kit/e2b:test` - Startup error about non-existing directory
   - `slideheroes-claude-agent:test` - "Error: no test specified"

## Expected Behavior

All unit tests should pass or be properly skipped.

## Actual Behavior

- **433 tests pass, 1 fails** in web app
- **@kit/e2b** fails at startup with config error
- **slideheroes-claude-agent** fails with placeholder script

## Diagnostic Data

### Issue 1: pptx-generator.test.ts Failure

```
FAIL  web app/home/(user)/ai/storyboard/_lib/services/powerpoint/pptx-generator.test.ts > PptxGenerator > Constructor & Initialization > should initialize PptxGenJS instance correctly
AssertionError: expected "vi.fn()" to be called 9 times, but got 0 times
 ❯ app/home/(user)/ai/storyboard/_lib/services/powerpoint/pptx-generator.test.ts:85:42
    83|  describe("Constructor & Initialization", () => {
    84|   it("should initialize PptxGenJS instance correctly", () => {
    85|    expect(mockPptxGen.defineSlideMaster).toHaveBeenCalledTimes(9);
```

### Issue 2: @kit/e2b Vitest Error

```
Error: Projects definition references a non-existing file or a directory: /home/msmith/projects/2025slideheroes/packages/e2b/apps/web
```

### Issue 3: slideheroes-claude-agent

```
> slideheroes-claude-agent@1.0.0 test
> echo "Error: no test specified" && exit 1
Error: no test specified
```

## Error Stack Traces

See diagnostic data above.

## Related Code

### Issue 1: pptx-generator.test.ts
- **Affected Files**:
  - `apps/web/app/home/(user)/ai/storyboard/_lib/services/powerpoint/pptx-generator.test.ts:85`
  - `apps/web/app/home/(user)/ai/storyboard/_lib/services/powerpoint/pptx-generator.ts`
- **Recent Changes**: Test added in commit `bfca466ee` (Jun 18), implementation in `956fdbfd9` (Jul 2)
- **Suspected Functions**: `PptxGenerator.constructor()` - never calls `defineSlideMaster()`

### Issue 2: @kit/e2b
- **Affected Files**:
  - `packages/e2b/package.json` (has `"test": "vitest"` but no local config)
  - `vitest.config.mts` (root config with relative `projects` paths)
- **Suspected Issue**: Missing `vitest.config.ts` in `packages/e2b`

### Issue 3: slideheroes-claude-agent
- **Affected Files**:
  - `packages/e2b/e2b-template/package.json:7` (placeholder test script)
- **Suspected Issue**: npm init default never replaced

## Related Issues & Context

### Similar Symptoms
- #76 (CLOSED): "Fix Remaining Test Failures: 3 in Payload App + 81 in Web App"
- #65 (CLOSED): "Comprehensive Test Type Definition Strategy"

### Historical Context
These appear to be long-standing issues that were either:
1. Never caught because CI doesn't run all package tests
2. Introduced when test suite was added before implementation was complete

## Root Cause Analysis

### Issue 1: pptx-generator.test.ts - Test-Implementation Mismatch

**Summary**: The test expects `defineSlideMaster()` to be called 9 times in the constructor, but the implementation never calls this method.

**Detailed Explanation**:
The test file at line 85 asserts:
```typescript
expect(mockPptxGen.defineSlideMaster).toHaveBeenCalledTimes(9);
```

However, searching the implementation file (`pptx-generator.ts`) reveals **zero calls** to `defineSlideMaster`. The constructor only:
1. Creates a new `pptxgen` instance
2. Initializes the logger

The test was written anticipating a feature (predefined slide masters) that was never implemented. Git history shows the test was added on Jun 18, 2025 (`bfca466ee`) while the implementation was updated on Jul 2, 2025 (`956fdbfd9`), suggesting the implementation direction changed after tests were written.

**Supporting Evidence**:
- `grep "defineSlideMaster" pptx-generator.ts` returns no matches
- Test file has 9 master names defined that don't exist in implementation
- Constructor in implementation (lines 118-124) only initializes pptx and logger

### Issue 2: @kit/e2b - Missing Vitest Configuration

**Summary**: The `@kit/e2b` package has a test script but no local `vitest.config.ts`, causing Vitest 4.x to inherit the root workspace config with relative paths that resolve incorrectly.

**Detailed Explanation**:
When `pnpm --filter @kit/e2b test` runs, Vitest:
1. Looks for `vitest.config.ts` in `packages/e2b/` - not found
2. Finds `vitest.config.mts` at root with `projects: ["apps/web", ...]`
3. Resolves paths relative to `packages/e2b/`, creating `/packages/e2b/apps/web`
4. Fails because this path doesn't exist

**Supporting Evidence**:
- `packages/e2b/` contains no vitest config file
- `vitest.config.mts` at root defines projects with relative paths
- `vitest.workspace.ts` also doesn't include `packages/e2b`

### Issue 3: slideheroes-claude-agent - Placeholder Test Script

**Summary**: The package uses npm's default placeholder test script that always fails.

**Detailed Explanation**:
The `packages/e2b/e2b-template/package.json` contains:
```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
}
```
This is npm's default when running `npm init`. It was never replaced with an actual test command or removed entirely.

**Supporting Evidence**:
- Package.json line 7 shows the exact npm default script
- No test files exist in the e2b-template directory

### Confidence Level

**Confidence**: High

**Reasoning**: All three issues have clear, reproducible causes with direct evidence from code inspection. The root causes are definitively identified through code analysis rather than speculation.

## Fix Approach (High-Level)

### Issue 1: pptx-generator.test.ts
Either:
- **Option A**: Remove the failing test if slide masters aren't needed
- **Option B**: Update the test to match actual implementation behavior
- **Option C**: Implement `defineSlideMaster` calls in the constructor if the feature is desired

Recommended: Option B - update test to test what the constructor actually does (initialize pptx instance and logger)

### Issue 2: @kit/e2b
Either:
- **Option A**: Add a local `vitest.config.ts` to `packages/e2b/`
- **Option B**: Remove the test script from package.json if no tests are needed
- **Option C**: Add `packages/e2b` to the root `vitest.config.mts` projects array

Recommended: Option B - remove test script since there are no test files

### Issue 3: slideheroes-claude-agent
Either:
- **Option A**: Remove the test script entirely
- **Option B**: Add actual tests if needed
- **Option C**: Change to `"test": "echo 'No tests' && exit 0"` to skip gracefully

Recommended: Option A or C - this is a template package that doesn't need tests

## Diagnosis Determination

All three issues are **configuration/test specification problems**, not code bugs. They have existed since the test infrastructure was set up and weren't caught because:
1. The issues don't affect the actual application functionality
2. CI may not run tests for all packages
3. The 433 passing tests mask the 1 failing test in web

None of these issues are related to the recent dependency updates.

## Additional Context

These issues were discovered while validating dependency updates (`pnpm update`). The dependency updates themselves did not cause these failures - they are pre-existing issues.

---
*Generated by Claude Debug Assistant*
*Tools Used: pnpm test:unit, grep, git log, gh issue list, file reads*
