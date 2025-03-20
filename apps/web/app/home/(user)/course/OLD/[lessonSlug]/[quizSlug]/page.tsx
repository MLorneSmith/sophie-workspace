import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { createKeystaticClient, isQuizEntry } from '@kit/keystatic';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { QuizRenderer } from '../../../../_components/content/quiz-renderer/quiz-renderer';
import { transformQuizContent } from './utils';

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

async function getLessonInfo(lessonSlug: Promise<string>) {
  'use server';
  try {
    const client = getSupabaseServerClient();
    // Ensure we await the promise before using it
    const resolvedSlug = await lessonSlug;

    const { data, error } = await client
      .from('lessons')
      .select('id, order, course_id')
      .eq('slug', resolvedSlug)
      .single();

    if (error) {
      console.error('Error fetching lesson info:', error);
      throw new Error('Failed to fetch lesson info');
    }

    if (!data || !data.id || !data.course_id) {
      throw new Error('Invalid lesson data received');
    }

    return {
      id: data.id,
      order: data.order ?? 0,
      course_id: data.course_id,
    };
  } catch (error) {
    console.error('Error in getLessonInfo:', error);
    throw error;
  }
}

async function getCourseInfo(courseId: string) {
  'use server';
  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) {
    console.error('Error fetching course info:', error);
    throw new Error('Failed to fetch course info');
  }

  if (!data) {
    throw new Error('Course not found');
  }

  return {
    id: data.id,
    name: data.title || 'Untitled Course',
    total_lessons: data.total_lessons,
  };
}

interface PageParams {
  lessonSlug: Promise<string>;
  quizSlug: Promise<string>;
}

// Update metadata generation to handle promise-based params
export async function generateMetadata({ params }: { params: PageParams }) {
  try {
    // Await both params at the top level
    const [lessonSlug, quizSlug] = await Promise.all([
      params.lessonSlug,
      params.quizSlug,
    ]);

    const cmsClient = await createKeystaticClient();
    const content = await cmsClient.getContentItemBySlug({
      slug: quizSlug,
      collection: 'quizzes',
    });

    if (!content) {
      return {
        title: 'Quiz Not Found',
      };
    }

    return {
      title: content.title || 'Quiz',
      description: content.description || 'Take the quiz',
      openGraph: {
        title: content.title || 'Quiz',
        description: content.description || 'Take the quiz',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: content.title || 'Quiz',
        description: content.description || 'Take the quiz',
      },
    };
  } catch (error) {
    console.error('Error generating quiz metadata:', error);
    return {
      title: 'Error Loading Quiz',
    };
  }
}

// Update page component to handle promise-based params
export default async function QuizPage({ params }: { params: PageParams }) {
  try {
    const [cmsClient, lessonData] = await Promise.all([
      createKeystaticClient(),
      getLessonInfo(params.lessonSlug),
    ]);

    const quizSlug = await params.quizSlug;
    const content = await cmsClient.getContentItemBySlug({
      slug: quizSlug,
      collection: 'quizzes',
    });

    if (!content || !isQuizEntry(content)) {
      notFound();
    }

    // Transform the content to match the expected format
    const transformedContent = transformQuizContent({
      ...content,
      slug: quizSlug,
    });

    const course = await getCourseInfo(lessonData.course_id);

    // Get user info from Supabase auth
    const client = getSupabaseServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="animate-pulse">
              <div className="h-8 w-2/3 rounded bg-gray-200" />
              <div className="mt-4 h-4 w-1/3 rounded bg-gray-200" />
              <div className="mt-8 space-y-4">
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-5/6 rounded bg-gray-200" />
                <div className="h-4 w-4/6 rounded bg-gray-200" />
              </div>
            </div>
          }
        >
          <QuizRenderer
            content={transformedContent}
            onComplete={() => {
              // Handle quiz completion
              // This will be handled by the client component using our Zustand store
            }}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in QuizPage:', error);
    throw error; // Let Next.js error boundary handle it
  }
}
