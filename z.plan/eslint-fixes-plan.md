# ESLint Issues: Categorization and Fix Plan (Updated)

This document outlines a systematic approach to address the ESLint errors identified in the GitHub Actions workflow. By categorizing the issues and tackling them methodically, we can efficiently improve code quality while maintaining functionality.

## Summary of Issues

**Original Issues**: 51 issues (49 errors, 2 warnings)  
**Current Issues**: 31 issues (29 errors, 2 warnings)  
**Issues Fixed**: 20 issues (39% complete)

## Categories of Issues

### 1. Unused Variables/Imports (15 remaining issues)

- **Unused variables**: Variables defined but never used
- **Unused imports**: Imports that are never referenced
- **Unused parameters**: Function parameters that aren't used in the function body
- **Fix pattern**: Prefix with underscore (e.g., `user` → `_user`) or remove if not needed

### 2. Type Issues (10 remaining issues)

- **Any type usage**: Using `any` where a more specific type should be used
- **Empty object type**: Using `{}` which is too permissive
- **Fix pattern**: Replace with more specific types like `unknown`, `Record<string, unknown>`, or custom interfaces

### 3. React Hook Warnings (2 remaining issues)

- **useCallback dependencies**: Missing or unknown dependencies
- **useRef cleanup**: Issues with ref handling in effect cleanup
- **Fix pattern**: Fix dependency arrays or restructure code

## Files Grouped by Component Area

### AI Canvas Components (23 issues)

- [x] `app/home/(user)/ai/canvas/_actions/generate-ideas.ts`
- [x] `app/home/(user)/ai/canvas/_actions/generate-outline.ts`
- [x] `app/home/(user)/ai/canvas/_actions/simplify-text.ts`
- [ ] `app/home/(user)/ai/canvas/_components/editor-panel.tsx`
- [ ] `app/home/(user)/ai/canvas/_components/editor/lexical-editor.tsx`
- [ ] `app/home/(user)/ai/canvas/_components/editor/plugins/format-preservation.plugin.tsx`
- [ ] `app/home/(user)/ai/canvas/_components/editor/plugins/format/nodes/formatted-element.node.tsx`
- [ ] `app/home/(user)/ai/canvas/_components/editor/tab-content.tsx`
- [ ] `app/home/(user)/ai/canvas/_components/editor/toolbar-plugin.tsx`
- [ ] `app/home/(user)/ai/canvas/_components/editor/utils/format-serialization.ts`
- [ ] `app/home/(user)/ai/canvas/_components/suggestions/suggestions-pane.tsx`
- [ ] `app/home/(user)/ai/canvas/_components/top-bar.tsx`
- [x] `app/home/(user)/ai/canvas/actions/generate-improvements.ts`

### Kanban Components (15 issues)

- [x] `app/home/(user)/kanban/_components/column.tsx`
- [x] `app/home/(user)/kanban/_components/task-card.tsx`
- [ ] `app/home/(user)/kanban/_components/task-dialog.tsx` (Partially fixed - still has any type issue)
- [x] `app/home/(user)/kanban/_components/task-form.tsx`
- [x] `app/home/(user)/kanban/_lib/api/tasks.ts`
- [x] `app/home/(user)/kanban/_lib/hooks/use-tasks.ts`

### Other Components (5 issues)

- [ ] `app/home/(user)/ai/blocks/_components/BlocksForm.tsx`
- [ ] `supabase/migrations/payload/20250226_202422_initial_schema.ts`

## Detailed Issue List (Remaining Issues)

### Unused Variables/Parameters

