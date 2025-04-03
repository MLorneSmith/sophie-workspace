/**
 * Script to repair all relationships in the database
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

/**
 * Repairs lesson-quiz relationships by matching lesson titles with quiz titles
 * @param client The database client
 */
async function repairLessonQuizRelationships(client: pg.PoolClient) {
  console.log('Repairing lesson-quiz relationships...');

  // Check if the quiz_id_id column exists in the course_lessons table
  const quizIdIdColumnExists = await client.query(
    `
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'course_lessons'
      AND column_name = 'quiz_id_id'
    ) AS exists
    `,
  );

  // If the column doesn't exist, add it
  if (!quizIdIdColumnExists.rows[0].exists) {
    console.log('Adding quiz_id_id column to course_lessons table...');
    await client.query(
      `
      ALTER TABLE payload.course_lessons
      ADD COLUMN quiz_id_id uuid REFERENCES payload.course_quizzes(id) ON DELETE SET NULL
      `,
    );
  }

  // Check if the field column exists in the course_lessons_rels table
  const fieldColumnExists = await client.query(
    `
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'course_lessons_rels'
      AND column_name = 'field'
    ) AS exists
    `,
  );

  // If the field column doesn't exist, add it
  if (!fieldColumnExists.rows[0].exists) {
    console.log('Adding field column to course_lessons_rels table...');
    await client.query(
      `
      ALTER TABLE payload.course_lessons_rels
      ADD COLUMN field VARCHAR(255)
      `,
    );
  }

  // Check if the value column exists in the course_lessons_rels table
  const valueColumnExists = await client.query(
    `
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'course_lessons_rels'
      AND column_name = 'value'
    ) AS exists
    `,
  );

  // If the value column doesn't exist, add it
  if (!valueColumnExists.rows[0].exists) {
    console.log('Adding value column to course_lessons_rels table...');
    await client.query(
      `
      ALTER TABLE payload.course_lessons_rels
      ADD COLUMN value uuid
      `,
    );
  }

  // Get all lessons
  const lessons = await client.query(
    'SELECT id, title FROM payload.course_lessons ORDER BY lesson_number',
  );

  // Get all quizzes
  const quizzes = await client.query(
    'SELECT id, title FROM payload.course_quizzes ORDER BY title',
  );

  // Create a map of quiz titles to IDs for easier lookup
  const quizMap = new Map();
  for (const quiz of quizzes.rows) {
    quizMap.set(quiz.title.toLowerCase(), quiz.id);
  }

  // Track successful matches
  let matchCount = 0;

  // For each lesson, try to find a matching quiz
  for (const lesson of lessons.rows) {
    const lessonTitle = lesson.title.toLowerCase();

    // Try different matching patterns
    let matchedQuizId = null;

    // Direct match: "Lesson Title Quiz"
    if (quizMap.has(`${lessonTitle} quiz`)) {
      matchedQuizId = quizMap.get(`${lessonTitle} quiz`);
    }

    // If no direct match, try more sophisticated matching
    if (!matchedQuizId) {
      // Create normalized versions of the lesson title for matching
      const normalizedTitle = lessonTitle
        .replace(/overview of /i, '')
        .replace(/the /i, '')
        .replace(/:/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Generate alternative patterns based on the lesson title
      const patterns = [
        normalizedTitle,
        // Handle "The Why: Building the Introduction" -> "The Why (Introductions) Quiz"
        normalizedTitle.replace(/building the introduction/i, 'introductions'),
        // Handle "The Why: Next Steps" -> "The Why (Next Steps) Quiz"
        normalizedTitle.replace(/next steps/i, 'next steps'),
        // Handle cases where the lesson title is a substring of the quiz title
        ...Array.from(quizMap.keys()).filter(
          (quizTitle) =>
            quizTitle.includes(normalizedTitle) ||
            normalizedTitle.includes(quizTitle.replace(/ quiz$/i, '')),
        ),
      ];

      // Try each pattern
      for (const pattern of patterns) {
        // Try exact match with "Quiz" suffix
        if (!matchedQuizId && quizMap.has(`${pattern} quiz`)) {
          matchedQuizId = quizMap.get(`${pattern} quiz`);
          continue;
        }

        // Try fuzzy matching - find quiz titles that contain the pattern
        if (!matchedQuizId) {
          for (const [quizTitle, quizId] of quizMap.entries()) {
            const normalizedQuizTitle = quizTitle.replace(/ quiz$/i, '');

            // Check if the normalized quiz title contains the pattern or vice versa
            if (
              normalizedQuizTitle.includes(pattern) ||
              pattern.includes(normalizedQuizTitle)
            ) {
              matchedQuizId = quizId;
              console.log(
                `Fuzzy matched: "${lesson.title}" with quiz "${quizTitle}"`,
              );
              break;
            }
          }
        }
      }
    }

    // If we found a match, update the relationship
    if (matchedQuizId) {
      console.log(
        `Matched lesson "${lesson.title}" with quiz ID ${matchedQuizId}`,
      );

      // Update both quiz_id and quiz_id_id columns in course_lessons
      await client.query(
        'UPDATE payload.course_lessons SET quiz_id = $1, quiz_id_id = $1 WHERE id = $2',
        [matchedQuizId, lesson.id],
      );

      // Check if a relationship entry already exists with field='quiz_id_id'
      const existingRel = await client.query(
        'SELECT id FROM payload.course_lessons_rels WHERE _parent_id = $1 AND field = $2 AND value = $3',
        [lesson.id, 'quiz_id_id', matchedQuizId],
      );

      // If no relationship exists, create one with field='quiz_id_id'
      if (existingRel.rows.length === 0) {
        await client.query(
          `INSERT INTO payload.course_lessons_rels (
            id, _parent_id, field, value, updated_at, created_at
          ) VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())`,
          [lesson.id, 'quiz_id_id', matchedQuizId],
        );
      }

      matchCount++;
    }
  }

  console.log(`Successfully matched ${matchCount} lessons with quizzes`);
}

/**
 * Repairs quiz-question relationships by finding all questions for each quiz
 * @param client The database client
 */
async function repairQuizQuestionRelationships(client: pg.PoolClient) {
  console.log('Repairing quiz-question relationships...');

  try {
    // Check if the course_quizzes_rels table exists
    const tableExists = await client.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes_rels'
      ) AS exists
      `,
    );

    // If the table doesn't exist, create it
    if (!tableExists.rows[0].exists) {
      console.log('Creating course_quizzes_rels table...');
      await client.query(
        `
        CREATE TABLE payload.course_quizzes_rels (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          _parent_id uuid NOT NULL REFERENCES payload.course_quizzes(id) ON DELETE CASCADE,
          field VARCHAR(255),
          value uuid,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        `,
      );
    } else {
      // Check if the field column exists
      const fieldColumnExists = await client.query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes_rels'
          AND column_name = 'field'
        ) AS exists
        `,
      );

      // If the field column doesn't exist, add it
      if (!fieldColumnExists.rows[0].exists) {
        console.log('Adding field column to course_quizzes_rels table...');
        await client.query(
          `
          ALTER TABLE payload.course_quizzes_rels
          ADD COLUMN field VARCHAR(255)
          `,
        );
      }

      // Check if the value column exists
      const valueColumnExists = await client.query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes_rels'
          AND column_name = 'value'
        ) AS exists
        `,
      );

      // If the value column doesn't exist, add it
      if (!valueColumnExists.rows[0].exists) {
        console.log('Adding value column to course_quizzes_rels table...');
        await client.query(
          `
          ALTER TABLE payload.course_quizzes_rels
          ADD COLUMN value uuid
          `,
        );
      }
    }

    // Get all quizzes
    const quizzes = await client.query(
      'SELECT id, title FROM payload.course_quizzes ORDER BY title',
    );

    console.log(`Found ${quizzes.rows.length} quizzes to process`);

    // Track successful relationships
    let relationshipCount = 0;

    // For each quiz, find all questions and create relationships
    for (const quiz of quizzes.rows) {
      // Get all questions for this quiz
      const questions = await client.query(
        'SELECT id, question FROM payload.quiz_questions WHERE quiz_id = $1',
        [quiz.id],
      );

      console.log(
        `Found ${questions.rows.length} questions for quiz "${quiz.title}"`,
      );

      // For each question, create a relationship entry in course_quizzes_rels
      for (const question of questions.rows) {
        // Check if a relationship entry already exists
        const existingRel = await client.query(
          `
          SELECT id FROM payload.course_quizzes_rels 
          WHERE _parent_id = $1 
          AND field = $2 
          AND value = $3
          `,
          [quiz.id, 'questions', question.id],
        );

        // If no relationship exists, create one
        if (existingRel.rows.length === 0) {
          await client.query(
            `INSERT INTO payload.course_quizzes_rels (
              id, _parent_id, field, value, updated_at, created_at
            ) VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())`,
            [quiz.id, 'questions', question.id],
          );

          relationshipCount++;
        }
      }
    }

    console.log(
      `Successfully created ${relationshipCount} quiz-question relationships`,
    );
  } catch (error) {
    console.error('Error repairing quiz-question relationships:', error);
    console.log('Continuing with other repairs...');
  }
}

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Repairs all relationships in the database
 */
async function repairAllRelationships() {
  // Get the database connection string from the environment variables
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Connecting to database: ${databaseUri}`);

  // Create a connection pool
  const pool = new Pool({
    connectionString: databaseUri,
  });

  try {
    // Test the connection
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // Get all collections that might have relationships
      const collections = [
        'media',
        'documentation',
        'posts',
        'surveys',
        'survey_questions',
        'courses',
        'course_lessons',
        'course_quizzes',
        'quiz_questions',
        'users',
        'payload_preferences',
        'payload_locked_documents',
      ];

      // For each collection, repair its relationships
      for (const collection of collections) {
        console.log(`Repairing relationships for ${collection}...`);

        // Find relationship fields in this collection
        const relationshipFields = await client.query(
          `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = $1
          AND column_name LIKE '%_id'
          AND column_name NOT IN ('id', '_parent_id', 'parent_id')
        `,
          [collection],
        );

        for (const field of relationshipFields.rows) {
          const fieldName = field.column_name;
          console.log(`Repairing ${fieldName} in ${collection}...`);

          // Check if the column exists in the relationship table
          const columnExists = await client.query(
            `
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'payload' 
              AND table_name = $1
              AND column_name = $2
            ) AS exists
          `,
            [`${collection}_rels`, fieldName],
          );

          if (columnExists.rows[0].exists) {
            // Check if the parent_id column exists
            const parentIdExists = await client.query(
              `
              SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'payload' 
                AND table_name = $1
                AND column_name = $2
              ) AS exists
            `,
              [`${collection}_rels`, '_parent_id'],
            );

            const parentIdColumn = parentIdExists.rows[0].exists
              ? '_parent_id'
              : 'parent_id';

            // Update relationship tables with the appropriate ID
            try {
              await client.query(`
                UPDATE payload.${collection}_rels
                SET ${fieldName} = ${collection}.${fieldName}
                FROM payload.${collection}
                WHERE ${collection}_rels.${parentIdColumn} = ${collection}.id
                AND ${collection}.${fieldName} IS NOT NULL
              `);
              console.log(`Repaired ${fieldName} in ${collection}`);
            } catch (error) {
              console.error(
                `Error repairing ${fieldName} in ${collection}:`,
                error,
              );
            }
          } else {
            console.log(
              `Column ${fieldName} does not exist in ${collection}_rels, skipping`,
            );
          }
        }
      }

      // Create a function to handle all dynamic UUID tables
      console.log('Creating function to handle all dynamic UUID tables...');
      await client.query(`
        -- Create a function to handle all dynamic UUID tables
        CREATE OR REPLACE FUNCTION payload.handle_all_dynamic_tables()
        RETURNS void AS $$
        DECLARE
          uuid_table record;
        BEGIN
          -- Get all tables with UUID pattern names
          FOR uuid_table IN 
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'payload' 
            AND table_name ~ '[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}'
          LOOP
            -- Add all relationship columns to the table
            PERFORM payload.handle_all_relationship_columns(uuid_table.table_name);
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Run the function to handle all dynamic UUID tables
      console.log('Running function to handle all dynamic UUID tables...');
      await client.query(`
        -- Run the function to handle all dynamic UUID tables
        SELECT payload.handle_all_dynamic_tables();
      `);

      // Note: We're not creating an event trigger because it requires superuser privileges
      // If you have superuser privileges, you can uncomment the following code:
      /*
      console.log(
        'Creating trigger to automatically handle dynamic UUID tables...',
      );
      await client.query(`
        -- Create a trigger to automatically handle dynamic UUID tables
        DROP EVENT TRIGGER IF EXISTS handle_dynamic_uuid_tables;
        
        CREATE EVENT TRIGGER handle_dynamic_uuid_tables
        ON ddl_command_end
        WHEN tag IN ('CREATE TABLE')
        EXECUTE FUNCTION payload.create_dynamic_uuid_table();
      `);
      */

      // Repair lesson-quiz relationships specifically
      console.log('\nRepairing lesson-quiz relationships specifically...');
      await repairLessonQuizRelationships(client);

      // Repair quiz-question relationships specifically
      console.log('\nRepairing quiz-question relationships specifically...');
      await repairQuizQuestionRelationships(client);

      console.log('All relationships repaired!');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// Run the script
repairAllRelationships().catch((error) => {
  console.error('Failed to repair relationships:', error);
  process.exit(1);
});
