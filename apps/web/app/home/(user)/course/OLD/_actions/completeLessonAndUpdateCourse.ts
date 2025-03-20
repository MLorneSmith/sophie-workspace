'use server';

import { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { Database } from '../../../../../../../packages/supabase/src/database.types';
import { generateCertificate } from './GenerateCertificate';

interface CompleteLessonParams {
  userId: string;
  lessonID: string;
  quizScore: number | null;
  lessonOrder: number;
  courseId: string;
}

interface CompleteLessonResult {
  success: boolean;
  courseCompletion?: number;
  certificateUrl?: string | null;
  error?: string;
  errorCode?: string;
}

interface CourseProgress {
  completed_lessons: number[];
  is_completed: boolean;
  total_lessons: number;
}

interface UserData {
  name: string | null;
}

interface CourseData {
  title: string | null;
  total_lessons: number | null;
}

function createSafeObject(obj: any): any {
  const seen = new WeakSet();
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    }),
  );
}

export async function completeLessonAndUpdateCourse({
  userId,
  lessonID,
  quizScore,
  lessonOrder,
  courseId,
}: CompleteLessonParams): Promise<CompleteLessonResult> {
  const supabase = getSupabaseServerClient() as SupabaseClient<Database>;

  console.log('Starting completeLessonAndUpdateCourse', {
    userId,
    lessonID,
    quizScore,
    lessonOrder,
    courseId,
  });

  // Input validation
  if (!userId || !lessonID || !courseId || lessonOrder < 0) {
    console.error('Invalid input parameters', {
      userId,
      lessonID,
      courseId,
      lessonOrder,
    });
    return {
      success: false,
      error: 'Invalid input parameters',
      errorCode: 'INVALID_INPUT',
    };
  }

  try {
    // Check if the course exists
    console.log('Fetching course data');
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('title, total_lessons')
      .eq('id', courseId)
      .single();

    if (courseError) {
      console.error('Course fetch error:', courseError);
      throw new Error(`Course fetch error: ${courseError.message}`);
    }

    if (!courseData) {
      console.error('Course not found');
      throw new Error('Course not found');
    }

    const typedCourseData: CourseData = courseData;
    console.log('Course data fetched:', typedCourseData);

    // Fetch current course progress
    const { data: currentProgress, error: currentProgressError } =
      await supabase
        .from('course_progress')
        .select('completed_lessons, is_completed')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

    if (currentProgressError) {
      console.error('Current progress fetch error:', currentProgressError);
      // If the error is because no rows were found, create a new course progress entry
      if (currentProgressError.code === 'PGRST116') {
        console.log('No existing course progress found. Creating new entry.');
        const { data: newProgress, error: newProgressError } = await supabase
          .from('course_progress')
          .insert({
            user_id: userId,
            course_id: courseId,
            completed_lessons: [],
            is_completed: false,
          })
          .single();

        if (newProgressError) {
          throw new Error(
            `Failed to create new course progress: ${newProgressError.message}`,
          );
        }
        console.log('New course progress entry created:', newProgress);
      } else {
        throw new Error(
          `Current progress fetch error: ${currentProgressError.message}`,
        );
      }
    }

    let completedLessons = currentProgress?.completed_lessons || [];
    if (!completedLessons.includes(lessonOrder)) {
      completedLessons.push(lessonOrder);
    }

    console.log('Calling complete_lesson_and_update_progress RPC');
    // Use the complete_lesson_and_update_progress function
    const { data: rpcData, error: completionError } = await supabase.rpc(
      'complete_lesson_and_update_progress',
      {
        p_user_id: userId,
        p_lesson_id: lessonID,
        p_quiz_score: quizScore !== null ? Math.round(quizScore) : 0, // Default to 0 if null
        p_completed_lesson: completedLessons,
      },
    );

    if (completionError) {
      console.error('Lesson completion error:', completionError);
      console.error(
        'RPC Error details:',
        JSON.stringify(completionError, null, 2),
      );
      throw new Error(`Lesson completion error: ${completionError.message}`);
    }
    console.log('Lesson completed and progress updated successfully', rpcData);

    if (!rpcData) {
      console.error('No data returned from RPC');
      throw new Error('No data returned from RPC');
    }

    const typedCourseProgress = rpcData as CourseProgress;

    console.log('Updated course progress:', typedCourseProgress);
    console.log('Is course completed:', typedCourseProgress.is_completed);

    const courseCompletion =
      (typedCourseProgress.completed_lessons.length /
        typedCourseProgress.total_lessons) *
      100;
    console.log('Course completion:', courseCompletion);

    // Generate certificate if course is completed
    let certificateUrl: string | null = null;
    if (typedCourseProgress.is_completed) {
      console.log('Course is completed, generating certificate');
      const { data: userData, error: userDataError } = await supabase
        .from('accounts')
        .select('name')
        .eq('id', userId)
        .single();

      if (userDataError) {
        console.error('User data fetch error:', userDataError);
        throw new Error(`User data fetch error: ${userDataError.message}`);
      }

      if (!userData) {
        console.error('User data not found');
        throw new Error('User data not found');
      }

      const typedUserData: UserData = userData;
      const userName = typedUserData.name || 'Unknown User';
      const courseTitle = typedCourseData.title || 'Untitled Course';
      const currentDate = new Date().toISOString().split('T')[0];

      try {
        const generatedUrl = await generateCertificate(
          userName,
          courseTitle,
          currentDate,
        );

        // Only update the database if we have a valid URL
        if (typeof generatedUrl === 'string' && generatedUrl.length > 0) {
          certificateUrl = generatedUrl;
          console.log('Certificate generated', certificateUrl);

          // Update course_progress with certificate URL
          const { error: certificateUpdateError } = await supabase
            .from('course_progress')
            .update({ certificate_url: certificateUrl })
            .eq('user_id', userId)
            .eq('course_id', courseId);

          if (certificateUpdateError) {
            console.error('Certificate update error:', certificateUpdateError);
            throw new Error(
              `Certificate update error: ${certificateUpdateError.message}`,
            );
          }
          console.log('Course progress updated with certificate URL');
        } else {
          console.error('Certificate generation failed - invalid URL returned');
        }
      } catch (certError) {
        console.error('Error generating certificate:', certError);
        // Handle the error as needed, maybe set a flag or send a notification
      }
    }

    const result = {
      success: true,
      courseCompletion,
      certificateUrl,
    };

    console.log('Completion successful', result);

    return createSafeObject(result);
  } catch (error) {
    console.error('Error in completeLessonAndUpdateCourse:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));

    const errorResult = {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
      errorCode: 'COMPLETION_ERROR',
    };

    return createSafeObject(errorResult);
  }
}
