# Bug Fix: Tiptap SSR Hydration Mismatch Error

**Related Diagnosis**: #1099
**Severity**: medium
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing `immediatelyRender: false` configuration in Tiptap `useEditor` hook required for Next.js SSR
- **Fix Approach**: Add single configuration option to `useEditor` hook initialization
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Tiptap editor on the canvas page (`/home/ai/canvas`) throws a console error warning about SSR detection and hydration mismatches. The `useEditor` hook is missing the required `immediatelyRender: false` option needed for Next.js SSR environments.

When Next.js renders server components and hydrates them on the client, Tiptap attempts to immediately render the editor DOM before hydration, causing a mismatch between server-rendered HTML and client-rendered content. This violates React's hydration contract.

For full details, see diagnosis issue #1099.

### Solution Approaches Considered

#### Option 1: Add `immediatelyRender: false` to useEditor Config ⭐ RECOMMENDED

**Description**: Add the `immediatelyRender: false` option to the `useEditor` hook configuration in `tiptap-editor.tsx`. This defers editor rendering until after client-side hydration completes, preventing hydration mismatches.

**Pros**:
- Single-line fix (minimal code change)
- Exact solution recommended by Tiptap documentation
- No additional dependencies or refactoring needed
- Resolves the error completely
- Zero performance impact

**Cons**:
- None - this is the canonical fix

**Risk Assessment**: low - This is a standard Tiptap configuration for SSR environments

**Complexity**: simple - One configuration option addition

#### Option 2: Wrap Editor in Suspense Boundary

**Description**: Wrap the Tiptap editor component in a Suspense boundary with a loading fallback to delay rendering until hydration completes.

**Pros**:
- Follows React patterns
- Provides visual loading state

**Cons**:
- Unnecessary complexity
- Requires additional fallback UI
- Less explicit about the actual problem
- Tiptap already has built-in SSR support via config flag

**Why Not Chosen**: Over-engineered compared to the single-line recommended fix

#### Option 3: Use Dynamic Import with no-ssr

**Description**: Dynamically import the editor component with `ssr: false` to skip server-side rendering entirely.

**Pros**:
- Completely avoids SSR rendering

**Cons**:
- Disables server-side rendering entirely (defeats Next.js performance benefits)
- Creates flash of unstyled content (FOUC)
- Tiptap explicitly supports SSR via configuration

**Why Not Chosen**: Loses performance benefits of Next.js SSR; conflicts with project's performance guidelines

### Selected Solution: Add `immediatelyRender: false` Configuration

**Justification**: Tiptap explicitly documents this option as the correct approach for Next.js SSR environments. This is not a workaround but the canonical, intended usage pattern. It's minimal, zero-risk, and directly addresses the root cause identified in the diagnosis.

**Technical Approach**:
- Add `immediatelyRender: false` to the `useEditor()` configuration object
- This defers editor DOM rendering until after React hydration completes
- Server-side rendering still occurs (performance benefit maintained)
- Client hydration proceeds without conflicts
- Editor renders on client with matching DOM structure

**Architecture Changes**: None - this is a configuration option, not architectural

**Migration Strategy**: Not applicable - this is a bug fix with no data migration needed

## Implementation Plan

### Affected Files

- `apps/web/app/home/(user)/ai/canvas/_components/editor/tiptap/tiptap-editor.tsx` - Add `immediatelyRender: false` to useEditor hook configuration

### New Files

None - no new files needed for this fix.

### Step-by-Step Tasks

#### Step 1: Locate and Read Tiptap Editor Component

Read the current `tiptap-editor.tsx` file to understand the existing `useEditor` hook configuration and identify the exact location where `immediatelyRender: false` needs to be added.

- Read `tiptap-editor.tsx` completely
- Identify the `useEditor` hook call
- Verify the current configuration structure

**Why this step first**: Must understand existing code before making changes

#### Step 2: Add `immediatelyRender: false` Configuration

Add the `immediatelyRender: false` option to the `useEditor` hook configuration:

```typescript
const editor = useEditor({
  immediatelyRender: false,  // ← Add this line
  extensions: [...],
  content: initialContent,
  // ... rest of config
});
```

- Add the configuration option at the beginning of the config object
- Maintain existing code formatting and style
- Preserve all other configuration options

**Why this step**: Directly applies the fix identified in the diagnosis

#### Step 3: Verify No Console Errors

Test the fix to ensure the SSR hydration error no longer appears:

