'use server';

import { unstable_cache } from 'next/cache';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

export const hasSurvey = unstable_cache(
  async (lessonSlug: string): Promise<boolean> => {
    try {
      const client = getSupabaseServerClient();
      const { data, error } = await client
        .from('lessons')
        .select('survey')
        .eq('slug', lessonSlug)
        .single();

      if (error) {
        console.error('Error checking survey:', error);
        return false;
      }

      return !!data?.survey;
    } catch (error) {
      console.error('Error in hasSurvey:', error);
      return false;
    }
  },
  ['survey-check'],
  {
    revalidate: 3600,
    tags: ['survey-check'],
  },
);
