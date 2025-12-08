# Bug Fix: Kanban subtask checkbox hydration error due to nested buttons

**Related Diagnosis**: #938 (REQUIRED)
**Severity**: medium
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Radix UI Checkbox renders as `<button>` element, creating invalid nested buttons inside the subtask wrapper button
- **Fix Approach**: Replace outer `<button>` wrapper with `<div>` and add proper accessibility attributes
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The TaskCard component wraps each subtask in a `<button>` element that contains a Radix UI Checkbox. Since Radix's CheckboxPrimitive.Root renders as a `<button type="button" role="checkbox">` internally, this creates invalid nested HTML:

```html
<button>              <!-- task-card.tsx:114 -->
    <div>
        <button>     <!-- Radix Checkbox renders as button -->
        </button>
    </div>
</button>
```

This causes React hydration errors: "In HTML, `<button>` cannot be a descendant of `<button>`"

For full details, see diagnosis issue #938.

### Solution Approaches Considered

#### Option 1: Replace outer button with accessible div ⭐ RECOMMENDED

**Description**: Convert the outer `<button>` wrapper to a `<div>` element with keyboard/mouse accessibility attributes (`role="button"`, `tabIndex={0}`, keyboard event handlers).

**Pros**:
- Simplest solution - minimal code changes
- Removes the invalid nesting while maintaining full functionality
- Properly semantic: checkbox inside its own interactive element is the correct structure
- No impact on other components or functionality
- Aligns with HTML standards and accessibility best practices
- Low risk of regressions

**Cons**:
- Requires adding `aria-label` and keyboard event handlers to the div
- Slightly more verbose than a button element

**Risk Assessment**: low - This is a structural fix with no logic changes

**Complexity**: simple - Direct element replacement

#### Option 2: Wrap checkbox in non-button container

**Description**: Keep the outer button but wrap the checkbox in a span with event handlers to prevent propagation more carefully.

**Why Not Chosen**: The issue isn't event handling - it's the invalid HTML structure. Wrapping wouldn't fix the nested button problem; the Checkbox would still render as a button.

#### Option 3: Use custom checkbox implementation

**Description**: Replace Radix UI Checkbox with a custom div-based implementation.

**Why Not Chosen**: Overkill for this issue. We'd lose Radix's accessibility features and maintainability benefits. The problem is the structure, not the component itself.

### Selected Solution: Replace outer button with accessible div

**Justification**: This approach directly solves the root cause (nested buttons) while maintaining all functionality and accessibility. It's the cleanest, lowest-risk fix that properly addresses the HTML validation issue.

**Technical Approach**:
- Convert `<button>` at line 114 to `<div>`
- Add `role="button"` for semantic accessibility
- Add `tabIndex={0}` for keyboard focus
- Keep existing `onClick` handler
- Add `onKeyDown` handler for Enter/Space keys (keyboard support)
- Keep `aria-label` for screen readers
- Maintain all event handling and styling

**Architecture Changes**: None - This is a structural fix only

