'use server';

import { unstable_cache } from 'next/cache';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = 'force-dynamic';

export const hasQuiz = unstable_cache(
  async (lessonSlug: string): Promise<boolean> => {
    try {
      const client = getSupabaseServerClient();
      const { data, error } = await client
        .from('lessons')
        .select('quiz')
        .eq('slug', lessonSlug)
        .single();

      if (error) {
        console.error('Error checking quiz:', error);
        return false;
      }

      return !!data?.quiz;
    } catch (error) {
      console.error('Error in hasQuiz:', error);
      return false;
    }
  },
  ['quiz-check'],
  {
    revalidate: 3600,
    tags: ['quiz-check'],
  },
);
