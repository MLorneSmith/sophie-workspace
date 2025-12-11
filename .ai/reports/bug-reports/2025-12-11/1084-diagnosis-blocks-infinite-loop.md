# Bug Diagnosis: Maximum update depth exceeded on /home/ai/blocks route

**ID**: ISSUE-1084
**Created**: 2025-12-11T15:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `/home/ai/blocks` route causes a "Maximum update depth exceeded" React error due to an infinite render loop in the `BlocksForm.tsx` component. The root cause is an unstable `debouncedFetchSuggestions` function reference that gets recreated on every render, causing a `useEffect` dependency to change every render and trigger the effect repeatedly.

## Environment

- **Application Version**: Latest dev branch
- **Environment**: Development
- **Browser**: All browsers
- **Node Version**: N/A (client-side React issue)
- **Database**: N/A
- **Last Working**: Unknown

## Reproduction Steps

1. Navigate to `/home/ai/blocks` route
2. The page immediately crashes with "Maximum update depth exceeded" error
3. The error points to line 284 in `BlocksForm.tsx` - the `setSuggestions([])` call

## Expected Behavior

The `/home/ai/blocks` page should load and display the multi-step form without errors.

## Actual Behavior

The page enters an infinite render loop and crashes with the error:
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

## Diagnostic Data

### Console Output
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.

    at SetupForm.useEffect (app/home/(user)/ai/blocks/_components/BlocksForm.tsx:284:3)
    at SetupMultistepForm (app/home/(user)/ai/blocks/BlocksMultistepForm.tsx:22:7)
    at BlocksPage (app/home/(user)/ai/blocks/page.tsx:37:5)
    at I18nServerComponentWrapper (lib/i18n/with-i18n.tsx:11:10)
```

### Code Frame
```
  282 |
  283 |         // Clear suggestions when field changes
> 284 |         setSuggestions([]);
      |         ^
  285 |
  286 |         // Only fetch initial suggestions when entering the field
  287 |         // or when presentation type changes
