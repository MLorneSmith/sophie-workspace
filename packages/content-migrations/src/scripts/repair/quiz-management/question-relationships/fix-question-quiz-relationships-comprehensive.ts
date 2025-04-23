/**
 * Comprehensive Question-Quiz Relationship Fix
 *
 * This script combines functionality from:
 * - fix-questions-quiz-references.ts
 * - fix-quiz-question-relationships.ts
 * - fix-quizzes-without-questions.ts
 *
 * It handles all aspects of question-quiz relationships in both
 * direct field storage and relationship tables.
 */
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const connectionString =
  process.env.DATABASE_URI ||
  'postgresql://postgres:postgres@localhost:54322/postgres';

// Configuration interface
interface FixOptions {
  fixSqlFiles: boolean;
  fixBidirectionalRelationships: boolean;
  fixQuizzesWithoutQuestions: boolean;
  dryRun: boolean;
}

// The correct quiz IDs mapping
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

// Map of incorrect IDs to correct IDs
const OLD_TO_NEW_ID_MAP: Record<string, string> = {
  'b618e70a-44e5-45ac-90b0-5bc075865744':
    CORRECT_QUIZ_IDS['elements-of-design-detail-quiz']!,
  '5d03514d-19e7-411c-a61b-d6ce6f31fc96':
    CORRECT_QUIZ_IDS['fact-persuasion-quiz']!,
  'b9bbe3a3-6f30-4191-a192-e3aa7f35f0fb':
    CORRECT_QUIZ_IDS['gestalt-principles-quiz']!,
  '289387c4-c547-4ffc-97fd-330526e7417f':
    CORRECT_QUIZ_IDS['idea-generation-quiz']!,
  'f06f8482-6ab6-4b77-8eca-0bef431cedfe':
    CORRECT_QUIZ_IDS['introductions-quiz']!,
  '7c47dfd0-aab9-4039-888e-af73209e7a11': CORRECT_QUIZ_IDS['our-process-quiz']!,
  'b10024dc-a620-46c8-bb52-b6a4d6b0cbec':
    CORRECT_QUIZ_IDS['overview-elements-of-design-quiz']!,
  '33894291-7980-4f86-b22c-2653be1777a0': CORRECT_QUIZ_IDS['performance-quiz']!,
  '097b580c-71e2-408b-9bb1-9a76cb7be43c':
    CORRECT_QUIZ_IDS['preparation-practice-quiz']!,
  '00d5c487-5481-4745-81bf-f064e684d291':
    CORRECT_QUIZ_IDS['slide-composition-quiz']!,
  '74c5df70-f59b-4cec-89c9-2be87853c8f5':
    CORRECT_QUIZ_IDS['specialist-graphs-quiz']!,
  '437bb1d0-abed-4fda-a4c3-40c11b646eda':
    CORRECT_QUIZ_IDS['storyboards-in-film-quiz']!,
  'f4653ead-3233-44e6-8d9d-5f92299b427e':
    CORRECT_QUIZ_IDS['storyboards-in-presentations-quiz']!,
  '48c1c3cb-b75b-4707-84af-7c8c8ce028c1': CORRECT_QUIZ_IDS['structure-quiz']!,
  '1cd1fe53-85cc-4146-afd8-bd86aa119e90':
    CORRECT_QUIZ_IDS['tables-vs-graphs-quiz']!,
  '3cafcfc7-e550-46e3-946f-1ccbc5e9c8a9': CORRECT_QUIZ_IDS['the-who-quiz']!,
  '149831ac-64a0-48b3-a414-774725aaa8da':
    CORRECT_QUIZ_IDS['using-stories-quiz']!,
  'ed73c2a4-0491-4a20-adbb-fbe1547c1a22':
    CORRECT_QUIZ_IDS['visual-perception-quiz']!,
  '948f56e2-ede7-4248-bac1-9f48c6629cc8':
    CORRECT_QUIZ_IDS['why-next-steps-quiz']!,
};

/**
 * Main entry point for comprehensive question-quiz relationship fixes
 */
