/**
 * Common types used across the scripts
 */
/**
 * Generic Payload API response structure
 */
export interface PayloadResponse {
    doc: {
        id: string;
        [key: string]: any;
    };
    docs?: Array<{
        id: string;
        [key: string]: any;
    }>;
    [key: string]: any;
}
/**
 * Survey data structure
 */
export interface Survey {
    id: string;
    title: string;
    slug: string;
    description?: string;
    status: 'draft' | 'published';
    startMessage?: any;
    endMessage?: any;
    questions?: string[];
}
/**
 * Survey question data structure
 */
export interface SurveyQuestion {
    id: string;
    text: string;
    description?: string;
    category: string;
    type: 'multiple_choice' | string;
    required: boolean;
    questionspin: 'Positive' | 'Negative';
    options: Array<{
        option: string;
    }>;
    position: number;
}
/**
 * Course data structure
 */
export interface Course {
    id: string;
    title: string;
    slug: string;
    description?: string;
    status: 'draft' | 'published';
    featuredImage?: any;
    introContent?: any;
    completionContent?: any;
    estimatedDuration?: number;
    showProgressBar?: boolean;
    lessons?: string[];
}
/**
 * Course lesson data structure
 */
export interface CourseLesson {
    id: string;
    title: string;
    slug: string;
    description?: string;
    featuredImage?: any;
    content?: any;
    lessonNumber: number;
    estimatedDuration?: number;
    course: string;
    quiz?: string;
}
/**
 * Course quiz data structure
 */
export interface CourseQuiz {
    id: string;
    title: string;
    description?: string;
    passingScore: number;
    questions: Array<{
        question: string;
        type: 'multiple_choice' | string;
        options: Array<{
            text: string;
            isCorrect: boolean;
        }>;
        explanation?: any;
    }>;
}
/**
 * Markdoc lesson data structure
 */
export interface MarkdocLesson {
    frontmatter: {
        title: string;
        status: string;
        description?: string;
        lessonID: number;
        chapter: string;
        lessonNumber: number;
        lessonLength: number;
        image?: string;
        publishedAt: string;
        language: string;
        order: number;
        [key: string]: any;
    };
    content: string;
}
/**
 * Markdoc quiz data structure
 */
export interface MarkdocQuiz {
    frontmatter: {
        title: string;
        questions: Array<{
            question: string;
            answers: Array<{
                answer: string;
                correct: boolean;
            }>;
            questiontype: 'single-answer' | 'multi-answer';
        }>;
        status: string;
        publishedAt: string;
        language: string;
        order: number;
        [key: string]: any;
    };
    content: string;
}
