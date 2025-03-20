import { redirect } from 'next/navigation';

import { getLessonBySlug } from '@kit/cms/payload';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { HomeLayoutPageHeader } from '../../../_components/home-page-header';
import { updateLessonProgressAction } from '../../_lib/server/server-actions';
// Import will be resolved when the component is created
import { LessonViewClient } from './_components/LessonViewClient';

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = 'force-dynamic';

export const generateMetadata = async ({
  params,
}: {
  params: { slug: string };
}) => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:routes.course');

  // Get lesson data for metadata
  const lessonData = await getLessonBySlug(params.slug);
  const lesson = lessonData?.docs?.[0];

  return {
    title: lesson?.title || title,
    description: lesson?.description || '',
  };
};

async function LessonPage({ params }: { params: { slug: string } }) {
  // Get the authenticated user
  const supabase = getSupabaseServerClient();
  const auth = await requireUser(supabase);

  // Check if the user needs redirect
  if (auth.error) {
    redirect(auth.redirectTo);
  }

  // User is authenticated
  const user = auth.data;

  // Get lesson data
  const lessonData = await getLessonBySlug(params.slug);
  const lesson = lessonData?.docs?.[0];

  if (!lesson) {
    return (
      <>
        <HomeLayoutPageHeader
          title={<Trans i18nKey={'common:routes.course'} />}
          description={<Trans i18nKey={'common:courseTabDescription'} />}
        />
        <PageBody>
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold">Lesson Not Found</h1>
            <p className="mt-4 text-gray-600">
              The lesson you are looking for does not exist.
            </p>
          </div>
        </PageBody>
      </>
    );
  }

  // Get course data
  const courseId = lesson.course?.id || '';

  // Get user's progress for this lesson
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lesson.id)
    .single();

  // If no progress record exists, create one
  if (!lessonProgress) {
    await updateLessonProgressAction({
      courseId,
      lessonId: lesson.id,
      completionPercentage: 0,
      completed: false,
    });
  }

  // Get quiz data if lesson has a quiz
  let quiz = null;
  let quizAttempts: any[] = [];

  if (lesson.quiz) {
    // Get quiz data
    const { getQuiz } = await import('@kit/cms/payload');
    quiz = await getQuiz(lesson.quiz.id);

    // Get user's quiz attempts for this quiz
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('quiz_id', lesson.quiz.id)
      .order('completed_at', { ascending: false });

    quizAttempts = attempts || [];
  }

  return (
    <>
      <HomeLayoutPageHeader
        title={lesson.title}
        description={lesson.description || ''}
      />

      <PageBody>
        <LessonViewClient
          lesson={lesson}
          quiz={quiz}
          quizAttempts={quizAttempts}
          lessonProgress={lessonProgress || null}
          userId={user.id}
        />
      </PageBody>
    </>
  );
}

export default withI18n(LessonPage);