```

## Error Stack Traces
```
at SetupForm.useEffect (app/home/(user)/ai/blocks/_components/BlocksForm.tsx:284:3)
at SetupMultistepForm (app/home/(user)/ai/blocks/BlocksMultistepForm.tsx:22:7)
at BlocksPage (app/home/(user)/ai/blocks/page.tsx:37:5)
at I18nServerComponentWrapper (lib/i18n/with-i18n.tsx:11:10)
```

## Related Code
- **Affected Files**:
  - `apps/web/app/home/(user)/ai/blocks/_components/BlocksForm.tsx`
- **Recent Changes**: Unknown
- **Suspected Functions**:
  - `useSuggestions` hook (lines 61-131)
  - `useEffect` at lines 279-301

## Related Issues & Context

### Direct Predecessors
None found - this appears to be a new issue.

### Related Infrastructure Issues
None directly related.

### Similar Symptoms
None found with "Maximum update depth" in this codebase.

### Same Component
- #1081 (CLOSED): "Chore: Fix Get Started button navigation on AI workspace dashboard" - Recent work on AI blocks area

### Historical Context
No previous infinite loop issues found in the BlocksForm component.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `debouncedFetchSuggestions` function in the `useSuggestions` hook is created at the top level of the hook function without memoization, causing it to be recreated on every render, which in turn causes `fetchSuggestions` to be recreated, triggering the `useEffect` dependency to change and re-run infinitely.

**Detailed Explanation**:

The issue is in the `useSuggestions` hook (lines 61-131 of `BlocksForm.tsx`):

```typescript
function useSuggestions(_userId: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // PROBLEM: This debounced function is created fresh on EVERY render
  const debouncedFetchSuggestions = debounce(
    async (...) => { ... },
    300,
  );

  // This useCallback depends on debouncedFetchSuggestions
  // Since debouncedFetchSuggestions changes every render, so does fetchSuggestions
  const fetchSuggestions = useCallback(
    (...) => {
      debouncedFetchSuggestions(...);
    },
    [debouncedFetchSuggestions], // Changes every render!
  );

  return {
    suggestions,
    isLoadingSuggestions,
    fetchSuggestions,  // Unstable reference
    setSuggestions,    // Stable (from useState)
  };
}
```

Then in `SetupForm` component, the `useEffect` at lines 279-301:

```typescript
useEffect(() => {
  const currentField = currentPath[currentQuestion];
  if (!currentField) return;

  setSuggestions([]);  // <-- This line triggers the infinite loop

  if (currentField === "title" && formData.presentation_type) {
    void fetchSuggestions("title", formData.presentation_type);
  }
}, [
  currentQuestion,
  formData.presentation_type,
  fetchSuggestions,    // Changes every render!
  currentPath,
  setSuggestions,      // Stable
]);
```

**The Infinite Loop Cycle**:
1. Component renders
2. `useSuggestions` creates new `debouncedFetchSuggestions` (no memoization)
3. `useCallback` creates new `fetchSuggestions` (dependency changed)
4. `useEffect` runs (because `fetchSuggestions` changed)
5. `setSuggestions([])` is called
6. State update triggers re-render
7. Go to step 1 → infinite loop

**Supporting Evidence**:
- Stack trace points directly to line 284: `setSuggestions([])`
- The error message states "one of the dependencies changes on every render"
- Code analysis shows `debouncedFetchSuggestions` is created without `useMemo`
- `fetchSuggestions` has `debouncedFetchSuggestions` in its dependency array

### How This Causes the Observed Behavior

The `fetchSuggestions` function reference changes on every render because its dependency `debouncedFetchSuggestions` is not memoized. When the `useEffect` at line 279 sees `fetchSuggestions` has changed, it re-runs. The effect calls `setSuggestions([])` which triggers a state update and re-render. On the next render, `debouncedFetchSuggestions` is recreated again (new reference), causing `fetchSuggestions` to be recreated (new reference), and the cycle continues indefinitely until React detects the infinite loop and throws the error.

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The error message explicitly states "one of the dependencies changes on every render"
2. Code analysis clearly shows `debouncedFetchSuggestions` is created without memoization
3. The `useCallback` for `fetchSuggestions` correctly lists `debouncedFetchSuggestions` as a dependency, which changes every render
4. The stack trace points directly to the `setSuggestions([])` call inside the effect that depends on `fetchSuggestions`
5. This is a well-known React anti-pattern

## Fix Approach (High-Level)

Wrap the `debouncedFetchSuggestions` function creation with `useMemo` to ensure it maintains a stable reference across renders:

```typescript
const debouncedFetchSuggestions = useMemo(
  () =>
    debounce(
      async (...) => { ... },
      300,
    ),
  [] // Empty deps - created once per hook instance
);
```

Alternatively, use `useRef` to store the debounced function:

```typescript
const debouncedFetchRef = useRef(
  debounce(async (...) => { ... }, 300)
);
```

Either approach will stabilize the function reference and break the infinite loop.

## Diagnosis Determination

The root cause is definitively identified: the `debouncedFetchSuggestions` function in the `useSuggestions` hook lacks memoization, causing it to be recreated on every render. This creates an unstable reference for `fetchSuggestions`, which is listed as a dependency in the `useEffect` at line 279. When the effect runs and calls `setSuggestions([])`, it triggers a re-render, which recreates the functions, which triggers the effect again - an infinite loop.

The fix is straightforward: wrap `debouncedFetchSuggestions` with `useMemo` (or use `useRef`) to maintain a stable reference.

## Additional Context

This is a common React anti-pattern. The lodash `debounce` function returns a new function wrapper each time it's called, so calling `debounce()` inside a component without memoization will create a new debounced function on every render, defeating the purpose of debouncing and causing issues like this infinite loop.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (BlocksForm.tsx, BlocksFormContext.tsx), Bash (gh issue list)*