| File                                                            | Line   | Issue                                                        | Fix             |
| --------------------------------------------------------------- | ------ | ------------------------------------------------------------ | --------------- |
| `ai/canvas/_components/editor-panel.tsx`                        | 43:10  | 'ErrorBoundary' is defined but never used                    | Prefix with `_` |
| `ai/canvas/_components/editor-panel.tsx`                        | 54:9   | 'supabase' is assigned a value but never used                | Prefix with `_` |
| `ai/canvas/_components/editor/lexical-editor.tsx`               | 349:22 | 'error' is defined but never used                            | Prefix with `_` |
| `ai/canvas/_components/editor/lexical-editor.tsx`               | 412:11 | 'DEFAULT_EDITOR_STATE' is assigned a value but never used    | Prefix with `_` |
| `ai/canvas/_components/editor/lexical-editor.tsx`               | 483:11 | 'handleAcceptImprovement' is assigned a value but never used | Prefix with `_` |
| `ai/canvas/_components/editor/tab-content.tsx`                  | 8:15   | 'LexicalEditor' is defined but never used                    | Prefix with `_` |
| `ai/canvas/_components/editor/toolbar-plugin.tsx`               | 8:10   | 'editor' is assigned a value but never used                  | Prefix with `_` |
| `ai/canvas/_components/suggestions/suggestions-pane.tsx`        | 28:3   | 'content' is defined but never used                          | Prefix with `_` |
| `ai/canvas/_components/suggestions/suggestions-pane.tsx`        | 29:3   | 'submissionId' is defined but never used                     | Prefix with `_` |
| `ai/canvas/_components/suggestions/suggestions-pane.tsx`        | 30:3   | 'type' is defined but never used                             | Prefix with `_` |
| `ai/canvas/_components/top-bar.tsx`                             | 3:10   | 'useCallback' is defined but never used                      | Prefix with `_` |
| `ai/canvas/_components/top-bar.tsx`                             | 10:18  | 'buttonVariants' is defined but never used                   | Prefix with `_` |
| `ai/canvas/_components/top-bar.tsx`                             | 13:10  | 'cn' is defined but never used                               | Prefix with `_` |
| `supabase/migrations/payload/20250226_202422_initial_schema.ts` | 3:32   | 'payload' is defined but never used                          | Prefix with `_` |
| `supabase/migrations/payload/20250226_202422_initial_schema.ts` | 3:41   | 'req' is defined but never used                              | Prefix with `_` |
| `supabase/migrations/payload/20250226_202422_initial_schema.ts` | 191:34 | 'payload' is defined but never used                          | Prefix with `_` |
| `supabase/migrations/payload/20250226_202422_initial_schema.ts` | 191:43 | 'req' is defined but never used                              | Prefix with `_` |

### Type Issues

| File                                                                           | Line  | Issue             | Fix                                    |
| ------------------------------------------------------------------------------ | ----- | ----------------- | -------------------------------------- |
| `ai/canvas/_components/editor/lexical-editor.tsx`                              | 73:18 | Unexpected any    | Replace with appropriate type          |
| `ai/canvas/_components/editor/plugins/format-preservation.plugin.tsx`          | 59:38 | Unexpected any    | Replace with appropriate type          |
| `ai/canvas/_components/editor/plugins/format-preservation.plugin.tsx`          | 86:41 | Unexpected any    | Replace with appropriate type          |
| `ai/canvas/_components/editor/plugins/format/nodes/formatted-element.node.tsx` | 6:3   | Empty object type | Replace with `Record<string, unknown>` |
| `ai/canvas/_components/editor/tab-content.tsx`                                 | 75:52 | Unexpected any    | Replace with appropriate type          |
| `ai/canvas/_components/editor/utils/format-serialization.ts`                   | 7:51  | Unexpected any    | Replace with appropriate type          |
| `ai/canvas/_components/editor/utils/format-serialization.ts`                   | 7:57  | Unexpected any    | Replace with appropriate type          |
| `ai/canvas/_components/editor/utils/format-serialization.ts`                   | 38:63 | Unexpected any    | Replace with appropriate type          |
| `ai/canvas/_components/editor/utils/format-serialization.ts`                   | 38:69 | Unexpected any    | Replace with appropriate type          |
| `kanban/_components/task-dialog.tsx`                                           | 74:18 | Unexpected any    | Replace with appropriate type          |

### React Hook Warnings

