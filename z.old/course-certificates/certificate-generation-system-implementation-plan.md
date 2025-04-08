# Certificate Generation System Implementation Plan

This document outlines the plan for implementing a certificate generation system for course completion in our application.

## 1. Current System Analysis

### Course Structure

- The course system is built around a main course called "Decks for Decision Makers"
- Course progress is tracked in the `course_progress` table, which includes a `completed_at` timestamp and a `certificate_generated` boolean field
- Lessons are tracked in the `lesson_progress` table
- The course is considered complete when all lessons except 801 and 802 are completed
- There's a "View Certificate" button in the course dashboard that links to `/home/course/certificate`, but this page doesn't exist yet

### PDF Certificate Form

- The certificate form is located at `apps/web/public/certificates/ddm_certificate_form.pdf`
- We need to fill in the user's full name on this form

### Storage Options

We have three potential storage options for certificates:

1. **Supabase Storage**: Already integrated with our application
2. **Cloudflare R2**: Set up for images
3. **Local storage**: In `apps/web/public/certificates`

## 2. PDF.co Integration

PDF.co provides an API for filling PDF forms:

1. First, we need to identify the field names in the certificate form
2. Then we can use the API to fill the form with the user's name
3. The API returns a URL to the filled form, which we can download and store

### PDF.co Form Filling Process

1. **Get Field Names**:

   ```javascript
   // Get the field names from the certificate form
   const fieldInfoResponse = await fetch(
     'https://api.pdf.co/v1/pdf/info/fields',
     {
       method: 'POST',
       headers: {
         'x-api-key': pdfCoApiKey,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
         async: false,
       }),
     },
   );

   const fieldInfo = await fieldInfoResponse.json();
   ```

2. **Fill the Form**:

   ```javascript
   // Fill the form with the user's name
   const fillFormResponse = await fetch('https://api.pdf.co/v1/pdf/edit/add', {
     method: 'POST',
     headers: {
       'x-api-key': pdfCoApiKey,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
       name: `certificate-${userId}-${courseId}.pdf`,
       async: false,
       fields: [
         {
           fieldName: 'name', // This will need to be updated with the actual field name
           pages: '0',
           text: fullName,
         },
       ],
     }),
   });

   const fillFormResult = await fillFormResponse.json();
   ```

3. **Download the Filled Form**:
   ```javascript
   // Download the filled form
   const certificateUrl = fillFormResult.url;
   const certificateResponse = await fetch(certificateUrl);
   const certificateBuffer = await certificateResponse.arrayBuffer();
   ```

## 3. Implementation Plan

### Step 1: Create a Certificate Storage Table

Create a new table in Supabase to store certificate information:

```sql
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Add RLS policies for security
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- RLS policies
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own certificates
CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Only allow authenticated users to insert certificates
CREATE POLICY "Authenticated users can insert certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### Step 2: Create Certificate Generation Service

Create a service to handle certificate generation using PDF.co:

```typescript
// apps/web/lib/certificates/certificate-service.ts
import { getSupabaseServerClient } from '@kit/supabase/server-client';

interface GenerateCertificateParams {
  userId: string;
  courseId: string;
  fullName: string;
}