- Open `/home/ai/canvas` in browser
- Open DevTools Console
- Verify no "Tiptap Error: SSR has been detected" warning appears
- Verify editor loads and functions normally
- Verify no new errors introduced

**Why this step**: Confirms the fix resolves the reported issue

#### Step 4: Run Type Checking and Linting

Ensure code quality standards are met:

```bash
pnpm typecheck
pnpm lint
pnpm format:fix
```

- Run full type check to catch any TypeScript issues
- Run linter to verify code style compliance
- Auto-fix formatting issues

**Why this step**: Maintains code quality and prevents regressions

#### Step 5: Final Validation

Perform comprehensive validation:

- Navigate to canvas page multiple times
- Test editor creation and content editing
- Verify in different browsers if possible
- Check for any unexpected behavior

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/ai/canvas`
- [ ] Open browser DevTools Console
- [ ] Verify "SSR has been detected" error is gone
- [ ] Verify no new console errors appear
- [ ] Create a new editor instance
- [ ] Type content in the editor
- [ ] Verify editor saves and loads content correctly
- [ ] Refresh the page
- [ ] Verify editor content persists after refresh
- [ ] Test on multiple browsers (Chrome, Firefox, Safari) if possible

### Unit Tests

No new unit tests needed for this configuration change - the fix is purely configuration.

### Integration Tests

No new integration tests needed - existing editor functionality remains unchanged.

### E2E Tests

No new E2E tests needed - existing canvas page tests should continue to pass without modification.

### Regression Testing

Since this is a simple configuration fix:
- Run existing canvas page tests to verify no regressions
- Verify editor functionality not impacted
- Confirm no performance changes

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Editor doesn't render on client**:
   - **Likelihood**: low (Tiptap-documented pattern)
   - **Impact**: medium (editor would be non-functional)
   - **Mitigation**: Revert change immediately if editor doesn't render; consult Tiptap docs

2. **Delayed rendering causes visual flash**:
   - **Likelihood**: low (deferred rendering is standard SSR pattern)
   - **Impact**: low (brief delay before editor appears)
   - **Mitigation**: Monitor page load metrics; add loading skeleton if needed

3. **Configuration syntax error**:
   - **Likelihood**: very low (simple property addition)
   - **Impact**: high (TypeScript would catch immediately)
   - **Mitigation**: Type checking catches any syntax issues

**Rollback Plan**:

If this fix causes issues in production:
1. Remove the `immediatelyRender: false` line from the useEditor config
2. Commit and deploy the revert
3. Investigate if there are other Tiptap configurations needed

**Monitoring** (if needed):
- Monitor browser console for any new errors
- Check page load metrics for unexpected slowdowns
- Verify editor responsiveness

## Performance Impact

**Expected Impact**: none to minimal

The fix defers editor rendering until after hydration, which is the standard pattern for SSR in React. Performance remains unchanged:
- Server-side rendering still occurs
- HTML is streamed to client
- Client hydration proceeds normally
- Editor renders with proper timing

No performance degradation or improvement expected.

## Security Considerations

**Security Impact**: none

This is a configuration option for proper SSR handling with no security implications. The fix:
- Does not change data flow
- Does not introduce new API calls
- Does not modify authentication or authorization
- Does not expose sensitive data

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to canvas page
# Open DevTools Console
# Observe: "Tiptap Error: SSR has been detected, please set `immediatelyRender` explicitly to `false`..."
```

**Expected Result**: SSR hydration error appears in console

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format
```

**Expected Result**:
- All commands succeed
- No TypeScript errors
- No lint errors
- Code properly formatted
- No console error when visiting canvas page

## Dependencies

No new dependencies required - uses existing Tiptap configuration options.

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - standard deployment process

**Feature flags needed**: No

**Backwards compatibility**: maintained (configuration-only change)

## Success Criteria

The fix is complete when:
- [ ] `immediatelyRender: false` added to useEditor config
- [ ] No "SSR has been detected" error in console
- [ ] Canvas page loads and editor functions normally
- [ ] No new console errors introduced
- [ ] All type checking passes
- [ ] All linting passes
- [ ] Editor content loads and saves correctly
- [ ] No visual regressions

## Notes

This is a straightforward fix following Tiptap's SSR documentation. The error message itself identifies the exact solution needed. The configuration option is well-documented and widely used in Next.js projects with Tiptap.

**Related Documentation**:
- Tiptap SSR Guide: https://tiptap.dev/guide/ssr
- Next.js Hydration: https://nextjs.org/docs/messages/react-hydration-error

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1099*
