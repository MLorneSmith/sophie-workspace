# Bug Fix: Blocks Form Submission Shows Empty Error Object

**Related Diagnosis**: #1086
**Severity**: medium
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `submitBuildingBlocksAction` throws raw `Error` objects which don't serialize properly across the Next.js server-client boundary, causing them to serialize as `{}` in the browser console
- **Fix Approach**: Refactor to use `enhanceAction` pattern with Zod schema validation and structured error returns
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When submitting the multi-step form at `/home/ai/blocks`, the final submission fails with an empty error object `{}` logged to the console. This occurs because:

1. **Server Action Pattern Violation**: `submitBuildingBlocksAction` does NOT use `enhanceAction` unlike other actions in the codebase
2. **Raw Error Throwing**: The action throws `new Error("message")` directly without serialization-safe wrapping
3. **Serialization Issue**: `Error` objects have non-enumerable properties, so they serialize to `{}` when crossing the Next.js server-client boundary

The user sees no useful error information, making debugging impossible.

### Solution Approaches Considered

#### Option 1: Refactor to use `enhanceAction` pattern ⭐ RECOMMENDED

**Description**:
Convert `submitBuildingBlocksAction` to use the `enhanceAction` wrapper from `@kit/next/actions`, following the established server action pattern used throughout the codebase. This includes:
- Adding Zod schema for input validation
- Returning structured error responses `{ success: false, error: "message" }` instead of throwing
- Removing "use client" from utility functions
- Proper error serialization

**Pros**:
- Aligns with project's established `enhanceAction` pattern (consistency)
- Automatic input validation via Zod
- Built-in error handling and serialization
- Makes error messages visible to client/user
- Easier testing and debugging
- Better security (validates at boundary)

**Cons**:
- Requires refactoring the entire action function
- Changes return type for the caller

**Risk Assessment**: low - This is the standard pattern used throughout the codebase. Clear example patterns exist in the documentation.

**Complexity**: simple - Straightforward refactoring following established patterns

#### Option 2: Keep current structure, wrap errors better

**Description**:
Keep the current action but catch errors and return `{ success: false, error: string }` instead of throwing, without using `enhanceAction`.

**Pros**:
- Less refactoring needed
- Fixes the immediate serialization issue

**Cons**:
- Doesn't follow project conventions
- Loses automatic input validation
- Manual error handling is error-prone
- Less secure (no validation at boundary)

**Why Not Chosen**: Doesn't align with project patterns. The `enhanceAction` pattern exists for a reason.

#### Option 3: Use try-catch wrapper in client

**Description**:
Update `BlocksForm.tsx` to handle the error response with better logging/user feedback without changing the server action.

**Pros**:
- Minimal server-side changes

**Cons**:
- Doesn't fix the root cause (error serialization)
- Masks the underlying issue rather than solving it
- Client still receives empty object

**Why Not Chosen**: This is a band-aid solution. The server action pattern itself is the problem.

### Selected Solution: Refactor to use `enhanceAction` pattern

**Justification**:
The `enhanceAction` pattern is the project standard for all server actions. It provides:
- Automatic validation, authentication, and error handling
- Proper serialization of errors across server-client boundary
- Consistency with 20+ other actions in the codebase
- Built-in security and error tracking via logger

This is a low-risk change that fixes the root cause while improving the code quality.

**Technical Approach**:

