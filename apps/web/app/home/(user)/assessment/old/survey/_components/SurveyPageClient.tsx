'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Toaster } from '@kit/ui/sonner';

import { useCoreStore } from '../../../../../_stores/core-store';
import {
  CustomSupabaseClient,
  SurveyResponseData,
  SurveyResponseResult,
} from '../../../_types/supabase';
import {
  CategoryScores,
  QuestionResponse,
  Survey,
  SurveyResponse,
  SurveyResponseOption,
} from '../../../_types/survey';
import { createApi } from '../../../_utils/api';
import { handleClientError } from '../../../_utils/errorHandling';
import { SurveyQuestion } from './SurveyQuestion';
import { SurveySummary, SurveySummaryProps } from './SurveySummary';

interface SurveyPageClientProps {
  survey: Survey;
  studentName: string | null;
  surveyId: string;
}

function SurveyHeader({ title }: { title: string }) {
  return (
    <div className="mb-6 border-b border-gray-200 pb-4">
      <div className="flex items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
    </div>
  );
}

// Define category names as constants
const CATEGORY_STRUCTURE = 'Structure';
const CATEGORY_STORY = 'Story';
const CATEGORY_SUBSTANCE = 'Substance';
const CATEGORY_SELF_CONFIDENCE = 'Self-Confidence';
const CATEGORY_STYLE = 'Style';

// Type guard for QuestionResponse
function isQuestionResponse(obj: any): obj is QuestionResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'questionType' in obj &&
    'response' in obj &&
    'score' in obj &&
    'category' in obj
  );
}

// Conversion function for Json[] to QuestionResponse[]
function convertToQuestionResponses(data: any[]): QuestionResponse[] {
  return data.filter(isQuestionResponse);
}

