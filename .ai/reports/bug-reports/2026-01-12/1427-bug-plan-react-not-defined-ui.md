# Bug Fix: React is not defined in Alpha Orchestrator UI

**Related Diagnosis**: #1426 (REQUIRED)
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Type-only React import (`import type * as React`) is erased at compile time, but JSX syntax requires React at runtime
- **Fix Approach**: Change line 2 in `ui/index.tsx` from type-only import to runtime import with biome-ignore annotation
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Spec Orchestrator UI fails at startup with `ReferenceError: React is not defined` when using the `tsx` runtime. The file `.ai/alpha/scripts/ui/index.tsx` uses a type-only React import (`import type * as React from "react"`), which is completely erased at compile time. However, the JSX syntax in the file requires React to be in scope at runtime when the `tsx` runner doesn't apply the automatic `react-jsx` transform.

The fix is documented in the diagnosis: change the type-only import to a runtime import using the same pattern that works correctly in `OrchestratorUI.tsx`.

For full details, see diagnosis issue #1426.

### Solution Approaches Considered

#### Option 1: Change type-only import to runtime import ⭐ RECOMMENDED

**Description**: Add `import React from "react"` at the top of the file (changing line 2 from type-only to runtime import), using the same pattern that already works in `OrchestratorUI.tsx`.

**Pros**:
- Minimal one-line change in the exact location of the error
- Matches the proven working pattern in the same codebase
- Zero risk to other code or functionality
- Addresses the root cause directly
- OrchestratorUI.tsx demonstrates this works correctly

**Cons**:
- None - this is the straightforward fix

**Risk Assessment**: low - Single line change to a single file, no other components affected

**Complexity**: simple - Type system fix, no business logic changes

#### Option 2: Move type imports to separate statement (Alternative but unnecessary)

**Description**: Keep `import type * as React from "react"` for types and add a separate `import React from "react"` for runtime

**Pros**:
- More explicit about what's a type vs runtime import
- Follows strict import separation

**Cons**:
- Unnecessary duplication when `import React from "react"` provides both
- Adds extra lines without benefit
- Goes against the working pattern in OrchestratorUI.tsx

**Why Not Chosen**: Over-engineering when Option 1 is simpler and proven to work

#### Option 3: Configure tsx with react-jsx transform flag

**Description**: Modify tsx execution to use the `--jsx=react-jsx` flag to enable automatic runtime transformation

**Pros**:
- Fixes root cause at build level
- Applies to all tsx files automatically

**Cons**:
- Requires changes to execution configuration/scripts
- More complex than a single line fix
- May affect other tsx files unnecessarily
- Doesn't match the existing codebase pattern

**Why Not Chosen**: Over-complicated when the working pattern is already established in the same file tree

### Selected Solution: Change type-only import to runtime import

**Justification**: This is a straightforward, one-line fix that directly addresses the root cause. The working pattern is already demonstrated in `OrchestratorUI.tsx` (same file, same component tree), so we're simply applying the proven solution to another file. Low risk, high confidence in success.

**Technical Approach**:
- Line 2: Change `import type * as React from "react"` to `import React from "react"`
- Add biome-ignore annotation to suppress the "unused import" lint warning (required for Ink/react-reconciler runtime)
- Keep line 3 which already imports specific hooks: `import { useCallback, useEffect, useState } from "react"`
- No other files need modification

**Architecture Changes**: None - This is a compilation fix, not an architecture change