export async function generateCertificate({
  userId,
  courseId,
  fullName,
}: GenerateCertificateParams) {
  // 1. Get PDF.co API key from environment variables
  const pdfCoApiKey = process.env.PDF_CO_API_KEY;

  if (!pdfCoApiKey) {
    throw new Error('PDF_CO_API_KEY is not defined in environment variables');
  }

  // 2. Get the field names from the certificate form
  const fieldInfoResponse = await fetch(
    'https://api.pdf.co/v1/pdf/info/fields',
    {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
        async: false,
      }),
    },
  );

  const fieldInfo = await fieldInfoResponse.json();

  if (fieldInfo.error) {
    throw new Error(`Failed to get field info: ${fieldInfo.message}`);
  }

  // 3. Fill the form with the user's name
  const fillFormResponse = await fetch('https://api.pdf.co/v1/pdf/edit/add', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/ddm_certificate_form.pdf`,
      name: `certificate-${userId}-${courseId}.pdf`,
      async: false,
      fields: [
        {
          fieldName: 'name', // This will need to be updated with the actual field name
          pages: '0',
          text: fullName,
        },
      ],
    }),
  });

  const fillFormResult = await fillFormResponse.json();

  if (fillFormResult.error) {
    throw new Error(`Failed to fill form: ${fillFormResult.message}`);
  }

  // 4. Download the filled form
  const certificateUrl = fillFormResult.url;
  const certificateResponse = await fetch(certificateUrl);
  const certificateBuffer = await certificateResponse.arrayBuffer();

  // 5. Store the certificate in Supabase Storage
  const supabase = getSupabaseServerClient();
  const fileName = `certificates/${userId}/${courseId}/${Date.now()}.pdf`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('certificates')
    .upload(fileName, certificateBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload certificate: ${uploadError.message}`);
  }

  // 6. Get the public URL for the certificate
  const { data: urlData } = await supabase.storage
    .from('certificates')
    .getPublicUrl(fileName);

  // 7. Store the certificate information in the database
  const { data: certificateData, error: certificateError } = await supabase
    .from('certificates')
    .insert({
      user_id: userId,
      course_id: courseId,
      file_path: fileName,
    })
    .select()
    .single();

  if (certificateError) {
    throw new Error(
      `Failed to store certificate information: ${certificateError.message}`,
    );
  }

  // 8. Update the course_progress table to mark the certificate as generated
  const { error: updateError } = await supabase
    .from('course_progress')
    .update({ certificate_generated: true })
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (updateError) {
    throw new Error(`Failed to update course progress: ${updateError.message}`);
  }

  return {
    certificateId: certificateData.id,
    certificateUrl: urlData.publicUrl,
  };
}
```

### Step 3: Create Certificate Page

Create a new page to display the certificate:

```tsx
// apps/web/app/home/(user)/course/certificate/page.tsx
import { redirect } from 'next/navigation';

import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { HomeLayoutPageHeader } from '../../../_components/home-page-header';
import { CertificateViewClient } from './_components/CertificateViewClient';

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:routes.certificate');

  return {
    title,
  };
};

async function CertificatePage() {
  // Get the authenticated user
  const supabase = getSupabaseServerClient();
  const auth = await requireUser(supabase);

  // Check if the user needs redirect
  if (auth.error) {
    redirect(auth.redirectTo);
  }

  // User is authenticated
  const user = auth.data;

  // Get the user's certificate
  const { data: certificate, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // If no certificate is found, redirect to the course page
  if (error || !certificate) {
    redirect('/home/course');
  }

  // Get the public URL for the certificate
  const { data: urlData } = await supabase.storage
    .from('certificates')
    .getPublicUrl(certificate.file_path);

  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.certificate'} />}
        description={<Trans i18nKey={'common:certificateDescription'} />}
      />

      <PageBody>
        <CertificateViewClient certificateUrl={urlData.publicUrl} />
      </PageBody>
    </>
  );
}

export default withI18n(CertificatePage);
```

Create a client component to display the certificate:

```tsx
// apps/web/app/home/(user)/course/certificate/_components/CertificateViewClient.tsx
'use client';

import Link from 'next/link';

import { ChevronLeft, Download } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';

// apps/web/app/home/(user)/course/certificate/_components/CertificateViewClient.tsx

// apps/web/app/home/(user)/course/certificate/_components/CertificateViewClient.tsx

interface CertificateViewClientProps {
  certificateUrl: string;
}

