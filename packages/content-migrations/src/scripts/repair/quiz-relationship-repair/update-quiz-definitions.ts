/**
 * Quiz Definitions Update Script
 *
 * This script updates the QUIZZES definition in packages/content-migrations/src/data/definitions/quizzes.ts
 * based on the quizzes found in the database and the CORRECT_QUIZ_IDS mapping.
 */
import fs from 'fs';
import path from 'path';

import { executeSQL } from '../../../utils/db/execute-sql.js';

// Path to the QUIZZES definition file
const quizzesFilePath = path.join(
  process.cwd(),
  '..',
  '..',
  'packages',
  'content-migrations',
  'src',
  'data',
  'definitions',
  'quizzes.ts',
);

// Path to output the new QUIZZES definition
const outputFilePath = path.join(
  process.cwd(),
  'z.plan',
  'quizzes',
  'updated-quizzes.ts',
);

// The CORRECT_QUIZ_IDS mapping from fix-quiz-id-consistency.ts
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

// Maps database quiz title to slug from CORRECT_QUIZ_IDS
const TITLE_TO_SLUG_MAP: Record<string, string> = {
  'Standard Graphs Quiz': 'basic-graphs-quiz',
  'The Fundamental Elements of Design in Detail Quiz':
    'elements-of-design-detail-quiz',
  'Overview of Fact-based Persuasion Quiz': 'fact-persuasion-quiz',
  'Gestalt Principles of Visual Perception Quiz': 'gestalt-principles-quiz',
  'Idea Generation Quiz': 'idea-generation-quiz',
  'The Why (Introductions) Quiz': 'introductions-quiz',
  'Our Process Quiz': 'our-process-quiz',
  'Overview of the Fundamental Elements of Design Quiz':
    'overview-elements-of-design-quiz',
  'Performance Quiz': 'performance-quiz',
  'Perparation & Practice Quiz': 'preparation-practice-quiz',
  'Slide Composition Quiz': 'slide-composition-quiz',
  'Specialist Graphs Quiz': 'specialist-graphs-quiz',
  'Storyboards in Film Quiz': 'storyboards-in-film-quiz',
  'Storyboards in Presentations Quiz': 'storyboards-in-presentations-quiz',
  'What is Structure? Quiz': 'structure-quiz',
  'Tables vs Graphs Quiz': 'tables-vs-graphs-quiz',
  'The Who Quiz': 'the-who-quiz',
  'Using Stories Quiz': 'using-stories-quiz',
  'Visual Perception and Communication Quiz': 'visual-perception-quiz',
  'The Why (Next Steps) Quiz': 'why-next-steps-quiz',
};

interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

interface QuizDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  passingScore: number;
  questions: QuizQuestion[];
}

async function updateQuizDefinitions() {
  try {
    console.log('Starting quiz definitions update...');

    // Get all quizzes from the database
    const quizzesResult = await executeSQL(`
      SELECT 
        id, 
        title, 
        slug,
        description,
        pass_threshold as "passingScore",
        passing_score
      FROM 
        payload.course_quizzes
      ORDER BY 
        title
    `);

    const quizzes = quizzesResult.rows;
    console.log(`Found ${quizzes.length} quizzes in the database`);

    // Get all questions from the database
    const questionsResult = await executeSQL(`
      SELECT 
        id,
        question,
        type,
        options,
        explanation
      FROM 
        payload.quiz_questions
      ORDER BY 
        id
    `);

    const allQuestions = questionsResult.rows;
    console.log(`Found ${allQuestions.length} questions in the database`);

    // Build the new QUIZZES object
    const quizDefinitions: Record<string, QuizDefinition> = {};

    // Process each quiz
    for (const quiz of quizzes) {
      // Find the slug for this quiz based on its title
      const slug = TITLE_TO_SLUG_MAP[quiz.title];

      if (!slug) {
        console.warn(`Warning: Could not find slug for quiz "${quiz.title}"`);
        continue;
      }

      // Check that the ID matches the one in CORRECT_QUIZ_IDS
      const expectedId = CORRECT_QUIZ_IDS[slug];
      if (expectedId !== quiz.id) {
        console.warn(
          `Warning: ID mismatch for quiz "${quiz.title}": Database ID ${quiz.id}, Expected ID ${expectedId}`,
        );
      }

      // For "The Who Quiz" and others, we need to find appropriate questions
      let quizQuestions: QuizQuestion[] = [];

      if (slug === 'the-who-quiz') {
        // Select relevant questions for "The Who Quiz"
        quizQuestions = allQuestions
          .filter(
            (q) =>
              q.question.toLowerCase().includes('who') ||
              q.question.toLowerCase().includes('audience'),
          )
          .slice(0, 5) // Limit to 5 questions
          .map(processQuestion);
      } else {
        // For other quizzes, find questions by keyword matching with quiz title
        const keywordMatches = getKeywordsFromTitle(quiz.title);

        quizQuestions = allQuestions
          .filter((q) =>
            keywordMatches.some((keyword) =>
              q.question.toLowerCase().includes(keyword.toLowerCase()),
            ),
          )
          .slice(0, 5) // Limit to 5 questions if too many matches
          .map(processQuestion);
      }

      // If no questions found, use some generic questions
      if (quizQuestions.length === 0) {
        console.warn(
          `Warning: No questions found for quiz "${quiz.title}". Using generic questions.`,
        );
        quizQuestions = allQuestions
          .slice(0, 3) // Just take the first 3 questions as fallback
          .map(processQuestion);
      }

      // Create the quiz definition
      quizDefinitions[slug] = {
        id: expectedId || quiz.id,
        slug: slug,
        title: quiz.title,
        description: quiz.description || `Quiz for ${quiz.title}`,
        passingScore: quiz.passingScore || quiz.passing_score || 70,
        questions: quizQuestions,
      };
    }

    // Generate the updated quizzes.ts file
    const updatedFile = generateQuizzesFile(quizDefinitions);

    // Ensure the output directory exists
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the updated file
    fs.writeFileSync(outputFilePath, updatedFile);

    console.log(`Updated quiz definitions written to ${outputFilePath}`);
    console.log(
      'Review the file and replace the original quizzes.ts if it looks good.',
    );

    return quizDefinitions;
  } catch (error) {
    console.error('Error updating quiz definitions:', error);
    throw error;
  }
}

