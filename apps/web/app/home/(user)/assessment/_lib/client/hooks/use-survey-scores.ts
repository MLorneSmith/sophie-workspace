'use client';

import { useEffect, useState } from 'react';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

export type CategoryScores = Record<string, number>;

/**
 * Hook to fetch survey scores for a user
 */
export function useSurveyScores(userId: string, surveyId: string) {
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [categoryScores, setCategoryScores] = useState<CategoryScores>({});
  const [highestCategory, setHighestCategory] = useState<string>('');
  const [lowestCategory, setLowestCategory] = useState<string>('');

  useEffect(() => {
    async function fetchScores() {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from('survey_responses')
          .select(
            'category_scores, highest_scoring_category, lowest_scoring_category',
          )
          .eq('user_id', userId)
          .eq('survey_id', surveyId)
          .single();

        if (error) {
          console.error('Error fetching survey scores:', error);
          setError(
            new Error(`Failed to fetch survey scores: ${error.message}`),
          );
          return;
        }

        // Set category scores from database
        if (data?.category_scores && typeof data.category_scores === 'object') {
          setCategoryScores(data.category_scores as CategoryScores);
        }

        // Set highest and lowest categories
        if (data?.highest_scoring_category) {
          setHighestCategory(data.highest_scoring_category);
        }

        if (data?.lowest_scoring_category) {
          setLowestCategory(data.lowest_scoring_category);
        }

        // If we don't have highest/lowest categories but have scores, calculate them
        if (!data?.highest_scoring_category && data?.category_scores) {
          const scores = data.category_scores as Record<string, number>;
          if (scores && Object.keys(scores).length > 0) {
            const sortedCategories = Object.entries(scores).sort(
              ([, a], [, b]) => b - a,
            );

            if (sortedCategories.length > 0) {
              const highestEntry = sortedCategories[0];
              const lowestEntry = sortedCategories[sortedCategories.length - 1];

              if (highestEntry && highestEntry[0]) {
                setHighestCategory(highestEntry[0]);
              }

              if (lowestEntry && lowestEntry[0]) {
                setLowestCategory(lowestEntry[0]);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error in useSurveyScores:', err);
        setError(
          err instanceof Error ? err : new Error('An unknown error occurred'),
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (userId && surveyId) {
      fetchScores();
    }
  }, [userId, surveyId, supabase]);

  return {
    categoryScores,
    highestCategory,
    lowestCategory,
    isLoading,
    error,
  };
}