| File                                              | Line   | Issue                                                                                                    | Fix                            |
| ------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `ai/blocks/_components/BlocksForm.tsx`            | 41:28  | React Hook useCallback received a function whose dependencies are unknown                                | Pass an inline function        |
| `ai/canvas/_components/editor/lexical-editor.tsx` | 404:41 | The ref value 'editorRef.current' will likely have changed by the time this effect cleanup function runs | Copy to variable inside effect |

## Updated Fix Plan

### Phase 1: Fix High-Impact Files (COMPLETED)

1. **Kanban API and Hooks** (COMPLETED)

   - [x] `app/home/(user)/kanban/_lib/api/tasks.ts`
   - [x] `app/home/(user)/kanban/_lib/hooks/use-tasks.ts`

2. **AI Canvas Actions** (COMPLETED)
   - [x] `app/home/(user)/ai/canvas/_actions/generate-ideas.ts`
   - [x] `app/home/(user)/ai/canvas/_actions/generate-outline.ts`
   - [x] `app/home/(user)/ai/canvas/_actions/simplify-text.ts`
   - [x] `app/home/(user)/ai/canvas/actions/generate-improvements.ts`

### Phase 2: Fix UI Component Files (IN PROGRESS)

1. **Kanban Components** (75% COMPLETED)

   - [x] `app/home/(user)/kanban/_components/task-form.tsx`
   - [x] `app/home/(user)/kanban/_components/task-card.tsx`
   - [ ] `app/home/(user)/kanban/_components/task-dialog.tsx` (Partially fixed - still has any type issue)
   - [x] `app/home/(user)/kanban/_components/column.tsx`

2. **AI Canvas Editor Components** (0% COMPLETED)
   - [ ] `app/home/(user)/ai/canvas/_components/editor-panel.tsx`
   - [ ] `app/home/(user)/ai/canvas/_components/editor/lexical-editor.tsx`
   - [ ] `app/home/(user)/ai/canvas/_components/editor/plugins/format-preservation.plugin.tsx`
   - [ ] `app/home/(user)/ai/canvas/_components/editor/plugins/format/nodes/formatted-element.node.tsx`
   - [ ] `app/home/(user)/ai/canvas/_components/editor/tab-content.tsx`
   - [ ] `app/home/(user)/ai/canvas/_components/editor/toolbar-plugin.tsx`
   - [ ] `app/home/(user)/ai/canvas/_components/editor/utils/format-serialization.ts`
   - [ ] `app/home/(user)/ai/canvas/_components/suggestions/suggestions-pane.tsx`
   - [ ] `app/home/(user)/ai/canvas/_components/top-bar.tsx`

### Phase 3: Fix Remaining Files (0% COMPLETED)

1. **Migration Files**

   - [ ] `supabase/migrations/payload/20250226_202422_initial_schema.ts`

2. **Block Components**
   - [ ] `app/home/(user)/ai/blocks/_components/BlocksForm.tsx`

## Recommended Next Steps

1. **Focus on AI Canvas Editor Components**:

   - These files contain the majority of the remaining issues
   - Start with the simpler unused variable fixes before tackling the type issues

2. **Address Type Issues**:

   - Replace `any` types with more specific types
   - Replace empty object type `{}` with `Record<string, unknown>` or more specific types

3. **Fix React Hook Warnings**:
   - Address the useCallback dependencies issue in BlocksForm.tsx
   - Fix the ref cleanup issue in lexical-editor.tsx

## Fix Approach for Each File

1. **Open the file** and identify all linting issues
2. **Group similar issues** within the file (e.g., all unused variables)
3. **Fix each group systematically**:
   - For unused variables/parameters: Prefix with underscore
   - For unused imports: Remove them
   - For any types: Replace with appropriate specific types
   - For restricted imports: Update import paths
4. **Test the file** after fixes to ensure functionality is preserved

## Progress Tracking

Use this document as a checklist by marking files as complete once fixed:

- [ ] Not started
- [x] Completed