**Migration Strategy**: Not needed - This is a runtime fix with no data or API changes

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/ui/index.tsx` - Change type-only React import to runtime import (line 2)

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix the React import

<describe what this step accomplishes>

The orchestrator UI will be able to reference React at runtime, allowing JSX syntax to work correctly with the tsx runner.

- Replace line 2 in `.ai/alpha/scripts/ui/index.tsx`
- Change from: `import type * as React from "react"`
- Change to:
  ```typescript
  // biome-ignore lint/correctness/noUnusedImports: React must be in scope at runtime for Ink/react-reconciler
  import React from "react";
  ```
- Add blank line to maintain spacing with line 3

**Why this step first**: This is the only change needed. The fix is surgical and isolated to one file.

#### Step 2: Verify the fix

<describe what this step accomplishes>

Confirm that the React import is now correctly in scope at runtime and the orchestrator can start without errors.

- Run the orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- Verify no "React is not defined" error
- Verify UI dashboard starts correctly
- Verify the dashboard shows expected sandbox progress output
- Confirm no build errors or type errors

#### Step 3: Verify no regressions

<describe what this step accomplishes>

Ensure the change doesn't break any other functionality.

- Run type check: `pnpm typecheck`
- Run linter: `pnpm lint`
- Run unit tests: `pnpm test:unit`
- Test orchestrator with different spec IDs to confirm robustness

## Testing Strategy

### Unit Tests

No new unit tests needed - This is a compilation fix that enables existing functionality.

**Test files**: N/A

### Integration Tests

No new integration tests needed - The orchestrator itself serves as the integration test.

**Test files**: N/A

### E2E Tests

No new E2E tests needed - This is an infrastructure component, not user-facing.

**Test files**: N/A

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Verify no "ReferenceError: React is not defined" error appears
- [ ] Verify "✅ UI Dashboard" shows in output (not "⚠️ Failed to start UI dashboard")
- [ ] Verify sandbox progress displays correctly in the terminal UI
- [ ] Test orchestrator with a different spec ID
- [ ] Verify no TypeScript errors: `pnpm typecheck`
- [ ] Verify no linting errors: `pnpm lint`
- [ ] Check browser console has no new errors (if applicable to tsx runtime)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Import side effects**: Adding a runtime import could trigger React initialization side effects
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: React is already imported elsewhere in the file (line 3 imports hooks from "react"), so any initialization already happens. No new behavior.

2. **Biome lint warning recurrence**: If biome-ignore is not correctly formatted
   - **Likelihood**: low
   - **Impact**: low (only affects linting, not runtime)
   - **Mitigation**: Follow the exact pattern from OrchestratorUI.tsx line 3, which is proven to work

**Rollback Plan**:

If this fix causes issues (unlikely given the root cause analysis):
1. Revert line 2 to the original: `import type * as React from "react"`
2. The UI will fail to start again, but no other code will be broken
3. Proceed with Option 3 (configure tsx with react-jsx flag) as alternative

**Monitoring**: None needed - This is a local development tool, not production code

## Performance Impact

**Expected Impact**: none

No performance implications - This is a type system / import fix with no runtime behavior changes.

## Security Considerations

**Security Impact**: none

No security implications - This is a developer tool, not production code handling user data.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Try to run orchestrator - should show React error
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```

**Expected Result**: Error message appears: `⚠️ Failed to start UI dashboard: ReferenceError: React is not defined`

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Run orchestrator - should work without React error
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Press Ctrl+C to exit when ready
```

**Expected Result**:
- `pnpm typecheck` passes with no errors
- `pnpm lint` passes with no errors
- Orchestrator starts with UI dashboard showing: `✅ UI Dashboard`
- Terminal shows sandbox progress with header and progress indicators
- No "ReferenceError: React is not defined" error

### Regression Prevention

```bash
# Run full test suite to ensure nothing else broke
pnpm test

# Build to verify no compilation issues
pnpm build
```

## Dependencies

### New Dependencies (if any)

No new dependencies required - React is already a dependency

**No new dependencies needed**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none

This is a developer tooling fix with no impact on production code.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: Not applicable (dev tool only)

## Success Criteria

The fix is complete when:
- [ ] File `.ai/alpha/scripts/ui/index.tsx` line 2 is changed to runtime import
- [ ] Biome-ignore annotation is properly formatted
- [ ] Orchestrator starts without "React is not defined" error
- [ ] UI dashboard displays correctly in terminal
- [ ] Type check passes: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint`
- [ ] No regressions in other code
- [ ] Manual testing checklist complete

## Notes

This is a straightforward one-line fix to a type system issue in developer tooling. The root cause (type-only import being erased at compile time) is well-understood, and the solution (runtime import) is proven to work in the same codebase.

The pattern already exists and works correctly in `.ai/alpha/scripts/ui/components/OrchestratorUI.tsx` lines 2-4, making this a low-risk application of an existing, proven solution.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1426*