export function SurveyPageClient(props: SurveyPageClientProps) {
  const { survey, studentName, surveyId } = props;

  const { surveyStates, updateSurveyState } = useCoreStore();
  const router = useRouter();
  const supabase = useSupabase() as unknown as CustomSupabaseClient;
  const api = useMemo(() => createApi(supabase), [supabase]);
  const [questionResponses, setQuestionResponses] = useState<
    QuestionResponse[]
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [categoryScores, setCategoryScores] = useState<CategoryScores>({
    [CATEGORY_STRUCTURE]: 0,
    [CATEGORY_STORY]: 0,
    [CATEGORY_SUBSTANCE]: 0,
    [CATEGORY_SELF_CONFIDENCE]: 0,
    [CATEGORY_STYLE]: 0,
  });
  const [categoryQuestionCounts, setCategoryQuestionCounts] = useState<
    Record<string, number>
  >({});
  const [highestScoringCategory, setHighestScoringCategory] =
    useState<string>('');
  const [lowestScoringCategory, setLowestScoringCategory] =
    useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedCompletion, setHasCheckedCompletion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;

  useEffect(() => {
    // Count the number of questions per category
    const counts: Record<string, number> = {};
    survey.questions.forEach((question) => {
      counts[question.category] = (counts[question.category] || 0) + 1;
    });
    setCategoryQuestionCounts(counts);
    console.log('Questions per category:', counts);
  }, [survey.questions]);

  const checkSurveyCompletion = useCallback(
    async (retryCount = 0) => {
      if (hasCheckedCompletion) return;
      setIsLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user found, skipping survey completion check');
          setIsLoading(false);
          return;
        }

        const result = (await supabase
          .from('survey_responses')
          .select(
            'id, responses, category_scores, highest_scoring_category, lowest_scoring_category',
          )
          .eq('user_id', user.id)
          .eq('survey_id', surveyId)
          .single()) as SurveyResponseResult;

        const { data: surveyData, error } = result;

        if (error) {
          if (error.code === 'PGRST116') {
            console.log(
              'No survey response found, user has not completed the survey yet',
            );
            setShowSummary(false);
            setQuestionResponses([]);
            setCurrentQuestionIndex(0);
            setCategoryScores({
              [CATEGORY_STRUCTURE]: 0,
              [CATEGORY_STORY]: 0,
              [CATEGORY_SUBSTANCE]: 0,
              [CATEGORY_SELF_CONFIDENCE]: 0,
              [CATEGORY_STYLE]: 0,
            });
            updateSurveyState(surveyId, false);
          } else {
            console.error('Error in checkSurveyCompletion:', error);
            if (retryCount < 3) {
              console.log(`Retrying... Attempt ${retryCount + 1}`);
              setTimeout(() => checkSurveyCompletion(retryCount + 1), 1000);
              return;
            }
            throw error;
          }
        } else if (surveyData) {
          console.log('Survey response found:', surveyData);
          setShowSummary(true);
          if (Array.isArray(surveyData.responses)) {
            setQuestionResponses(
              convertToQuestionResponses(surveyData.responses),
            );
          }
          if (surveyData.category_scores) {
            setCategoryScores(surveyData.category_scores);
          }
          setHighestScoringCategory(surveyData.highest_scoring_category || '');
          setLowestScoringCategory(surveyData.lowest_scoring_category || '');
          updateSurveyState(surveyId, true);
        } else {
          console.log('No survey response data found');
          setShowSummary(false);
          setQuestionResponses([]);
          setCurrentQuestionIndex(0);
          setCategoryScores({
            [CATEGORY_STRUCTURE]: 0,
            [CATEGORY_STORY]: 0,
            [CATEGORY_SUBSTANCE]: 0,
            [CATEGORY_SELF_CONFIDENCE]: 0,
            [CATEGORY_STYLE]: 0,
          });
          updateSurveyState(surveyId, false);
        }
      } catch (error) {
        console.error('Error checking survey completion:', error);
        setError('Failed to check survey completion. Please try again later.');
        handleClientError(error, 'Error checking survey completion');
      } finally {
        setIsLoading(false);
        setHasCheckedCompletion(true);
      }
    },
    [surveyId, supabase, updateSurveyState, hasCheckedCompletion],
  );

  useEffect(() => {
    checkSurveyCompletion();
  }, [checkSurveyCompletion]);

  const handleSurveyCompletion = useCallback(() => {
    setShowSummary(true);
    updateSurveyState(surveyId, true);
    toast.success('Survey completed! Thank you for your participation.');
  }, [surveyId, updateSurveyState]);

  const handleRetry = useCallback(() => {
    updateSurveyState(surveyId, false);
    setQuestionResponses([]);
    setCurrentQuestionIndex(0);
    setShowSummary(false);
    setCategoryScores({
      [CATEGORY_STRUCTURE]: 0,
      [CATEGORY_STORY]: 0,
      [CATEGORY_SUBSTANCE]: 0,
      [CATEGORY_SELF_CONFIDENCE]: 0,
      [CATEGORY_STYLE]: 0,
    });
    setHighestScoringCategory('');
    setLowestScoringCategory('');
  }, [surveyId, updateSurveyState]);

  const getHighestAndLowestCategories = useCallback(
    (scores: CategoryScores): { highest: string; lowest: string } => {
      const entries = Object.entries(scores);
      const highest = entries.reduce(
        (max, [category, score]) => (score > max[1] ? [category, score] : max),
        ['', -Infinity],
      );
      const lowest = entries.reduce(
        (min, [category, score]) => (score < min[1] ? [category, score] : min),
        ['', Infinity],
      );
      return { highest: highest[0], lowest: lowest[0] };
    },
    [],
  );

  const submitSurvey = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { highest: highestScoringCategory, lowest: lowestScoringCategory } =
        getHighestAndLowestCategories(categoryScores);

      setHighestScoringCategory(highestScoringCategory);
      setLowestScoringCategory(lowestScoringCategory);

      console.log('Submitting survey with:', {
        userId: user.id,
        surveyId: surveyId,
        responses: questionResponses,
        categoryScores: categoryScores,
        highestScoringCategory: highestScoringCategory,
        lowestScoringCategory: lowestScoringCategory,
      });

      const result = await api.survey.submitSurveyResponses(
        user.id,
        surveyId,
        questionResponses,
        categoryScores,
        highestScoringCategory,
        lowestScoringCategory,
      );

      if (!result.success) {
        throw new Error('Failed to submit survey responses');
      }

      handleSurveyCompletion();
    } catch (error) {
      console.error('Error in submitSurvey:', error);
      handleClientError(error, 'Error submitting survey');
      toast.error('Failed to submit survey. Please try again later.');
    }
  }, [
    questionResponses,
    categoryScores,
    surveyId,
    supabase.auth,
    api.survey,
    getHighestAndLowestCategories,
    handleSurveyCompletion,
  ]);

  const calculateScore = useCallback(
    (response: SurveyResponseOption, questionspin: 'Positive' | 'Negative') => {
      const scoreMap: Record<SurveyResponseOption, number> = {
        'Strongly disagree': questionspin === 'Positive' ? 1 : 5,
        Disagree: questionspin === 'Positive' ? 2 : 4,
        'Neither agree nor disagree': 3,
        Agree: questionspin === 'Positive' ? 4 : 2,
        'Strongly agree': questionspin === 'Positive' ? 5 : 1,
      };
      return scoreMap[response];
    },
    [],
  );

  const handleUpdateResponse = useCallback(
    (response: SurveyResponseOption, category: string) => {
      const currentQuestion = survey.questions[currentQuestionIndex];
      if (currentQuestion) {
        const score = calculateScore(response, currentQuestion.questionspin);
        console.log(
          'Calculated score:',
          score,
          'for response:',
          response,
          'with questionspin:',
          currentQuestion.questionspin,
        );

        setQuestionResponses((prev) => {
          const newResponses = [...prev];
          newResponses[currentQuestionIndex] = {
            questionType: currentQuestion.type,
            response,
            score,
            category: category,
          };
          return newResponses;
        });

        setCategoryScores((prev) => {
          const categoryKey =
            category.toLowerCase() === 'self-confidence'
              ? CATEGORY_SELF_CONFIDENCE
              : category.charAt(0).toUpperCase() + category.slice(1);

          // Accumulate the score instead of calculating an average
          const newScore =
            (prev[categoryKey as keyof CategoryScores] || 0) + score;

          const newScores = {
            ...prev,
            [categoryKey]: newScore,
          };
          console.log('Updated category scores:', newScores);
          return newScores;
        });
      }
    },
    [currentQuestionIndex, survey.questions, calculateScore],
  );

  const handleNextQuestion = useCallback(
    async (response: SurveyResponseOption, category: string) => {
      console.log('handleNextQuestion called with:', { response, category });
      handleUpdateResponse(response, category);
      if (isLastQuestion) {
        console.log('Last question reached, submitting survey');
        await submitSurvey();
      } else {
        console.log('Moving to next question');
        setCurrentQuestionIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          console.log('New question index:', nextIndex);
          return nextIndex;
        });
      }
    },
    [isLastQuestion, submitSurvey, handleUpdateResponse],
  );

  useEffect(() => {
    console.log('Current question index:', currentQuestionIndex);
  }, [currentQuestionIndex]);

  const memoizedSurveyQuestion = useMemo(() => {
    console.log('Rendering question:', currentQuestionIndex);
    return (
      <SurveyQuestion
        key={currentQuestionIndex}
        survey={survey}
        currentQuestionIndex={currentQuestionIndex}
        onNextQuestion={handleNextQuestion}
        isLastQuestion={isLastQuestion}
        updateResponse={handleUpdateResponse}
        onSurveyComplete={handleSurveyCompletion}
      />
    );
  }, [
    survey,
    currentQuestionIndex,
    handleNextQuestion,
    isLastQuestion,
    handleUpdateResponse,
    handleSurveyCompletion,
  ]);

  if (!survey) {
    handleClientError(
      new Error('Missing required props'),
      'Unable to load survey',
    );
    return <div>Error: Unable to load survey</div>;
  }

  if (isLoading) {
    return <div>Loading survey data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const surveySummaryProps: SurveySummaryProps = {
    categoryScores,
    onRetry: handleRetry,
    highestScoringCategory,
    lowestScoringCategory,
    totalQuestions: survey.questions.length,
    submitButton: <button onClick={submitSurvey}>Submit Survey</button>,
  };

  return (
    <div className="flex flex-col space-y-6">
      <SurveyHeader title={survey.title} />
      <div className="mt-8">
        {!showSummary ? (
          memoizedSurveyQuestion
        ) : (
          <SurveySummary {...surveySummaryProps} />
        )}
      </div>
      <Toaster />
    </div>
  );
}
