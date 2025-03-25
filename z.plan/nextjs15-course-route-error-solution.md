# Next.js 15 Course Route Error: Root Cause Analysis and Solution

## Executive Summary

We've identified an issue with our course lesson routes in Next.js 15 where accessing `/home/course/lessons/welcome-to-ddm` results in an error related to Server Components. The error incorrectly suggests we're using the Pages Router despite our application being built with the App Router. After thorough analysis, we've determined this is caused by a combination of:

1. Next.js 15's handling of routes that combine route groups and dynamic segments
2. Our Payload CMS integration's API client implementation
3. The way server-only modules like `next/headers` are imported

Our solution combines two approaches:

1. Fixing the API client to avoid problematic dynamic imports
2. Implementing an Intermediary Layout Pattern to better separate authentication and data fetching concerns

This document outlines our analysis and proposed implementation plan.

## Root Cause Analysis

### The Error

When accessing `/home/course/lessons/welcome-to-ddm`, we encounter:

```
Error: ./packages/supabase/src/clients/server-client.ts:3:1
You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory.
```

### Technical Investigation

Our investigation revealed several key factors contributing to this issue:

1. **Route Structure Conflict**: Next.js 15 appears to have a specific issue with routes that combine:

   - Route groups (the `(user)` folder)
   - Dynamic segments (the `[slug]` folder)
   - Server Components that use `next/headers`

2. **API Client Implementation**: In `packages/cms/payload/src/api/payload-api.ts`, we use a dynamic `require` statement to load the Supabase server client:

   ```typescript
   try {
     const { getSupabaseServerClient } =
       require('@kit/supabase/server-client') as {
         getSupabaseServerClient: () => any;
       };
     const supabase = getSupabaseServerClient();
     const { data } = await supabase.auth.getSession();
     session = data.session;
   } catch (error) {
     console.error('Failed to get Supabase server client:', error);
     // Continue without authentication
   }
   ```

   This creates a chain of imports that includes `next/headers`, which is causing issues in the context of our route structure.

3. **Next.js 15 Routing Changes**: Next.js 15 introduced changes to routing behavior and caching defaults, which may be contributing to the issue.

4. **Misleading Error Message**: The error message incorrectly suggests we're using the Pages Router (`pages/` directory) when we're actually using the App Router (`app/` directory).

## Solution Strategy

We're implementing a combined approach that addresses both the API client issue and the route structure:

### 1. API Client Fix

Modify the Payload API client to avoid problematic dynamic requires by:

- Creating a dedicated server-only module for authentication
- Using proper dynamic imports with error handling
- Separating server-only code with the 'server-only' directive

### 2. Intermediary Layout Pattern

Restructure the course lessons route to use an intermediary layout:

- Move authentication and session management to a layout component
- Create a dedicated server component for data fetching
- Simplify the dynamic route page to minimize direct server component dependencies

## Implementation Plan

### Step 1: Fix the API Client

1. **Create a Server-Safe Authentication Helper**:

```typescript
// packages/cms/payload/src/api/server-auth.ts
import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function getServerSession() {
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (error) {
    console.error('Failed to get server session:', error);
    return null;
  }
}
```

2. **Update the Main API Client**:

```typescript
// packages/cms/payload/src/api/payload-api.ts

// Remove the dynamic require and replace with safer logic
export async function callPayloadAPI(
  endpoint: string,
  options: RequestInit = {},
  supabaseClient?: any,
) {
  let session = null;

  try {
    if (supabaseClient) {
      // Client-side with provided client
      const { data } = await supabaseClient.auth.getSession();
      session = data.session;
    } else if (typeof window === 'undefined') {
      // Server-side: dynamic import with proper error handling
      try {
        // Use dynamic import instead of require
        const { getServerSession } = await import('./server-auth');
        session = await getServerSession();
      } catch (error) {
        console.error('Server auth import failed:', error);
        // Continue without auth
      }
    }
  } catch (error) {
    console.error('Error getting auth session:', error);
  }

  // Rest of the function remains the same...
}
```

### Step 2: Implement Intermediary Layout Pattern

1. **Create a Lessons Layout**:

```typescript
// apps/web/app/home/(user)/course/lessons/layout.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

// This layout handles auth and session management
export default async function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Handle authentication at the layout level
  const supabase = getSupabaseServerClient();
  const auth = await requireUser(supabase);

  // Check if the user needs redirect
  if (auth.error) {
    redirect(auth.redirectTo);
  }

  return (
    <Suspense fallback={<div>Loading lesson...</div>}>
      {children}
    </Suspense>
  );
}
```

2. **Create a Server Component for Data Fetching**:

