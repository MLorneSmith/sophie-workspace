# Onboarding Experience Implementation Plan

This document outlines the detailed implementation plan for creating a user onboarding experience in our Makerkit-based Next.js 15 application with Payload CMS integration. The implementation will follow the structure and formatting of the legacy implementation found in `D:/SlideHeroes/App/repos/legacy/slideheroes25/apps/web/app/onboarding`.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [File Structure](#file-structure)
4. [Implementation Steps](#implementation-steps)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Considerations](#deployment-considerations)

## Overview

The onboarding experience will consist of a 6-step process:

1. **Welcome Step**: Introduction to SlideHeroes
2. **Profile Step**: Collecting user's full name
3. **Goals Step**: Primary and secondary goals with conditional fields
4. **Theme Step**: Visual theme selection
5. **Summary Step**: Review of collected information
6. **Complete Step**: Confirmation with confetti animation

Key features include:

- Multi-step form with progress indicator
- Form data persistence using localStorage
- Conditional fields based on user selections
- Analytics tracking at each step
- Accessibility features (keyboard navigation, focus management)
- Responsive design for mobile and desktop
- Confetti animation on completion

## Database Schema

### Onboarding Table Migration

```sql
CREATE TABLE IF NOT EXISTS public.onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Profile data
  full_name TEXT,
  first_name TEXT, -- Parsed from full_name
  last_name TEXT,  -- Parsed from full_name

  -- Goals data
  primary_goal TEXT CHECK (primary_goal IN ('work', 'personal', 'school')),
  secondary_goals JSONB, -- Store the boolean values for learn, automate, feedback

  -- Conditional goal details
  work_role TEXT,
  work_industry TEXT,
  personal_project TEXT,
  school_level TEXT,
  school_major TEXT,

  -- Theme preference
  theme_preference TEXT CHECK (theme_preference IN ('dark', 'light')),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_onboarding
  ON public.onboarding
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY insert_onboarding
  ON public.onboarding
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY update_onboarding
  ON public.onboarding
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## File Structure

```
apps/web/app/onboarding/
├── page.tsx                      # Main onboarding page
├── _components/
│   ├── onboarding-form.tsx       # Multi-step form component
│   └── onboarding-form.test.tsx  # Tests for the form component
├── _lib/
│   ├── onboarding-form.schema.ts # Zod schema for form validation
│   └── server/
│       └── server-actions.ts     # Server actions for form submission
└── complete/
    └── page.tsx                  # Completion page (optional)
```

## Implementation Steps

### 1. Database Migration

1. Create a new migration file for the onboarding table:

```bash
pnpm --filter web supabase migration new onboarding
```

2. Add the SQL schema defined above to the migration file.

3. Apply the migration:

```bash
pnpm run supabase:web:reset
```

4. Update the database types:

```bash
pnpm run supabase:web:typegen
```

### 2. Form Schema Definition

Create the form schema in `apps/web/app/onboarding/_lib/onboarding-form.schema.ts`:

```typescript
import { z } from 'zod';

export const FormSchema = createStepSchema({
  welcome: z.object({}),
  profile: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters' })
      .max(255, { message: 'Name must be 255 characters or less' }),
  }),
  goals: z.object({
    primary: z.enum(['work', 'personal', 'school']),
    secondary: z.object({
      learn: z.boolean(),
      automate: z.boolean(),
      feedback: z.boolean(),
    }),
    workDetails: z
      .object({
        role: z.string().min(1, 'Role is required'),
        industry: z.string().min(1, 'Industry is required'),
      })
      .optional(),
    personalDetails: z
      .object({
        project: z.string().min(1, 'Project is required'),
      })
      .optional(),
    schoolDetails: z
      .object({
        level: z.enum(['highschool', 'undergraduate', 'graduate']),
        major: z.string().min(1, 'Major is required'),
      })
      .optional(),
  }),
  theme: z.object({
    style: z.enum(['dark', 'light']),
  }),
});
```

### 3. Server Actions Implementation

Create the server actions in `apps/web/app/onboarding/_lib/server/server-actions.ts`:

```typescript
'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { FormSchema } from '../onboarding-form.schema';