1. **Create Zod schema** for `SubmitFormData` input validation
2. **Refactor the action** to use `enhanceAction` wrapper
3. **Return structured responses** instead of throwing errors
4. **Update client caller** to handle the new response pattern
5. **Remove "use client"** from `tiptap-format-utils.ts` (it's only used server-side)
6. **Update error handling** in `BlocksForm.tsx` to use the response object

**Architecture Changes**:
- Server action now validates input at boundary
- Error handling becomes explicit via return values
- Client receives structured responses with clear error messages

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/ai/blocks/_actions/submitBuildingBlocksAction.ts` - Refactor to use enhanceAction, add Zod schema
- `apps/web/app/home/(user)/ai/blocks/_components/BlocksForm.tsx` - Update error handling, handle response object instead of thrown errors
- `apps/web/app/home/(user)/ai/blocks/_actions/tiptap-format-utils.ts` - Remove "use client" directive (only used server-side)

### New Files

- `apps/web/app/home/(user)/ai/blocks/_lib/schemas/submit-building-blocks.schema.ts` - Zod schema for input validation

### Step-by-Step Tasks

#### Step 1: Create Zod validation schema

Define validation schema for the form submission data in a dedicated schema file. This ensures:
- Type-safe input validation at the server boundary
- Clear validation rules for each field
- Reusable schema for testing

**Subtasks**:
- Create `_lib/schemas/submit-building-blocks.schema.ts`
- Define `SubmitBuildingBlocksSchema` with Zod validation rules
- Export schema and infer TypeScript type from it

#### Step 2: Refactor server action to use enhanceAction

Convert the action to follow the project's standard `enhanceAction` pattern:
- Remove direct error throwing
- Add structured return values
- Use Zod schema for automatic validation
- Keep all business logic intact

**Why this step first**: The schema must exist before we can use it in `enhanceAction`.

**Subtasks**:
- Import `enhanceAction` from `@kit/next/actions`
- Wrap the action function with `enhanceAction`
- Replace thrown errors with structured return objects `{ success: false, error: "message" }`
- Pass schema to `enhanceAction` config
- Keep the business logic (database operations) unchanged
- Ensure "use server" directive is at the top

#### Step 3: Update client-side form handling

Modify `BlocksForm.tsx` to handle the new response pattern from the server action:
- Change from expecting thrown errors to handling response objects
- Update error logging to use structured response
- Update loading state and success handling

**Subtasks**:
- Update `handleFormSubmit` to check `response.success` instead of catching exceptions
- Update error logging to use `response.error` message
- Ensure user feedback is clear and helpful
- Test with both success and error scenarios

#### Step 4: Remove "use client" from utilities

Remove the "use client" directive from `tiptap-format-utils.ts` since it's only imported and used on the server side (`submitBuildingBlocksAction`).

**Why this step**: The utility runs only on the server, so the directive is incorrect and should be removed.

**Subtasks**:
- Remove `"use client";` from `tiptap-format-utils.ts`
- Verify the file has no client-specific imports
- Test that server action still works correctly

#### Step 5: Validation and testing

Run all validation commands and manual tests:
- Type checking must pass
- Linting must pass
- Format must pass
- Manually test the form submission flow
- Verify error messages are displayed correctly

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Zod schema validates correct data successfully
- ✅ Zod schema rejects invalid field values
- ✅ Server action returns `{ success: true, submissionId }` on success
- ✅ Server action returns `{ success: false, error }` on database error
- ✅ Server action returns `{ success: false, error }` on validation error
- ✅ Duplicate submissions return existing submission (deduplication works)
- ✅ User authentication is checked
- ✅ Unauthenticated calls are rejected

**Test files**:
- `apps/web/app/home/(user)/ai/blocks/_lib/schemas/submit-building-blocks.schema.test.ts` - Schema validation
- `apps/web/app/home/(user)/ai/blocks/_actions/submitBuildingBlocksAction.test.ts` - Action behavior

### Integration Tests

- ✅ Form submission flow from client to server succeeds
- ✅ Form submission displays success message and redirects
- ✅ Form submission displays error message on failure
- ✅ Database deduplication prevents duplicate records

### E2E Tests

- ✅ Complete form submission flow: fill form → submit → redirect to home
- ✅ Error scenario: submit with invalid data → error message shown
- ✅ Error scenario: server error → user-friendly error message displayed

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/ai/blocks`
- [ ] Fill out all form fields completely
- [ ] Click "Submit" on the final question
- [ ] Verify form submits successfully and redirects to `/home/ai`
- [ ] Check browser console - should see no error messages
- [ ] Test with invalid data (empty fields) - should show validation error
- [ ] Submit the form twice with identical data - second submit should succeed (deduplication)
- [ ] Stop the database/server and try to submit - should show error message
- [ ] Verify error messages are user-friendly and helpful

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Breaking change for existing API consumers**: Converting from throwing errors to returning response objects
   - **Likelihood**: medium
   - **Impact**: low (only internal caller in BlocksForm.tsx)
   - **Mitigation**: Update all callers in a single PR, verify E2E tests pass

2. **Schema validation too strict**: Zod schema rejects valid data
   - **Likelihood**: low
   - **Impact**: medium (users cannot submit forms)
   - **Mitigation**: Test schema with various edge cases, review validation rules carefully

3. **Duplicate submission detection fails**: New action misses existing submissions
   - **Likelihood**: low
   - **Impact**: medium (creates duplicate records)
   - **Mitigation**: Keep the existing deduplication logic unchanged, test thoroughly

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the commit (`git revert <commit-hash>`)
2. Server action will re-throw errors (back to empty object error)
3. Client error handler will catch exceptions again
4. Form will be broken again but in the previous state
5. Users should be notified of temporary issues

Alternative: Keep both old and new actions during transition period (not recommended).

## Performance Impact

**Expected Impact**: minimal

- Zod schema validation adds ~1ms per request
- Enhanced action wrapper adds no significant overhead
- Error serialization is now correct (no repeated logging)
- Database query performance unchanged

**Performance Testing**:
- Measure form submission latency before/after (should be imperceptible)
- Monitor error rates in production logging

## Security Considerations

**Security Impact**: positive

The `enhanceAction` wrapper adds:
- **Input validation** at server boundary (prevents injection attacks)
- **Authentication check** (auth:true by default)
- **CSRF protection** (built into Next.js server actions)
- **Rate limiting** readiness

**Security review needed**: no (using standard project patterns)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start development server
pnpm dev

# Navigate to http://localhost:3000/home/ai/blocks
# Fill out form completely
# Submit form
# Observe console error: "Form submission error: {}"
```

**Expected Result**: Console shows empty object error `{}`, no meaningful error information

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if added)
pnpm test:unit apps/web/app/home/\\(user\\)/ai/blocks

# Build
pnpm build

# E2E tests - blocks form flow
pnpm test:e2e blocks-form

# Manual verification
# Navigate to http://localhost:3000/home/ai/blocks
# Fill out form with valid data
# Submit form
# Observe: form submits successfully, redirects to /home/ai
# Console shows no errors
```

**Expected Result**:
- All commands pass without errors
- Form submission succeeds with clear navigation
- Console is clean, no error messages
- Error messages are user-friendly (if testing error cases)

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run full E2E tests
pnpm test:e2e

# Type check entire project
pnpm typecheck
```

## Dependencies

### New Dependencies

None required. Uses existing packages:
- `zod` - already in project
- `@kit/next/actions` - already in project
- `@kit/supabase/server-client` - already in project

**No new dependencies added**

## Database Changes

**Migration needed**: no

**No database changes required** - Only refactoring server action, database schema unchanged

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: none

**Feature flags needed**: no

**Backwards compatibility**: maintained (internal change only, no public API changes)

Can be deployed to production immediately without feature flags or special handling.

## Success Criteria

The fix is complete when:
- [ ] Zod schema created and type-safe
- [ ] Server action refactored to use `enhanceAction`
- [ ] Error handling returns structured responses
- [ ] Client handles response object correctly
- [ ] `tiptap-format-utils.ts` has "use client" removed
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Unit tests pass (if added)
- [ ] E2E tests pass (blocks form submission flow)
- [ ] Manual testing checklist complete
- [ ] No regressions in other tests
- [ ] Form submissions produce clear, user-visible error messages
- [ ] Success case redirects properly without console errors

## Notes

**Key Considerations**:
- The `enhanceAction` pattern is standard throughout the codebase - this brings the blocks action into alignment
- Keep the deduplication logic unchanged (it works correctly, just move it into the new structure)
- The tiptap utility was incorrectly marked as client code - it's server-only
- The `createTiptapFromText` function doesn't depend on browser APIs

**Related Patterns**:
- See `/packages/next/src/actions/index.ts` for `enhanceAction` implementation
- See other actions in `apps/web/app/home/[account]/_actions/` for examples
- Review server-actions.md in context docs for complete pattern guide

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1086*
