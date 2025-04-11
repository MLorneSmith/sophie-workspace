/**
 * Type declarations for quiz-map-generator.js
 * This module generates a mapping between quiz slugs and their UUIDs.
 */

/**
 * Generates a map from quiz slugs to quiz UUIDs
 * @param quizzesDir Directory containing quiz files
 * @returns A Map object with quiz slugs as keys and UUIDs as values
 */
export function generateQuizMap(quizzesDir: string): Map<string, string>;