export async function fixQuestionQuizRelationshipsComprehensive(
  options: Partial<FixOptions> = {},
): Promise<void> {
  console.log('Starting comprehensive question-quiz relationship fix...');

  // Default options
  const config: FixOptions = {
    fixSqlFiles: true,
    fixBidirectionalRelationships: true,
    fixQuizzesWithoutQuestions: true,
    dryRun: false,
    ...options,
  };

  // 1. Fix SQL files first (doesn't require database connection)
  if (config.fixSqlFiles) {
    fixQuestionsQuizReferencesSql();
  }

  // 2. Fix database relationships
  const client = new Client({ connectionString });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');

    // Begin transaction for database operations
    if (!config.dryRun) {
      await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');
      console.log('Transaction started');
    } else {
      console.log('DRY RUN: Transaction would start here');
    }

    // Fix bidirectional relationships
    if (config.fixBidirectionalRelationships) {
      await fixBidirectionalRelationships(client, config.dryRun);
    }

    // Fix quizzes without questions
    if (config.fixQuizzesWithoutQuestions) {
      await fixEmptyQuizzes(client, config.dryRun);
    }

    // Verify relationships
    await verifyQuizQuestionRelationships(client);

    // Commit transaction if not in dry run mode
    if (!config.dryRun) {
      await client.query('COMMIT');
      console.log('Transaction committed successfully');
    } else {
      console.log('DRY RUN: Transaction would be committed here');
    }
  } catch (error) {
    // Rollback transaction on error if not in dry run mode
    if (!config.dryRun) {
      try {
        await client.query('ROLLBACK');
        console.log('Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    } else {
      console.log('DRY RUN: Transaction would be rolled back here');
    }

    console.error('Error fixing question-quiz relationships:', error);
    throw error;
  } finally {
    // Close database connection
    try {
      await client.end();
      console.log('Database connection closed');
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
  }

  console.log('Comprehensive question-quiz relationship fix completed');
}

/**
 * Fix quiz ID references in the 04-questions.sql file
 * Consolidated from fix-questions-quiz-references.ts
 */
function fixQuestionsQuizReferencesSql(): void {
  console.log('Fixing quiz-question references in SQL files...');

  // Find the project root
  const projectRoot = path.resolve(
    __dirname,
    '../../../../../..', // Go from /packages/content-migrations/src/scripts/repair/quiz-management/question-relationships/* to project root
  );

  const questionsFilePath = path.join(
    projectRoot,
    'apps/payload/src/seed/sql/04-questions.sql',
  );

  // Ensure the file exists
  if (!fs.existsSync(questionsFilePath)) {
    console.error(
      `Error: Quiz questions SQL file not found at ${questionsFilePath}`,
    );
    return;
  }

  // Read the file
  let questionsContent = fs.readFileSync(questionsFilePath, 'utf8');
  let replacementCount = 0;

  // Replace each old ID with the correct ID
  for (const [oldId, newId] of Object.entries(OLD_TO_NEW_ID_MAP)) {
    if (oldId === newId) continue; // Skip if IDs are already the same

    const regex = new RegExp(oldId, 'g');
    const matches = questionsContent.match(regex);

    if (matches) {
      replacementCount += matches.length;
      questionsContent = questionsContent.replace(regex, newId);
    }
  }

  // Write the updated content back to the file
  fs.writeFileSync(questionsFilePath, questionsContent);

  console.log(
    `Fixed ${replacementCount} quiz-question references in ${questionsFilePath}`,
  );
}

/**
 * Fix bidirectional relationships between quizzes and questions
 * Consolidated from fix-quiz-question-relationships.ts
 */
async function fixBidirectionalRelationships(
  client: Client,
  dryRun: boolean,
): Promise<void> {
  console.log('Fixing quiz-question bidirectional relationships...');

  try {
    // 1. Find all quiz questions and their associated quizzes
    const questions = await client.query(`
      SELECT id, question, quiz_id FROM payload.quiz_questions
      WHERE quiz_id IS NOT NULL
    `);

    console.log(`Found ${questions.rowCount} quiz questions with quiz_id set`);

    // 2. Group questions by quiz_id
    const quizMap = new Map();
    questions.rows.forEach((q) => {
      if (!quizMap.has(q.quiz_id)) {
        quizMap.set(q.quiz_id, []);
      }
      quizMap.get(q.quiz_id).push(q.id);
    });

    console.log(`Found ${quizMap.size} quizzes with questions`);

    // 3. Update quizzes with their questions array
    let quizzesUpdated = 0;
    let relationshipsCreated = 0;

    for (const [quizId, questionIds] of quizMap.entries()) {
      // Skip if no question IDs (shouldn't happen, but just in case)
      if (!questionIds || questionIds.length === 0) continue;

      if (!dryRun) {
        // Update the quiz entry
        const updateResult = await client.query(
          `
          UPDATE payload.course_quizzes
          SET questions = ARRAY[${questionIds.map((id) => `'${id}'`).join(',')}]::uuid[]
          WHERE id = $1
          RETURNING id
        `,
          [quizId],
        );

        quizzesUpdated += updateResult.rowCount;
      } else {
        console.log(
          `DRY RUN: Would update quiz ${quizId} with ${questionIds.length} questions`,
        );
        quizzesUpdated++;
      }

      // Ensure relationship entries exist in course_quizzes_rels
      for (const questionId of questionIds) {
        // Check if relationship already exists
        const existingRel = await client.query(
          `
          SELECT id FROM payload.course_quizzes_rels
          WHERE _parent_id = $1 AND field = 'questions' AND value = $2
        `,
          [quizId, questionId],
        );

        if (existingRel.rowCount === 0) {
          if (!dryRun) {
            // Create the relationship
            await client.query(
              `
              INSERT INTO payload.course_quizzes_rels
              (id, _parent_id, field, value, created_at, updated_at, quiz_questions_id)
              VALUES (gen_random_uuid(), $1, 'questions', $2, NOW(), NOW(), $2)
            `,
              [quizId, questionId],
            );
          } else {
            console.log(
              `DRY RUN: Would create relationship between quiz ${quizId} and question ${questionId}`,
            );
          }
          relationshipsCreated++;
        }
      }
    }

    console.log(`Updated ${quizzesUpdated} quizzes with questions array`);
    console.log(`Created ${relationshipsCreated} missing relationship entries`);
  } catch (error) {
    console.error('Error in fixBidirectionalRelationships:', error);
    throw error;
  }
}

/**
 * Fix quizzes without questions
 * Consolidated from fix-quizzes-without-questions.ts
 */
async function fixEmptyQuizzes(client: Client, dryRun: boolean): Promise<void> {
  console.log('Fixing references to quizzes without questions...');

  try {
    // Identify quizzes that don't have any questions
    const quizzesWithoutQuestions = await client.query(`
      SELECT cq.id, cq.title
      FROM payload.course_quizzes cq
      LEFT JOIN payload.quiz_questions qq ON qq.quiz_id = cq.id
      GROUP BY cq.id, cq.title
      HAVING COUNT(qq.id) = 0
    `);

    if (quizzesWithoutQuestions.rowCount > 0) {
      console.log(
        `Found ${quizzesWithoutQuestions.rowCount} quizzes without questions:`,
      );

      const quizIds = quizzesWithoutQuestions.rows.map((q) => q.id);

      quizzesWithoutQuestions.rows.forEach((quiz) => {
        console.log(`- Quiz ID: ${quiz.id}, Title: ${quiz.title}`);
      });

      if (!dryRun) {
        // Update lessons to remove references to quizzes without questions
        const updateResult = await client.query(`
          UPDATE payload.course_lessons
          SET quiz_id = NULL
          WHERE quiz_id IN (${quizIds.map((id) => `'${id}'`).join(',')})
          RETURNING id, title
        `);

        // Also update quiz_id_id field which is sometimes used
        const updateIdIdResult = await client.query(`
          UPDATE payload.course_lessons
          SET quiz_id_id = NULL
          WHERE quiz_id_id IN (${quizIds.map((id) => `'${id}'`).join(',')})
          RETURNING id, title
        `);

        const totalUpdated = updateResult.rowCount + updateIdIdResult.rowCount;

        console.log(
          `Updated ${totalUpdated} lessons to remove references to quizzes without questions:`,
        );

        const updatedLessons = [...updateResult.rows, ...updateIdIdResult.rows];
        updatedLessons.forEach((row) => {
          console.log(`- Lesson ID: ${row.id}, Title: ${row.title}`);
        });
      } else {
        console.log(
          `DRY RUN: Would update lessons that reference ${quizzesWithoutQuestions.rowCount} empty quizzes`,
        );
      }
    } else {
      console.log('No quizzes without questions found');
    }
  } catch (error) {
    console.error('Error in fixEmptyQuizzes:', error);
    throw error;
  }
}

/**
 * Verify quiz-question relationships
 */
async function verifyQuizQuestionRelationships(client: Client): Promise<void> {
  console.log('Verifying quiz-question relationships...');

  try {
    // Get verification data
    const verificationResult = await client.query(`
      SELECT 
        cq.id as quiz_id, 
        cq.title as quiz_title,
        COUNT(qq.id) as question_count,
        COALESCE(ARRAY_LENGTH(cq.questions, 1), 0) as questions_array_length,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE _parent_id = cq.id AND field = 'questions') as rel_count
      FROM payload.course_quizzes cq
      LEFT JOIN payload.quiz_questions qq ON qq.quiz_id = cq.id
      GROUP BY cq.id, cq.title, cq.questions
      ORDER BY question_count DESC
    `);

    console.log('\nVerification results:');
    let mismatchCount = 0;

    verificationResult.rows.forEach((row) => {
      console.log(
        `Quiz "${row.quiz_title}": ${row.question_count} questions, ${row.questions_array_length} in array, ${row.rel_count} in relationships`,
      );

      if (
        row.question_count !== row.questions_array_length ||
        row.question_count !== row.rel_count
      ) {
        console.warn(`  ⚠️ Mismatch detected for quiz "${row.quiz_title}"`);
        mismatchCount++;
      }
    });

    if (mismatchCount === 0) {
      console.log('✅ All quiz-question relationships are consistent');
    } else {
      console.warn(
        `⚠️ ${mismatchCount} quizzes have inconsistent relationships`,
      );
    }
  } catch (error) {
    console.error('Error in verifyQuizQuestionRelationships:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  fixQuestionQuizRelationshipsComprehensive()
    .then(() => console.log('Done'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
