import { Suspense } from 'react';

import { createKeystaticReader, isLessonEntry } from '@kit/keystatic';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  Course,
  LessonCompletion,
  LessonContent,
  LessonWithContent,
} from '~/home/(user)/_types/courseTypes';

import { transformKeystaticContent } from '../../../lib/markdoc-transformer';
import { CourseDashboardClient } from './_components/CourseDashboardClient';

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = 'force-dynamic';

interface DatabaseLesson {
  id: string | null;
  slug: string;
  order: number;
  course_id: string | null;
  title: string;
  lessonID: number;
  quiz: string | null;
  survey: string | null;
  created_at: string;
  updated_at: string | null;
}

interface DatabaseProgress {
  id: string;
  user_id: string | null;
  lesson_id: string | null;
  completed_at: string | null;
  quiz_score: number | null;
  completed_lesson: number[] | null;
  migrated_to_quiz_attempts: boolean | null;
  created_at: string;
  updated_at: string | null;
}

async function getLessons(): Promise<DatabaseLesson[]> {
  try {
    const client = getSupabaseServerClient();
    const { data, error } = await client
      .from('lessons')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getLessons:', error);
    return [];
  }
}

async function getCourseInfo(): Promise<Course> {
  try {
    const client = getSupabaseServerClient();
    const { data, error } = await client.from('courses').select('*').single();

    if (error) {
      console.error('Error fetching course info:', error);
      return {
        id: 'default',
        name: 'Course',
        total_lessons: 0,
      };
    }

    if (!data) {
      return {
        id: 'default',
        name: 'Course',
        total_lessons: 0,
      };
    }

    return {
      id: data.id,
      name: data.title || 'Course',
      total_lessons: data.total_lessons || 0,
    };
  } catch (error) {
    console.error('Error in getCourseInfo:', error);
    return {
      id: 'default',
      name: 'Course',
      total_lessons: 0,
    };
  }
}

export async function generateMetadata() {
  try {
    const course = await getCourseInfo();

    return {
      title: course.name,
      description: 'Course Dashboard',
      openGraph: {
        title: course.name,
        description: 'Course Dashboard',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: course.name,
        description: 'Course Dashboard',
      },
    };
  } catch (error) {
    console.error('Error generating course metadata:', error);
    return {
      title: 'Course Dashboard',
    };
  }
}

