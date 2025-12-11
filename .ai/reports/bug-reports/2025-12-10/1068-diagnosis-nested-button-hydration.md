# Bug Diagnosis: Nested button hydration error in ScaleQuestion component

**ID**: ISSUE-1068
**Created**: 2025-12-10T00:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The ScaleQuestion component in the survey feature wraps each radio option in a `<button>` element, which contains a `RadioGroupItem` component. Since `RadioGroupItem` renders as a Radix UI `<button>` internally, this creates invalid nested buttons (`<button><button></button></button>`), causing React hydration errors.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Browser**: All browsers
- **Node Version**: N/A
- **Database**: N/A
- **Last Working**: Unknown

## Reproduction Steps

1. Navigate to `/home/course/lessons/before-you-go`
2. Trigger the survey component to render (lesson with survey_id)
3. Observe the console error about nested buttons

## Expected Behavior

Radio group options should render without HTML validation errors and hydrate correctly.

## Actual Behavior

Console displays hydration errors:
- "In HTML, `<button>` cannot be a descendant of `<button>`"
- "`<button>` cannot contain a nested `<button>`"

## Diagnostic Data

### Console Output
```
In HTML, <button> cannot be a descendant of <button>.
This will cause a hydration error.

<button> cannot contain a nested <button>.
See this log for the ancestor stack trace.
```

### Network Analysis
N/A - This is a client-side rendering issue.

### Database Analysis
N/A - This is a client-side rendering issue.

### Performance Metrics
N/A - This is a client-side rendering issue.

### Screenshots
N/A

## Error Stack Traces
```
at button (<anonymous>:null:null)
at RadioGroupItem (../../packages/ui/src/shadcn/radio-group.tsx:25:3)
at <unknown> (app/home/(user)/assessment/survey/_components/scale-question.tsx:71:8)
at Array.map (<anonymous>:null:null)
at ScaleQuestion (app/home/(user)/assessment/survey/_components/scale-question.tsx:55:24)
at QuestionCard (app/home/(user)/assessment/survey/_components/question-card.tsx:43:4)
at SurveyComponent (app/home/(user)/course/lessons/[slug]/_components/SurveyComponent.tsx:429:7)
```

## Related Code
- **Affected Files**:
  - `apps/web/app/home/(user)/assessment/survey/_components/scale-question.tsx` (lines 58-78)
  - `packages/ui/src/shadcn/radio-group.tsx` (line 25 - RadioGroupItem renders a button)
- **Recent Changes**: N/A
- **Suspected Functions**: `ScaleQuestion` component's option rendering

## Related Issues & Context

### Direct Predecessors
None found.

### Related Infrastructure Issues
None found.

### Similar Symptoms
None found.

### Same Component
None found.

### Historical Context
This appears to be an implementation error when the ScaleQuestion component was created.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The ScaleQuestion component wraps RadioGroupItem in a `<button>` element, but RadioGroupItem already renders as a `<button>` internally via Radix UI, creating invalid nested buttons.

**Detailed Explanation**:
In `scale-question.tsx` lines 58-78, each option is wrapped in a `<button>` element for interactivity:
```tsx
<button
    key={optionId}
    type="button"
    className="hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-md border p-4 text-left w-full"
    onClick={() => setSelectedOption(optionId)}
    ...
>
    <RadioGroupItem value={optionId} id={optionId} />
    <Label ...>{option.option}</Label>
</button>
```

The `RadioGroupItem` component (`packages/ui/src/shadcn/radio-group.tsx:25`) renders `<RadioGroupPrimitive.Item>` from Radix UI, which is a `<button type="button">` element:
```tsx
<RadioGroupPrimitive.Item
    className={cn(...)}
    {...props}
>
```

This creates the structure: `<button><button role="radio">...</button></button>`, which is invalid HTML.

**Supporting Evidence**:
- Stack trace clearly shows: `at button` → `at RadioGroupItem` → `at button`
- Code frame shows line 58 (`<button>`) containing line 71 (`<RadioGroupItem>`)
- Radix UI RadioGroup.Item is documented as rendering a button: https://www.radix-ui.com/primitives/docs/components/radio-group

### How This Causes the Observed Behavior

1. Server renders the component with nested buttons
2. Client hydration validates the HTML structure
3. React/Next.js detects invalid nesting and reports the hydration error
4. The component may exhibit inconsistent behavior due to hydration mismatch

### Confidence Level

**Confidence**: High

**Reasoning**: The stack trace explicitly shows the nesting, the code clearly shows the button wrapper around RadioGroupItem, and the Radix UI documentation confirms RadioGroupItem renders a button.

## Fix Approach (High-Level)

Replace the `<button>` wrapper with `<label>` or `RadioGroupItemLabel` component (already available in `@kit/ui/radio-group`). The `RadioGroupItemLabel` component renders a `<label>` element with proper styling for clickable radio options, as demonstrated in `packages/billing/gateway/src/components/plan-picker.tsx`.

## Diagnosis Determination

Root cause confirmed: Invalid HTML structure from wrapping a Radix UI RadioGroupItem (which renders as `<button>`) inside another `<button>` element. The fix is straightforward - replace the outer `<button>` with a `<label>` or `RadioGroupItemLabel` component to maintain click handling without violating HTML nesting rules.

## Additional Context

The codebase already has the correct pattern implemented in `packages/billing/gateway/src/components/plan-picker.tsx` where `<label>` elements wrap `RadioGroupItem` components. The `RadioGroupItemLabel` component in `@kit/ui/radio-group` was specifically designed for this use case.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (scale-question.tsx, radio-group.tsx, plan-picker.tsx), Grep (RadioGroupItemLabel)*
