# Bug Diagnosis: Blocks Form Submission Shows Empty Error Object

**ID**: ISSUE-1086
**Created**: 2025-12-11T00:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

When submitting the multi-step form at `/home/ai/blocks`, the final submission fails with an empty error object `{}` logged to the console. The error originates from the `handleFormSubmit` function in `BlocksForm.tsx` but provides no useful error information because the server action throws raw `Error` objects that don't serialize properly across the Next.js server-client boundary.

## Environment

- **Application Version**: Current dev branch (commit 6fef3eec8)
- **Environment**: development
- **Browser**: Any
- **Node Version**: 20+
- **Database**: PostgreSQL via Supabase
- **Next.js Version**: 16.0.7 (Turbopack)
- **Last Working**: Unknown

## Reproduction Steps

1. Navigate to `/home/ai/blocks`
2. Complete all questions in the multi-step form
3. Click "Submit" on the final question
4. Observe console error: `Form submission error: {}`

## Expected Behavior

Either:
1. The form submits successfully and redirects to `/home/ai`, OR
2. If an error occurs, the error message should be displayed to the user with meaningful information

## Actual Behavior

- Console shows: `Form submission error: {}`
- No useful error information is available
- User has no idea what went wrong
- Form submission silently fails

## Diagnostic Data

### Console Output
```
Form submission error: {}
    at Object.error (app/home/(user)/ai/blocks/_components/BlocksForm.tsx:40:12)
    at handleFormSubmit (app/home/(user)/ai/blocks/_components/BlocksForm.tsx:409:11)
```

### Network Analysis

The server action `submitBuildingBlocksAction` is being called, but when it throws an error, the error object becomes empty `{}` when received on the client side.

### Database Analysis

The `building_blocks_submissions` table exists with proper RLS policies. The actual database error (if any) is lost due to improper error serialization.

## Error Stack Traces

The stack trace points to the catch block in `handleFormSubmit`:

```typescript
// BlocksForm.tsx:408-412
} catch (_error) {
    logger.error("Form submission error:", {
        formData,
        error: _error,  // This is an empty object {}
    });
}
```

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/ai/blocks/_components/BlocksForm.tsx` (lines 382-416)
  - `apps/web/app/home/(user)/ai/blocks/_actions/submitBuildingBlocksAction.ts`
  - `apps/web/app/home/(user)/ai/blocks/_actions/tiptap-format-utils.ts`
- **Recent Changes**: Logging improvements and Biome 2.0 fixes
- **Suspected Functions**: `submitBuildingBlocksAction`, `handleFormSubmit`

## Related Issues & Context

### Similar Patterns in Codebase

The `ai-suggestions-action.ts` in the same directory correctly uses `enhanceAction` and returns `{ success: false, error: message }` pattern instead of throwing errors.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `submitBuildingBlocksAction` server action throws raw `Error` objects which don't serialize properly across the Next.js server-client boundary, resulting in empty error objects on the client.

**Detailed Explanation**:

1. **Server Action Pattern Violation**: The `submitBuildingBlocksAction.ts` does NOT use `enhanceAction` from `@kit/next/actions` unlike other server actions in the codebase (e.g., `ai-suggestions-action.ts`).

2. **Raw Error Throwing**: The server action throws `new Error("message")` directly:
   ```typescript
   // submitBuildingBlocksAction.ts:97
   throw new Error("Failed to submit building blocks");
   ```

3. **Error Serialization Issue**: When Next.js server actions throw errors, they are serialized and sent to the client. However, standard JavaScript `Error` objects don't serialize well - their `message`, `stack`, and `name` properties are non-enumerable, so `JSON.stringify(new Error("test"))` returns `"{}"`.

4. **Client-Side Catch**: The `handleFormSubmit` catches the error but receives only an empty object:
   ```typescript
   // BlocksForm.tsx:408-412
   } catch (_error) {
       logger.error("Form submission error:", {
           error: _error,  // Empty object {}
       });
   }
   ```

5. **Secondary Issue**: The `tiptap-format-utils.ts` has `"use client"` directive but is imported in a server action. While this doesn't directly cause the error, it's a code smell that could cause issues.

**Supporting Evidence**:
- Stack trace shows error at line 40 in BlocksForm.tsx (the logger.error call)
- Error object is `{}` (empty) which is characteristic of serialized Error objects
- Comparison with `ai-suggestions-action.ts` shows correct pattern using `enhanceAction` and returning error objects instead of throwing

### How This Causes the Observed Behavior

1. User submits the form
2. `handleFormSubmit` calls `submitBuildingBlocksAction`
3. Server action encounters an error (auth, database, or validation)
4. Server action throws `new Error("message")`
5. Next.js serializes the error for transmission to client
6. `Error` object serializes to `{}` (empty object)
7. Client receives empty object in catch block
8. Logger outputs "Form submission error: {}"
9. User sees nothing - no error message, no redirect

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The error serialization behavior is well-documented in Next.js
2. The codebase has a correct pattern (`ai-suggestions-action.ts`) that doesn't have this issue
3. The empty object `{}` is the expected result of serializing an Error object
4. The `enhanceAction` pattern is documented in the project's CLAUDE.md as the required approach

## Fix Approach (High-Level)

Refactor `submitBuildingBlocksAction.ts` to:
1. Use `enhanceAction` from `@kit/next/actions` for proper error handling
2. Add a Zod schema for input validation
3. Return `{ success: false, error: "message" }` on error instead of throwing
4. Update `BlocksForm.tsx` to handle the return value pattern instead of try/catch

Additionally:
- Remove `"use client"` directive from `tiptap-format-utils.ts` since it's used in a server action
- Update `handleFormSubmit` to check for `result.success` and display errors to the user

## Diagnosis Determination

The root cause has been conclusively identified: improper error handling in `submitBuildingBlocksAction.ts` that throws raw `Error` objects instead of using the project's established `enhanceAction` pattern. This causes errors to serialize as empty objects when crossing the server-client boundary.

## Additional Context

The project's `packages/next/CLAUDE.md` explicitly documents the correct pattern:
- "Always use `enhanceAction` from `@packages/next/src/actions/index.ts`"
- Server actions should return `{ success: true/false, error?: string }` patterns

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash (git log, gh issue list)*
