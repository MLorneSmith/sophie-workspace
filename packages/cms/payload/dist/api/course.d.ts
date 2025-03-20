/**
 * Get all published courses
 * @param options Additional options for the API call
 * @returns The courses data
 */
export declare function getCourses(options?: {}): Promise<any>;
/**
 * Get a course by slug
 * @param slug The slug of the course
 * @param options Additional options for the API call
 * @returns The course data
 */
export declare function getCourseBySlug(slug: string, options?: {}): Promise<any>;
/**
 * Get lessons for a course
 * @param courseId The ID of the course
 * @param options Additional options for the API call
 * @returns The course lessons
 */
export declare function getCourseLessons(courseId: string, options?: {}): Promise<any>;
/**
 * Get a lesson by slug
 * @param slug The slug of the lesson
 * @param options Additional options for the API call
 * @returns The lesson data
 */
export declare function getLessonBySlug(slug: string, options?: {}): Promise<any>;
/**
 * Get a quiz by ID
 * @param quizId The ID of the quiz
 * @param options Additional options for the API call
 * @returns The quiz data
 */
export declare function getQuiz(quizId: string, options?: {}): Promise<any>;
