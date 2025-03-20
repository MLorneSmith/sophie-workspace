'use server';

import { unstable_cache } from 'next/cache';

import { createCmsClient } from '@kit/cms';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { QuizContentItem } from '../../../_types/quiz';

interface DatabaseLesson {
  id: string | null;
  order: number | null;
  lessonID: number;
  quiz: string | null;
  course_id: string | null;
  title: string | null;
  slug: string | null;
}

interface DatabaseCourse {
  id: string;
  title: string;
  total_lessons: number | null;
}

interface QuizData {
  lessonData: {
    id: string;
    order: number | null;
    lessonID: number;
    quiz: string | null;
    course_id: string;
    title: string | null;
    slug: string | null;
    course: {
      id: string;
      name: string;
      total_lessons: number | null;
    };
  };
  quizData: QuizContentItem;
  lessonCompletions: any[] | null;
  studentName: string | null;
  quizId: string;
}

class QuizDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuizDataError';
  }
}

export const getQuizData = unstable_cache(
  async function (lessonSlug: Promise<string>, quizSlug: Promise<string>): Promise<QuizData> {
    const supabase = getSupabaseServerClient();
    const cmsClient = await createCmsClient();

    try {
      // Await both params first
      const [resolvedLessonSlug, resolvedQuizSlug] = await Promise.all([
        lessonSlug,
        quizSlug
      ]);

      console.log('Fetching user data...');
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError)
        throw new QuizDataError(
          `User authentication error: ${userError.message}`,
        );
      if (!user) throw new QuizDataError('User not authenticated');

      console.log('Authenticated user:', {
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const authenticatedSupabase = supabase;

      console.log('Fetching lesson data...');
      const { data: lesson, error: lessonError } = await authenticatedSupabase
        .from('lessons')
        .select('id, order, lessonID, quiz, course_id, title, slug')
        .eq('slug', resolvedLessonSlug)
        .maybeSingle();

      if (lessonError)
        throw new QuizDataError(
          `Error fetching lesson: ${lessonError.message}`,
        );
      if (!lesson)
        throw new QuizDataError(`Lesson not found for slug: ${resolvedLessonSlug}`);
      if (!lesson.id) throw new QuizDataError('Lesson ID is missing');
      if (!lesson.course_id)
        throw new QuizDataError('Lesson has no associated course');

      const validatedLesson: DatabaseLesson & {
        id: string;
        course_id: string;
      } = {
        ...lesson,
        id: lesson.id,
        course_id: lesson.course_id,
      };

      console.log('Fetching course data...');
      const { data: course, error: courseError } = await authenticatedSupabase
        .from('courses')
        .select('id, title, total_lessons')
        .eq('id', validatedLesson.course_id)
        .maybeSingle();

      if (courseError)
        throw new QuizDataError(
          `Error fetching course: ${courseError.message}`,
        );
      if (!course)
        throw new QuizDataError(
          `Course not found for id: ${validatedLesson.course_id}`,
        );

      console.log('Fetching quiz data from CMS...');
      const quizResult = await cmsClient.getContentItemBySlug({
        slug: resolvedQuizSlug,
        collection: 'quizzes',
      });

      if (!quizResult || !('questions' in quizResult)) {
        throw new QuizDataError(`Quiz not found for slug: ${resolvedQuizSlug}`);
      }

      console.log('Fetching quiz ID from Supabase...');
      const { data: quizData, error: quizError } = await authenticatedSupabase
        .from('quizzes')
        .select('id')
        .eq('slug', resolvedQuizSlug)
        .maybeSingle();

      if (quizError)
        throw new QuizDataError(`Error fetching quiz ID: ${quizError.message}`);
      if (!quizData)
        throw new QuizDataError(`Quiz ID not found for slug: ${resolvedQuizSlug}`);

      console.log('Fetching lesson completions...');
      const { data: lessonCompletions, error: completionsError } =
        await authenticatedSupabase
          .from('lesson_completions')
          .select('*')
          .eq('user_id', user.id);

      if (completionsError)
        throw new QuizDataError(
          `Error fetching lesson completions: ${completionsError.message}`,
        );

      console.log('Fetching student account...');
      const { data: account, error: accountError } = await authenticatedSupabase
        .from('accounts')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();

      if (accountError)
        throw new QuizDataError(
          `Error fetching student account: ${accountError.message}`,
        );

      const result: QuizData = {
        lessonData: {
          ...validatedLesson,
          course: {
            id: course.id,
            name: course.title,
            total_lessons: course.total_lessons,
          },
        },
        quizData: quizResult as QuizContentItem,
        lessonCompletions: lessonCompletions ?? null,
        studentName: account?.name ?? null,
        quizId: quizData.id,
      };

      return result;
    } catch (error) {
      console.error('Error in getQuizData:', error);
      throw error;
    }
  },
  ['quiz-data'],
  {
    revalidate: 3600,
    tags: ['quiz-data'],
  },
);
