# Supabase Patterns

## Database Access

SlideHeroes uses a three-schema architecture with specific access patterns for each.

### Server-side Access

Use the server client for server components and API routes:

```tsx
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function getCourseData(courseId: string) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      status,
      course_lessons(
        id,
        title,
        order_index,
        estimated_duration
      )
    `)
    .eq('id', courseId)
    .single()
    .throwOnError();
    
  return data;
}
```

### Client-side Access

Use the client hook for client components:

```tsx
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

export function CourseProgressComponent({ courseId }: { courseId: string }) {
  const supabase = useSupabase();
  
  const fetchProgress = async () => {
    const { data, error } = await supabase
      .from('course_progress')
      .select('*')
      .eq('course_id', courseId)
      .throwOnError();
      
    return data;
  };
}
```

## Schema-Specific Access Patterns

### Public Schema (MakerKit SaaS)

Access MakerKit tables with proper RLS policies:

```tsx
// Account-based data access
async function getAccountData(accountId: string) {
  const supabase = getSupabaseServerClient();
  
  const { data } = await supabase
    .from('accounts')
    .select(`
      id,
      name,
      slug,
      type,
      accounts_memberships(
        user_id,
        role,
        user:users(email, display_name)
      )
    `)
    .eq('id', accountId)
    .single()
    .throwOnError();
    
  return data;
}
```

### Payload Schema Access

Access Payload CMS content through the public schema when needed:

```tsx
// Direct access to Payload content (be careful with RLS)
async function getPayloadCourse(courseId: string) {
  const supabase = getSupabaseServerClient();
  
  // Note: This requires service role or proper RLS policies
  const { data } = await supabase
    .schema('payload')
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()
    .throwOnError();
    
  return data;
}

// Preferred: Use Payload API routes instead
async function getCourseViaAPI(slug: string) {
  const response = await fetch(`/api/courses/${slug}`);
  return response.json();
}
```

## Row-Level Security (RLS)

### Account-Based RLS

All MakerKit tables use account-based access control:

```sql
-- Accounts table RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts they belong to" ON public.accounts
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.accounts_memberships 
      WHERE account_id = accounts.id
    )
  );

CREATE POLICY "Account owners can update account" ON public.accounts
  FOR UPDATE USING (
    auth.uid() = primary_owner_user_id
  );
```

### Course Progress RLS

```sql
-- Course progress is user-specific
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.course_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.course_progress
  FOR INSERT, UPDATE USING (auth.uid() = user_id);
```

### AI Usage Tracking RLS

```sql
-- AI usage tracking with account-based access
ALTER TABLE public.ai_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their account's AI usage" ON public.ai_usage_tracking
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.accounts_memberships 
      WHERE account_id = ai_usage_tracking.account_id
    )
  );
