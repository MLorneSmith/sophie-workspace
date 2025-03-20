import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { createKeystaticReader, isLessonEntry } from '@kit/keystatic';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { transformKeystaticContent } from '../../../../lib/markdoc-transformer';
import { LessonActions } from '../_components/course/LessonActions';
import { Post } from './_components/lesson';

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = 'force-dynamic';

interface PageParams {
  lessonSlug: string;
}

async function getLessonContent(slug: string) {
  const client = getSupabaseServerClient();
  const reader = await createKeystaticReader();

  const [lessonInfo, rawContent] = await Promise.all([
    client
      .from('lessons')
      .select('id, order, course_id, lessonID, quiz')
      .eq('slug', slug)
      .single(),
    reader.collections.lessons.read(slug),
  ]);

  if (lessonInfo.error) {
    console.error('Error fetching lesson info:', lessonInfo.error);
    throw new Error('Failed to fetch lesson info');
  }

  const data = lessonInfo.data;
  if (!data || !data.id || !data.course_id) {
    throw new Error('Invalid lesson data received');
  }

  if (!rawContent || !isLessonEntry(rawContent)) {
    console.error('Invalid or missing lesson content:', rawContent);
    notFound();
  }

  return {
    lessonSlug: slug,
    lessonData: {
      id: data.id,
      order: data.order ?? 0,
      course_id: data.course_id,
      lessonID: data.lessonID,
      quiz: data.quiz,
    },
    rawContent,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  try {
    const resolvedParams = await params;
    console.log('Debug - generateMetadata resolved params:', resolvedParams);

    const { rawContent } = await getLessonContent(resolvedParams.lessonSlug);

    return {
      title: rawContent.title || 'Lesson',
      description: rawContent.description || 'Learn with us',
      openGraph: {
        title: rawContent.title || 'Lesson',
        description: rawContent.description || 'Learn with us',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: rawContent.title || 'Lesson',
        description: rawContent.description || 'Learn with us',
      },
    };
  } catch (error) {
    console.error('Error generating lesson metadata:', error);
    return {
      title: 'Error Loading Lesson',
      description: 'There was an error loading the lesson.',
    };
  }
}

function LoadingFallback() {
  return (
    <div className="container mx-auto flex max-w-3xl flex-col space-y-6 py-8">
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-4 flex space-x-4">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-4/6 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

export default async function LessonPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  try {
    const resolvedParams = await params;
    console.log('Debug - LessonPage resolved params:', resolvedParams);

    const { lessonData, rawContent } = await getLessonContent(
      resolvedParams.lessonSlug,
    );

    let transformedContent;
    try {
      transformedContent = await transformKeystaticContent(rawContent.content);
      if (!transformedContent || transformedContent.length === 0) {
        throw new Error('Content transformation failed');
      }
    } catch (error) {
      console.error('Error transforming content:', error);
      throw error;
    }

    return (
      <div className="flex-grow">
        <div className="container mx-auto sm:max-w-none sm:p-0">
          <Suspense fallback={<LoadingFallback />}>
            <Post
              post={{
                title: rawContent.title,
                chapter: rawContent.chapter,
                lessonNumber: rawContent.lessonNumber,
                lessonLength: rawContent.lessonLength,
                description: rawContent.description,
                image: rawContent.image || undefined,
                publishedAt: rawContent.publishedAt,
              }}
              content={transformedContent}
            />
            <div className="mb-10 mt-8 flex justify-center">
              <LessonActions
                lessonId={lessonData.id}
                lessonSlug={resolvedParams.lessonSlug}
                courseId={lessonData.course_id}
                lessonNumber={lessonData.lessonID}
                quizSlug={lessonData.quiz}
              />
            </div>
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in LessonPage:', error);
    throw error;
  }
}