**Migration Strategy**: Not needed - This is a bug fix with no data/API changes

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/web/app/home/(user)/kanban/_components/task-card.tsx` (lines 113-159) - Replace outer button wrapper with accessible div, add keyboard support

### New Files

No new files needed - this is a direct modification of existing structure.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify the bug and understand current behavior

<describe what this step accomplishes>

- Read the current task-card.tsx implementation (already done)
- Understand Radix Checkbox rendering behavior (already done)
- Confirm the button nesting issue exists in the code

**Why this step first**: Ensures we fully understand the problem before making changes

#### Step 2: Replace outer button with accessible div

<describe what this step accomplishes>

Convert the subtask wrapper from `<button>` to `<div>` with proper accessibility:

- Remove `type="button"` attribute
- Change `<button>` tag to `<div>`
- Add `role="button"` attribute
- Add `tabIndex={0}` attribute
- Keep `aria-label` attribute
- Keep `className` attribute
- Keep `onClick` handler
- Add `onKeyDown` handler for keyboard support (Enter/Space keys)
- Add `onMouseDown` handler to prevent drag (already exists)

#### Step 3: Add keyboard event handler

<describe what this step accomplishes>

Ensure proper keyboard interaction for the div-based button:

- Add `onKeyDown` handler that checks for Enter (key code 13) or Space (key code 32)
- Prevent default behavior
- Trigger checkbox update on Enter/Space
- Maintain existing behavior from the onClick handler
- Ensure event propagation is properly managed

#### Step 4: Update component types if needed

<describe what this step accomplishes>

- Verify TypeScript types are correct for div element
- Ensure no type errors from the structural change
- Run `pnpm typecheck` to validate

#### Step 5: Test the fix

<describe what this step accomplishes>

- Verify React hydration error is gone
- Test checkbox interaction (click/space/enter)
- Test drag-and-drop still works
- Test keyboard navigation
- Verify accessibility with screen reader expectations

#### Step 6: Run linting and validation

- Run `pnpm lint:fix` to catch any style issues
- Run `pnpm typecheck` to verify no type errors
- Run `pnpm format:fix` to ensure consistent formatting

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Div element renders correctly (not button)
- ✅ Checkbox interaction works with click
- ✅ Checkbox interaction works with keyboard (Enter, Space)
- ✅ Stop propagation works (prevents outer click)
- ✅ Drag events not triggered by checkbox interaction
- ✅ Accessibility attributes present (role, tabIndex, aria-label)

**Test files**:
- `apps/web/app/home/(user)/kanban/_components/__tests__/task-card.spec.ts` - Component structure and interaction tests

### Integration Tests

Test the full kanban flow with subtasks:
- Subtask checkbox interaction within the kanban board
- Multiple subtasks in a single task card
- Drag and drop with subtasks present

**Test files**:
- `apps/web/app/home/(user)/kanban/_components/__tests__/task-card-integration.spec.ts`

### E2E Tests

Test user interactions with subtasks in the actual application:
- Navigate to kanban board
- Interact with subtask checkboxes (click, keyboard)
- Verify no hydration errors in console
- Test accessibility with keyboard navigation

**Test files**:
- `apps/e2e/tests/kanban.spec.ts` - Add subtask interaction tests

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to kanban board
- [ ] Open browser console and DevTools
- [ ] Verify no hydration errors appear
- [ ] Click on subtask checkbox - should toggle completion
- [ ] Press Tab to focus on task card
- [ ] Press Space to toggle subtask while focused
- [ ] Press Enter to toggle subtask while focused
- [ ] Drag task card - subtasks don't trigger drag
- [ ] Click subtask label text - should toggle checkbox
- [ ] Verify completed subtasks show strikethrough styling
- [ ] Test with screen reader (NVDA/JAWS) - checkbox labeled correctly
- [ ] Verify no console errors or warnings

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Accessibility Regression**: Changing from button to div might affect screen reader behavior
   - **Likelihood**: low
   - **Impact**: medium (affects users with screen readers)
   - **Mitigation**: Add comprehensive keyboard event handlers, test with screen readers, ensure `role="button"` is present

2. **Keyboard Navigation Issues**: New `onKeyDown` handler might not handle all cases
   - **Likelihood**: low
   - **Impact**: low (affects keyboard users)
   - **Mitigation**: Test with Tab, Enter, Space keys; add comprehensive event handling

3. **Drag and Drop Interference**: Event handlers might interfere with drag-kit functionality
   - **Likelihood**: very low
   - **Impact**: medium (drag-drop is critical)
   - **Mitigation**: Keep existing `onMouseDown` event propagation handling; test drag functionality

4. **Styling Issues**: Div might not inherit button styles correctly
   - **Likelihood**: very low
   - **Impact**: low (visual regression only)
   - **Mitigation**: Verify className is applied correctly, check computed styles in DevTools

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit with the div changes
2. Run `pnpm typecheck` and `pnpm lint:fix` to verify clean state
3. The original button nesting issue will return (but application continues functioning)
4. Investigate specific issue and implement alternative approach

**Monitoring** (if needed):

- Monitor for hydration errors in production (should decrease to zero)
- Monitor for keyboard navigation issues in user feedback
- Monitor for accessibility issues from screen reader users

## Performance Impact

**Expected Impact**: none

No performance impact expected. This is purely a structural HTML fix with no algorithmic changes or additional rendering.

## Security Considerations

**Security Impact**: none

No security implications. This is a structural HTML/accessibility fix with no security relevance.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to apps/web and run the dev server
pnpm dev

# Then in browser:
# 1. Go to /home/kanban
# 2. Open DevTools console
# 3. Look for hydration error about nested buttons
```

**Expected Result**: Hydration error appears in console: "In HTML, `<button>` cannot be a descendant of `<button>`"

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build
pnpm build

# Manual verification
# 1. Run dev server: pnpm dev
# 2. Go to /home/kanban
# 3. Open DevTools console
# 4. No hydration errors should appear
# 5. Interact with subtask checkboxes
```

**Expected Result**:
- All validation commands succeed
- No hydration errors in browser console
- Subtask checkboxes work with click and keyboard
- Drag and drop functionality intact

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run type checking
pnpm typecheck

# Visual regression check
pnpm build
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained (no API or data structure changes)

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass (typecheck, lint, format, build)
- [ ] Hydration error no longer appears in browser console
- [ ] Subtask checkbox works with click interaction
- [ ] Subtask checkbox works with Enter key
- [ ] Subtask checkbox works with Space key
- [ ] Task card drag-and-drop still functions
- [ ] All existing tests pass
- [ ] New tests added for keyboard interactions
- [ ] No new accessibility issues introduced
- [ ] Manual testing checklist complete

## Notes

This fix addresses a critical HTML validation issue that affects React's hydration process. While the application may continue to function with nested buttons, the hydration error indicates a client-server mismatch that can cause unpredictable behavior and performance issues.

The solution maintains full functionality while properly following HTML and accessibility standards. The div + keyboard handlers approach is a common pattern for custom interactive elements that need button-like behavior.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #938*
