# React Query Patterns

## Configuration and Setup

SlideHeroes uses React Query with the standard MakerKit configuration:

```tsx
// apps/web/components/react-query-provider.tsx
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function ReactQueryProvider(props: React.PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prevents immediate refetching on the client with SSR
            staleTime: 60 * 1000, // 1 minute
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
```

## Basic Query Pattern with Supabase

```tsx
import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

function useCourses() {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          slug,
          description,
          status,
          difficulty,
          estimated_duration
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .throwOnError();
        
      return data;
    },
  });
}
```

## Query Keys for SlideHeroes

Follow consistent patterns for query keys based on our content structure:

### Course System
- `['courses']` - All courses
- `['courses', courseId]` - Single course
- `['courses', courseId, 'lessons']` - Course lessons
- `['courses', courseId, 'quizzes']` - Course quizzes
- `['lessons', lessonId]` - Single lesson
- `['quizzes', quizId]` - Single quiz

### User Progress
- `['course-progress', userId]` - User's course progress
- `['course-progress', userId, courseId]` - Progress for specific course
- `['certificates', userId]` - User's certificates

### Account Management
- `['accounts', accountId]` - Account details
- `['accounts', accountId, 'memberships']` - Account memberships
- `['accounts', accountId, 'subscriptions']` - Account subscriptions

## Server Actions Integration

SlideHeroes integrates React Query with MakerKit server actions:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCourseProgressAction } from '@/app/actions/course-progress';

function useUpdateCourseProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateCourseProgressAction,
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['course-progress', variables.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['course-progress', variables.userId, variables.courseId] 
      });
    },
    onError: (error) => {
      console.error('Failed to update course progress:', error);
    },
  });
}

// Usage in component
function LessonCompleteButton({ lessonId, courseId }: Props) {
  const updateProgress = useUpdateCourseProgress();
  
  const handleComplete = () => {
    updateProgress.mutate({
      lessonId,
      courseId,
      completed: true,
    });
  };

  return (
    <button 
      onClick={handleComplete}
      disabled={updateProgress.isPending}
    >
      {updateProgress.isPending ? 'Saving...' : 'Mark Complete'}
    </button>
  );
}
```

## Course Content Queries

### Fetching Course with Lessons

```tsx
function useCourseWithLessons(courseId: string) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['courses', courseId, 'with-lessons'],
    queryFn: async () => {
      // First get the course
      const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()
        .throwOnError();

      // Then get lessons based on course_lessons array
      if (course.course_lessons?.length) {
        const { data: lessons } = await supabase
          .from('course_lessons')
          .select('*')
          .in('id', course.course_lessons)
          .order('order_index')
          .throwOnError();
        
        return { ...course, lessons };
      }
      
      return { ...course, lessons: [] };
    },
    enabled: !!courseId,
  });
}
```

### Payload CMS Content Queries

For content managed through Payload CMS:

```tsx
function usePayloadContent<T>(collection: string, slug?: string) {
  return useQuery({
    queryKey: [collection, slug],
    queryFn: async () => {
      const response = await fetch(`/api/payload/${collection}${slug ? `/${slug}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json() as T;
    },
    enabled: !!collection,
  });
}

// Usage for specific content types
function useCourse(slug: string) {
  return usePayloadContent<Course>('courses', slug);
}

function usePosts() {
  return usePayloadContent<Post[]>('posts');
}
```

## Optimistic Updates for Course Progress

```tsx
function useOptimisticLessonComplete() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  
  return useMutation({
    mutationFn: async ({ lessonId, courseId }: { lessonId: string; courseId: string }) => {
      const { error } = await supabase
        .from('course_progress')
        .upsert({
          lesson_id: lessonId,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .throwOnError();
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ['course-progress', variables.courseId] 
      });
      
      // Snapshot previous value
      const previousProgress = queryClient.getQueryData([
        'course-progress', 
        variables.courseId
      ]);
      
      // Optimistically update
      queryClient.setQueryData(
        ['course-progress', variables.courseId],
        (old: any) => ({
          ...old,
          lessons: {
            ...old?.lessons,
            [variables.lessonId]: {
              completed: true,
              completed_at: new Date().toISOString(),
            },
          },
        })
      );
      
      return { previousProgress };
    },
    onError: (err, variables, context) => {
      // Revert on error
      if (context?.previousProgress) {
        queryClient.setQueryData(
          ['course-progress', variables.courseId],
          context.previousProgress
        );
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after completion
      queryClient.invalidateQueries({ 
        queryKey: ['course-progress', variables.courseId] 
      });
    },
  });
}
```

## Account-Based Data Fetching

SlideHeroes uses account-based access patterns:

```tsx
function useAccountCourses(accountId: string) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['accounts', accountId, 'courses'],
    queryFn: async () => {
      // Get account's course progress and join with course data
      const { data } = await supabase
        .from('course_progress')
        .select(`
          *,
          course:courses(
            id,
            title,
            slug,
            description,
            featured_image_id
          )
        `)
        .eq('account_id', accountId)
        .throwOnError();
      
      return data;
    },
    enabled: !!accountId,
  });
}
```

## Error Handling Patterns

```tsx
function useCourseWithErrorHandling(courseId: string) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Course not found');
        }
        throw new Error(`Failed to load course: ${error.message}`);
      }
      
      return data;
    },
    retry: (failureCount, error) => {
      // Don't retry for 404s
      if (error.message.includes('not found')) return false;
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    enabled: !!courseId,
  });
}
```

## Prefetching for Better UX

```tsx
function usePrefetchCourse() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  
  return (courseId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['courses', courseId],
      queryFn: async () => {
        const { data } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()
          .throwOnError();
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}

// Usage in navigation component
function CourseCard({ course }: { course: Course }) {
  const prefetchCourse = usePrefetchCourse();
  
  return (
    <Link
      href={`/courses/${course.slug}`}
      onMouseEnter={() => prefetchCourse(course.id)}
    >
      <h3>{course.title}</h3>
      <p>{course.description}</p>
    </Link>
  );
}
```

## Infinite Queries for Large Datasets

```tsx
function useInfinitePosts() {
  const supabase = useSupabase();
  
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * 10;
      const to = from + 9;
      
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(from, to)
        .throwOnError();
      
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });
}
```

## Suspense Mode with Loading States

```tsx
import { useSuspenseQuery } from '@tanstack/react-query';

function CourseDetails({ courseId }: { courseId: string }) {
  const { data: course } = useSuspenseQuery({
    queryKey: ['courses', courseId],
    queryFn: () => fetchCourse(courseId),
  });
  
  return (
    <div>
      <h1>{course.title}</h1>
      <p>{course.description}</p>
    </div>
  );
}

// Usage with Suspense boundary
function CourseDetailPage({ courseId }: { courseId: string }) {
  return (
    <Suspense fallback={<CourseDetailsSkeleton />}>
      <CourseDetails courseId={courseId} />
    </Suspense>
  );
}
```

## Real-time Updates with Supabase

```tsx
function useCourseProgressRealtime(courseId: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: async () => {
      const { data } = await supabase
        .from('course_progress')
        .select('*')
        .eq('course_id', courseId)
        .throwOnError();
      return data;
    },
  });
  
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
        () => {
          queryClient.invalidateQueries({ 
            queryKey: ['course-progress', courseId] 
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId, supabase, queryClient]);
  
  return query;
}
```