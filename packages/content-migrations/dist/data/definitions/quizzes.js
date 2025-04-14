/**
 * Static definitions for all quizzes in the system.
 * This is the SINGLE SOURCE OF TRUTH for quiz data.
 */
export const QUIZZES = {
    'basic-graphs-quiz': {
        id: 'c11dbb26-7561-4d12-88c8-141c653a43fd',
        slug: 'basic-graphs-quiz',
        title: 'Basic Graphs',
        description: 'Quiz on basic graph concepts and their applications',
        passingScore: 70,
        questions: [
            {
                id: '8f5e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
                text: 'Which type of graph is best for showing trends over time?',
                options: ['Pie chart', 'Line graph', 'Bar chart', 'Scatter plot'],
                correctOptionIndex: 1,
                explanation: 'Line graphs are ideal for showing how values change over a continuous period of time.',
            },
            // Additional questions would be added here
        ],
    },
    'elements-of-design-detail-quiz': {
        id: '42564568-76bb-4405-88a9-8e9fd0a9154a',
        slug: 'elements-of-design-detail-quiz',
        title: 'Elements of Design in Detail',
        description: 'Comprehensive quiz on the detailed elements of design',
        passingScore: 75,
        questions: [
            {
                id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
                text: 'Which design element is primarily concerned with the arrangement of visual elements?',
                options: ['Color', 'Composition', 'Typography', 'Contrast'],
                correctOptionIndex: 1,
                explanation: 'Composition refers to the arrangement of visual elements in a design.',
            },
            // Additional questions would be added here
        ],
    },
    'fact-persuasion-quiz': {
        id: '791e27de-2c98-49ef-b684-6c88667d1571',
        slug: 'fact-persuasion-quiz',
        title: 'Fact and Persuasion',
        description: 'Quiz on using facts for persuasive presentations',
        passingScore: 70,
        questions: [
            {
                id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
                text: 'What is the most effective way to present statistical data in a persuasive presentation?',
                options: [
                    'Present all available data',
                    'Focus on the most compelling statistics',
                    'Avoid using numbers entirely',
                    'Only use percentages, never absolute numbers',
                ],
                correctOptionIndex: 1,
                explanation: 'Focusing on the most compelling statistics helps maintain audience attention and strengthens your argument.',
            },
            // Additional questions would be added here
        ],
    },
    'gestalt-principles-quiz': {
        id: '3c72b383-e17e-4b07-8a47-451cfbff29c0',
        slug: 'gestalt-principles-quiz',
        title: 'Gestalt Principles',
        description: 'Quiz on Gestalt principles and their application in design',
        passingScore: 70,
        questions: [
            {
                id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
                text: 'Which Gestalt principle states that elements that are similar will be perceived as belonging together?',
                options: ['Proximity', 'Similarity', 'Continuity', 'Closure'],
                correctOptionIndex: 1,
                explanation: 'The principle of Similarity states that elements sharing visual characteristics (shape, color, size, etc.) are perceived as related.',
            },
            // Additional questions would be added here
        ],
    },
    // Additional quizzes would be defined here following the same pattern
};
// Export a function to get a quiz by slug for convenience
export function getQuizBySlug(slug) {
    return QUIZZES[slug];
}
// Export a function to get a quiz by ID
export function getQuizById(id) {
    return Object.values(QUIZZES).find((quiz) => quiz.id === id);
}
