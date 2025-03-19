import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSurvey } from '@kit/payload';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { HomeLayoutPageHeader } from '../_components/home-page-header';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:routes.assessment');

  return {
    title,
  };
};

async function AssessmentPage() {
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Get the assessment survey
  const surveyData = await getSurvey('assessment');
  const survey = surveyData.docs?.[0];

  if (!survey) {
    return (
      <PageBody>
        <Card className="mx-auto max-w-2xl p-8 shadow-lg">
          <h1 className="mb-6 text-center text-3xl font-bold">
            <Trans i18nKey="assessment:surveyNotFound" />
          </h1>
          <p className="mb-6 text-lg">
            <Trans i18nKey="assessment:surveyNotAvailable" />
          </p>
        </Card>
      </PageBody>
    );
  }

  // Check if user has started the survey
  const { data: progressData } = await client
    .from('survey_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('survey_id', String(survey.id))
    .maybeSingle();

  // If user has started the survey and not completed it, redirect to the survey page
  if (
    progressData &&
    progressData.current_question_index != null &&
    progressData.total_questions != null &&
    progressData.current_question_index > 0 &&
    progressData.current_question_index < progressData.total_questions
  ) {
    redirect('/home/assessment/survey');
  }

  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.assessment'} />}
        description={<Trans i18nKey={'common:assessmentTabDescription'} />}
      />

      <PageBody>
        <Card className="mx-auto max-w-2xl p-8 shadow-lg">
          <h1 className="mb-6 text-center text-3xl font-bold">
            {survey.title}
          </h1>
          <div
            className="prose prose-slate dark:prose-invert mb-6 max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                survey.startMessage?.root?.children?.[0]?.children?.[0]?.text ||
                survey.description ||
                'Welcome to the Self-Assessment Survey. This survey is designed to help you evaluate your current skills and knowledge in various areas related to public speaking and presentation.',
            }}
          />
          <div className="flex justify-center">
            <Link href="/home/assessment/survey">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Trans i18nKey="assessment:takeSurvey" />
              </Button>
            </Link>
          </div>
        </Card>
      </PageBody>
    </>
  );
}

export default withI18n(AssessmentPage);
