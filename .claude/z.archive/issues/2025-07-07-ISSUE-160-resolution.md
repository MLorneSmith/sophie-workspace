# Resolution Report: Turbopack Build Failure on Survey Page

**Issue ID**: ISSUE-160
**Resolved Date**: 2025-07-08T16:00:00Z
**Resolver**: Claude Debug Assistant

## Root Cause

The Turbopack build was failing due to two separate issues:

1. **Dynamic imports in logger**: The survey page was using `await getLogger()` inside the component body during rendering, which triggered dynamic imports. Turbopack has stricter module instantiation rules compared to webpack.

2. **Non-async exports in "use server" file**: The server actions file was exporting Zod schema objects (SaveResponseSchema, CompleteSurveySchema) alongside async functions. Turbopack enforces that "use server" files can only export async functions.

## Solution Implemented

### 1. Refactored logger usage in survey page (page.tsx)
- Kept the `createServiceLogger` import and initialization at module level
- Created an async helper function `processQuestions()` that handles logging outside of component rendering
- Moved all question processing logic including logger calls into this helper
- Removed type transformations that were incompatible with the expected SurveyQuestion type

### 2. Fixed server actions exports (server-actions.ts)
- Changed `export const SaveResponseSchema` to `const SaveResponseSchema`
- Changed `export const CompleteSurveySchema` to `const CompleteSurveySchema`
- Kept the schemas as internal constants used by the enhanced actions

## Files Modified

1. `/apps/web/app/home/(user)/assessment/survey/page.tsx`
   - Created `processQuestions()` async helper function
   - Moved `await getLogger()` call into the helper function
   - Preserved logging functionality while avoiding Turbopack issues
   - Fixed type compatibility with `@kit/cms-types` SurveyQuestion

2. `/apps/web/app/home/(user)/assessment/_lib/server/server-actions.ts`
   - Made Zod schemas internal constants instead of exports

## Verification Results

- ✅ Turbopack build successful (`pnpm build:test`)
- ✅ No type errors (`pnpm typecheck`)
- ✅ No lint errors (`pnpm lint`)
- ✅ Survey page builds correctly at 120 kB
- ✅ Logging functionality preserved

## Lessons Learned

1. **Turbopack is stricter about module boundaries**: Dynamic imports should not be used during page rendering, but can be used in async helper functions
2. **"use server" enforcement**: Turbopack strictly enforces that "use server" files only export async functions
3. **Logger initialization**: For server components, use async helper functions to handle logger initialization outside of the component body
4. **Follow Enhanced Logger documentation**: The `.claude/context/systems/enhanced-logger.md` provides proper patterns for async logger usage

## Prevention

- Use async helper functions for operations that require `await getLogger()`
- Keep "use server" files clean with only async function exports
- Follow the enhanced logger patterns documented in the codebase
- Test with Turbopack builds regularly during development to catch issues early