/**
 * Main SQL seed files generator using static definitions
 */
import fs from 'fs';
import path from 'path';

import {
  LESSON_QUIZ_RELATIONS,
  validateLessonQuizRelations,
} from '../../data/definitions/lesson-quiz-relations.js';
import { validateQuizDefinition } from '../../data/definitions/quiz-types.js';
import { QUIZZES } from '../../data/definitions/quizzes.js';
import { generateRelationshipTablesSql } from './generators/generate-relationship-sql.js';
import { generateLessonQuizReferencesSql } from './generators/new-generate-lesson-quiz-references-sql.js';
import { generateQuestionsSql } from './generators/new-generate-questions-sql.js';
import { generateQuizzesSql } from './generators/new-generate-quizzes-sql.js';

/**
 * Main function to generate all SQL seed files
 * @param outputDir Directory to write SQL files to
 */
export async function generateSqlSeedFiles(outputDir: string): Promise<void> {
  console.log('Generating SQL seed files from static definitions...');

  // Create the output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 1: Validate quiz definitions
  console.log('Validating quiz definitions...');
  const allQuizzesValid = Object.values(QUIZZES).every(validateQuizDefinition);
  if (!allQuizzesValid) {
    throw new Error('Invalid quiz definitions found');
  }

  // Step 2: Validate lesson-quiz relations
  console.log('Validating lesson-quiz relations...');
  if (!validateLessonQuizRelations()) {
    throw new Error('Invalid lesson-quiz relations found');
  }

  // Step 3: Generate and write SQL files
  console.log('Generating SQL files...');

  // 3.0: Generate relationship tables SQL with required columns
  const relationshipTablesSql = generateRelationshipTablesSql();
  fs.writeFileSync(
    path.join(outputDir, '01-relationship-tables.sql'),
    relationshipTablesSql,
  );
  console.log('Generated relationship tables SQL file');

  // 3.1: Generate quizzes SQL
  const quizzesSql = generateQuizzesSql();
  fs.writeFileSync(path.join(outputDir, '03-quizzes.sql'), quizzesSql);
  console.log('Generated quizzes SQL file');

  // 3.2: Generate questions SQL
  const questionsSql = generateQuestionsSql();
  fs.writeFileSync(path.join(outputDir, '04-questions.sql'), questionsSql);
  console.log('Generated questions SQL file');

  // 3.3: Generate lesson-quiz references SQL
  const referencesSql = generateLessonQuizReferencesSql();
  fs.writeFileSync(
    path.join(outputDir, '03a-lesson-quiz-references.sql'),
    referencesSql,
  );
  console.log('Generated lesson-quiz references SQL file');

  console.log('All SQL seed files generated successfully!');
}

// Add a CLI entrypoint
// For Node.js ESM, we can check if this file is being run directly
// by checking if require.main === module, but in ESM we check process.argv[1]
if (
  process.argv[1]?.endsWith('new-generate-sql-seed-files.ts') ||
  process.argv[1]?.endsWith('new-generate-sql-seed-files.js')
) {
  // Default output directory
  const outputDir =
    process.argv[2] || path.resolve(process.cwd(), 'apps/payload/src/seed');

  generateSqlSeedFiles(outputDir)
    .then(() => console.log('Done!'))
    .catch((err) => {
      console.error('Error generating SQL seed files:', err);
      process.exit(1);
    });
}
