# Bug Diagnosis: React is not defined in Alpha Orchestrator UI

**ID**: ISSUE-1426
**Created**: 2026-01-12T10:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: error

## Summary

When running the Alpha Spec Orchestrator (`tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`), the UI dashboard fails to start with error "ReferenceError: React is not defined" at `ui/index.tsx:174`. The orchestrator continues without the UI but this breaks the intended dashboard functionality.

## Environment

- **Application Version**: N/A (internal tooling)
- **Environment**: development
- **Node Version**: (tsx runtime)
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown (new feature)

## Reproduction Steps

1. Navigate to project root: `/home/msmith/projects/2025slideheroes`
2. Run the orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
3. Observe the error message about UI dashboard failure

## Expected Behavior

The orchestrator should start with a functioning Ink-based terminal UI dashboard showing sandbox progress.

## Actual Behavior

The UI fails to initialize with:
```
⚠️ Failed to start UI dashboard: ReferenceError: React is not defined
    at UIManager.start (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/ui/index.tsx:174:26)
    at startOrchestratorUI (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/ui/index.tsx:233:10)
    at orchestrate (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/orchestrator.ts:627:16)
```

The orchestrator continues without UI mode, but the dashboard feature is broken.

## Diagnostic Data

### Console Output

```
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
⚠️ Failed to start UI dashboard: ReferenceError: React is not defined
    at UIManager.start (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/ui/index.tsx:174:26)
    at startOrchestratorUI (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/ui/index.tsx:233:10)
    at orchestrate (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/orchestrator.ts:627:16)
    at async main (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/spec-orchestrator.ts:90:2)
   Continuing without UI...
```

### Configuration Analysis

**ui/tsconfig.json**:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",  // Automatic JSX runtime
    ...
  }
}
```

**ui/index.tsx line 2**:
```typescript
import type * as React from "react";  // TYPE-ONLY import - erased at runtime!
```

**ui/index.tsx line 174** (where error occurs):
```typescript
this.instance = render(<OrchestratorApp config={this.config} />, {
```

**Working pattern in ui/components/OrchestratorUI.tsx**:
```typescript
import type { FC } from "react";
// biome-ignore lint/correctness/noUnusedImports: React must be in scope at runtime for Ink/react-reconciler
import React from "react";  // RUNTIME import - this is correct
```

## Error Stack Traces

```
ReferenceError: React is not defined
    at UIManager.start (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/ui/index.tsx:174:26)
    at startOrchestratorUI (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/ui/index.tsx:233:10)
    at orchestrate (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/orchestrator.ts:627:16)
    at async main (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/spec-orchestrator.ts:90:2)
```

## Related Code

- **Affected Files**:
  - `.ai/alpha/scripts/ui/index.tsx` (primary - missing React import)
- **Recent Changes**: New feature implementation
- **Suspected Functions**: `UIManager.start()` at line 174

## Related Issues & Context

### Direct Predecessors
None found - this is a new feature.

### Similar Symptoms
This is a common pattern with JSX and TypeScript's automatic JSX runtime when using `tsx` or other runtime transpilers.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The file `ui/index.tsx` uses a type-only React import (`import type * as React from "react"`) which is erased at compile time, but uses JSX syntax that requires React to be in scope at runtime when `tsx` doesn't properly apply the `react-jsx` automatic runtime transform.

**Detailed Explanation**:

1. **TypeScript Configuration**: The `ui/tsconfig.json` specifies `"jsx": "react-jsx"` which is the automatic JSX runtime introduced in React 17. With this setting, JSX should be transformed to `_jsx()` calls from `react/jsx-runtime`, NOT `React.createElement()` calls.

2. **Type-Only Import Problem**: Line 2 of `ui/index.tsx` uses:
   ```typescript
   import type * as React from "react";
   ```
   This is a TypeScript type-only import that gets completely removed during compilation. It provides types for the TypeScript compiler but no runtime value.

3. **Runtime Behavior**: When `tsx` (esbuild-based runtime) transpiles this file, it may not be properly picking up the `tsconfig.json` from the nested `ui/` directory. Instead, it might be using classic JSX transform behavior, converting `<OrchestratorApp ... />` to `React.createElement(OrchestratorApp, ...)`.

4. **The Crash**: Since `React` was only imported as a type (erased at runtime), the `React.createElement()` call fails with "React is not defined".

**Supporting Evidence**:
- Stack trace points directly to line 174 where JSX is used: `<OrchestratorApp config={this.config} />`
- The `OrchestratorUI.tsx` file in the same directory has the correct pattern with a biome-ignore comment explaining why React must be imported at runtime for Ink/react-reconciler
- The parent `tsconfig.json` explicitly excludes the `ui/` directory, so there may be config resolution issues

### How This Causes the Observed Behavior

1. `spec-orchestrator.ts` calls `orchestrate()` in `lib/orchestrator.ts`
2. `orchestrate()` dynamically imports `../ui/index.js` at line 626
3. `startOrchestratorUI()` is called, which creates a `UIManager` and calls `start()`
4. `start()` at line 174 tries to render JSX: `render(<OrchestratorApp ... />)`
5. `tsx` has transpiled this to `React.createElement()` but React is undefined
6. ReferenceError is thrown, caught by orchestrator, and UI is disabled

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message is explicit: "React is not defined"
- The stack trace points to the exact line with JSX
- The type-only import pattern is visible in the source code
- A working example of the correct pattern exists in `OrchestratorUI.tsx` in the same directory
- This is a well-known issue with TypeScript's automatic JSX runtime and various transpilers

## Fix Approach (High-Level)

Change line 2 of `.ai/alpha/scripts/ui/index.tsx` from:
```typescript
import type * as React from "react";
```
to:
```typescript
// biome-ignore lint/correctness/noUnusedImports: React must be in scope at runtime for Ink/react-reconciler
import React from "react";
import type { FC } from "react";
```

This matches the working pattern already used in `ui/components/OrchestratorUI.tsx` and ensures React is available at runtime for JSX transformation.

## Diagnosis Determination

The root cause has been conclusively identified: a type-only React import in `ui/index.tsx` that gets erased at runtime, combined with `tsx` not properly applying the automatic JSX runtime transform, results in `React.createElement()` calls without React being defined.

The fix is straightforward: change the type-only import to a runtime import, following the pattern already established in other files in the same directory.

## Additional Context

- The `tsx` runtime uses esbuild under the hood and may have quirks with nested tsconfig resolution
- Ink (terminal React renderer) has its own reconciler that may require React in scope regardless of JSX transform
- The biome-ignore comment in `OrchestratorUI.tsx` suggests this issue was encountered and solved before in this codebase

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Glob, Bash*