export const submitOnboardingFormAction = enhanceAction(
  async (data, user) => {
    const logger = await getLogger();
    const supabase = getSupabaseServerClient();
    const isFinalSubmission = data.isFinalSubmission || false;

    logger.info({ userId: user.id }, `Submitting onboarding form...`);

    try {
      // Parse full name into first and last name
      const nameParts = data.profile.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Prepare onboarding data
      const onboardingData = {
        user_id: user.id,
        full_name: data.profile.name,
        first_name: firstName,
        last_name: lastName,
        primary_goal: data.goals.primary,
        secondary_goals: data.goals.secondary,
        theme_preference: data.theme.style,
        updated_at: new Date().toISOString(),
      };

      // Add conditional fields based on primary goal
      if (data.goals.primary === 'work' && data.goals.workDetails) {
        onboardingData.work_role = data.goals.workDetails.role;
        onboardingData.work_industry = data.goals.workDetails.industry;
      } else if (
        data.goals.primary === 'personal' &&
        data.goals.personalDetails
      ) {
        onboardingData.personal_project = data.goals.personalDetails.project;
      } else if (data.goals.primary === 'school' && data.goals.schoolDetails) {
        onboardingData.school_level = data.goals.schoolDetails.level;
        onboardingData.school_major = data.goals.schoolDetails.major;
      }

      // If this is the final submission, mark as completed
      if (isFinalSubmission) {
        onboardingData.completed = true;
        onboardingData.completed_at = new Date().toISOString();
      }

      // Upsert to onboarding table
      const { error } = await supabase
        .from('onboarding')
        .upsert(onboardingData, { onConflict: 'user_id' });

      if (error) {
        logger.error(
          { userId: user.id, error },
          `Failed to save onboarding data`,
        );
        throw error;
      }

      logger.info({ userId: user.id }, `Onboarding data saved successfully`);

      // If final submission, also update user metadata
      if (isFinalSubmission) {
        const { error: userUpdateError } = await supabase.auth.updateUser({
          data: {
            onboarded: true,
            onboardedAt: new Date().toISOString(),
          },
        });

        if (userUpdateError) {
          logger.error(
            { userId: user.id, error: userUpdateError },
            `Failed to mark user as onboarded`,
          );
          throw userUpdateError;
        }

        logger.info(
          { userId: user.id },
          `User marked as onboarded successfully`,
        );
      }

      return {
        success: true,
        isComplete: isFinalSubmission,
      };
    } catch (error) {
      logger.error(
        { userId: user.id, error },
        `Error in submitOnboardingFormAction`,
      );

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        isComplete: false,
      };
    }
  },
  {
    auth: true,
    schema: FormSchema,
  },
);
```

### 4. Main Onboarding Page

Create the main onboarding page in `apps/web/app/onboarding/page.tsx`:

```tsx
import { AppLogo } from '~/components/app-logo';

import { OnboardingForm } from './_components/onboarding-form';

export const dynamic = 'force-dynamic';

function OnboardingPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-16">
      <AppLogo />

      <div>
        <OnboardingForm />
      </div>
    </div>
  );
}

export default OnboardingPage;
```

### 5. Onboarding Form Component

Create the onboarding form component in `apps/web/app/onboarding/_components/onboarding-form.tsx`. This will be a complex component with multiple steps, similar to the legacy implementation. The key sections include:

1. Form setup with React Hook Form and Zod validation
2. Step components for each part of the onboarding process
3. Form persistence using localStorage
4. Analytics tracking
5. Accessibility enhancements

The implementation will closely follow the legacy code structure but adapted to our current project requirements.

### 6. Middleware Update

Update the middleware to check for onboarding status and redirect accordingly:

```typescript
// In apps/web/middleware.ts, add to the home route pattern handler
{
  pattern: new URLPattern({ pathname: '/home/*?' }),
  handler: async (req: NextRequest, res: NextResponse) => {
    const {
      data: { user },
    } = await getUser(req, res);

    const origin = req.nextUrl.origin;
    const next = req.nextUrl.pathname;

    // If user is not logged in, redirect to sign in page.
    if (!user) {
      const signIn = pathsConfig.auth.signIn;
      const redirectPath = `${signIn}?next=${next}`;

      return NextResponse.redirect(new URL(redirectPath, origin).href);
    }

    // Check if user has completed onboarding
    const isOnboarded = user?.app_metadata.onboarded === true;

    // If user is logged in but has not completed onboarding,
    // redirect to onboarding page
    if (!isOnboarded) {
      return NextResponse.redirect(new URL('/onboarding', origin).href);
    }

    // Continue with existing middleware logic...
  },
}
```

### 7. Analytics Integration

Integrate analytics tracking at key points in the onboarding process:

```typescript
// Example analytics tracking in the onboarding form
useEffect(() => {
  analytics.trackEvent('onboarding_started');
}, []);

// Track step completion
const handleContinue = () => {
  analytics.trackEvent('onboarding_profile_completed', {
    name: form.getValues().profile.name,
  });
  nextStep();
};

// Track final submission
analytics.trackEvent('onboarding_completed', flattenFormData(data));
```

## Testing Strategy

1. **Unit Tests**:

   - Test form validation logic
   - Test conditional rendering based on user selections
   - Test name parsing functionality

2. **Integration Tests**:

   - Test form submission and server actions
   - Test database interactions
   - Test middleware redirects

3. **End-to-End Tests**:
   - Test complete onboarding flow
   - Test persistence across page refreshes
   - Test accessibility features

## Deployment Considerations

1. **Database Migration**:

   - Ensure the onboarding table migration is applied in all environments
   - Consider data migration for existing users

2. **Feature Flags**:

   - Consider using a feature flag to gradually roll out the new onboarding experience

3. **Analytics**:

   - Set up dashboards to monitor onboarding completion rates
   - Track drop-off points in the onboarding flow

4. **Performance**:
   - Optimize image loading in the onboarding flow
   - Ensure responsive design works well on all devices

## Implementation Timeline

1. **Week 1**:

   - Database migration and schema setup
   - Basic form structure and validation
   - Welcome and Profile steps implementation

2. **Week 2**:

   - Goals and Theme steps implementation
   - Summary and Complete steps implementation
   - Server actions and data persistence

3. **Week 3**:

   - Middleware integration
   - Analytics integration
   - Testing and bug fixes

4. **Week 4**:
   - Final polish and accessibility improvements
   - Documentation
   - Deployment preparation

## Conclusion

This implementation plan provides a comprehensive roadmap for creating a user onboarding experience based on the legacy implementation. By following this plan, we will create a smooth, intuitive onboarding process that collects valuable user information while providing a delightful user experience.

The dedicated onboarding table will allow us to store and reference this information throughout the user's journey, enabling personalization and targeted content delivery based on the user's goals and preferences.
