import { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { ErrorBoundary } from 'react-error-boundary';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { Survey, SurveyResponseOption } from '../../_types/survey';
import { ErrorFallback } from './_components/ErrorFallback';
import { SurveyPageClient } from './_components/SurveyPageClient';
import { getSurveyQuestions } from './_utils/parseSurveyMarkdown';
import { SURVEY_IDS, SURVEY_SLUGS, ensureSurveyExists } from './surveyConfig';

export const metadata: Metadata = {
  title: 'Self-Assessment Survey',
};

async function getSurveyData(): Promise<Survey> {
  console.log('Starting getSurveyData...');
  try {
    console.log('Fetching survey questions...');
    const questions = await getSurveyQuestions(SURVEY_SLUGS.SELF_ASSESSMENT);
    console.log('Successfully fetched survey questions:', questions);

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error('No survey questions found');
    }

    const mappedQuestions = questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.text,
      text: q.text,
      options: q.options as SurveyResponseOption[],
      category: q.category,
      questionspin: q.questionspin,
    }));

    return {
      id: SURVEY_IDS.SELF_ASSESSMENT,
      title: 'Self-Assessment Survey',
      content:
        'Please answer the following questions to the best of your ability.',
      questions: mappedQuestions,
    };
  } catch (error) {
    console.error('Error in getSurveyData:', error);
    throw error;
  }
}

export default async function SurveyPage() {
  console.log('Rendering SurveyPage...');

  try {
    console.log('Getting Supabase client...');
    const client = getSupabaseServerClient();
    console.log('Successfully got Supabase client');

    console.log('Getting user...');
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      console.log('No user found, redirecting to sign in');
      redirect('/auth/sign-in');
    }
    console.log('User found:', user.id);

    console.log('Ensuring survey exists...');
    await ensureSurveyExists(client);
    console.log('Survey existence confirmed');

    console.log('Getting survey data...');
    const survey = await getSurveyData();
    console.log('Successfully got survey data:', survey);

    if (!survey.questions || survey.questions.length === 0) {
      throw new Error('Survey has no questions');
    }

    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div className="flex flex-col space-y-6">
          <SurveyPageClient
            survey={survey}
            studentName={user.user_metadata.full_name}
            surveyId={survey.id}
          />
        </div>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error in SurveyPage:', error);
    return <ErrorFallback error={error as Error} />;
  }
}
