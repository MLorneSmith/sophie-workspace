/**
 * Generate Static Relationship Mappings with Direct SQL (no Drizzle ORM)
 *
 * This script creates static mappings of relationships that can be used as fallbacks
 * if the relationship tables are corrupted.
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const projectRoot = path.resolve(__dirname, '../../../../../../../');
dotenv.config({ path: path.resolve(projectRoot, '.env') });

// Get environment variables from .env.development file
try {
  const envFilePath = path.resolve(
    __dirname,
    '../../../../../.env.development',
  );
  console.log(`Loading environment variables from: ${envFilePath}`);
  dotenv.config({ path: envFilePath });
} catch (error) {
  console.warn('Could not load .env.development file:', error);

  // Try alternate path in case we're running from different location
  const alternatePath = path.resolve(
    __dirname,
    '../../../../../../.env.development',
  );
  console.log(`Trying alternate path: ${alternatePath}`);
  dotenv.config({ path: alternatePath });
}

// Database connection settings
const DATABASE_URI =
  process.env.DATABASE_URI ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';

/**
 * Type for relationship mapping
 */
type RelationshipMapping = {
  sourceId: string;
  sourceTitle: string | null;
  targetId: string;
  targetTitle: string | null;
  order: number | null;
  relationshipType: string;
};

/**
 * Generates the static relationship mappings
 */
