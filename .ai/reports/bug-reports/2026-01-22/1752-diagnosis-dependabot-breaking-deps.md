# Bug Diagnosis: Dependabot PR #1751 Contains Breaking Dependency Updates

**ID**: ISSUE-pending
**Created**: 2026-01-22T19:45:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: regression

## Summary

PR Validation workflow continues failing on Dependabot PRs despite implementing fixes from issues #1748 and #1750. The root cause is **NOT** a CI/CD configuration issue - it's that Dependabot PR #1751 introduces breaking dependency updates requiring code changes:

1. **react-resizable-panels**: 3.0.6 → 4.4.1 (breaking export changes)
2. **@payloadcms/* packages**: 3.70.0 → 3.72.0 (version mismatch with `payload` 3.70.0)

The fixes from #1748 and #1750 were correctly implemented and merged - the current failures are from new Dependabot PRs that update to incompatible versions.

## Environment

- **Application Version**: dev branch (latest)
- **Environment**: CI/CD (GitHub Actions)
- **Node Version**: 20
- **Database**: PostgreSQL (Supabase)
- **Last Working**: 2026-01-22T16:48:26Z (before Dependabot PR #1751 opened)

## Reproduction Steps

1. Dependabot opens PR #1751 with 45 production dependency updates
2. PR Validation workflow triggers on the PR branch
3. TypeScript check fails with `react-resizable-panels` export errors
4. Build fails with Payload `getRangeRequestInfo` import error

## Expected Behavior

PR Validation workflow should pass after implementing fixes from #1748 and #1750.

## Actual Behavior

PR Validation fails with two distinct error categories:

1. **TypeScript Check** - 5 errors in `packages/ui/src/shadcn/resizable.tsx`:
   - `Property 'PanelGroup' does not exist on type 'typeof import("react-resizable-panels")'`
   - `Property 'PanelResizeHandle' does not exist on type 'typeof import("react-resizable-panels")'`

2. **Payload Build** - 1 error in apps/payload:
   - `Attempted import error: 'getRangeRequestInfo' is not exported from 'payload/internal'`

## Diagnostic Data

### Console Output
```
TypeScript Check:
src/shadcn/resizable.tsx(10,51): error TS2339: Property 'PanelGroup' does not exist on type
src/shadcn/resizable.tsx(11,22): error TS2339: Property 'PanelGroup' does not exist on type
src/shadcn/resizable.tsx(26,51): error TS2339: Property 'PanelResizeHandle' does not exist on type
src/shadcn/resizable.tsx(29,22): error TS2339: Property 'PanelResizeHandle' does not exist on type
src/shadcn/resizable.tsx(41,23): error TS2339: Property 'PanelResizeHandle' does not exist on type

Bundle Size Check:
Attempted import error: 'getRangeRequestInfo' is not exported from 'payload/internal'
Build failed because of webpack errors
payload#build: command exited (1)
```

### Dependency Version Changes (PR #1751)
```diff
# react-resizable-panels
- "react-resizable-panels": "^3.0.6"
+ "react-resizable-panels": "^4.4.1"

# Payload CMS packages
- "@payloadcms/db-postgres": "3.70.0"
+ "@payloadcms/db-postgres": "3.72.0"
- "@payloadcms/next": "^3.70.0"
+ "@payloadcms/next": "^3.72.0"
- "@payloadcms/richtext-lexical": "3.70.0"
+ "@payloadcms/richtext-lexical": "3.72.0"
# ... (all @payloadcms/* packages: 3.70.0 → 3.72.0)
# BUT: "payload": "3.70.0" remains unchanged (version mismatch!)
```

## Error Stack Traces
```
TypeScript Check:
##[error]src/shadcn/resizable.tsx(10,51): error TS2339: Property 'PanelGroup' does not exist
##[error]@kit/ui#typecheck: command (/home/runner/_work/.../packages/ui) pnpm run typecheck exited (2)

Bundle Size Check:
[ERROR] command finished with error: command (apps/payload) pnpm run build exited (1)
##[error]payload#build: command (apps/payload) pnpm run build exited (1)
```

## Related Code
- **Affected Files**:
  - `packages/ui/src/shadcn/resizable.tsx` (TypeScript errors)
  - `apps/payload/` (build errors)
  - `packages/ui/package.json` (react-resizable-panels dependency)
  - `apps/payload/package.json` (Payload dependencies)
- **Recent Changes**: Dependabot PR #1751 with 45 dependency updates
- **Suspected Functions**:
  - Namespace import pattern in resizable.tsx
  - Payload internal imports requiring version alignment

## Related Issues & Context

### Direct Predecessors
- #1750 (CLOSED): "Bug Fix: PR Validation Workflow Multiple Failures" - Different root cause (Aikido scan, Docker SARIF, test file)
- #1748 (CLOSED): "Bug Fix: PR Validation Fails on Dependabot PRs Due to Stale Workflow Files" - Auto-rebase fix (working correctly)
- #1749 (CLOSED): Diagnosis for #1750

### Same Component
- PR #1751 is the Dependabot PR causing failures
- PR #1728: Another stale Dependabot PR (tar update) - also failing

### Historical Context
The #1748 fix (auto-rebase) is working correctly - Dependabot PRs now rebase and get latest workflow config. However, PR #1751 introduces breaking dependency changes that require code modifications, not just workflow fixes.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Dependabot PR #1751 updates dependencies with breaking changes that require code modifications - this is NOT a CI/CD configuration issue.

**Detailed Explanation**:

**Root Cause 1: react-resizable-panels v4 breaking change**
- The library changed its export structure in v4.0.0 (now ESM-only)
- Current code uses namespace import: `import * as ResizablePrimitive from "react-resizable-panels"`
- This pattern no longer works reliably with the ESM-only module structure
- TypeScript cannot resolve `PanelGroup` and `PanelResizeHandle` from the namespace import

**Root Cause 2: Payload CMS version mismatch**
- Dependabot updated `@payloadcms/*` packages (db-postgres, next, richtext-lexical, etc.) from 3.70.0 → 3.72.0
- BUT: The `payload` package itself remains at 3.70.0 (not included in update group)
- `@payloadcms/next@3.72.0` imports `getRangeRequestInfo` from `payload/internal`
- This function was **introduced in payload 3.72.0** and doesn't exist in 3.70.0
- Result: Import error at build time

**Supporting Evidence**:
- Error logs show exact TypeScript errors for `PanelGroup` and `PanelResizeHandle`
- Error logs show exact import error for `getRangeRequestInfo`
- PR #1751 diff shows version changes but `payload` package not updated to match
- GitHub Actions workflow runs before #1751: passing; after #1751: failing

### How This Causes the Observed Behavior

1. Dependabot creates PR #1751 with 45 dependency updates
2. PR Validation runs on the PR branch (not dev) which has the new dependencies
3. `pnpm install` resolves new versions: react-resizable-panels@4.4.1, @payloadcms/*@3.72.0
4. TypeScript check runs → fails because `import * as X from "react-resizable-panels"` doesn't expose expected properties
5. Build runs → fails because `@payloadcms/next@3.72.0` imports function not present in `payload@3.70.0`

### Confidence Level

**Confidence**: High

**Reasoning**:
- Error messages directly reference the exact packages being updated
- The errors did not exist before PR #1751 (workflow runs show success immediately before)
- The issues #1748 and #1750 addressed completely different problems (workflow config, not dependency compatibility)
- Research confirms both libraries have known breaking changes in these versions

## Fix Approach (High-Level)

**For react-resizable-panels v4**:
Change namespace import to named imports in `packages/ui/src/shadcn/resizable.tsx`:
```typescript
// Before
import * as ResizablePrimitive from "react-resizable-panels";

// After
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
```
Then update component references accordingly.

**For Payload CMS version mismatch**:
Either:
1. Add `"payload": "3.72.0"` to Dependabot update group to ensure version alignment
2. Or manually add `payload` package update to PR #1751
3. Remove the pnpm patch for payload 3.70.0 if it's blocking the update

**Alternative**: Close PR #1751 and configure Dependabot to group Payload packages properly.

## Diagnosis Determination

The PR Validation workflow is failing as expected - the Dependabot PR contains breaking dependency updates that require code changes. This is not a CI/CD bug; it's working correctly by catching incompatible dependencies.

**Recommended Actions**:
1. Close PR #1751 without merging (too many breaking changes at once)
2. Create separate PRs for:
   - react-resizable-panels upgrade (with code fixes)
   - Payload CMS upgrade (ensuring all packages including `payload` are updated together)
3. Update Dependabot configuration to group Payload packages with the main `payload` package

## Additional Context

- The fixes from #1748 (auto-rebase) and #1750 (workflow fixes) are working correctly
- These were for different problems: stale workflow files and missing env vars/scan configs
- The current failure is expected behavior - PR validation is correctly catching breaking changes
- No action needed on PR Validation workflow - code changes needed in the Dependabot PR

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI (run list, run view, pr view, pr diff), grep, jq, perplexity-expert research agents*
