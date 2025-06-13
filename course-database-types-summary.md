# Course Database Types Summary

Based on the database types found in `/home/msmith/projects/2025slideheroes/packages/supabase/src/database.types.ts`, here are the course-related database types:

## How to Access Types

To use these types in your code, import them like this:

```typescript
import type { Database } from '~/lib/database.types';

// Access specific table types
type Course = Database['payload']['Tables']['courses']['Row'];
type CourseProgress = Database['public']['Tables']['course_progress']['Row'];
type LessonProgress = Database['public']['Tables']['lesson_progress']['Row'];
type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Row'];
type CourseLesson = Database['payload']['Tables']['course_lessons']['Row'];
```

## 1. Course Type

Located in `Database["payload"]["Tables"]["courses"]["Row"]`:

```typescript
{
  id: string;
  title: string | null;
  slug: string | null;
  description: string | null;
  status: string | null;
  path: string | null;
  parent_id: string | null;
  content: Json | null;
  intro_content: Json | null;
  completion_content: Json | null;
  featured_image_id: string | null;
  featured_image_id_id: string | null;
  media_id: string | null;
  downloads_id: string[] | null;
  estimated_duration: number | null;
  show_progress_bar: boolean | null;
  private_id: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

## 2. CourseProgress Type

Located in `Database["public"]["Tables"]["course_progress"]["Row"]`:

```typescript
{
  id: string;
  user_id: string;
  course_id: string;
  current_lesson_id: string | null;
  started_at: string | null;
  last_accessed_at: string | null;
  completed_at: string | null;
  completion_percentage: number | null;
  certificate_generated: boolean | null;
}
```

## 3. LessonProgress Type

Located in `Database["public"]["Tables"]["lesson_progress"]["Row"]`:

```typescript
{
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  started_at: string | null;
  completed_at: string | null;
  completion_percentage: number | null;
}
```

## 4. QuizAttempt Type

Located in `Database["public"]["Tables"]["quiz_attempts"]["Row"]`:

```typescript
{
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  quiz_id: string;
  started_at: string | null;
  completed_at: string | null;
  score: number | null;
  passed: boolean | null;
  answers: Json | null;
}
```

## 5. CourseLesson Type

Located in `Database["payload"]["Tables"]["course_lessons"]["Row"]`:

```typescript
{
  id: string;
  title: string | null;
  slug: string | null;
  description: string | null;
  course_id: string | null;
  course_id_id: string | null;
  lesson_number: number | null;
  content: string | null;
  estimated_duration: number | null;
  quiz_id: string | null;
  quiz_id_id: string | null;
  survey_id: string | null;
  survey_id_id: string | null;
  featured_image_id: string | null;
  featured_image_id_id: string | null;
  media_id: string | null;
  downloads_id: string[] | null;

  // Video-related fields
  video_source_type: string | null;
  youtube_video_id: string | null;
  bunny_library_id: string | null;
  bunny_video_id: string | null;

  // Todo/task fields
  todo: string | null;
  todo_complete_quiz: boolean | null;
  todo_course_project: string | null;
  todo_read_content: string | null;
  todo_watch_content: string | null;

  // System fields
  path: string | null;
  parent_id: string | null;
  private_id: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

## Insert and Update Types

Each table also has corresponding `Insert` and `Update` types:

- `Insert`: All fields are optional (with defaults) except for required fields
- `Update`: All fields are optional for partial updates

Example:

```typescript
type CourseProgressInsert =
  Database['public']['Tables']['course_progress']['Insert'];
type CourseProgressUpdate =
  Database['public']['Tables']['course_progress']['Update'];
```

## Notes

1. The `Json` type is defined as:

   ```typescript
   export type Json =
     | string
     | number
     | boolean
     | null
     | { [key: string]: Json | undefined }
     | Json[];
   ```

2. Courses and course lessons are stored in the `payload` schema (managed by Payload CMS)
3. Progress tracking tables (course_progress, lesson_progress, quiz_attempts) are in the `public` schema
4. All timestamp fields are stored as `string | null` (ISO 8601 format)
5. Many fields have `_id` suffixes which appear to be for relationship tracking in Payload CMS
