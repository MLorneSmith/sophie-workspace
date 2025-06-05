/**
 * Enhanced getQuiz function with improved unidirectional relationship handling
 *
 * This version properly handles the unidirectional relationship model:
 * 1. Uses proper depth parameter to include questions
 * 2. Uses direct lookup via relationship for quiz questions
 * 3. Provides fallback mechanisms to ensure questions are loaded
 *
 * @param quizId The ID of the quiz
 * @param depth The query depth (default: 1)
 * @param supabaseClient Optional Supabase client
 * @returns The quiz with its questions, or null if not found
 */
export declare function getQuizEnhanced(quizId: string | {
    value: string;
    relationTo?: string;
} | any, depth?: number, supabaseClient?: any): Promise<any>;
export { getQuiz } from "./course";
export declare function getQuiz2(quizId: any, options?: {}, supabaseClient?: any): Promise<any>;