```typescript
// apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider.tsx
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { updateLessonProgressAction } from '../../../_lib/server/server-actions';

// This is a server component responsible for data fetching
export async function LessonDataProvider({
  children,
  slug,
  lessonId,
  courseId,
}: {
  children: (data: any) => React.ReactNode;
  slug: string;
  lessonId: string;
  courseId: string;
}) {
  // Get supabase client and session
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's progress for this lesson
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single();

  // If no progress record exists, create one
  if (!lessonProgress) {
    await updateLessonProgressAction({
      courseId,
      lessonId,
      completionPercentage: 0,
      completed: false,
    });
  }

  // Get quiz data if lesson has a quiz
  let quiz = null;
  let quizAttempts: any[] = [];

  if (lesson.quiz) {
    // Get quiz data
    const { getQuiz } = await import('@kit/cms/payload');
    quiz = await getQuiz(lesson.quiz.id);

    // Get user's quiz attempts for this quiz
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('quiz_id', lesson.quiz.id)
      .order('completed_at', { ascending: false });

    quizAttempts = attempts || [];
  }

  return children({
    quiz,
    quizAttempts,
    lessonProgress: lessonProgress || null,
    userId: user.id,
  });
}
```

3. **Simplify the Dynamic Route Page**:

```typescript
// apps/web/app/home/(user)/course/lessons/[slug]/page.tsx

// Keep the dynamic page simpler, with less direct server component dependencies
import { notFound } from 'next/navigation';

import { getLessonBySlug } from '@kit/cms/payload';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { HomeLayoutPageHeader } from '../../../_components/home-page-header';
import { LessonViewClient } from './_components/LessonViewClient';
import { LessonDataProvider } from './_components/LessonDataProvider';

// Explicitly opt out of caching
export const dynamic = 'force-dynamic';

export const generateMetadata = async ({
  params,
}: {
  params: { slug: string };
}) => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:routes.course');

  // Get lesson data for metadata
  const lessonData = await getLessonBySlug(params.slug);
  const lesson = lessonData?.docs?.[0];

  return {
    title: lesson?.title || title,
    description: lesson?.description || '',
  };
};

async function LessonPage({ params }: { params: { slug: string } }) {
  // Get lesson data
  const lessonData = await getLessonBySlug(params.slug);
  const lesson = lessonData?.docs?.[0];

  if (!lesson) {
    notFound();
  }

  // Get course ID for the data provider
  const courseId = lesson.course?.id || '';

  return (
    <>
      <HomeLayoutPageHeader
        title={lesson.title}
        description={lesson.description || ''}
      />

      <PageBody>
        <LessonDataProvider
          slug={params.slug}
          lessonId={lesson.id}
          courseId={courseId}
        >
          {(data) => (
            <LessonViewClient
              lesson={lesson}
              quiz={data.quiz}
              quizAttempts={data.quizAttempts}
              lessonProgress={data.lessonProgress}
              userId={data.userId}
            />
          )}
        </LessonDataProvider>
      </PageBody>
    </>
  );
}

export default withI18n(LessonPage);
```

## Technical Considerations

### Performance

- The Intermediary Layout Pattern may slightly increase the component tree depth but improves code organization
- Dynamic imports in the API client add a small performance cost but improve code splitting
- Server components are still used efficiently for data fetching

### Compatibility

- This solution is specifically designed for Next.js 15's App Router
- It addresses the specific edge case with route groups and dynamic segments
- The approach follows Next.js best practices for server/client component separation

### Maintenance

- Clearer separation of concerns makes the code more maintainable
- Authentication logic is centralized in the layout
- Data fetching is isolated in a dedicated server component
- The page component focuses on orchestration and rendering

## Testing Strategy

To verify this solution works correctly:

1. **Direct URL Access Test**:

   - Access `/home/course/lessons/welcome-to-ddm` directly in the browser
   - Verify no errors occur and the lesson loads correctly

2. **Navigation Test**:

   - Navigate to the course dashboard
   - Click on a lesson link to navigate to the lesson page
   - Verify the navigation works smoothly

3. **Authentication Test**:

   - Test with both authenticated and unauthenticated users
   - Verify proper redirects occur for unauthenticated users

4. **Data Fetching Test**:

   - Verify lesson content loads correctly
   - Verify progress tracking works as expected
   - Test quiz functionality if applicable

5. **Error Handling Test**:
   - Test with invalid lesson slugs
   - Verify proper error pages are shown

## Conclusion

This combined approach addresses both the immediate symptoms and the underlying cause of the Next.js 15 routing issue with our course lessons. By fixing the API client implementation and restructuring our components using the Intermediary Layout Pattern, we create a more robust and maintainable solution that aligns with Next.js 15 best practices.

The solution avoids creating parallel routes, which would lead to maintenance challenges, and instead focuses on proper separation of concerns and code organization. This approach should resolve the current issue while also improving the overall architecture of our course system.
