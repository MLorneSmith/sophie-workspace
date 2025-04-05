// Import the server client using dynamic import to avoid issues with next/headers
import { updateLessonProgressAction } from '../../../_lib/server/server-actions';

/**
 * Server component responsible for data fetching
 * This isolates data fetching logic from the page component
 */
export async function LessonDataProvider({
  children,
  slug,
  lessonId,
  courseId,
  lesson,
}: {
  children: (data: any) => React.ReactNode;
  slug: string;
  lessonId: string;
  courseId: string;
  lesson: any;
}) {
  // Dynamically import the server client to avoid issues with next/headers
  const { getSupabaseServerClient } = await import(
    '@kit/supabase/server-client'
  );
  const supabase = getSupabaseServerClient();

  // Get user - should be authenticated by middleware
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user's progress for this lesson
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single();

  // If no progress record exists, create one
  if (!lessonProgress) {
    await updateLessonProgressAction({
      courseId,
      lessonId,
      completionPercentage: 0,
      completed: false,
    });
  }

  // Get quiz data if lesson has a quiz
  let quiz = null;
  let quizAttempts: any[] = [];

  // Check for quiz relationship using quiz_id or quiz_id_id
  const quizId = lesson.quiz_id || lesson.quiz_id_id;

  if (quizId) {
    try {
      // Get quiz data
      const { getQuiz } = await import('@kit/cms/payload');

      try {
        // Pass the quiz ID as is - the getQuiz function now handles both string and object IDs
        quiz = await getQuiz(quizId);
      } catch (error) {
        // Continue without the quiz data
      }

      // Get user's quiz attempts for this quiz (even if quiz fetch failed)
      try {
        // Extract the actual quiz ID for the database query
        const actualQuizId =
          typeof quizId === 'object' && quizId.value
            ? quizId.value
            : typeof quizId === 'object' && quizId.id
              ? quizId.id
              : quizId;

        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .eq('quiz_id', actualQuizId)
          .order('completed_at', { ascending: false });

        quizAttempts = attempts || [];
      } catch (error) {
        // Continue with empty quiz attempts
      }
    } catch (error) {
      // Continue without quiz data
    }
  }

  return children({
    quiz,
    quizAttempts,
    lessonProgress: lessonProgress || null,
    userId: user.id,
  });
}
