'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function updateOrCreateLessonCompletion(
  userId: string,
  lessonId: string,
  lessonOrder: number,
  quizScore: number | null,
  courseId: string,
) {
  const client = getSupabaseServerClient();

  try {
    // First, try to find an existing completion for this user and lesson
    const { data: existingCompletion, error: fetchError } = await client
      .from('lesson_completions')
      .select('id, completed_lesson, quiz_score')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows returned
      console.error('Error fetching existing lesson completion:', fetchError);
      return { data: null, error: fetchError };
    }

    const now = new Date().toISOString();

    if (existingCompletion) {
      // Update the existing completion
      const { data, error } = await client
        .from('lesson_completions')
        .update({
          quiz_score: quizScore,
          updated_at: now,
        })
        .eq('id', existingCompletion.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating lesson completion:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } else {
      // Insert a new completion
      const { data, error } = await client
        .from('lesson_completions')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          course_id: courseId,
          completed_lesson: [lessonOrder],
          quiz_score: quizScore,
          completed_at: now,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting lesson completion:', error);
        return { data: null, error };
      }

      return { data, error: null };
    }
  } catch (error) {
    console.error('Error in updateOrCreateLessonCompletion:', error);
    return { data: null, error };
  }
}
