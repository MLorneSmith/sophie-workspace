'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

// Start or update course progress
const UpdateCourseProgressSchema = z.object({
  courseId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  currentLessonId: z
    .union([z.string(), z.number(), z.undefined()])
    .transform((val) => (val !== undefined ? String(val) : undefined)),
  completionPercentage: z.number().min(0).max(100).optional(),
  completed: z.boolean().optional(),
});

export const updateCourseProgressAction = enhanceAction(
  async function (data, user) {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    // Check if the user already has a course progress record
    const { data: existingProgress } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', data.courseId)
      .single();

    if (existingProgress) {
      // Update existing record
      const updateData: any = {
        last_accessed_at: now,
      };

      if (data.currentLessonId) {
        updateData.current_lesson_id = data.currentLessonId;
      }

      if (data.completionPercentage !== undefined) {
        updateData.completion_percentage = data.completionPercentage;
      }

      if (data.completed) {
        updateData.completed_at = now;

        // This would be a hook point for certificate generation
        // updateData.certificate_generated = true;
      }

      await supabase
        .from('course_progress')
        .update(updateData)
        .eq('id', existingProgress.id);
    } else {
      // Create new record
      await supabase.from('course_progress').insert({
        user_id: user.id,
        course_id: data.courseId,
        started_at: now,
        last_accessed_at: now,
        current_lesson_id: data.currentLessonId,
        completion_percentage: data.completionPercentage || 0,
        completed_at: data.completed ? now : null,
      });
    }

    return { success: true };
  },
  {
    auth: true,
    schema: UpdateCourseProgressSchema,
  },
);

// Update lesson progress
const UpdateLessonProgressSchema = z.object({
  courseId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  lessonId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  completionPercentage: z.number().min(0).max(100).optional(),
  completed: z.boolean().optional(),
});

export const updateLessonProgressAction = enhanceAction(
  async function (data, user) {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    // Check if the user already has a lesson progress record
    const { data: existingProgress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', data.lessonId)
      .single();

    if (existingProgress) {
      // Update existing record
      const updateData: any = {};

      if (data.completionPercentage !== undefined) {
        updateData.completion_percentage = data.completionPercentage;
      }

      if (data.completed) {
        updateData.completed_at = now;
      }

      await supabase
        .from('lesson_progress')
        .update(updateData)
        .eq('id', existingProgress.id);
    } else {
      // Create new record
      await supabase.from('lesson_progress').insert({
        user_id: user.id,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        started_at: now,
        completed_at: data.completed ? now : null,
        completion_percentage: data.completionPercentage || 0,
      });
    }

    // Update overall course progress
    const { data: lessonProgress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', data.courseId);

    // Get total lessons for this course from Payload CMS
    const { getCourseBySlug, getCourseLessons } = await import(
      '@kit/cms/payload'
    );
    const courseData = await getCourseBySlug(data.courseId);

    if (courseData?.docs?.[0]) {
      const course = courseData.docs[0];
      const lessonsData = await getCourseLessons(course.id);
      const totalLessons = lessonsData?.docs?.length || 0;

      if (lessonProgress && totalLessons > 0) {
        const completedLessons = lessonProgress.filter(
          (p) => p.completed_at,
        ).length;
        const courseCompletionPercentage =
          (completedLessons / totalLessons) * 100;

        await updateCourseProgressAction({
          courseId: data.courseId,
          completionPercentage: courseCompletionPercentage,
          completed: completedLessons === totalLessons,
        });
      }
    }

    return { success: true };
  },
  {
    auth: true,
    schema: UpdateLessonProgressSchema,
  },
);

// Submit quiz attempt
const SubmitQuizAttemptSchema = z.object({
  courseId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  lessonId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  quizId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  answers: z.record(z.string(), z.any()),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
});

export const submitQuizAttemptAction = enhanceAction(
  async function (data, user) {
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    // Insert the quiz attempt
    await supabase.from('quiz_attempts').insert({
      user_id: user.id,
      course_id: data.courseId,
      lesson_id: data.lessonId,
      quiz_id: data.quizId,
      started_at: now, // In a real implementation, this would be from when the quiz was started
      completed_at: now,
      score: data.score,
      passed: data.passed,
      answers: data.answers,
    });

    // If passed, mark the lesson as completed
    if (data.passed) {
      await updateLessonProgressAction({
        courseId: data.courseId,
        lessonId: data.lessonId,
        completed: true,
        completionPercentage: 100,
      });
    }

    return { success: true };
  },
  {
    auth: true,
    schema: SubmitQuizAttemptSchema,
  },
);
