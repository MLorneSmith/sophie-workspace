# Certificate Generation System Fix Plan

## Current System Analysis

The certificate generation system is designed to create a personalized certificate when a user completes the "Decks for Decision Makers" course. However, several issues are preventing this functionality from working correctly.

### Current Implementation

1. **Certificate Template**: Located at `apps/web/lib/certificates/templates/ddm_certificate_form.pdf`
2. **Certificate Service**: Implemented in `apps/web/lib/certificates/certificate-service.ts`
3. **Certificate Page**: Implemented in `apps/web/app/home/(user)/course/certificate/`
4. **Certificate Component**: Implemented in `apps/web/app/home/(user)/course/certificate/_components/CertificateViewClient.tsx`
5. **Course Completion Logic**: Implemented in `apps/web/app/home/(user)/course/_lib/server/server-actions.ts`

### Identified Issues

Through investigation, we've identified the following issues:

1. **Missing Storage Bucket**: The `certificates` storage bucket doesn't exist in Supabase, although the code attempts to create it if missing.

2. **Course Completion Logic Issue**: The course is marked as 100% complete but `completed_at` is null, preventing certificate generation.

3. **Path Resolution Problem**: The certificate service is using an incorrect path to read the certificate template file:

   ```javascript
   require('path').join(
     process.cwd(),
     'lib/certificates/templates/ddm_certificate_form.pdf',
   );
   ```

   This path is relative to the process working directory, not the app directory structure.

4. **Certificate Generation Trigger**: The certificate generation is only triggered when a course is explicitly marked as completed, but this isn't happening correctly.

## Root Causes

1. **Storage Bucket Creation Failure**: The code attempts to create the bucket if it doesn't exist, but this might be failing due to permissions or other issues.

2. **Course Completion Logic**: The `updateLessonProgressAction` in `server-actions.ts` calculates if the course is completed, but there appears to be an issue with how it determines completion. The logic should be:

   ```javascript
   // Course is completed when all completable lessons are done
   const isCompleted = completedLessons >= totalCompletableLessons;
   ```

   But this might not be triggering correctly.

3. **Incorrect Path Resolution**: The path to the certificate template is incorrect, causing the file to not be found.

4. **Missing Certificate Generation Trigger**: The certificate generation is not being triggered when the course is completed.

## Proposed Solutions

### 1. Fix the Storage Bucket Creation

The certificate service attempts to create the bucket if it doesn't exist, but this might be failing due to permissions or other issues. We need to ensure the bucket is created properly.

**Solution**: Update the bucket creation code to include proper error handling and logging. If the bucket creation fails, we should log the error and attempt to create it again with different settings.

```typescript
// Check if the certificates bucket exists, create it if it doesn't
const { data: buckets, error: bucketsError } =
  await supabase.storage.listBuckets();
if (bucketsError) {
  console.error('Failed to list buckets:', bucketsError.message);
  throw new Error(`Failed to list buckets: ${bucketsError.message}`);
}

const certificatesBucket = buckets?.find(
  (bucket) => bucket.name === 'certificates',
);

if (!certificatesBucket) {
  const { error: createBucketError } = await supabase.storage.createBucket(
    'certificates',
    {
      public: false,
      allowedMimeTypes: ['application/pdf'],
      fileSizeLimit: 10485760, // 10MB
    },
  );

  if (createBucketError) {
    console.error(
      'Failed to create certificates bucket:',
      createBucketError.message,
    );
    throw new Error(
      `Failed to create certificates bucket: ${createBucketError.message}`,
    );
  }

  console.log('Created certificates bucket successfully');
}
```

### 2. Fix the Course Completion Logic

The `updateLessonProgressAction` in `server-actions.ts` calculates if the course is completed, but there appears to be an issue with how it determines completion.

**Solution**: Update the course completion logic to correctly mark courses as completed when all required lessons are completed.

