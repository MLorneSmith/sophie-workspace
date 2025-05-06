import path from 'path';
import { fileURLToPath } from 'url';
import { parseMarkdocFile, readFilesWithExtension, extractBunnyVideoId } from '../lib/file-parser';
import { markdocToLexical, createLexicalWithBunnyVideo } from '../lib/lexical-converter';
import { logger } from '../lib/logger';
import { initPayloadRestAPI } from '../lib/payload-api';
// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Load course data from Markdoc files into Payload CMS
 */
export async function loadCourseFromMarkdoc(options) {
    const { lessonsDir, quizzesDir, apiUrl, email, password } = options;
    logger.section('Loading Course from Markdoc Files');
    logger.info(`Lessons directory: ${lessonsDir}`);
    logger.info(`Quizzes directory: ${quizzesDir}`);
    try {
        // Initialize the Payload REST API
        const api = await initPayloadRestAPI({ apiUrl, email, password });
        // Read all lesson files
        logger.info('Reading lesson files...');
        const lessonFiles = readFilesWithExtension(lessonsDir, '.mdoc');
        logger.info(`Found ${lessonFiles.length} lesson files`);
        // Read all quiz files
        logger.info('Reading quiz files...');
        const quizFiles = readFilesWithExtension(quizzesDir, '.mdoc');
        logger.info(`Found ${quizFiles.length} quiz files`);
        // Parse lesson files
        logger.info('Parsing lesson files...');
        const lessons = lessonFiles.map((file) => {
            const parsedLesson = parseMarkdocFile(file);
            return {
                ...parsedLesson,
                filename: path.basename(file),
            };
        });
        // Parse quiz files
        logger.info('Parsing quiz files...');
        const quizzes = quizFiles.map((file) => {
            const parsedQuiz = parseMarkdocFile(file);
            return {
                ...parsedQuiz,
                filename: path.basename(file),
            };
        });
        // Create or update the course
        logger.info('Creating or updating course...');
        const courseTitle = 'Decks for Decision Makers';
        const courseSlug = 'decks-for-decision-makers';
        // Check if the course already exists
        const checkResponse = (await api.callAPI(`courses?where[slug][equals]=${courseSlug}`));
        let course;
        if (checkResponse.docs && checkResponse.docs.length > 0) {
            // Course already exists, use it
            course = { doc: checkResponse.docs[0] };
            logger.info(`Using existing course with ID: ${course.doc.id}`);
        }
        else {
            logger.info('Creating new course...');
            // Create the course
            const courseData = {
                title: courseTitle,
                slug: courseSlug,
                description: 'Learn how to create effective presentation decks',
                introContent: markdocToLexical('Welcome to the Decks for Decision Makers course! This course will teach you how to create effective presentation decks.'),
                completionContent: markdocToLexical('Congratulations on completing the course! You now have the skills to create effective presentation decks.'),
                estimatedDuration: 120, // 2 hours
                showProgressBar: true,
                status: 'published',
            };
            // Create the course
            const courseResponse = (await api.callAPI('courses', {
                method: 'POST',
                body: JSON.stringify(courseData),
            }));
            course = courseResponse;
            logger.success(`Course created with ID: ${course.doc.id}`);
        }
        // Create quizzes first (so we can reference them from lessons)
        logger.info('Creating quizzes...');
        const createdQuizzes = [];
        for (const quiz of quizzes) {
            const quizTitle = quiz.frontmatter.title;
            const quizSlug = createSlugFromTitle(quizTitle);
            // Check if the quiz already exists
            const checkQuizResponse = (await api.callAPI(`course_quizzes?where[title][equals]=${encodeURIComponent(quizTitle)}`));
            if (checkQuizResponse.docs && checkQuizResponse.docs.length > 0) {
                // Quiz already exists, use it
                logger.info(`Quiz "${quizTitle}" already exists, using existing quiz`);
                createdQuizzes.push({
                    id: checkQuizResponse.docs[0].id,
                    title: quizTitle,
                    filename: quiz.filename,
                });
                continue;
            }
            // Map the quiz questions
            const questions = quiz.frontmatter.questions.map((q) => {
                return {
                    question: q.question,
                    type: 'multiple_choice',
                    options: q.answers.map((a) => ({
                        text: a.answer,
                        isCorrect: a.correct,
                    })),
                    explanation: markdocToLexical(''),
                };
            });
            // Create the quiz
            const quizData = {
                title: quizTitle,
                description: `Quiz for ${quizTitle}`,
                passingScore: 70,
                questions,
            };
            // Create the quiz
            const quizResponse = (await api.callAPI('course_quizzes', {
                method: 'POST',
                body: JSON.stringify(quizData),
            }));
            createdQuizzes.push({
                id: quizResponse.doc.id,
                title: quizTitle,
                filename: quiz.filename,
            });
            logger.debug(`Created quiz: ${quizResponse.doc.id} - ${quizTitle}`);
        }
        // Create lessons
        logger.info('Creating lessons...');
        const createdLessons = [];
        for (const lesson of lessons) {
            const lessonTitle = lesson.frontmatter.title;
            const lessonSlug = createSlugFromTitle(lessonTitle);
            // Check if the lesson already exists
            const checkLessonResponse = (await api.callAPI(`course_lessons?where[slug][equals]=${lessonSlug}`));
            if (checkLessonResponse.docs && checkLessonResponse.docs.length > 0) {
                // Lesson already exists, use it
                logger.info(`Lesson "${lessonTitle}" already exists, using existing lesson`);
                createdLessons.push({
                    id: checkLessonResponse.docs[0].id,
                    title: lessonTitle,
                    lessonNumber: lesson.frontmatter.lessonNumber,
                });
                continue;
            }
            // Find associated quiz
            const associatedQuizFilename = findAssociatedQuizFilename(lesson.filename, quizzes);
            const associatedQuiz = associatedQuizFilename
                ? createdQuizzes.find((q) => q.filename === associatedQuizFilename)
                : null;
            // Extract Bunny video ID if present
            const bunnyVideoId = extractBunnyVideoId(lesson.content);
            // Create lesson content
            let lessonContent;
            if (bunnyVideoId) {
                lessonContent = createLexicalWithBunnyVideo(bunnyVideoId, lesson.content);
            }
            else {
                lessonContent = markdocToLexical(lesson.content);
            }
            // Create the lesson
            const lessonData = {
                title: lessonTitle,
                slug: lessonSlug,
                description: lesson.frontmatter.description || '',
                content: lessonContent,
                lessonNumber: lesson.frontmatter.lessonNumber,
                estimatedDuration: lesson.frontmatter.lessonLength || 10,
                course: course.doc.id,
                quiz: associatedQuiz ? associatedQuiz.id : undefined,
            };
            // Create the lesson
            const lessonResponse = (await api.callAPI('course_lessons', {
                method: 'POST',
                body: JSON.stringify(lessonData),
            }));
            createdLessons.push({
                id: lessonResponse.doc.id,
                title: lessonTitle,
                lessonNumber: lesson.frontmatter.lessonNumber,
            });
            logger.debug(`Created lesson: ${lessonResponse.doc.id} - ${lessonTitle}`);
        }
        // Sort lessons by lesson number
        createdLessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
        // Update the course with the lesson IDs
        logger.info('Updating course with lesson IDs...');
        const updateResponse = await api.callAPI(`courses/${course.doc.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                lessons: createdLessons.map((lesson) => lesson.id),
            }),
        });
        logger.success('Course loaded successfully!');
        return { success: true, courseId: course.doc.id };
    }
    catch (error) {
        logger.error('Error loading course:', error);
        return { success: false, error };
    }
}
/**
 * Create a slug from a title
 */
function createSlugFromTitle(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
}
/**
 * Find the associated quiz filename for a lesson
 */
function findAssociatedQuizFilename(lessonFilename, quizzes) {
    // Remove the .mdoc extension
    const lessonName = lessonFilename.replace('.mdoc', '');
    // Look for a quiz with a matching name (e.g., "structure.mdoc" -> "structure-quiz.mdoc")
    const matchingQuiz = quizzes.find((quiz) => {
        const quizName = quiz.filename.replace('-quiz.mdoc', '');
        return quizName === lessonName;
    });
    return matchingQuiz ? matchingQuiz.filename : null;
}
/**
 * Main function to load a course from Markdoc files
 */
export async function loadCourse(lessonsDir, quizzesDir) {
    const absoluteLessonsDir = path.resolve(lessonsDir);
    const absoluteQuizzesDir = path.resolve(quizzesDir);
    return loadCourseFromMarkdoc({
        lessonsDir: absoluteLessonsDir,
        quizzesDir: absoluteQuizzesDir,
    });
}