export function CertificateViewClient({
  certificateUrl,
}: CertificateViewClientProps) {
  const handleDownload = () => {
    window.open(certificateUrl, '_blank');
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex justify-between">
            <Link href="/home/course">
              <Button variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Course
              </Button>
            </Link>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Certificate
            </Button>
          </div>

          <div className="flex justify-center">
            <iframe
              src={certificateUrl}
              className="h-[800px] w-full rounded-lg border border-gray-200"
              title="Course Completion Certificate"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 4: Update Course Completion Logic

Update the server action to generate a certificate when a course is completed:

```typescript
// apps/web/app/home/(user)/course/_lib/server/server-actions.ts
// Add this import
import { generateCertificate } from '~/lib/certificates/certificate-service';

// Update the updateCourseProgressAction function
export const updateCourseProgressAction = enhanceAction(
  async function (data, user) {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    // Check if the user already has a course progress record
    const { data: existingProgress } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', data.courseId)
      .single();

    if (existingProgress) {
      // Update existing record
      const updateData: any = {
        last_accessed_at: now,
      };

      if (data.currentLessonId) {
        updateData.current_lesson_id = data.currentLessonId;
      }

      if (data.completionPercentage !== undefined) {
        updateData.completion_percentage = data.completionPercentage;
      }

      // If the course is being marked as completed and a certificate hasn't been generated yet
      if (data.completed && !existingProgress.certificate_generated) {
        updateData.completed_at = now;

        // Get the user's full name from the accounts table
        const { data: accountData } = await supabase
          .from('accounts')
          .select('name')
          .eq('id', user.id)
          .single();

        const fullName = accountData?.name || user.email || 'Student';

        // Generate the certificate
        try {
          await generateCertificate({
            userId: user.id,
            courseId: data.courseId,
            fullName,
          });

          // Mark the certificate as generated
          updateData.certificate_generated = true;
        } catch (error) {
          console.error('Failed to generate certificate:', error);
          // Continue with the update even if certificate generation fails
        }
      } else if (data.completed) {
        updateData.completed_at = now;
      }

      await supabase
        .from('course_progress')
        .update(updateData)
        .eq('id', existingProgress.id);
    } else {
      // Create new record
      await supabase.from('course_progress').insert({
        user_id: user.id,
        course_id: data.courseId,
        started_at: now,
        last_accessed_at: now,
        current_lesson_id: data.currentLessonId,
        completion_percentage: data.completionPercentage || 0,
        completed_at: data.completed ? now : null,
        certificate_generated: false,
      });
    }

    return { success: true };
  },
  {
    auth: true,
    schema: UpdateCourseProgressSchema,
  },
);
```

### Step 5: Update Lesson 801 (Congratulations) to Display Certificate

Modify the LessonViewClient component to display a link to the certificate on lesson 801:

```typescript
// apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx
// Add this code in the appropriate place in the component

// Inside the LessonViewClient component
const isCongratulationsLesson = lesson.lesson_number === '801';

// In the render function, add this after the lesson content
{isCongratulationsLesson && (
  <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-800 dark:bg-green-900/50">
    <h2 className="text-xl font-bold text-green-800 dark:text-green-300">
      Congratulations on completing the course! 🎉
    </h2>
    <p className="mt-2 text-green-700 dark:text-green-400">
      You've successfully completed all lessons in the course. Your certificate of completion is ready.
    </p>
    <div className="mt-4 flex justify-end">
      <Link href="/home/course/certificate">
        <Button className="bg-green-600 hover:bg-green-700">
          View Certificate
        </Button>
      </Link>
    </div>
  </div>
)}
```

## 4. Storage Recommendation

Based on our analysis, we recommend using **Supabase Storage** for storing certificates for the following reasons:

1. **Integration**: We're already using Supabase for authentication and database, so it provides a seamless integration.
2. **Security**: Supabase offers Row-Level Security (RLS) policies to ensure only authorized users can access their certificates.
3. **Scalability**: Supabase Storage can handle a large number of files efficiently.
4. **Simplicity**: Using the same provider for both database and storage simplifies the architecture.

## 5. Implementation Steps

1. Create the certificates table in Supabase
2. Create a certificates bucket in Supabase Storage
3. Implement the certificate generation service
4. Create the certificate page and components
5. Update the course completion logic to generate certificates
6. Update lesson 801 to display a link to the certificate
7. Test the certificate generation and display

## 6. Additional Considerations

1. **Error Handling**: Implement robust error handling for certificate generation failures
2. **Retry Mechanism**: Add a way to regenerate certificates if the initial generation fails
3. **PDF.co API Key**: We'll need to obtain an API key from PDF.co and add it to our environment variables
4. **Field Name Identification**: We'll need to identify the actual field name in the certificate form using PDF.co's field inspector
