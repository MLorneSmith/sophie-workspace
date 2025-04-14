/**
 * Fix quiz ID references in the 04-questions.sql file
 * This script directly modifies the file to ensure it uses the correct quiz IDs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// The correct quiz IDs mapping from fix-quiz-id-consistency.ts
const CORRECT_QUIZ_IDS = {
    'basic-graphs-quiz': 'c11dbb26-7561-4d12-88c8-141c653a43fd',
    'elements-of-design-detail-quiz': '42564568-76bb-4405-88a9-8e9fd0a9154a',
    'fact-persuasion-quiz': '791e27de-2c98-49ef-b684-6c88667d1571',
    'gestalt-principles-quiz': '3c72b383-e17e-4b07-8a47-451cfbff29c0',
    'idea-generation-quiz': 'a84d3844-8c19-4c82-8a98-902c530a1a99',
    'introductions-quiz': 'b75e29c7-1d9f-4f41-8c91-a72847d13747',
    'our-process-quiz': '5a8d6b7c-9e2f-4d3a-8b1c-0f9a2e4d5c6b',
    'overview-elements-of-design-quiz': 'c7d8e9f0-a1b2-3c4d-5e6f-7a8b9c0d1e2f',
    'performance-quiz': '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    'preparation-practice-quiz': 'f1e2d3c4-b5a6-9876-5432-1098f7e6d5c4',
    'slide-composition-quiz': 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'specialist-graphs-quiz': 'd4c3b2a1-f6e5-8a7b-9c0d-1e2f3a4b5c6d',
    'storyboards-in-film-quiz': '1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b',
    'storyboards-in-presentations-quiz': 'a6b5c4d3-e2f1-0a9b-8c7d-6e5f4a3b2c1d',
    'structure-quiz': 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
    'tables-vs-graphs-quiz': 'f4e3d2c1-b6a5-8d7c-0e9f-5a4b3c2d1e0f',
    'the-who-quiz': 'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0',
    'using-stories-quiz': 'a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d5',
    'visual-perception-quiz': 'f9e8d7c6-b5a4-3210-f9e8-d7c6b5a43210',
    'why-next-steps-quiz': 'e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3',
};
// Function to safely get a quiz ID with error handling
function getQuizId(slug) {
    const id = CORRECT_QUIZ_IDS[slug];
    if (!id) {
        console.warn(`Warning: Quiz ID for "${slug}" not found in CORRECT_QUIZ_IDS map`);
        // Return a fallback ID or the original slug as a UUID-like string
        return `fallback-${slug}-${Date.now()}`;
    }
    return id;
}
// Map of incorrect IDs to correct IDs
const OLD_TO_NEW_ID_MAP = {
    // The specific mapping from the error:
    'b618e70a-44e5-45ac-90b0-5bc075865744': getQuizId('elements-of-design-detail-quiz'),
    // Add any other incorrect IDs from the 04-questions.sql file
    '5d03514d-19e7-411c-a61b-d6ce6f31fc96': getQuizId('fact-persuasion-quiz'),
    'b9bbe3a3-6f30-4191-a192-e3aa7f35f0fb': getQuizId('gestalt-principles-quiz'),
    '289387c4-c547-4ffc-97fd-330526e7417f': getQuizId('idea-generation-quiz'),
    'f06f8482-6ab6-4b77-8eca-0bef431cedfe': getQuizId('introductions-quiz'),
    '7c47dfd0-aab9-4039-888e-af73209e7a11': getQuizId('our-process-quiz'),
    'b10024dc-a620-46c8-bb52-b6a4d6b0cbec': getQuizId('overview-elements-of-design-quiz'),
    '33894291-7980-4f86-b22c-2653be1777a0': getQuizId('performance-quiz'),
    '097b580c-71e2-408b-9bb1-9a76cb7be43c': getQuizId('preparation-practice-quiz'),
    '00d5c487-5481-4745-81bf-f064e684d291': getQuizId('slide-composition-quiz'),
    '74c5df70-f59b-4cec-89c9-2be87853c8f5': getQuizId('specialist-graphs-quiz'),
    '437bb1d0-abed-4fda-a4c3-40c11b646eda': getQuizId('storyboards-in-film-quiz'),
    'f4653ead-3233-44e6-8d9d-5f92299b427e': getQuizId('storyboards-in-presentations-quiz'),
    '48c1c3cb-b75b-4707-84af-7c8c8ce028c1': getQuizId('structure-quiz'),
    '1cd1fe53-85cc-4146-afd8-bd86aa119e90': getQuizId('tables-vs-graphs-quiz'),
    '3cafcfc7-e550-46e3-946f-1ccbc5e9c8a9': getQuizId('the-who-quiz'),
    '149831ac-64a0-48b3-a414-774725aaa8da': getQuizId('using-stories-quiz'),
    'ed73c2a4-0491-4a20-adbb-fbe1547c1a22': getQuizId('visual-perception-quiz'),
    '948f56e2-ede7-4248-bac1-9f48c6629cc8': getQuizId('why-next-steps-quiz'),
};
/**
 * Fix the quiz-question references in 04-questions.sql
 */
export function fixQuestionsQuizReferences() {
    console.log('Fixing quiz-question references in 04-questions.sql...');
    // Find the project root
    const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../../../../..');
    const questionsFilePath = path.join(projectRoot, 'apps/payload/src/seed/sql/04-questions.sql');
    // Ensure the file exists
    if (!fs.existsSync(questionsFilePath)) {
        console.error(`Error: Quiz questions SQL file not found at ${questionsFilePath}`);
        return;
    }
    // Read the file
    let questionsContent = fs.readFileSync(questionsFilePath, 'utf8');
    let replacementCount = 0;
    // Replace each old ID with the correct ID
    for (const [oldId, newId] of Object.entries(OLD_TO_NEW_ID_MAP)) {
        if (oldId === newId)
            continue; // Skip if IDs are already the same
        const regex = new RegExp(oldId, 'g');
        const matches = questionsContent.match(regex);
        if (matches) {
            replacementCount += matches.length;
            questionsContent = questionsContent.replace(regex, newId);
        }
    }
    // Write the updated content back to the file
    fs.writeFileSync(questionsFilePath, questionsContent);
    console.log(`Fixed ${replacementCount} quiz-question references in ${questionsFilePath}`);
}
// CLI entrypoint
// Check if this file is being run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
    fixQuestionsQuizReferences();
}
