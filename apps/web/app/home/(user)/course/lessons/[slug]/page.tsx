import { notFound } from 'next/navigation';

import { getLessonBySlug } from '@kit/cms/payload';
import { PageBody } from '@kit/ui/page';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { HomeLayoutPageHeader } from '../../../_components/home-page-header';
import { LessonDataProviderEnhanced } from './_components/LessonDataProvider-enhanced';
import { LessonViewClient } from './_components/LessonViewClient';

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = 'force-dynamic';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const resolvedParams = await params;
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:routes.course');

  // Get lesson data for metadata
  const lessonData = await getLessonBySlug(resolvedParams.slug);
  const lesson = lessonData?.docs?.[0];

  return {
    title: lesson?.title || title,
    description: lesson?.description || '',
  };
};

/**
 * Enhanced Lesson page component
 * This page uses the improved LessonDataProviderEnhanced component that handles
 * the unidirectional relationship model for quizzes and questions
 */
async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Await the params to get the slug
  const resolvedParams = await params;

  // Get lesson data
  const lessonData = await getLessonBySlug(resolvedParams.slug);
  const lesson = lessonData?.docs?.[0];

  if (!lesson) {
    notFound();
  }

  // Get course ID for the data provider
  const courseId = lesson.course?.id || '';

  return (
    <>
      <HomeLayoutPageHeader
        title={lesson.title}
        description={lesson.description || ''}
      />

      <PageBody>
        <LessonDataProviderEnhanced
          slug={resolvedParams.slug}
          lessonId={String(lesson.id)}
          courseId={String(courseId)}
          lesson={lesson}
        >
          {(data) => (
            <LessonViewClient
              lesson={lesson}
              quiz={data.quiz}
              quizAttempts={data.quizAttempts}
              lessonProgress={data.lessonProgress}
              userId={data.userId}
              survey={data.survey}
              surveyResponses={data.surveyResponses}
            />
          )}
        </LessonDataProviderEnhanced>
      </PageBody>
    </>
  );
}

export default withI18n(LessonPage);