// Helper function to process a question from the database into the expected format
function processQuestion(question: any): QuizQuestion {
  const options = [];
  let correctOptionIndex = 0;

  if (question.options && Array.isArray(question.options)) {
    // Process each option
    for (let i = 0; i < question.options.length; i++) {
      const option = question.options[i];
      options.push(option.text);

      // If this is the correct option, store its index
      if (option.isCorrect) {
        correctOptionIndex = i;
      }
    }
  } else {
    // Create default options if none exist
    options.push('Option 1 (correct)', 'Option 2', 'Option 3', 'Option 4');
  }

  return {
    id: question.id,
    text: question.question,
    options: options,
    correctOptionIndex: correctOptionIndex,
    explanation: question.explanation || '',
  };
}

// Helper function to extract keywords from a quiz title
function getKeywordsFromTitle(title: string): string[] {
  // Remove common words and extract meaningful parts
  const lowerTitle = title.toLowerCase();

  // Extract key terms
  const keywords: string[] = [];

  if (lowerTitle.includes('graph')) keywords.push('graph');
  if (lowerTitle.includes('design')) keywords.push('design');
  if (lowerTitle.includes('persuasion')) keywords.push('persuasion');
  if (lowerTitle.includes('gestalt')) keywords.push('gestalt');
  if (lowerTitle.includes('idea')) keywords.push('idea');
  if (lowerTitle.includes('process')) keywords.push('process');
  if (lowerTitle.includes('element')) keywords.push('element');
  if (lowerTitle.includes('performance')) keywords.push('performance');
  if (lowerTitle.includes('practice')) keywords.push('practice');
  if (lowerTitle.includes('slide')) keywords.push('slide');
  if (lowerTitle.includes('composition')) keywords.push('composition');
  if (lowerTitle.includes('storyboard')) keywords.push('storyboard');
  if (lowerTitle.includes('structure')) keywords.push('structure');
  if (lowerTitle.includes('table')) keywords.push('table');
  if (lowerTitle.includes('who')) keywords.push('who');
  if (lowerTitle.includes('why')) keywords.push('why');
  if (lowerTitle.includes('story')) keywords.push('story');
  if (lowerTitle.includes('visual')) keywords.push('visual');
  if (lowerTitle.includes('perception')) keywords.push('perception');

  // If no keywords found, use the most specific part of the title
  if (keywords.length === 0) {
    const parts = title.split(' ');
    const filteredParts = parts.filter(
      (part) =>
        !['quiz', 'the', 'and', 'of', 'in', 'for', '&'].includes(
          part.toLowerCase(),
        ),
    );

    if (filteredParts.length > 0) {
      keywords.push(filteredParts[0]);
    }
  }

  return keywords;
}

// Generate the updated quizzes.ts file
function generateQuizzesFile(
  quizDefinitions: Record<string, QuizDefinition>,
): string {
  let fileContent = `import { QuizDefinition } from './quiz-types.js';

/**
 * Static definitions for all quizzes in the system.
 * This is the SINGLE SOURCE OF TRUTH for quiz data.
 * Updated by update-quiz-definitions.ts script on ${new Date().toISOString()}
 */
export const QUIZZES: Record<string, QuizDefinition> = {\n`;

  // Add each quiz definition
  for (const [slug, quiz] of Object.entries(quizDefinitions)) {
    fileContent += `  '${slug}': {\n`;
    fileContent += `    id: '${quiz.id}',\n`;
    fileContent += `    slug: '${slug}',\n`;
    fileContent += `    title: '${quiz.title.replace(/'/g, "\\'")}',\n`;
    fileContent += `    description: '${(quiz.description || '').replace(/'/g, "\\'")}',\n`;
    fileContent += `    passingScore: ${quiz.passingScore},\n`;
    fileContent += `    questions: [\n`;

    // Add questions
    for (const question of quiz.questions) {
      fileContent += `      {\n`;
      fileContent += `        id: '${question.id}',\n`;
      fileContent += `        text: '${(question.text || '').replace(/'/g, "\\'")}',\n`;
      fileContent += `        options: ${JSON.stringify(question.options)},\n`;
      fileContent += `        correctOptionIndex: ${question.correctOptionIndex},\n`;
      fileContent += `        explanation: '${(question.explanation || '').replace(/'/g, "\\'")}',\n`;
      fileContent += `      },\n`;
    }

    fileContent += `    ],\n`;
    fileContent += `  },\n`;
  }

  fileContent += `};

// Export a function to get a quiz by slug for convenience
export function getQuizBySlug(slug: string): QuizDefinition | undefined {
  return QUIZZES[slug];
}

// Export a function to get a quiz by ID
export function getQuizById(id: string): QuizDefinition | undefined {
  return Object.values(QUIZZES).find((quiz) => quiz.id === id);
}
`;

  return fileContent;
}

// Run the update
updateQuizDefinitions().catch((error) => {
  console.error('Critical error during quiz definitions update:', error);
  process.exit(1);
});
