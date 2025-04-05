# Onboarding Form Validation Issues

## Problem Description

We've identified an issue with the multi-step form in the onboarding process. Specifically, the "Continue" button on step 3 (Goals) is not advancing users to step 4 (Theme) as expected. Instead, it's taking users back to step 1 (Welcome).

The root cause appears to be validation failures in the Goals step. The form is designed to validate each step before allowing progression to the next step. However, the validation for the Goals step is failing, even when we attempt to set default values for all required fields.

## Attempted Solutions

### 1. Direct `nextStep(e)` Call

Our initial approach was to use the `nextStep(e)` function provided by the `useMultiStepFormContext()` hook. However, this didn't work because the validation for the Goals step was failing.

```typescript
const handleContinue = (e: React.SyntheticEvent) => {
  e.preventDefault();
  nextStep(e);
};
```

### 2. Setting Default Values Before `nextStep(e)`

We then tried to set default values for all required fields before calling `nextStep(e)`:

```typescript
const handleDirectContinue = (e: React.SyntheticEvent) => {
  e.preventDefault();

  // Set default values for all required fields
  form.setValue('goals.workDetails', {
    role: 'Default Role',
    industry: 'Default Industry',
  });

  form.setValue('goals.personalDetails', {
    project: 'Default Project',
  });

  form.setValue('goals.schoolDetails', {
    level: 'undergraduate',
    major: 'Default Major',
  });

  // Ensure at least one secondary goal is selected
  form.setValue('goals.secondary.learn', true);

  // Track event
  analytics.trackEvent('onboarding_goals_completed', form.getValues().goals);

  // Try to move to next step
  nextStep(e);
};
```

This approach still failed, suggesting that the validation logic in the `nextStep` function is more complex than just checking if the fields have values.

### 3. Direct URL Navigation

We attempted to bypass the form's internal navigation by directly setting the URL:

```typescript
window.location.href = '/onboarding?step=theme';
```

This approach also failed, causing the form to reset to step 1 (Welcome). This suggests that the multi-step form doesn't support URL-based navigation or that the URL parameter isn't being processed correctly.

## Root Cause Analysis

After examining the `MultiStepForm` component and the `useMultiStepForm` hook in `packages/ui/src/makerkit/multi-step-form.tsx`, we identified that the validation logic is tied to the Zod schema used to validate the form. The `isStepValid` function in the hook checks if the current step's data is valid according to the schema.

The issue appears to be that our form schema doesn't match the structure expected by the `MultiStepForm` component, or that the validation logic in the `isStepValid` function isn't handling our form data correctly.

## Suggested Next Steps

1. **Modify the Form Schema**: Review and update the form schema to ensure it matches the structure expected by the `MultiStepForm` component. The schema should be structured as an object with properties for each step, and each step's property should be a Zod schema that validates the fields for that step.

2. **Customize the `isStepValid` Function**: If modifying the schema isn't sufficient, we may need to customize the `isStepValid` function in the `useMultiStepForm` hook to better handle our form data.

3. **Implement a Custom Navigation Solution**: If the built-in navigation in the `MultiStepForm` component can't be made to work with our form data, we may need to implement a custom navigation solution. This could involve:

   - Creating a custom multi-step form component that doesn't rely on the built-in validation logic
   - Using a different approach to form validation, such as manual validation or a different validation library
   - Implementing a state-based navigation system that doesn't rely on the form's validation logic

4. **Simplify the Form Structure**: If possible, simplify the form structure to reduce the complexity of the validation logic. This could involve:

   - Reducing the number of conditional fields
   - Simplifying the nesting of form fields
   - Using a flatter form structure with fewer nested objects

5. **Consult with the Makerkit Team**: If none of these approaches work, consider reaching out to the Makerkit team for guidance on how to properly use the `MultiStepForm` component with complex form structures.

## Implementation Plan

1. First, try modifying the form schema to match the structure expected by the `MultiStepForm` component. This is the least invasive change and has the highest chance of success.

2. If that doesn't work, try customizing the `isStepValid` function in a copy of the `useMultiStepForm` hook to better handle our form data.

3. If both of those approaches fail, implement a custom navigation solution that doesn't rely on the built-in validation logic.

4. As a last resort, consider simplifying the form structure or consulting with the Makerkit team.
