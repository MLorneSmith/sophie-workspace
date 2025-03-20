/**
 * Load course data from Markdoc files into Payload CMS
 */
export declare function loadCourseFromMarkdoc(options: {
    lessonsDir: string;
    quizzesDir: string;
    apiUrl?: string;
    email?: string;
    password?: string;
}): Promise<{
    success: boolean;
    courseId: string;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    courseId?: undefined;
}>;
/**
 * Main function to load a course from Markdoc files
 */
export declare function loadCourse(lessonsDir: string, quizzesDir: string): Promise<{
    success: boolean;
    courseId: string;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    courseId?: undefined;
}>;
