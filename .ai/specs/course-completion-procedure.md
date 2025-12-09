# Course Completion Procedure

This document describes the complete procedure that executes when a user completes all required lessons in a course.

## Overview

A course is considered **completed** when all **23 required lessons** have been marked as completed. Upon completion, the system generates a certificate and unlocks post-completion content.

## Required Lessons

The course requires completion of these 23 lessons (defined in `apps/web/lib/course/course-config.ts`):

```typescript
export const REQUIRED_LESSON_NUMBERS = [
  "101", "103", "104",           // Module 1
  "201", "202", "203", "204",    // Module 2
  "301", "302",                  // Module 3
  "401", "402", "403",           // Module 4
  "501", "502", "503", "504", "511",  // Module 5
  "602", "603", "604", "611",    // Module 6
  "701", "702"                   // Module 7
];

export const TOTAL_REQUIRED_LESSONS = 23;
```

## Completion Flow

```
User completes lesson
        ↓
updateLessonProgressAction called
        ↓
lesson_progress.completed_at = NOW()
        ↓
Count completed required lessons
        ↓
completedRequiredLessons >= 23?
    ├─ NO: Update course_progress with percentage only
    └─ YES:
        ├─ Set course_progress.completed_at = NOW()
        ├─ Set completion_percentage = 100%
        ├─ Generate certificate (if not already generated)
        │   ├─ Fill PDF template with user name
        │   ├─ Upload to Supabase Storage
        │   └─ Insert certificates table record
        ├─ Set certificate_generated = true
        └─ UI shows:
            ├─ "Course Complete!" message
            ├─ "View Certificate" button
            └─ Post-completion lessons unlocked
```

## Step-by-Step Procedure

### Step 1: Lesson Completion Trigger

**File:** `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx`

When a user completes a lesson, the client calls `updateLessonProgressAction`:

```typescript
const markLessonAsCompleted = () => {
  startTransition(async () => {
    await updateLessonProgressAction({
      courseId,
      lessonId: lesson.id,
      completionPercentage: 100,
      completed: true,
    });
  });
};
```

### Step 2: Lesson Progress Update

**File:** `apps/web/app/home/(user)/course/_lib/server/server-actions.ts`

The `updateLessonProgressAction` server action:

1. Updates the `lesson_progress` table with `completed_at = NOW()`
2. Fetches all lesson progress records for the user
3. Counts how many required lessons are completed

```typescript
const completedRequiredLessons = lessonProgress.filter((p) => {
  const lesson = lessonsData.docs.find(
    (l: { id: string }) => l.id === p.lesson_id,
  );
  const isCompleted =
    p.completed_at &&
    lesson &&
    REQUIRED_LESSON_NUMBERS.includes(String(lesson.lesson_number));
  return isCompleted;
}).length;
```

### Step 3: Completion Percentage Calculation

```typescript
const courseCompletionPercentage = Math.round(
  (completedRequiredLessons / TOTAL_REQUIRED_LESSONS) * 100,
);

const isCompleted = completedRequiredLessons >= TOTAL_REQUIRED_LESSONS;
```

### Step 4: Course Progress Update

**File:** `apps/web/app/home/(user)/course/_lib/server/server-actions.ts`

When `isCompleted` is true, `updateCourseProgressAction` is called:

```typescript
await updateCourseProgressAction({
  courseId: data.courseId,
  completionPercentage: courseCompletionPercentage,
  completed: isCompleted,
});
```

This updates the `course_progress` table:
- Sets `completed_at = NOW()`
- Sets `completion_percentage = 100`
- Triggers certificate generation

### Step 5: Certificate Generation

**File:** `apps/web/lib/certificates/certificate-service.ts`

When course is marked complete and no certificate exists:

1. **Check if certificate already generated** - Skip if `certificate_generated = true`

2. **Load PDF template** - From `/lib/certificates/templates/ddm_certificate_form.pdf`

3. **Get user's name** - From the `accounts` table

4. **Fill PDF form** - Uses PDF.co API to insert user's name into certificate template

5. **Upload to Supabase Storage**:
   - Bucket: `certificates`
   - Path: `{userId}/{courseId}/{timestamp}.pdf`

6. **Create database record**:
   ```typescript
   await supabase.rpc("insert_certificate", {
     p_user_id: userId,
     p_course_id: courseId,
     p_file_path: fileName,
   });
   ```

7. **Update course_progress flag**:
   ```typescript
   await supabase
     .from("course_progress")
     .update({ certificate_generated: true })
     .eq("user_id", userId)
     .eq("course_id", courseId);
   ```

### Step 6: UI Updates

**File:** `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx`

Upon completion, the UI displays:

1. **Completion message**:
   ```tsx
   {isCourseCompleted && (
     <div className="rounded-lg border border-green-200 bg-green-50 p-4">
       <h2>Course Complete!</h2>
       <p>Congratulations on completing the course.</p>
       <Link href="/home/course/certificate">View Certificate</Link>
     </div>
   )}
   ```

2. **Post-completion lessons unlocked**:
   - `congratulations` lesson
   - `before-you-go` lesson

### Step 7: Certificate Viewing

**File:** `apps/web/app/home/(user)/course/certificate/page.tsx`

When user navigates to `/home/course/certificate`:

1. Retrieves certificate record from database
2. Generates public URL from Supabase Storage
3. Displays certificate in an iframe

## Database Schema

### lesson_progress

Tracks individual lesson completion status.

```sql
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_percentage NUMERIC DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);
```

### course_progress

Tracks overall course completion and certificate status.

```sql
CREATE TABLE public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_percentage NUMERIC DEFAULT 0,
  current_lesson_id TEXT,
  certificate_generated BOOLEAN DEFAULT false,
  UNIQUE(user_id, course_id)
);
```

### certificates

Stores generated certificate records.

```sql
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);
```

## Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Course configuration | `apps/web/lib/course/course-config.ts` |
| Lesson completion client | `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx` |
| Server actions | `apps/web/app/home/(user)/course/_lib/server/server-actions.ts` |
| Certificate service | `apps/web/lib/certificates/certificate-service.ts` |
| Certificate template | `apps/web/lib/certificates/templates/ddm_certificate_form.pdf` |
| Course dashboard | `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx` |
| Certificate page | `apps/web/app/home/(user)/course/certificate/page.tsx` |
| Database migration | `apps/web/supabase/migrations/20250319104726_web_course_system.sql` |

## Security

All three tables have Row Level Security (RLS) enabled:

- Users can only view/insert/update their own progress records
- Users can only view their own certificates
- Certificate storage bucket has user-scoped access policies

## External Dependencies

- **PDF.co API** - Used for filling PDF certificate template with user data
- **Supabase Storage** - Stores generated certificate PDFs