```

## Database Functions

### Course Progress Management

```sql
CREATE OR REPLACE FUNCTION public.update_course_progress(
  p_user_id UUID,
  p_course_id TEXT,
  p_lesson_id TEXT,
  p_completed BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  completion_percentage DECIMAL;
BEGIN
  -- Update or insert lesson progress
  INSERT INTO public.course_progress (
    user_id, course_id, lesson_id, completed, updated_at
  )
  VALUES (
    p_user_id, p_course_id, p_lesson_id, p_completed, NOW()
  )
  ON CONFLICT (user_id, course_id, lesson_id)
  DO UPDATE SET 
    completed = p_completed,
    updated_at = NOW();
  
  -- Calculate overall course completion
  SELECT COUNT(*) INTO total_lessons
  FROM payload.course_lessons cl
  JOIN payload.courses c ON c.id = p_course_id
  WHERE cl.id = ANY(c.course_lessons);
  
  SELECT COUNT(*) INTO completed_lessons
  FROM public.course_progress cp
  WHERE cp.user_id = p_user_id 
    AND cp.course_id = p_course_id 
    AND cp.completed = true;
  
  completion_percentage := (completed_lessons::DECIMAL / total_lessons) * 100;
  
  -- Update overall course progress
  INSERT INTO public.course_progress (
    user_id, course_id, completion_percentage, updated_at
  )
  VALUES (
    p_user_id, p_course_id, completion_percentage, NOW()
  )
  ON CONFLICT (user_id, course_id) WHERE lesson_id IS NULL
  DO UPDATE SET 
    completion_percentage = completion_percentage,
    updated_at = NOW();
  
  RETURN true;
END;
$$;
```

### Certificate Generation

```sql
CREATE OR REPLACE FUNCTION public.generate_certificate(
  p_user_id UUID,
  p_course_id TEXT,
  p_file_path TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  certificate_id UUID;
BEGIN
  INSERT INTO public.certificates (
    user_id, course_id, file_path, issued_at
  )
  VALUES (
    p_user_id, p_course_id, p_file_path, NOW()
  )
  RETURNING id INTO certificate_id;
  
  RETURN certificate_id;
END;
$$;
```

## Migrations for SlideHeroes

### MakerKit Migration Pattern

```sql
-- 20241201120000_create_course_progress_table.sql

-- Create course progress tracking
CREATE TABLE public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT,
  completed BOOLEAN DEFAULT false,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- in seconds
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique progress per user/course/lesson
  UNIQUE(user_id, course_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own progress" ON public.course_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.course_progress
  FOR INSERT, UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_course_progress_user_id ON public.course_progress(user_id);
CREATE INDEX idx_course_progress_course_id ON public.course_progress(course_id);
CREATE INDEX idx_course_progress_completed ON public.course_progress(completed);
```

### Cross-Schema Migration Pattern

```sql
-- 20241201130000_create_course_relationship_view.sql

-- Create view to join Payload courses with progress
CREATE OR REPLACE VIEW public.course_progress_with_details AS
SELECT 
  cp.*,
  c.title as course_title,
  c.slug as course_slug,
  c.difficulty,
  c.estimated_duration as course_duration,
  cl.title as lesson_title,
  cl.estimated_duration as lesson_duration
FROM public.course_progress cp
LEFT JOIN payload.courses c ON c.id = cp.course_id
LEFT JOIN payload.course_lessons cl ON cl.id = cp.lesson_id;

-- Grant access to authenticated users
GRANT SELECT ON public.course_progress_with_details TO authenticated;
```

## TypeScript Integration

### Generated Types

Use generated types from the database schema:

```tsx
import type { Database } from '@/lib/database.types';

// Public schema types
type Account = Database['public']['Tables']['accounts']['Row'];
type CourseProgress = Database['public']['Tables']['course_progress']['Row'];
type Certificate = Database['public']['Tables']['certificates']['Row'];

// Course progress with relationships
type CourseProgressWithDetails = Database['public']['Views']['course_progress_with_details']['Row'];

// Insert types for mutations
type NewCourseProgress = Database['public']['Tables']['course_progress']['Insert'];
type UpdateCourseProgress = Database['public']['Tables']['course_progress']['Update'];
```

### Typed Query Functions

```tsx
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type TypedSupabaseClient = SupabaseClient<Database>;

export function getCourseProgress(
  client: TypedSupabaseClient, 
  userId: string, 
  courseId: string
) {
  return client
    .from('course_progress')
    .select(`
      *,
      course:courses(title, slug)
    `)
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .throwOnError();
}

export function updateCourseProgress(
  client: TypedSupabaseClient,
  progress: NewCourseProgress
) {
  return client
    .from('course_progress')
    .upsert(progress)
    .throwOnError();
}
```

## Real-time Subscriptions

### Course Progress Updates

```tsx
import { useEffect } from 'react';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

function useCourseProgressSubscription(courseId: string, onUpdate: () => void) {
  const supabase = useSupabase();
  
  useEffect(() => {
    const channel = supabase
      .channel(`course-progress-${courseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_progress',
          filter: `course_id=eq.${courseId}`,
        },
        onUpdate
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId, supabase, onUpdate]);
}
```

## Error Handling

### Comprehensive Error Handling

```tsx
import { PostgrestError } from '@supabase/supabase-js';

export function handleSupabaseError(error: PostgrestError | null) {
  if (!error) return null;
  
  switch (error.code) {
    case 'PGRST116':
      return 'Resource not found';
    case '23505':
      return 'This record already exists';
    case '23503':
      return 'Cannot delete: record is referenced by other data';
    case '42501':
      return 'Access denied: insufficient permissions';
    default:
      console.error('Supabase error:', error);
      return 'An unexpected error occurred';
  }
}

// Usage in queries
async function safeCourseQuery(courseId: string) {
  const supabase = useSupabase();
  
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (error) {
      throw new Error(handleSupabaseError(error) || 'Failed to fetch course');
    }
    
    return data;
  } catch (error) {
    console.error('Course query failed:', error);
    throw error;
  }
}
```

## Performance Optimization

### Query Optimization

```tsx
// Optimize with selective field fetching
export function getOptimizedCourseList() {
  return supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      featured_image_id,
      difficulty,
      estimated_duration
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20)
    .throwOnError();
}

// Use pagination for large datasets
export function getPaginatedCourses(page: number, limit: number = 10) {
  const from = page * limit;
  const to = from + limit - 1;
  
  return supabase
    .from('courses')
    .select('*')
    .range(from, to)
    .throwOnError();
}
```