export default async function CoursePage() {
  try {
    // Get course info and lessons
    const [course, dbLessons] = await Promise.all([
      getCourseInfo(),
      getLessons(),
    ]);

    // Filter out lessons with null IDs and ensure we have valid lessons
    const validLessons = (dbLessons || []).filter(
      (lesson): lesson is DatabaseLesson & { id: string } =>
        lesson && typeof lesson.id === 'string' && lesson.slug !== null,
    );

    if (validLessons.length === 0) {
      console.log('No valid lessons found');
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Course Dashboard</h1>
          <p className="mt-4 text-gray-600">No lessons available yet.</p>
        </div>
      );
    }

    // Get lesson content from Keystatic reader
    const reader = await createKeystaticReader();
    const lessonContents = await Promise.all(
      validLessons.map(async (lesson) => {
        try {
          // Get raw content from Keystatic reader
          const rawContent = await reader.collections.lessons.read(lesson.slug);

          // Only include lessons with valid content
          if (!rawContent || !isLessonEntry(rawContent)) {
            console.warn(
              `Invalid or missing content for lesson ${lesson.slug}`,
            );
            return {
              id: lesson.id,
              slug: lesson.slug,
              order: lesson.order,
              title: lesson.title,
              description: 'No description available.',
              image: '/placeholder.svg?height=155&width=275',
              lessonLength: 0,
              chapter: 'getting-started',
              lessonNumber: 0,
              lessonID: lesson.lessonID,
              status: 'published',
              language: 'en',
              publishedAt: new Date().toISOString(),
              content: null,
              quiz: lesson.quiz,
            } satisfies LessonWithContent;
          }

          // Extract raw fields
          const {
            title,
            description,
            image,
            lessonLength,
            chapter,
            lessonNumber,
            lessonID,
            status,
            language,
            order,
            publishedAt,
            content: rawMarkdoc,
          } = rawContent;

          // Transform markdoc content
          const transformedContent =
            await transformKeystaticContent(rawMarkdoc);

          // Create the lesson content with required fields
          const lessonContent: LessonContent = {
            type: 'lesson',
            status: status || 'published',
            title: title || '',
            description: description || 'No description available.',
            publishedAt: publishedAt || new Date().toISOString(),
            language: language || 'en',
            order: order || 0,
            lessonID: lessonID || 0,
            chapter: chapter || 'getting-started',
            lessonNumber: lessonNumber || 0,
            lessonLength: lessonLength || 0,
            content: transformedContent,
          };

          // Create the lesson with content and metadata
          const lessonWithContent: LessonWithContent = {
            id: lesson.id,
            slug: lesson.slug,
            order: lesson.order,
            title,
            description: description || 'No description available.',
            image: image || '/placeholder.svg?height=155&width=275',
            lessonLength: lessonLength || 0,
            chapter,
            lessonNumber,
            lessonID,
            status,
            language,
            publishedAt: publishedAt || new Date().toISOString(),
            content: lessonContent,
            quiz: lesson.quiz,
          };

          return lessonWithContent;
        } catch (error) {
          console.error(
            `Error fetching content for lesson ${lesson.slug}:`,
            error,
          );
          return {
            id: lesson.id,
            slug: lesson.slug,
            order: lesson.order,
            title: lesson.title,
            description: 'No description available.',
            image: '/placeholder.svg?height=155&width=275',
            lessonLength: 0,
            chapter: 'getting-started',
            lessonNumber: 0,
            lessonID: lesson.lessonID,
            status: 'published',
            language: 'en',
            publishedAt: new Date().toISOString(),
            content: null,
            quiz: lesson.quiz,
          } satisfies LessonWithContent;
        }
      }),
    );

    // Get user info from Supabase auth
    const client = getSupabaseServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's progress
    const { data: dbProgress } = await client
      .from('lesson_completions')
      .select('*')
      .eq('user_id', user.id);

    // Transform progress data to match LessonCompletion type
    const progress: LessonCompletion[] = (dbProgress || [])
      .filter(
        (p): p is DatabaseProgress & { lesson_id: string } =>
          p && typeof p.lesson_id === 'string',
      )
      .map((p) => ({
        id: p.id,
        user_id: p.user_id || user.id,
        lesson_id: p.lesson_id,
        completed_at: p.completed_at || '',
        quiz_score: p.quiz_score,
        completed_lesson: p.completed_lesson || [],
        created_at: p.created_at,
        updated_at: p.updated_at || p.created_at,
        quiz_id: '', // Add default value if needed
      }));

    return (
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex flex-col space-y-6">
              {/* Title skeleton */}
              <div className="flex justify-center">
                <div className="h-8 w-2/3 rounded bg-gray-200" />
              </div>

              {/* Progress bar skeleton */}
              <div className="h-4 w-full rounded bg-gray-200" />

              {/* Lesson cards skeleton */}
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-6 w-1/3 rounded bg-gray-200" />
                      <div className="h-6 w-24 rounded bg-gray-200" />
                    </div>
                    <div className="flex gap-4">
                      <div className="h-[155px] w-[275px] rounded bg-gray-200" />
                      <div className="flex-1 space-y-4">
                        <div className="h-4 w-3/4 rounded bg-gray-200" />
                        <div className="h-4 w-2/3 rounded bg-gray-200" />
                        <div className="h-4 w-1/2 rounded bg-gray-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <CourseDashboardClient
            course={course}
            lessons={lessonContents}
            progress={progress}
            userId={user.id}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in CoursePage:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h2 className="text-lg font-semibold">Error Loading Course</h2>
          <p className="mt-2">
            There was a problem loading the course content. Please try again
            later.
          </p>
        </div>
      </div>
    );
  }
}
