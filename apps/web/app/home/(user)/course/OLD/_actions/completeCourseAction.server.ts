'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { calculateCourseCompletion } from './CalculateCourseCompletion';
import { generateCertificate } from './GenerateCertificate';

export async function completeCourseAction(
  currentLessonId: string,
  quizScore: number,
  lessonOrder: number,
  course: { id: string; name: string; total_lessons: number | null },
  lessonCompletionsData:
    | {
        id: string;
        user_id: string | null;
        completed_at: string | null;
        quiz_score: number | null;
        completed_lesson: number[];
      }[]
    | null,
) {
  const supabase = getSupabaseServerClient();

  try {
    console.log('Starting completeCourseAction');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError)
      throw new Error(`User authentication error: ${userError.message}`);
    if (!user) throw new Error('User not found');

    console.log('User retrieved:', user.id);

    // Check if a lesson completion already exists
    const { data: existingCompletion, error: existingCompletionError } =
      await supabase
        .from('lesson_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', currentLessonId)
        .single();

    if (
      existingCompletionError &&
      existingCompletionError.code !== 'PGRST116'
    ) {
      throw new Error(
        `Error checking existing lesson completion: ${existingCompletionError.message}`,
      );
    }

    let lessonCompletion;
    if (existingCompletion) {
      // Update existing lesson completion
      const { data: updatedCompletion, error: updateError } = await supabase
        .from('lesson_completions')
        .update({
          completed_at: new Date().toISOString(),
          quiz_score: quizScore,
          completed_lesson: [lessonOrder],
        })
        .eq('id', existingCompletion.id)
        .select()
        .single();

      if (updateError)
        throw new Error(
          `Lesson completion update error: ${updateError.message}`,
        );
      lessonCompletion = updatedCompletion;
    } else {
      // Insert new lesson completion
      const { data: newCompletion, error: insertError } = await supabase
        .from('lesson_completions')
        .insert({
          user_id: user.id,
          lesson_id: currentLessonId,
          completed_at: new Date().toISOString(),
          quiz_score: quizScore,
          completed_lesson: [lessonOrder],
        })
        .select()
        .single();

      if (insertError)
        throw new Error(
          `Lesson completion insert error: ${insertError.message}`,
        );
      lessonCompletion = newCompletion;
    }

    console.log('Lesson completion updated:', lessonCompletion);

    // Calculate course completion
    const updatedLessonCompletionsData = [
      ...(lessonCompletionsData ?? []),
      lessonCompletion,
    ];
    const courseCompletion = calculateCourseCompletion(
      course,
      updatedLessonCompletionsData,
    );

    console.log('Course completion calculated:', courseCompletion);

    // Generate certificate if course is completed
    let certificateUrl = null;
    if (courseCompletion === 100) {
      console.log('Course completed. Generating certificate...');

      const { data: userData, error: userDataError } = await supabase
        .from('accounts')
        .select('name')
        .eq('id', user.id)
        .single();

      if (userDataError)
        throw new Error(`User data fetch error: ${userDataError.message}`);
      if (!userData || !userData.name) throw new Error('User name not found');

      console.log('User data retrieved for certificate generation');

      const currentDate =
        new Date().toISOString().split('T')[0] || new Date().toISOString();

      try {
        certificateUrl = await generateCertificate(
          userData.name,
          course.name,
          currentDate,
        );
        console.log('Certificate generated successfully:', certificateUrl);
      } catch (certError) {
        console.error('Error generating certificate:', certError);
        throw new Error(
          `Certificate generation failed: ${certError instanceof Error ? certError.message : 'Unknown error'}`,
        );
      }

      // Update course_progress with certificate URL
      const { error: progressError } = await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: course.id,
          is_completed: true,
          completed_lessons: Array.from(
            { length: course.total_lessons || 0 },
            (_, i) => i + 1,
          ),
          certificate_url: certificateUrl,
          updated_at: new Date().toISOString(),
        });

      if (progressError)
        throw new Error(
          `Course progress update error: ${progressError.message}`,
        );

      console.log('Course progress updated with certificate URL');
    }

    console.log('Completing completeCourseAction successfully');

    return {
      success: true,
      courseCompletion,
      certificateUrl,
    };
  } catch (error) {
    console.error('Error in completeCourseAction:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

export default completeCourseAction;
