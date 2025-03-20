import { getSupabaseServerClient } from '@kit/supabase/server-client';

interface LessonCompletion {
  id: string;
  user_id: string;
  completed_at: string;
  quiz_score: number | null;
  updated_at: string;
  created_at: string;
  completed_lesson: number[]; // Changed to an array
  lesson_id: string;
  quiz_id: string;
}

interface User {
  id: string;
}

export async function getLessonCompletions(user: User) {
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

export default async function LessonCompletions({ user }: { user: User }) {
  const { data: lessonCompletionsData, error: lessonCompletionsError } =
    await getLessonCompletions(user);

  if (lessonCompletionsError) {
    return <div>Error loading lesson completion data</div>;
  }

  if (!lessonCompletionsData) {
    return <div>Loading lesson completion data...</div>;
  }

  return null; // This component doesn't render anything directly
}

export { type LessonCompletion };
