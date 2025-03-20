import { callPayloadAPI } from './payload-api';

/**
 * Get all published courses
 * @param options Additional options for the API call
 * @returns The courses data
 */
export async function getCourses(options = {}) {
  return callPayloadAPI(`courses?where[status][equals]=published&depth=1`);
}

/**
 * Get a course by slug
 * @param slug The slug of the course
 * @param options Additional options for the API call
 * @returns The course data
 */
export async function getCourseBySlug(slug: string, options = {}) {
  return callPayloadAPI(`courses?where[slug][equals]=${slug}&depth=1`);
}

/**
 * Get lessons for a course
 * @param courseId The ID of the course
 * @param options Additional options for the API call
 * @returns The course lessons
 */
export async function getCourseLessons(courseId: string, options = {}) {
  return callPayloadAPI(
    `course_lessons?where[course][equals]=${courseId}&sort=lessonNumber&depth=0`,
  );
}

/**
 * Get a lesson by slug
 * @param slug The slug of the lesson
 * @param options Additional options for the API call
 * @returns The lesson data
 */
export async function getLessonBySlug(slug: string, options = {}) {
  return callPayloadAPI(`course_lessons?where[slug][equals]=${slug}&depth=2`);
}

/**
 * Get a quiz by ID
 * @param quizId The ID of the quiz
 * @param options Additional options for the API call
 * @returns The quiz data
 */
export async function getQuiz(quizId: string, options = {}) {
  return callPayloadAPI(`course_quizzes/${quizId}`);
}
