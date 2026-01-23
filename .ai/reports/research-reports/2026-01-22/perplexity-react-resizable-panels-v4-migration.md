# Perplexity Research: react-resizable-panels v4 Migration

**Date**: 2026-01-22
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary
Researched breaking changes in react-resizable-panels v4, specifically why `PanelGroup` and `PanelResizeHandle` would not be exported when using namespace import pattern (`import * as ResizablePrimitive from "react-resizable-panels"`), and the correct import pattern for v4.4.1.

## Findings

### Current Version
- **Latest version**: 4.4.1 (released approximately January 2026)
- **Previous major**: 3.0.6

### Export Names - NO CHANGE
The component export names remain **unchanged** between v3 and v4:
- `Panel` - Individual resizable panel
- `PanelGroup` - Container for panels
- `PanelResizeHandle` - Drag handle between panels

Additionally, utility functions are exported:
- `getPanelElement`
- `getPanelGroupElement`
- `getResizeHandleElement`
- `setNonce`
- `disableGlobalCursorStyles`

### The Real Issue: TypeScript Type Definitions

The TypeScript error `Property 'PanelGroup' does not exist on type 'typeof import("react-resizable-panels")'` is **NOT** caused by export name changes. The issue is with how TypeScript resolves namespace imports with the library's module structure.

### Root Cause Analysis

1. **ESM-only module (v3.0.0+)**: The package became ESM-only to better work with modern tooling.

2. **TypeScript type resolution**: When using `import * as ResizablePrimitive`, TypeScript may not properly resolve the types from the package's type definitions, especially with certain `moduleResolution` settings.

3. **Known TypeScript/React type issues**: GitHub issue #256 documented similar TypeScript errors where components couldn't be used as JSX components due to React TypeScript type changes for server components.

### Correct Import Pattern for v4.4.1

**RECOMMENDED - Named imports (always works):**
```typescript
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
```

**Namespace import (if needed for aliasing):**
```typescript
import * as ResizablePrimitive from "react-resizable-panels";

// Access via namespace
<ResizablePrimitive.PanelGroup direction="horizontal">
  <ResizablePrimitive.Panel>Content</ResizablePrimitive.Panel>
  <ResizablePrimitive.PanelResizeHandle />
</ResizablePrimitive.PanelGroup>
```

### Migration Steps

1. **Change from namespace to named imports**:
   ```typescript
   // Before (causes TypeScript error)
   import * as ResizablePrimitive from "react-resizable-panels";
   
   // After (works correctly)
   import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
   ```

2. **If namespace aliasing is required**, create a wrapper:
   ```typescript
   import { 
     Panel, 
     PanelGroup, 
     PanelResizeHandle 
   } from "react-resizable-panels";
   
   export const ResizablePrimitive = {
     Panel,
     PanelGroup,
     PanelResizeHandle,
   };
   ```

3. **Verify TypeScript configuration**:
   - Ensure `moduleResolution` is set to `bundler` or `node16`
   - Restart TypeScript server after changes

### shadcn/ui Resizable Component

The shadcn/ui resizable component wraps react-resizable-panels and re-exports as:
- `ResizablePanel` (wraps `Panel`)
- `ResizablePanelGroup` (wraps `PanelGroup`)
- `ResizableHandle` (wraps `PanelResizeHandle`)

Import from the local shadcn component:
```typescript
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
```

### v3 to v4 Breaking Changes (from CHANGELOG)

The v3.0.0 release notes:
- Module is ESM-only to better work with modern tooling
- `pointerup` and `pointercancel` listeners attached to `ownerDocument` body for better portal support

No export name changes were documented between v3 and v4.

## Sources & Citations
- https://www.npmjs.com/package/react-resizable-panels
- https://github.com/bvaughn/react-resizable-panels
- https://github.com/bvaughn/react-resizable-panels/blob/main/packages/react-resizable-panels/CHANGELOG.md
- https://ui.shadcn.com/docs/components/resizable
- https://github.com/bvaughn/react-resizable-panels/issues/256

## Key Takeaways

- **Export names are unchanged**: `Panel`, `PanelGroup`, `PanelResizeHandle` remain the same in v4
- **Use named imports**: Replace `import * as ResizablePrimitive` with named imports
- **TypeScript issue**: The error is a TypeScript module resolution issue, not an export change
- **For shadcn/ui**: Import from `@/components/ui/resizable` which provides the wrapper components

## Related Searches
- TypeScript moduleResolution settings for ESM packages
- shadcn/ui resizable component customization
- react-resizable-panels imperative API usage
