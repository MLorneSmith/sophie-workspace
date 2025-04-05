[Home Page](https://makerkit.dev/)

Live Demo

# Creating a Delightful Onboarding Experience with Multi-Step Forms

Jul 10, 2024

## In this post, we'll show you how to create a delightful onboarding experience using the Multi-Step Form Component for Makerkit.

[next](https://makerkit.dev/blog/tags/next)

[react](https://makerkit.dev/blog/tags/react)

The release of Multi-Step forms for Makerkit opens up a world of possibilities for creating delightful onboarding experiences. In this post, we'll show you how to create a delightful onboarding experience using the Multi-Step Form Component for Makerkit.

While Makerkit Turbo does not include an Onboarding (customers in v1 were not interested in this feature), some customers are still needing this feature. In this post, I'll show you how easy it is with Makerkit.

The final result will be a multi-step form that guides users through the onboarding process, collecting information along the way:

## Differentiating between Onboarded and Non-Onboarded Users

First - we must be able to differentiate between onboarded and non-onboarded users. This can be done by checking if the user has completed the onboarding process. If they have, we can redirect them to the dashboard. If they haven't, we can show them the onboarding form.

To store this data, we can use the Supabase Auth `app_metadata` field. This field is a JSON object that can store any data you want (with limitations). In this case, we'll store a boolean value that indicates whether the user has completed the onboarding process.

### Checking if the User is Onboarded in the Middleware

To check if the user is onboarded, we add a check in the middleware. If the user is not onboarded, we redirect them to the onboarding page.

In your middleware, you can add the following code after the user has been fetched:

apps/web/app/middleware.ts

```

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

   const isOnboarded = user?.app_metadata.onboarded;

   if (!isOnboarded) {
     return NextResponse.redirect(new URL('/onboarding', origin).href);
   }

   const supabase = createMiddlewareClient(req, res);

   const requiresMultiFactorAuthentication =
     await checkRequiresMultiFactorAuthentication(supabase);

   // If user requires multi-factor authentication, redirect to MFA page.
   if (requiresMultiFactorAuthentication) {
     return NextResponse.redirect(
       new URL(pathsConfig.auth.verifyMfa, origin).href,
     );
   }
 },
}
```

### Creating the Onboarding Page

With the middleware in place, we can now create the onboarding page. The onboarding page is where the user will complete the onboarding process. This page will contain the multi-step form that the user will fill out.

Let's create a page for the onboarding at `apps/web/app/onboarding/page.tsx`:

apps/web/app/onboarding/page.tsx

```

import { AppLogo } from '~/components/app-logo';
import { OnboardingForm } from '~/onboarding/_components/onboarding-form';

export default function OnboardingPage() {
 return (
   <div className={'flex flex-1 flex-col h-screen items-center justify-center space-y-16'}>
     <AppLogo />

     <OnboardingForm />
   </div>
 );
}
```

NB: we don't have the `OnboardingForm` component yet, but we'll create it in the next section. Please leave it empty for now and then import it back.

#### Installing the package react-confetti

To make the onboarding experience more delightful, we can add some confetti animation when the user completes the onboarding process. We'll use the `react-confetti` package for this.

To install the package, run:

```

pnpm --filter web add react-confetti
```

### Creating the Multi-Step Form

Now that we have the onboarding page, we can create the multi-step form. The multi-step form will guide the user through the onboarding process, collecting the necessary information along the way.

To create the multi-step form, we'll use the Multi-Step Form Component for Makerkit. This component provides a simple API to create multi-step forms with ease.

In the onboarding form, we ask the user the following information:

1. Their full name
2. The name of the Team they want to create

We split the form into two steps, with each step collecting one piece of information - which is a good practice for onboarding forms and helps to reduce friction.

Now let's dive deep into the multi-step form implementation. We'll break down each part of the `OnboardingForm` component and explain its purpose and functionality.

### 1\. Defining the Form Schema

First, we define the schema for our form using Zod:

```

const FormSchema = createStepSchema({
  profile: z.object({
    name: z.string().min(1).max(255),
  }),
  team: z.object({
    name: z.string().min(1).max(255),
  }),
});
```

This schema defines two steps: 'profile' and 'team', each with a 'name' field. The `createStepSchema` function is a helper that ensures our schema is compatible with the Multi-Step Form component.

### 2\. The OnboardingForm Component

The `OnboardingForm` component is the main container for our multi-step form:

```

export function OnboardingForm() {
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      profile: { name: '' },
      team: { name: '' },
    },
    mode: 'onBlur',
  });

  const onSubmit = useCallback((data: z.infer<typeof FormSchema>) => {
    console.log(data);
  }, []);

  return (
    <div>
      <MultiStepForm
        className={/* ... */}
        schema={FormSchema}
        form={form}
        onSubmit={onSubmit}
      >
        {/* Form content */}
      </MultiStepForm>
    </div>
  );
}
```

Here, we:

- Use `useForm` from react-hook-form to manage our form state
- Set up form validation using the Zod schema we defined
- Define an `onSubmit` callback (currently just logging the data)
- Render the `MultiStepForm` component, passing in our schema, form, and onSubmit handler

### 3\. Form Header with Stepper

Inside the `MultiStepForm`, we first render a header with a stepper:

```

<MultiStepFormHeader>
  <MultiStepFormContextProvider>
    {({ currentStepIndex }) => (
      <Stepper
        variant={'numbers'}
        steps={['Profile', 'Team', 'Complete']}
        currentStep={currentStepIndex}
      />
    )}
  </MultiStepFormContextProvider>
</MultiStepFormHeader>
```

This creates a visual indicator of progress through the form steps. The `MultiStepFormContextProvider` gives us access to the current step index, which we use to highlight the active step.

### 4\. Form Steps

Next, we define each step of our form:

```

<MultiStepFormStep name={'profile'}>
  <ProfileStep />
</MultiStepFormStep>

<MultiStepFormStep name={'team'}>
  <TeamStep />
</MultiStepFormStep>

<MultiStepFormStep name={'complete'}>
  <CompleteStep />
</MultiStepFormStep>
```

Each `MultiStepFormStep` corresponds to a step in our form schema. The `name` prop should match the keys in our schema.

### 5\. The Profile Step

The `ProfileStep` component renders the first step of our form:

```

function ProfileStep() {
  const { nextStep, form } = useMultiStepFormContext();

  return (
    <Form {...form}>
      <div className={'flex flex-col space-y-6'}>
        {/* Welcome text */}
        <FormField
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder={'Name'} />
              </FormControl>
              <FormDescription>Enter your full name here</FormDescription>
            </FormItem>
          )}
          name={'profile.name'}
        />
        <div className={'flex justify-end'}>
          <Button onClick={nextStep}>Continue</Button>
        </div>
      </div>
    </Form>
  );
}
```

This step:

- Uses the `useMultiStepFormContext` hook to access form utilities
- Renders a form field for the user's name
- Provides a 'Continue' button to move to the next step

### 6\. The Team Step

The `TeamStep` component is similar to the `ProfileStep`, but adds team creation functionality:

```

function TeamStep() {
  const { nextStep, prevStep, form, mutation } = useMultiStepFormContext();

  return (
    <Form {...form}>
      {/* Similar structure to ProfileStep */}
      <div className={'flex justify-end space-x-2'}>
        <Button variant={'ghost'} onClick={prevStep}>
          Go Back
        </Button>
        <Button
          onClick={async (e) => {
            await mutation.mutateAsync();
            nextStep(e);
          }}
        >
          {mutation.isPending ? 'Processing...' : 'Create Team'}
        </Button>
      </div>
    </Form>
  );
}
```

This step adds:

- A 'Go Back' button to return to the previous step
- A 'Create Team' button that triggers a mutation (e.g., to create the team in your backend) before moving to the next step

The `mutation` object uses `useMutation` from React Query and provides utilities for handling asynchronous operations, which is very useful when you need additional control over form submission.

### 7\. The Complete Step

The `CompleteStep` component renders the final step of our form:

```

function CompleteStep() {
  const { form } = useMultiStepFormContext();

  return (
    <div className={'flex flex-col space-y-6'}>
      {/* Completion message */}
      <Button asChild>
        <Link href={'/home'}>Finish</Link>
      </Button>
    </div>
  );
}
```

This step:

- Displays a completion message, including the user's name from the form data
- Provides a 'Finish' button that links to the home page

### Handling Form Submission

Finally, we handle form submission in the `onSubmit` callback. In this function, we will execute a Server Action to update the user profile, create the team, and mark the user as onboarded.

apps/web/app/onboarding/\_lib/server/server-actions.ts

```

'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export const submitOnboardingFormAction = enhanceAction(
 async (data, user) => {
   const client = getSupabaseServerClient();

   const createTeamResponse = await client.rpc('create_team_account', {
     account_name: data.team.name,
   });

   if (createTeamResponse.error) {
     throw new Error(
       `Failed to create team: ${createTeamResponse.error.message}`,
     );
   }

   const profileResponse = await client
     .from('accounts')
     .update({
       name: data.profile.name,
     })
     .eq('id', user.id);

   if (profileResponse.error) {
     throw new Error(
       `Failed to update profile: ${profileResponse.error.message}`,
     );
   }

   const adminClient = getSupabaseServerActionClient({ admin: true });

   await adminClient.auth.admin.updateUserById(user.id, {
     app_metadata: {
       onboarded: true,
     },
   });

   return {
     success: true,
   };
 },
 {
   auth: true,
   schema: z.object({
     profile: z.object({
       name: z.string().min(1).max(255),
     }),
     team: z.object({
       name: z.string().min(1).max(255),
     }),
   }),
 },
);
```

This action updates the user's profile, creates the team, and marks the user as onboarded. It uses the `enhanceAction` helper to handle authentication and validation.

This is just an example - your onboarding process may involve different steps or actions. You can customize the `submitOnboardingFormAction` to suit your specific requirements.

### Integrating the Server Action

Let's now integrate the `submitOnboardingFormAction` with our form submission:

apps/web/app/onboarding/onboarding-form.tsx

```

import { submitOnboardingFormAction } from './_lib/server/server-actions';
```

apps/web/app/onboarding/onboarding-form.tsx

```

const onSubmit = useCallback(async (data: z.infer<typeof FormSchema>) => {
 try {
   await submitOnboardingFormAction(data);
 } catch (error) {
   console.error('Failed to submit form:', error);
 }
}, []);
```

### Putting It All Together

With all the pieces in place, our `OnboardingForm` component looks like this:

apps/web/app/onboarding/onboarding-form.tsx

```

'use client';

import { useCallback } from 'react';

import { createPortal } from 'react-dom';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
 Form,
 FormControl,
 FormDescription,
 FormField,
 FormItem,
 FormLabel,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import {
 MultiStepForm,
 MultiStepFormContextProvider,
 MultiStepFormHeader,
 MultiStepFormStep,
 createStepSchema,
 useMultiStepFormContext,
} from '@kit/ui/multi-step-form';
import { Stepper } from '@kit/ui/stepper';

import { submitOnboardingFormAction } from '~/onboarding/_lib/server/server-actions';

const Confetti = dynamic(
 () => {
   return import('react-confetti');
 },
 {
   ssr: false,
 },
);

const FormSchema = createStepSchema({
 profile: z.object({
   name: z.string().min(1).max(255),
 }),
 team: z.object({
   name: z.string().min(1).max(255),
 }),
});

export function OnboardingForm() {
 const form = useForm({
   resolver: zodResolver(FormSchema),
   defaultValues: {
     profile: {
       name: '',
     },
     team: {
       name: '',
     },
   },
   mode: 'onBlur',
 });

 const onSubmit = useCallback(async (data: z.infer<typeof FormSchema>) => {
   try {
     await submitOnboardingFormAction(data);
   } catch (error) {
     console.error('Failed to submit form:', error);
   }
 }, []);

 return (
   <div>
     <MultiStepForm
       className={
         'w-full max-w-md space-y-8 rounded-lg border p-8 shadow-sm duration-500 animate-in fade-in-90 zoom-in-95 slide-in-from-bottom-12'
       }
       schema={FormSchema}
       form={form}
       onSubmit={onSubmit}
     >
       <MultiStepFormHeader>
         <MultiStepFormContextProvider>
           {({ currentStepIndex }) => (
             <Stepper
               variant={'numbers'}
               steps={['Profile', 'Team', 'Complete']}
               currentStep={currentStepIndex}
             />
           )}
         </MultiStepFormContextProvider>
       </MultiStepFormHeader>

       <MultiStepFormStep name={'profile'}>
         <ProfileStep />
       </MultiStepFormStep>

       <MultiStepFormStep name={'team'}>
         <TeamStep />
       </MultiStepFormStep>

       <MultiStepFormStep name={'complete'}>
         <CompleteStep />
       </MultiStepFormStep>
     </MultiStepForm>
   </div>
 );
}

function ProfileStep() {
 const { nextStep, form } = useMultiStepFormContext();

 return (
   <Form {...form}>
     <div className={'flex flex-col space-y-6'}>
       <div className={'flex flex-col space-y-2'}>
         <h1 className={'text-xl font-semibold'}>Welcome to Makerkit</h1>

         <p className={'text-sm text-muted-foreground'}>
           Welcome to the onboarding process! Let&apos;s get started by
           entering your name.
         </p>
       </div>

       <FormField
         render={({ field }) => {
           return (
             <FormItem>
               <FormLabel>Your Name</FormLabel>

               <FormControl>
                 <Input {...field} placeholder={'Name'} />
               </FormControl>

               <FormDescription>Enter your full name here</FormDescription>
             </FormItem>
           );
         }}
         name={'profile.name'}
       />

       <div className={'flex justify-end'}>
         <Button onClick={nextStep}>Continue</Button>
       </div>
     </div>
   </Form>
 );
}

function TeamStep() {
 const { nextStep, prevStep, form, mutation } = useMultiStepFormContext();

 return (
   <Form {...form}>
     <div className={'flex flex-col space-y-6'}>
       <div className={'flex flex-col space-y-2'}>
         <h1 className={'text-xl font-semibold'}>Create Your Team</h1>

         <p className={'text-sm text-muted-foreground'}>
           Let&apos;s create your team. Enter your team name below.
         </p>
       </div>

       <FormField
         render={({ field }) => {
           return (
             <FormItem>
               <FormLabel>Your Team Name</FormLabel>

               <FormControl>
                 <Input {...field} placeholder={'Name'} />
               </FormControl>

               <FormDescription>
                 This is the name of your team.
               </FormDescription>
             </FormItem>
           );
         }}
         name={'team.name'}
       />

       <div className={'flex justify-end space-x-2'}>
         <Button
           disabled={mutation.isPending}
           variant={'ghost'}
           onClick={prevStep}
         >
           Go Back
         </Button>

         <Button
           onClick={async (e) => {
             await mutation.mutateAsync();

             nextStep(e);
           }}
         >
           {mutation.isPending ? 'Processing...' : 'Create Team'}
         </Button>
       </div>
     </div>
   </Form>
 );
}

function CompleteStep() {
 const { form } = useMultiStepFormContext();

 return (
   <div className={'flex flex-col space-y-6'}>
     {createPortal(<Confetti numberOfPieces={500} recycle={false} />, document.body)}

     <div className={'flex flex-col space-y-2'}>
       <h1 className={'text-xl font-semibold'}>
         Hello, {form.getValues('profile').name}!
       </h1>

       <p className={'text-sm text-muted-foreground'}>
         You&apos;re almost done! Click the button below to finish the
         onboarding process.
       </p>
     </div>

     <Button asChild>
       <Link href={'/home'}>Finish</Link>
     </Button>
   </div>
 );
}
```

## Conclusion

By leveraging Makerkit's Multi-Step Form component, we've created a smooth, intuitive onboarding process. This approach:

1. Breaks down the onboarding into manageable steps
2. Provides clear visual feedback on progress
3. Allows for easy validation and error handling
4. Creates a flexible structure that can be easily extended or modified

With this onboarding flow in place, you're well on your way to creating a delightful first-time user experience that sets the tone for your entire application. Happy onboarding!

##### Some other posts you might like...

[Dec 27, 2024Introducing a free and open source Next.js Supabase SaaS Starter KitLooking for a free Next.js SaaS Template? Announcing a lite version of our Next.js Supabase SaaS Boilerplate, now open source!](https://makerkit.dev/blog/changelog/free-nextjs-saas-boilerplate)