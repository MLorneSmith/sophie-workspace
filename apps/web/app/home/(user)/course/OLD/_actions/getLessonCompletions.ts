import { getSupabaseServerClient } from '@kit/supabase/server-client';

interface User {
  id: string;
}

export interface LessonCompletion {
  id: string;
  user_id: string;
  completed_at: string;
  quiz_score: number | null;
  updated_at: string;
  created_at: string;
  completed_lesson: number[];
  lesson_id: string;
  quiz_id: string;
}

export async function getLessonCompletions(user: User) {
  'use server';

  const client = getSupabaseServerClient();
  const { data, error } = await client
    .from('lesson_completions')
    .select('id, user_id, completed_at, quiz_score, completed_lesson')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching lesson completions data:', error);
    return { data: null, error };
  }

  return { data, error: null };
}
