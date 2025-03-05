import { createCmsClient } from '@kit/cms';

import { Cms } from '../../../../../../../../packages/cms/types/src/cms-client';

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'multiple_choice';
  options: string[];
  category: string;
  questionspin: 'Positive' | 'Negative';
}

interface RawSurveyQuestion {
  question: string;
  answers: Array<{ answer: string }>;
  questioncategory: string;
  questionspin: string;
}

export async function getSurveyQuestions(
  surveySlug: string,
): Promise<SurveyQuestion[]> {
  console.log('Starting getSurveyQuestions for slug:', surveySlug);

  try {
    console.log('Creating CMS client...');
    const client = await createCmsClient();
    console.log('Successfully created CMS client');

    console.log('Fetching surveys...');
    const { items } = await client.getContentItems({
      collection: 'surveys',
      status: 'published',
    });

    console.log('Fetched items:', JSON.stringify(items, null, 2));

    // Try to find the survey by exact slug or without extension
    const survey = items.find(
      (item) =>
        item.slug === surveySlug ||
        item.slug === surveySlug.replace('.yaml', '').replace('.mdoc', ''),
    ) as Cms.ContentItem | undefined;

    if (!survey) {
      console.error(`Survey not found with slug: ${surveySlug}`);
      console.error(
        'Available surveys:',
        items.map((item) => item.slug).join(', '),
      );
      throw new Error(`Survey not found with slug: ${surveySlug}`);
    }

    console.log('Found survey:', JSON.stringify(survey, null, 2));

    // Parse the questions from the content field
    const questions = JSON.parse(
      survey.content as string,
    ) as RawSurveyQuestion[];

    if (!questions || !Array.isArray(questions)) {
      throw new Error(
        `Survey has invalid question format. Questions: ${JSON.stringify(
          questions,
        )}`,
      );
    }

    // Map the questions to the expected format
    const mappedQuestions: SurveyQuestion[] = questions.map((q, index) => ({
      id: `q${index + 1}`,
      text: q.question,
      type: 'multiple_choice',
      options: q.answers.map((a) => a.answer),
      category: q.questioncategory,
      questionspin: capitalizeFirst(q.questionspin),
    }));

    console.log('Mapped questions:', JSON.stringify(mappedQuestions, null, 2));
    return mappedQuestions;
  } catch (error) {
    console.error('Error in getSurveyQuestions:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      error,
    });
    throw error;
  }
}

function capitalizeFirst(str: string): 'Positive' | 'Negative' {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as
    | 'Positive'
    | 'Negative';
}