async function generateStaticMappings() {
  console.log(chalk.blue('\n=== GENERATING STATIC RELATIONSHIP MAPPINGS ==='));
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const pool = new Pool({ connectionString: DATABASE_URI });
  const mappingsDir = path.resolve(__dirname, '../../mappings');

  try {
    // Ensure mappings directory exists
    if (!fs.existsSync(mappingsDir)) {
      fs.mkdirSync(mappingsDir, { recursive: true });
      console.log(`Created mappings directory at: ${mappingsDir}`);
    }

    console.log('Connected to database');

    // 1. Generate lesson-quiz mappings
    console.log(chalk.cyan('Generating lesson-quiz mappings...'));

    const lessonQuizQuery = `
      SELECT 
        cl.id as source_id,
        cl.title as source_title,
        cq.id as target_id,
        cq.title as target_title,
        clr.order,
        'quiz' as relationship_type
      FROM 
        payload.course_lessons cl
      JOIN 
        payload.course_lessons_rels clr ON cl.id = clr.parent_id
      JOIN 
        payload.course_quizzes cq ON clr.course_quizzes_id = cq.id
      WHERE 
        clr.course_quizzes_id IS NOT NULL
      ORDER BY 
        cl.order ASC NULLS LAST, clr.order ASC NULLS LAST
    `;

    const lessonQuizResult = await pool.query(lessonQuizQuery);
    const lessonQuizMappings = lessonQuizResult.rows as RelationshipMapping[];

    console.log(`Found ${lessonQuizMappings.length} lesson-quiz relationships`);

    // Write lesson-quiz mappings to file
    const lessonQuizPath = path.join(mappingsDir, 'lesson-quiz-mappings.json');
    fs.writeFileSync(
      lessonQuizPath,
      JSON.stringify(lessonQuizMappings, null, 2),
    );

    console.log(
      chalk.green(`✓ Saved lesson-quiz mappings to ${lessonQuizPath}`),
    );

    // 2. Generate quiz-question mappings
    console.log(chalk.cyan('Generating quiz-question mappings...'));

    const quizQuestionQuery = `
      SELECT 
        cq.id as source_id,
        cq.title as source_title,
        qq.id as target_id,
        qq.text as target_title,
        cqr.order,
        'questions' as relationship_type
      FROM 
        payload.course_quizzes cq
      JOIN 
        payload.course_quizzes_rels cqr ON cq.id = cqr.parent_id
      JOIN 
        payload.quiz_questions qq ON cqr.quiz_questions_id = qq.id
      WHERE 
        cqr.quiz_questions_id IS NOT NULL
      ORDER BY 
        cqr.order ASC NULLS LAST
    `;

    const quizQuestionResult = await pool.query(quizQuestionQuery);
    const quizQuestionMappings =
      quizQuestionResult.rows as RelationshipMapping[];

    console.log(
      `Found ${quizQuestionMappings.length} quiz-question relationships`,
    );

    // Write quiz-question mappings to file
    const quizQuestionPath = path.join(
      mappingsDir,
      'quiz-question-mappings.json',
    );
    fs.writeFileSync(
      quizQuestionPath,
      JSON.stringify(quizQuestionMappings, null, 2),
    );

    console.log(
      chalk.green(`✓ Saved quiz-question mappings to ${quizQuestionPath}`),
    );

    // 3. Generate survey-question mappings
    console.log(chalk.cyan('Generating survey-question mappings...'));

    const surveyQuestionQuery = `
      SELECT 
        s.id as source_id,
        s.title as source_title,
        sq.id as target_id,
        sq.text as target_title,
        sr.order,
        'questions' as relationship_type
      FROM 
        payload.surveys s
      JOIN 
        payload.surveys_rels sr ON s.id = sr.parent_id
      JOIN 
        payload.survey_questions sq ON sr.survey_questions_id = sq.id
      WHERE 
        sr.survey_questions_id IS NOT NULL
      ORDER BY 
        sr.order ASC NULLS LAST
    `;

    const surveyQuestionResult = await pool.query(surveyQuestionQuery);
    const surveyQuestionMappings =
      surveyQuestionResult.rows as RelationshipMapping[];

    console.log(
      `Found ${surveyQuestionMappings.length} survey-question relationships`,
    );

    // Write survey-question mappings to file
    const surveyQuestionPath = path.join(
      mappingsDir,
      'survey-question-mappings.json',
    );
    fs.writeFileSync(
      surveyQuestionPath,
      JSON.stringify(surveyQuestionMappings, null, 2),
    );

    console.log(
      chalk.green(`✓ Saved survey-question mappings to ${surveyQuestionPath}`),
    );

    // 4. Generate lesson-download mappings
    console.log(chalk.cyan('Generating lesson-download mappings...'));

    const lessonDownloadQuery = `
      SELECT 
        cl.id as source_id,
        cl.title as source_title,
        dl.id as target_id,
        dl.title as target_title,
        clr.order,
        'download' as relationship_type
      FROM 
        payload.course_lessons cl
      JOIN 
        payload.course_lessons_rels clr ON cl.id = clr.parent_id
      JOIN 
        payload.downloads dl ON clr.downloads_id = dl.id
      WHERE 
        clr.downloads_id IS NOT NULL
      ORDER BY 
        cl.order ASC NULLS LAST, clr.order ASC NULLS LAST
    `;

    const lessonDownloadResult = await pool.query(lessonDownloadQuery);
    const lessonDownloadMappings =
      lessonDownloadResult.rows as RelationshipMapping[];

    console.log(
      `Found ${lessonDownloadMappings.length} lesson-download relationships`,
    );

    // Write lesson-download mappings to file
    const lessonDownloadPath = path.join(
      mappingsDir,
      'lesson-download-mappings.json',
    );
    fs.writeFileSync(
      lessonDownloadPath,
      JSON.stringify(lessonDownloadMappings, null, 2),
    );

    console.log(
      chalk.green(`✓ Saved lesson-download mappings to ${lessonDownloadPath}`),
    );

    // 5. Generate post-media mappings
    console.log(chalk.cyan('Generating post-media mappings...'));

    const postMediaQuery = `
      SELECT 
        p.id as source_id,
        p.title as source_title,
        m.id as target_id,
        m.filename as target_title,
        0 as "order",
        'image' as relationship_type
      FROM 
        payload.posts p
      JOIN 
        payload.media m ON p.image_id = m.id
      WHERE 
        p.image_id IS NOT NULL
    `;

    const postMediaResult = await pool.query(postMediaQuery);
    const postMediaMappings = postMediaResult.rows as RelationshipMapping[];

    console.log(`Found ${postMediaMappings.length} post-media relationships`);

    // Write post-media mappings to file
    const postMediaPath = path.join(mappingsDir, 'post-media-mappings.json');
    fs.writeFileSync(postMediaPath, JSON.stringify(postMediaMappings, null, 2));

    console.log(chalk.green(`✓ Saved post-media mappings to ${postMediaPath}`));

    // 6. Create consolidated mapping file
    console.log(chalk.cyan('Creating consolidated relationship mapping...'));

    const allMappings = {
      lessonQuiz: lessonQuizMappings,
      quizQuestion: quizQuestionMappings,
      surveyQuestion: surveyQuestionMappings,
      lessonDownload: lessonDownloadMappings,
      postMedia: postMediaMappings,
      metadata: {
        createdAt: new Date().toISOString(),
        totalRelationships:
          lessonQuizMappings.length +
          quizQuestionMappings.length +
          surveyQuestionMappings.length +
          lessonDownloadMappings.length +
          postMediaMappings.length,
      },
    };

    // Write consolidated mappings to file
    const consolidatedPath = path.join(
      mappingsDir,
      'all-relationship-mappings.json',
    );
    fs.writeFileSync(consolidatedPath, JSON.stringify(allMappings, null, 2));

    console.log(
      chalk.green(`✓ Saved consolidated mappings to ${consolidatedPath}`),
    );

    // 7. Create SQL dump for emergency restoration
    console.log(
      chalk.cyan('Creating SQL dump for emergency relationship restoration...'),
    );

    let sqlDump = `-- Relationship Restoration SQL
-- Generated: ${new Date().toISOString()}
-- WARNING: Use only for emergency recovery. This will overwrite existing relationships.

BEGIN;

-- Clear existing relationships first
`;

    // Add SQL to clear existing relationships
    sqlDump += `
-- Clear lesson-quiz relationships
DELETE FROM payload.course_lessons_rels WHERE course_quizzes_id IS NOT NULL;

-- Clear quiz-question relationships
DELETE FROM payload.course_quizzes_rels WHERE quiz_questions_id IS NOT NULL;

-- Clear survey-question relationships
DELETE FROM payload.surveys_rels WHERE survey_questions_id IS NOT NULL;

-- Clear lesson-download relationships
DELETE FROM payload.course_lessons_rels WHERE downloads_id IS NOT NULL;

-- Now restore relationships from mappings
`;

    // Add lesson-quiz relationship restoration
    sqlDump += `
-- Restore lesson-quiz relationships
`;

    lessonQuizMappings.forEach((mapping, index) => {
      sqlDump += `INSERT INTO payload.course_lessons_rels (parent_id, course_quizzes_id, order) 
VALUES ('${mapping.sourceId}', '${mapping.targetId}', ${mapping.order || index});
`;
    });

    // Add quiz-question relationship restoration
    sqlDump += `
-- Restore quiz-question relationships
`;

    quizQuestionMappings.forEach((mapping, index) => {
      sqlDump += `INSERT INTO payload.course_quizzes_rels (parent_id, quiz_questions_id, order) 
VALUES ('${mapping.sourceId}', '${mapping.targetId}', ${mapping.order || index});
`;
    });

    // Add survey-question relationship restoration
    sqlDump += `
-- Restore survey-question relationships
`;

    surveyQuestionMappings.forEach((mapping, index) => {
      sqlDump += `INSERT INTO payload.surveys_rels (parent_id, survey_questions_id, order) 
VALUES ('${mapping.sourceId}', '${mapping.targetId}', ${mapping.order || index});
`;
    });

    // Add lesson-download relationship restoration
    sqlDump += `
-- Restore lesson-download relationships
`;

    lessonDownloadMappings.forEach((mapping, index) => {
      sqlDump += `INSERT INTO payload.course_lessons_rels (parent_id, downloads_id, order) 
VALUES ('${mapping.sourceId}', '${mapping.targetId}', ${mapping.order || index});
`;
    });

    // Add post-media relationship restoration
    sqlDump += `
-- Restore post-media relationships
`;

    postMediaMappings.forEach((mapping) => {
      sqlDump += `UPDATE payload.posts SET image_id = '${mapping.targetId}' WHERE id = '${mapping.sourceId}';
`;
    });

    // Finalize the SQL dump
    sqlDump += `
COMMIT;
-- End of relationship restoration SQL`;

    // Write SQL dump to file
    const sqlDumpPath = path.join(mappingsDir, 'relationship-restoration.sql');
    fs.writeFileSync(sqlDumpPath, sqlDump);

    console.log(chalk.green(`✓ Saved SQL dump to ${sqlDumpPath}`));

    // Summary
    console.log(
      chalk.green(
        '\n✓ Successfully generated all static relationship mappings',
      ),
    );

    console.log(chalk.yellow('\nSummary of relationships mapped:'));
    console.log(`- Lesson-Quiz: ${lessonQuizMappings.length}`);
    console.log(`- Quiz-Question: ${quizQuestionMappings.length}`);
    console.log(`- Survey-Question: ${surveyQuestionMappings.length}`);
    console.log(`- Lesson-Download: ${lessonDownloadMappings.length}`);
    console.log(`- Post-Media: ${postMediaMappings.length}`);
    console.log(`- Total: ${allMappings.metadata.totalRelationships}`);

    return {
      success: true,
      mappingsPath: mappingsDir,
      relationshipsCount: allMappings.metadata.totalRelationships,
    };
  } catch (error) {
    console.error(chalk.red('Error generating static mappings:'), error);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateStaticMappings()
    .then((result) => {
      if (result.success) {
        console.log(
          chalk.green('Static relationship mappings generated successfully'),
        );
        process.exit(0);
      } else {
        console.error(
          chalk.red('Static relationship mappings generation failed:'),
          result.error,
        );
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(chalk.red('Unhandled error:'), error);
      process.exit(1);
    });
}

export { generateStaticMappings };
