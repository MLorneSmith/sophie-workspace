# Certificate Generation System Fix Implementation Plan

This document outlines the plan for fixing the certificate generation system in our application.

## Current Implementation Status

### What's Implemented:

1. ✅ Certificate table in the database (`public.certificates`)
2. ✅ Certificate template file (`apps/web/lib/certificates/templates/ddm_certificate_form.pdf`)
3. ✅ Certificate service implementation (`apps/web/lib/certificates/certificate-service.ts`)
4. ✅ Certificate page implementation (`apps/web/app/home/(user)/course/certificate/page.tsx`)
5. ✅ Certificate view component (`apps/web/app/home/(user)/course/certificate/_components/CertificateViewClient.tsx`)
6. ✅ Course completion logic in server actions
7. ✅ `insert_certificate` stored procedure in the database
8. ✅ UI elements for viewing certificates (in course dashboard and congratulations lesson)

### What's Missing:

1. ❌ Certificates storage bucket in Supabase
2. ❌ Course completion records in the database
3. ❌ Environment variable for PDF.co API key

## Root Causes of Current Issues

1. **Missing Storage Bucket**: The code attempts to create the `certificates` bucket if it doesn't exist, but this might be failing due to permissions or other issues.

2. **Certificate Generation Not Triggered**: The certificate generation is only triggered when a course is explicitly marked as completed, but this isn't happening correctly because:

   - There are no completed courses in the database
   - The course completion logic might not be correctly identifying when all required lessons are completed

3. **Environment Variable**: The PDF.co API key environment variable might not be set, causing the certificate generation to fail.

## Implementation Plan

### 1. Create the Certificates Storage Bucket

The certificate service attempts to create the bucket if it doesn't exist, but this might be failing. We need to ensure the bucket is created with the correct settings:

```typescript
// Ensure the bucket is created with public access
const { error: createBucketError } = await supabase.storage.createBucket(
  'certificates',
  {
    public: true, // Make it public so we can access the files
    allowedMimeTypes: ['application/pdf'],
    fileSizeLimit: 10485760, // 10MB
  },
);
```

### 2. Fix the Course Completion Logic

The course completion logic in `updateLessonProgressAction` needs to correctly identify when all required lessons are completed:

```typescript
// Count completed required lessons
const completedRequiredLessons = lessonProgress.filter((p) => {
  // Find the lesson for this progress
  const lesson = lessonsData.docs.find(
    (l: { id: string }) => l.id === p.lesson_id,
  );

  // Only count if it's in our required list and is completed
  return (
    p.completed_at &&
    lesson &&
    REQUIRED_LESSON_NUMBERS.includes(String(lesson.lesson_number))
  );
}).length;

// Course is completed when all required lessons are done
const isCompleted = completedRequiredLessons >= TOTAL_REQUIRED_LESSONS;

// Update course progress with completion status
await updateCourseProgressAction({
  courseId: data.courseId,
  completionPercentage: courseCompletionPercentage,
  completed: isCompleted,
});
```

### 3. Add Detailed Logging

Add comprehensive logging throughout the certificate generation process to identify any failures:

```typescript
console.log('Starting certificate generation for user:', userId);
console.log('Course ID:', courseId);
console.log('Full name:', fullName);

// Log each step of the process
console.log('1. Getting PDF.co API key');
// ...

console.log('2. Getting field names from certificate form');
// ...
```

### 4. Set Up the PDF.co API Key

Ensure the PDF.co API key is set in the environment variables:

```
PDF_CO_API_KEY=your-pdf-co-api-key
```

### 5. Test the Certificate Generation

1. Run the `update-test-user-progress.ts` script to mark all lessons except 801 and 802 as complete
2. Verify that the course is marked as completed
3. Check if the certificate is generated and stored in the database
4. Navigate to lesson 801 and verify that the certificate component is displayed
5. Test downloading the certificate

## Implementation Steps

1. **Fix the Storage Bucket Creation**:

   - Update the bucket creation code to include proper error handling and logging
   - Ensure the bucket is created with public access

2. **Fix the Course Completion Logic**:

   - Update the course completion logic to correctly mark courses as completed
   - Add logging to track the course completion status

3. **Add Environment Variable**:

   - Add the PDF.co API key to the environment variables

4. **Test the Certificate Generation**:
   - Create a test script to mark all required lessons as completed
   - Verify that the certificate is generated and stored correctly

## Testing Plan

### Test Case 1: Course Completion

1. **Setup**: Run the `update-test-user-progress.ts` script to mark all lessons except 702, 801, and 802 as complete.
2. **Action**: Manually complete lesson 702.
3. **Expected Result**: The course should be marked as completed, and a certificate should be generated.

### Test Case 2: Certificate Generation

1. **Setup**: Complete the course as in Test Case 1.
2. **Action**: Check the database for a certificate record.
3. **Expected Result**: A certificate record should exist in the `certificates` table for the test user.

### Test Case 3: Certificate Storage

1. **Setup**: Complete the course as in Test Case 1.
2. **Action**: Check the Supabase Storage for the certificate file.
3. **Expected Result**: The certificate file should exist in the `certificates` bucket.

### Test Case 4: Certificate Display

1. **Setup**: Complete the course as in Test Case 1.
2. **Action**: Navigate to lesson 801 (Congratulations).
3. **Expected Result**: The certificate component should be displayed with a link to view the certificate.

### Test Case 5: Certificate Download

1. **Setup**: Complete the course as in Test Case 1.
2. **Action**: Navigate to the certificate page and click the download button.
3. **Expected Result**: The certificate should be downloaded as a PDF file.

## Conclusion

By implementing these fixes, we should be able to resolve the issues with the certificate generation system. The key issues are the missing storage bucket, the course completion logic, and the PDF.co API key environment variable. By addressing these issues, we should be able to get the certificate generation system working correctly.
