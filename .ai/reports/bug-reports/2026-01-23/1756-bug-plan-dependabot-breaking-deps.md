# Bug Fix: Dependabot PR #1751 Breaking Dependency Updates

**Related Diagnosis**: #1752 (REQUIRED)
**Severity**: medium
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Two distinct breaking changes in PR #1751: react-resizable-panels v4 (namespace import failure) and version mismatch between @payloadcms/* (3.72.0) and payload (3.70.0)
- **Fix Approach**: (1) Update react-resizable-panels namespace imports to named imports, (2) Update payload package to 3.72.0 to match @payloadcms/* packages
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Dependabot PR #1751 introduces two independent breaking dependency updates:

1. **react-resizable-panels 3.0.6 → 4.4.1**: ESM-only module with changed export structure causes TypeScript errors when using namespace imports
2. **Payload version mismatch**: @payloadcms/* packages updated to 3.72.0 but `payload` package remains at 3.70.0, causing import errors for new functions

Full context: See diagnosis issue #1752.

### Solution Approaches Considered

#### Option 1: Update imports + sync Payload versions ⭐ RECOMMENDED

**Description**: Fix both issues in PR #1751:
1. Change `react-resizable-panels` namespace import to named imports in `packages/ui/src/shadcn/resizable.tsx`
2. Update `payload` package from 3.70.0 to 3.72.0 in `apps/payload/package.json`

**Pros**:
- Minimal code changes (only 1 file affected for imports)
- Resolves both issues in a single PR
- Maintains Dependabot automation working correctly
- No complex refactoring needed
- Version alignment ensures no future compatibility issues

**Cons**:
- Requires understanding both library changes
- Two distinct root causes to address

**Risk Assessment**: low - Changes are straightforward, both libraries are stable versions with good documentation

**Complexity**: simple - Namespace import conversion is a straightforward mechanical change; version bump is a simple update

#### Option 2: Close PR #1751 and create separate PRs

**Description**: Close the Dependabot PR and manually create two focused PRs:
1. One for react-resizable-panels upgrade with fixes
2. One for Payload CMS synchronized upgrade

**Pros**:
- Cleaner Git history with focused commits
- Easier to revert individual changes if needed
- Better for understanding what changed over time

**Cons**:
- Manual work to create separate PRs
- Delays Dependabot automation benefits
- Requires updating Dependabot config to group Payload packages

**Why Not Chosen**: Option 1 is simpler and faster. The Dependabot PR is already prepared with all changes. Since both issues are in the same commit context, fixing them together is acceptable.

### Selected Solution: Option 1 - Update imports + sync Payload versions

**Justification**:
- Fixes both root causes identified in diagnosis
- Minimal code changes required
- Maintains Dependabot automation workflow
- Lower effort than managing separate PRs
- All changes are straightforward updates with no complex logic changes

**Technical Approach**:
1. Change `import * as ResizablePrimitive from "react-resizable-panels"` to named imports
2. Replace `ResizablePrimitive.PanelGroup` with `PanelGroup`, etc.
3. Update `payload` package version to match other @payloadcms/* packages
4. Run validation to ensure all imports resolve correctly

**Architecture Changes**: None - this is purely a dependency update with import pattern fixes, no architectural modifications

## Implementation Plan

### Affected Files

- `packages/ui/src/shadcn/resizable.tsx` - Update namespace import to named imports (5 lines)
- `apps/payload/package.json` - Update `payload` version from 3.70.0 to 3.72.0 (1 line)

### New Files

None - this is a fix-only change

### Step-by-Step Tasks

**IMPORTANT**: Execute every step in order, top to bottom.

#### Step 1: Update react-resizable-panels import pattern

Fix the namespace import pattern in `packages/ui/src/shadcn/resizable.tsx` to use named imports instead of namespace import:

- Change `import * as ResizablePrimitive from "react-resizable-panels"` to `import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"`
- Replace all `ResizablePrimitive.PanelGroup` → `PanelGroup` (lines 11, 26)
- Replace all `ResizablePrimitive.Panel` → `Panel` (line 20)
- Replace all `ResizablePrimitive.PanelResizeHandle` → `PanelResizeHandle` (line 29, 41)

**Why this step first**: The import statement is the foundation; TypeScript needs proper named imports to resolve component types

#### Step 2: Update Payload package version

Sync the `payload` package version to 3.72.0 in `apps/payload/package.json`:

- Change `"payload": "3.70.0"` to `"payload": "3.72.0"` (line 70 or similar)

**Why this step second**: After fixing imports, this resolves the `getRangeRequestInfo` import error

#### Step 3: Install and validate

Verify the fixes work:

- Run `pnpm install` to update lock files
- Run `pnpm typecheck` to verify no TypeScript errors
- Run `pnpm --filter @kit/ui typecheck` to specifically check UI package

#### Step 4: Build validation

Ensure the build completes successfully:

- Run `pnpm build` to build all packages
- Specifically check `pnpm --filter payload build` for Payload app

#### Step 5: Final validation

Complete pre-commit checks:

- Run `pnpm lint` to check code style
- Run `pnpm format` to ensure formatting
- Verify no new errors in console output

## Testing Strategy

### Unit Tests

No new unit tests needed - this is a dependency update with import pattern fixes.

**Existing coverage**:
- `resizable.tsx` is a presentation component with no business logic
- Component tests should pass with same functionality
- TypeScript type checking validates import correctness

### Integration Tests

No integration tests needed - component behavior unchanged.

**Validation**:
- E2E tests that use resizable panels will validate functionality is preserved
- Payload app functionality unchanged (internal import only)

### E2E Tests

Existing E2E tests should pass without modification:
- Any tests that render resizable panels will validate correct behavior
- No UI changes, so visual regression tests not needed

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] TypeScript check passes: `pnpm typecheck` (0 errors)
- [ ] Payload build succeeds: `pnpm --filter payload build` (0 errors)
- [ ] UI package builds: `pnpm --filter @kit/ui run typecheck` (0 errors)
- [ ] Full build succeeds: `pnpm build` (all packages build successfully)
- [ ] Linting passes: `pnpm lint` (0 errors)
- [ ] Formatting correct: `pnpm format:fix` (no changes needed if run twice)
- [ ] No runtime errors in console (if running dev server)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Named imports not available in react-resizable-panels**:
   - **Likelihood**: low (Panel, PanelGroup, PanelResizeHandle are core exports)
   - **Impact**: high (build fails completely)
   - **Mitigation**: Check react-resizable-panels v4 release notes before implementation; these are documented core exports

2. **Payload 3.72.0 has incompatibilities with Next.js or other deps**:
   - **Likelihood**: low (Payload v3.72.0 is stable release)
   - **Impact**: medium (Payload app won't run)
   - **Mitigation**: Run `pnpm install && pnpm build` to validate; check Payload release notes for known issues

3. **Other apps depend on old react-resizable-panels API**:
   - **Likelihood**: very low (only UI package exports resizable components)
   - **Impact**: low (only resizable.tsx affected)
   - **Mitigation**: Global search for `ResizablePrimitive` to find all usages

**Rollback Plan**:

If this fix causes production issues:
1. Revert this commit: `git revert <commit-hash>`
2. Close Dependabot PR #1751 without merging
3. Alternatively: Configure Dependabot to not auto-update react-resizable-panels until ready
4. Revert Payload version back to 3.70.0 if compatibility issues found

**Monitoring** (if needed):

- Monitor `pnpm build` output for any TypeScript errors
- Watch for runtime errors related to resizable panel components
- Check Payload CMS initialization logs after deploy

## Performance Impact

**Expected Impact**: none

- Named imports may be slightly more efficient than namespace imports (tree-shaking benefits)
- No functional changes to component behavior
- No data fetching or rendering changes

## Security Considerations

**Security Impact**: none

- No security-relevant changes in this fix
- Both libraries (react-resizable-panels v4, payload v3.72.0) are maintained projects
- No new dependencies added
- No removal of security patches

## Validation Commands

### Before Fix (Bug Should Reproduce)

These commands will show errors before applying the fix:

```bash
# TypeScript check will fail with PanelGroup/PanelResizeHandle errors
pnpm typecheck

# Build will fail with getRangeRequestInfo import error
pnpm build

# Specific failures:
# - pnpm --filter @kit/ui typecheck → error TS2339: Property 'PanelGroup' does not exist
# - pnpm --filter payload build → error: 'getRangeRequestInfo' is not exported
```

**Expected Result**:
- TypeScript errors for `PanelGroup` and `PanelResizeHandle` in resizable.tsx
- Build error for missing `getRangeRequestInfo` export from payload/internal
- Total: 6 errors preventing build completion

### After Fix (Bug Should Be Resolved)

```bash
# Type check - must pass with 0 errors
pnpm typecheck

# Linting - must pass with no errors
pnpm lint

# Formatting - must pass
pnpm format:fix

# Build - must succeed
pnpm build

# Specific validations
pnpm --filter @kit/ui typecheck    # UI package types must resolve
pnpm --filter payload build         # Payload app must build successfully
```

**Expected Result**: All commands succeed, 0 errors, build completes without warnings related to imports

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test:unit
pnpm test:e2e

# Check that resizable components still work in dev
pnpm dev  # Browse to any page with resizable panels
```

## Dependencies

### New Dependencies (if any)

None - this fix only updates existing dependencies.

**Dependencies updated**:
- `react-resizable-panels`: 3.0.6 → 4.4.1 (already in Dependabot PR)
- `payload`: 3.70.0 → 3.72.0 (this fix adds it)

## Database Changes

**No database changes required** - This is purely a dependency and import pattern fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

- Standard `pnpm install && pnpm build && pnpm start` deployment process
- No database migrations needed
- No environment variable changes needed
- No rollout coordination needed

**Feature flags needed**: no

**Backwards compatibility**: maintained

- Components have same props and behavior
- Output HTML structure unchanged
- No breaking API changes in this fix

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass (typecheck, lint, format, build)
- [ ] `pnpm build` completes without errors
- [ ] Both `@kit/ui` typecheck and `payload build` succeed
- [ ] No TypeScript errors for `PanelGroup` or `PanelResizeHandle`
- [ ] No import errors for `getRangeRequestInfo`
- [ ] PR passes CI/CD workflow validation
- [ ] No regressions in existing tests
- [ ] Manual testing checklist complete

## Notes

**Implementation notes**:
- The fixes are mechanical and straightforward
- No complex logic changes needed
- Both issues are well-documented in diagnosis #1752
- react-resizable-panels v4 release notes confirm named exports for Panel, PanelGroup, PanelResizeHandle
- Payload v3.72.0 is stable with `getRangeRequestInfo` available in payload/internal

**Related documentation**:
- Diagnosis: `.ai/reports/bug-reports/2026-01-22/1752-diagnosis-dependabot-breaking-deps.md`
- Package docs: `packages/ui/package.json` (current version 3.0.6)
- Payload docs: `apps/payload/package.json` (current version 3.70.0)

**Related issues**:
- #1748: (CLOSED) Auto-rebase fix - working correctly
- #1750: (CLOSED) Workflow fixes - working correctly
- #1751: The Dependabot PR that introduces these changes

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1752*
