'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { completeLessonAndUpdateCourse } from '../../_actions/completeLessonAndUpdateCourse';

// Explicitly opt out of caching since Next.js 15 changes default behavior
export const dynamic = 'force-dynamic';

const COURSE_TITLE = 'Decks for Decision Makers';

interface CompletionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export async function CompleteLessonServer(
  userId: string,
  lessonID: string,
  lessonOrder: number,
  courseTitle: string,
): Promise<CompletionResult> {
  console.log('CompleteLessonServer started', {
    userId,
    lessonID,
    lessonOrder,
    courseTitle,
  });

  const supabase = getSupabaseServerClient();

  try {
    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.error('Authentication error:', userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }
    console.log('Authenticated user:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Verify that the provided courseTitle matches our hardcoded title
    if (courseTitle !== COURSE_TITLE) {
      console.error(
        `Mismatch in course title. Expected: ${COURSE_TITLE}, Received: ${courseTitle}`,
      );
      throw new Error(`Invalid course title provided: ${courseTitle}`);
    }

    // Fetch the course (we still need this for the completeLessonAndUpdateCourse function)
    console.log('Fetching course data');
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('title', COURSE_TITLE)
      .single();

    if (courseError) {
      console.error('Error fetching course:', courseError);
      throw new Error(`Failed to fetch course: ${courseError.message}`);
    }
    console.log('Fetched course:', course);

    // Check if the lesson completion already exists
    console.log('Checking for existing lesson completion');
    const { data: existingCompletion, error: existingCompletionError } =
      await supabase
        .from('lesson_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonID)
        .single();

    if (
      existingCompletionError &&
      existingCompletionError.code !== 'PGRST116'
    ) {
      console.error(
        'Error checking existing completion:',
        existingCompletionError,
      );
      throw new Error(
        `Failed to check existing completion: ${existingCompletionError.message}`,
      );
    }

    if (existingCompletion) {
      console.log('Lesson already completed:', existingCompletion);
      return { success: true, message: 'Lesson already completed' };
    }

    const now = new Date().toISOString();
    const completionData = {
      user_id: userId,
      lesson_id: lessonID,
      completed_at: now,
      completed_lesson: [lessonOrder],
      quiz_score: null,
      updated_at: now,
    };

    // Attempt to insert lesson completion
    console.log('Inserting lesson completion with data:', completionData);
    const { data: completionResult, error: completionError } = await supabase
      .from('lesson_completions')
      .insert(completionData)
      .select()
      .single();

    if (completionError) {
      console.error('Error inserting lesson completion:', completionError);
      throw new Error(
        `Failed to insert lesson completion: ${completionError.message}`,
      );
    }
    console.log('Lesson completion inserted:', completionResult);

    // Call completeLessonAndUpdateCourse
    console.log('Calling completeLessonAndUpdateCourse with params:', {
      userId,
      lessonID,
      quizScore: null,
      lessonOrder,
      courseId: course.id,
    });

    const result = await completeLessonAndUpdateCourse({
      userId,
      lessonID,
      quizScore: null,
      lessonOrder,
      courseId: course.id,
    });

    if ('error' in result && result.error) {
      console.error('Error in completeLessonAndUpdateCourse:', result.error);
      throw new Error(result.error);
    }

    console.log('Lesson completed successfully', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in CompleteLessonServer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