```typescript
// Count completed lessons, excluding lessons 801 and 802
const completedLessons = lessonProgress.filter((p) => {
  // Find the lesson for this progress
  const lesson = lessonsData.docs.find(
    (l: { id: string }) => l.id === p.lesson_id,
  );
  // Only count if it's not lesson 801 or 802 and is completed
  return (
    p.completed_at &&
    lesson &&
    !['801', '802'].includes(String(lesson.lesson_number))
  );
}).length;

// Calculate completion percentage
const courseCompletionPercentage = Math.round(
  (completedLessons / totalCompletableLessons) * 100,
);

// Course is completed when all completable lessons are done
const isCompleted = completedLessons >= totalCompletableLessons;

console.log(
  `Course completion: ${completedLessons}/${totalCompletableLessons} lessons (${courseCompletionPercentage}%)`,
);
console.log(`Course completed: ${isCompleted ? 'Yes' : 'No'}`);

// Update course progress with completion status
await updateCourseProgressAction({
  courseId: data.courseId,
  completionPercentage: courseCompletionPercentage,
  completed: isCompleted,
});
```

### 3. Fix the Certificate Template Path

The path to the certificate template needs to be corrected to use the proper Next.js app directory structure.

**Solution**: Update the path resolution in the certificate service to use the correct path.

```typescript
// Use the correct path to the certificate template
const fs = require('fs');
const path = require('path');
const appDir = path.join(process.cwd(), 'apps', 'web');
const templatePath = path.join(appDir, 'lib', 'certificates', 'templates', 'ddm_certificate_form.pdf');

// Read the certificate template
const certificateTemplate = fs.readFileSync(templatePath);
const certificateTemplateBase64 = Buffer.from(certificateTemplate).toString('base64');

// Use the base64-encoded template in the API request
body: JSON.stringify({
  file: certificateTemplateBase64,
  name: `certificate-${userId}-${courseId}.pdf`,
  async: false,
  fields: [
    {
      fieldName: nameFieldName,
      pages: '0',
      text: fullName,
    },
  ],
}),
```

### 4. Add Debugging to Certificate Generation

We should add more detailed logging to the certificate generation process to identify any failures.

**Solution**: Add comprehensive logging throughout the certificate generation process.

```typescript
console.log('Starting certificate generation for user:', userId);
console.log('Course ID:', courseId);
console.log('Full name:', fullName);

// Log each step of the process
console.log('1. Getting PDF.co API key');
// ...

console.log('2. Getting field names from certificate form');
// ...

console.log('3. Filling form with user name');
// ...

console.log('4. Downloading filled form');
// ...

console.log('5. Storing certificate in Supabase Storage');
// ...

console.log('6. Getting public URL for certificate');
// ...

console.log('7. Storing certificate information in database');
// ...

console.log('8. Updating course progress');
// ...

console.log('Certificate generation completed successfully');
```

## Implementation Plan

### Step 1: Fix the Certificate Template Path

1. Update the certificate service to use the correct path to the certificate template.
2. Add error handling and logging to ensure the file is found.

### Step 2: Fix the Storage Bucket Creation

1. Update the bucket creation code to include proper error handling and logging.
2. If the bucket creation fails, log the error and attempt to create it again with different settings.

### Step 3: Fix the Course Completion Logic

1. Update the course completion logic in `updateLessonProgressAction` to correctly mark courses as completed.
2. Add logging to track the course completion status.

### Step 4: Add Detailed Logging

1. Add comprehensive logging throughout the certificate generation process.
2. Log each step of the process to identify where failures occur.

### Step 5: Test the Certificate Generation

1. Run the `update-test-user-progress.ts` script to mark all lessons except 702, 801, and 802 as complete.
2. Manually complete lesson 702.
3. Verify that the course is marked as completed.
4. Check if the certificate is generated and stored in the database.
5. Navigate to lesson 801 and verify that the certificate component is displayed.
6. Test downloading the certificate.

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

By implementing these fixes, we should be able to resolve the issues with the certificate generation system. The key issues are the incorrect path to the certificate template, the missing storage bucket, and the course completion logic. By addressing these issues, we should be able to get the certificate generation system working correctly.
