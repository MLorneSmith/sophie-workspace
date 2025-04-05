# Onboarding Form Validation Fix

## Problem Analysis

The multi-step onboarding form is experiencing an issue where the "Continue" button on step 3 (Goals) is not advancing users to step 4 (Theme) as expected. Instead, it's taking users back to step 1 (Welcome).

### Root Cause Analysis

After examining the code, I've identified several issues contributing to this problem:

1. **Conditional Field Validation**: The Goals step has conditional fields based on the primary goal (work, personal, school), but the validation logic in `isStepValid` function doesn't properly handle these conditional requirements.

2. **Schema Structure Mismatch**: The schema structure doesn't align with how the `isStepForm` function validates each step. The function expects a specific structure that our implementation doesn't match.

3. **Initialization of Optional Fields**: The conditional fields (workDetails, personalDetails, schoolDetails) are marked as optional in the schema, but the validation still requires them when the corresponding primary goal is selected.

4. **Direct URL Navigation Attempt**: The current workaround attempts to use direct URL navigation (`window.location.href = '/onboarding?step=theme'`), but this doesn't work because:
   - It resets the form state
   - The multi-step form component doesn't support URL-based navigation
   - It bypasses the internal state management of the form

### Technical Details

The issue stems from how the `isStepValid` function in the `useMultiStepForm` hook validates the current step:

```typescript
const isStepValid = useCallback(() => {
  const currentStepName = stepNames[state.currentStepIndex] as Path<
    z.TypeOf<Schema>
  >;

  if (schema instanceof z.ZodObject) {
    const currentStepSchema = schema.shape[currentStepName] as z.ZodType;

    // the user may not want to validate the current step
    // or the step doesn't contain any form field
    if (!currentStepSchema) {
      return true;
    }

    const currentStepData = form.getValues(currentStepName) ?? {};
    const result = currentStepSchema.safeParse(currentStepData);

    return result.success;
  }

  throw new Error(`Unsupported schema type: ${schema.constructor.name}`);
}, [schema, form, stepNames, state.currentStepIndex]);
```

This function:

1. Gets the current step name
2. Extracts the schema for that step
3. Gets the form values for that step
4. Validates the form values against the schema

The issue is that our schema has conditional validation requirements that aren't being properly handled by this function.

## Solution Plan

### 1. Fix the Schema Structure

Update the `onboarding-form.schema.ts` file to:

- Better handle conditional validation
- Ensure the schema structure matches what the `isStepValid` function expects
- Use `.refine()` to add custom validation logic for conditional fields

### 2. Fix the GoalsStep Component

Update the `GoalsStep` component in `onboarding-form.tsx` to:

- Properly initialize all conditional fields
- Implement a more robust validation approach
- Use the built-in `nextStep` function instead of URL navigation

### 3. Implement Proper Field Initialization

Add an effect to initialize all conditional fields when the primary goal changes:

- Ensure default values are set for all required fields
- Update the fields when the primary goal changes

### 4. Add Custom Validation Logic

Create a helper function to validate the goals step based on the primary goal:

- Check if at least one secondary goal is selected
- Validate the required fields based on the primary goal
- Integrate this with the form's validation system

## Implementation Steps

1. **Update the Schema**:

   - Modify the schema to use `.refine()` for conditional validation
   - Ensure all required fields are properly defined

2. **Fix the GoalsStep Component**:

   - Update the `handleContinue` function to properly validate the form
   - Ensure all conditional fields are initialized
   - Remove the direct URL navigation approach

3. **Add Field Initialization Logic**:

   - Add an effect to initialize fields when the primary goal changes
   - Set default values for all required fields

4. **Implement Custom Validation**:
   - Create a helper function to validate the goals step
   - Integrate this with the form's validation system

## Expected Outcome

After implementing these changes:

1. The "Continue" button on the Goals step will properly advance to the Theme step
2. The form validation will correctly handle conditional fields
3. The user experience will be smoother with proper validation feedback
4. The form will maintain its state throughout the onboarding process

This solution addresses the root cause while maintaining the existing form structure and user experience.
