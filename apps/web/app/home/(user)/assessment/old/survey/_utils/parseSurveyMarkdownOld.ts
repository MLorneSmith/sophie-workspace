import { createCmsClient } from '@kit/cms';

// Basic ContentItem interface definition
interface ContentItem {
  id: string;
  slug: string;
  [key: string]: any; // Allow for additional properties
}

interface SurveyQuestion {
  id: string;
  text: string;
  type: 'multiple_choice';
  options: string[];
  category: string;
  questionspin: 'Positive' | 'Negative';
}

interface SurveyContentItem extends ContentItem {
  questions?: {
    question: string;
    answers: { answer: string }[];
    questioncategory: string;
    questionspin: 'Positive' | 'Negative';
  }[];
}

export async function getSurveyQuestions(
  surveySlug: string,
): Promise<SurveyQuestion[]> {
  try {
    const client = await createCmsClient();

    const { items } = await client.getContentItems({
      collection: 'surveys',
    });

    console.log('Fetched items:', JSON.stringify(items, null, 2)); // Log fetched items

    const survey = items.find((item) => item.slug === surveySlug) as
      | SurveyContentItem
      | undefined;

    if (!survey) {
      console.error(`Survey ${surveySlug} not found`);
      throw new Error(`Survey ${surveySlug} not found`);
    }

    console.log('Found survey:', JSON.stringify(survey, null, 2)); // Log found survey

    if (!survey.questions || !Array.isArray(survey.questions)) {
      console.error(
        `Survey ${surveySlug} has no questions or questions is not an array`,
      );
      throw new Error(`Survey ${surveySlug} has invalid question format`);
    }

    const questions: SurveyQuestion[] = survey.questions.map((q, index) => ({
      id: `q${index + 1}`,
      text: q.question,
      type: 'multiple_choice',
      options: q.answers.map((a) => a.answer),
      category: q.questioncategory,
      questionspin: q.questionspin,
    }));

    console.log('Parsed questions:', JSON.stringify(questions, null, 2)); // Log parsed questions

    return questions;
  } catch (error) {
    console.error('Error in getSurveyQuestions:', error);
    throw error;
  }
}
