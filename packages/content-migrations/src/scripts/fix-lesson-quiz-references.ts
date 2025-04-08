/**
 * Fix lesson-quiz reference consistency issues between SQL files
 * This script directly modifies 02-lessons.sql to ensure quiz_id and quiz_id_id references
 * match the IDs defined in the quizzes static definition
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// The correct quiz IDs mapping - must match those in fix-quiz-id-consistency.ts
const CORRECT_QUIZ_IDS: Record<string, string> = {
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

// Map of incorrect IDs to correct IDs - using non-null assertion
// This is safe because we've defined all the keys in CORRECT_QUIZ_IDS
const OLD_TO_NEW_ID_MAP: Record<string, string> = {
  'b48a3ab3-25a8-457f-a510-39ef3311ddb4':
    CORRECT_QUIZ_IDS['basic-graphs-quiz']!,
  '72682adf-9d36-40f8-b0b8-dece9ca39b0f':
    CORRECT_QUIZ_IDS['elements-of-design-detail-quiz']!,
  '9745028e-4973-4f74-9555-263befbb8a2d':
    CORRECT_QUIZ_IDS['fact-persuasion-quiz']!,
  'aad1ab9e-a591-40a6-bd41-6789cdcfeffb':
    CORRECT_QUIZ_IDS['gestalt-principles-quiz']!,
  'bced1ae3-db3e-41ac-b2f6-96e1cdea4abd':
    CORRECT_QUIZ_IDS['idea-generation-quiz']!,
  'c162a80e-bef5-4753-b58b-c22370f55c10':
    CORRECT_QUIZ_IDS['introductions-quiz']!,
  '12381d77-63c2-49e1-8677-dc8aac806665': CORRECT_QUIZ_IDS['our-process-quiz']!,
  '1ef6ab15-b344-4c0e-bea1-99b5df6f001e':
    CORRECT_QUIZ_IDS['overview-elements-of-design-quiz']!,
  '59ee15ce-707e-4a6b-9da3-c0c6dc09187e': CORRECT_QUIZ_IDS['performance-quiz']!,
  'd21b373b-2e76-4bfd-ba80-cc765d93f173':
    CORRECT_QUIZ_IDS['preparation-practice-quiz']!,
  '511130c3-981f-4666-aceb-bd9d18c46857':
    CORRECT_QUIZ_IDS['slide-composition-quiz']!,
  'ce0de613-77d2-4cb4-8a78-4c44a475aa5b':
    CORRECT_QUIZ_IDS['specialist-graphs-quiz']!,
  '930424d4-65cd-48e6-9f30-7bb3da41c82b':
    CORRECT_QUIZ_IDS['storyboards-in-film-quiz']!,
  '45417960-af6b-440b-b233-783adf3b398a':
    CORRECT_QUIZ_IDS['storyboards-in-presentations-quiz']!,
  'ad0aac61-8c6c-4359-9c33-8ddd1f36ba04': CORRECT_QUIZ_IDS['structure-quiz']!,
  '475d945e-3339-49bd-8656-12f5b58447d0':
    CORRECT_QUIZ_IDS['tables-vs-graphs-quiz']!,
  'b544658d-e4e0-4d28-bc00-52e9348392f9': CORRECT_QUIZ_IDS['the-who-quiz']!,
  'b976d4fe-e907-45fe-9beb-6a8c9a152c72':
    CORRECT_QUIZ_IDS['using-stories-quiz']!,
  '868717f4-e922-41fb-be0f-40f145095ec0':
    CORRECT_QUIZ_IDS['visual-perception-quiz']!,
  'd5f4f1a6-c0fe-4c45-9baf-cdfdc88e37f9':
    CORRECT_QUIZ_IDS['why-next-steps-quiz']!,
};

/**
 * Fix the lesson-quiz references in 02-lessons.sql
 */
export function fixLessonQuizReferences(): void {
  console.log('Fixing lesson-quiz references...');

  // Find the project root
  const projectRoot = path.resolve(
    fileURLToPath(import.meta.url),
    '../../../../..', // Go from /packages/content-migrations/src/scripts/fix-lesson-quiz-references.ts to project root
  );

  const lessonsFilePath = path.join(
    projectRoot,
    'apps/payload/src/seed/sql/02-lessons.sql',
  );

  // Ensure the file exists
  if (!fs.existsSync(lessonsFilePath)) {
    console.error(`Error: Lessons SQL file not found at ${lessonsFilePath}`);
    return;
  }

  // Read the file
  let lessonsContent = fs.readFileSync(lessonsFilePath, 'utf8');
  let replacementCount = 0;

  // Replace each old ID with the correct ID
  for (const [oldId, newId] of Object.entries(OLD_TO_NEW_ID_MAP)) {
    if (oldId === newId) continue; // Skip if IDs are already the same

    const regex = new RegExp(oldId, 'g');
    const matches = lessonsContent.match(regex);

    if (matches) {
      replacementCount += matches.length;
      lessonsContent = lessonsContent.replace(regex, newId);
    }
  }

  // Write the updated content back to the file
  fs.writeFileSync(lessonsFilePath, lessonsContent);

  console.log(
    `Fixed ${replacementCount} lesson-quiz references in ${lessonsFilePath}`,
  );
}

// CLI entrypoint
// Check if this file is being run directly
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  fixLessonQuizReferences();
}
