# Issue #72: Biome Linting Errors - Debugging Plan

**Issue**: 211 Biome linting errors and 19 warnings across codebase
**Created**: 2025-06-19
**Status**: In Progress

## Current Status

As of 2025-06-19, running `pnpm biome check .` shows:

- **99 errors** (down from 211 reported)
- **15 warnings** (down from 19 reported)

This suggests some errors have already been addressed, but significant issues remain.

## Error Breakdown

### Most Common Errors (by frequency)

1. `lint/suspicious/noExplicitAny` (7 instances) - Use of `any` type
2. `lint/correctness/noUnusedVariables` (5 instances) - Unused variables
3. `lint/correctness/noUnusedFunctionParameters` (4 instances) - Unused function parameters
4. `lint/style/noNonNullAssertion` (2 instances) - Non-null assertions
5. `suppressions/unused` (1 instance) - Unnecessary suppression comments
6. `lint/a11y/useSemanticElements` (1 instance) - Accessibility issues
7. Format errors - Code formatting issues

### Most Affected Areas

1. **Test Files** (`*.test.ts`)
   - Heavy use of `any` in test assertions
   - Type casting issues in mocks
2. **AI Canvas Components** (`apps/web/app/home/(user)/ai/canvas/`)
   - Editor content normalization tests
   - Admin conversion page
3. **Storyboard Components** (`apps/web/app/home/(user)/ai/storyboard/`)
   - PowerPoint generator service
   - Unused type definitions
4. **Course Components** (`apps/web/app/home/(user)/course/`)
   - Unused function parameters
   - Type safety issues

## Resolution Strategy

### Phase 1: Automated Fixes (Safe)

Run Biome with auto-fix for safe, non-breaking changes:

```bash
pnpm biome check . --write --unsafe
```

This will handle:

- Import organization
- Unused imports removal
- Basic formatting issues
- Simple type imports conversion

### Phase 2: Type Safety Improvements

Address `noExplicitAny` errors systematically:

1. **Test Files Pattern**
   Create proper type definitions for test utilities:

   ```typescript
   // packages/test-utils/types.ts
   export type MockedFunction<T = any> = jest.MockedFunction<T>;
   export type DeepPartial<T> = {
     [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
   };
   ```

2. **Replace `any` with specific types**:
   - For test mocks: Use `DeepPartial<T>` or `Partial<T>`
   - For API responses: Define proper interfaces
   - For event handlers: Use proper event types

### Phase 3: Dead Code Removal

1. Remove unused variables and imports
2. Remove unused type definitions
3. Clean up unused function parameters (or prefix with `_`)

### Phase 4: Manual Fixes

1. Fix accessibility issues (semantic elements)
2. Address non-null assertions with proper null checks
3. Remove unnecessary biome-ignore comments

## Implementation Steps

### Step 1: Create Test Helper Types

```bash
# Create test utilities package
mkdir -p packages/test-utils/src
```

### Step 2: Run Automated Fixes

```bash
# Backup current state
git add -A
git commit -m "chore: backup before biome fixes"

# Run auto-fixes
pnpm biome check . --write

# Review changes
git diff
```

### Step 3: Fix Type Safety Issues

Focus on high-impact areas first:

1. Test files in AI canvas
2. Storyboard services
3. Course components

### Step 4: CI Integration

Add Biome check to CI pipeline:

```yaml
- name: Lint with Biome
  run: pnpm biome ci .
```

## Success Criteria

1. Zero Biome errors
2. Minimal use of `biome-ignore` comments
3. All tests passing
4. No runtime errors introduced
5. CI pipeline includes Biome checks

## Risk Mitigation

1. Commit frequently during fixes
2. Run tests after each major change
3. Use `--dry-run` before applying fixes
4. Review all automated changes
5. Test application functionality after fixes

## Monitoring

- Track error count reduction
- Monitor test coverage
- Check for performance impacts
- Validate no new TypeScript errors

## Next Steps

1. Begin with Phase 1 automated fixes
2. Create test helper types package
3. Systematically address `any` usage
4. Add Biome to CI pipeline
