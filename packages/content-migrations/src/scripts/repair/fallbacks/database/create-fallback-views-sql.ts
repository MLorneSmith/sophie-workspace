/**
 * Create Fallback Views with Direct SQL (no Drizzle ORM)
 *
 * This script creates database views that act as fallbacks for missing relationships.
 * It uses direct SQL queries with the pg client instead of Drizzle ORM.
 */
import chalk from 'chalk';
import dotenv from 'dotenv';
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
 * Creates the fallback views in the database
 */
async function createFallbackViews() {
  console.log(chalk.blue('\n=== CREATING FALLBACK VIEWS ==='));
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const pool = new Pool({ connectionString: DATABASE_URI });

  try {
    console.log('Connected to database');

    // Start a transaction
    await pool.query('BEGIN');

    try {
      // 1. Create comprehensive relationships view
      console.log(chalk.cyan('Creating unified_relationships view...'));

      await pool.query(`
        CREATE OR REPLACE VIEW payload.unified_relationships AS
        SELECT 
          'course_lessons' as source_table,
          cl.id as source_id,
          cl.title as source_title,
          'course_quizzes' as target_table,
          cq.id as target_id,
          cq.title as target_title,
          'quiz' as relationship_type,
          clr.order as relationship_order
        FROM 
          payload.course_lessons cl
        JOIN 
          payload.course_lessons_rels clr ON cl.id = clr.parent_id
        JOIN 
          payload.course_quizzes cq ON clr.course_quizzes_id = cq.id
        WHERE 
          clr.course_quizzes_id IS NOT NULL
          
        UNION ALL
        
        SELECT 
          'course_quizzes' as source_table,
          cq.id as source_id,
          cq.title as source_title,
          'quiz_questions' as target_table,
          qq.id as target_id,
          qq.text as target_title,
          'questions' as relationship_type,
          cqr.order as relationship_order
        FROM 
          payload.course_quizzes cq
        JOIN 
          payload.course_quizzes_rels cqr ON cq.id = cqr.parent_id
        JOIN 
          payload.quiz_questions qq ON cqr.quiz_questions_id = qq.id
        WHERE 
          cqr.quiz_questions_id IS NOT NULL
          
        UNION ALL
        
        SELECT 
          'surveys' as source_table,
          s.id as source_id,
          s.title as source_title,
          'survey_questions' as target_table,
          sq.id as target_id,
          sq.text as target_title,
          'questions' as relationship_type,
          sr.order as relationship_order
        FROM 
          payload.surveys s
        JOIN 
          payload.surveys_rels sr ON s.id = sr.parent_id
        JOIN 
          payload.survey_questions sq ON sr.survey_questions_id = sq.id
        WHERE 
          sr.survey_questions_id IS NOT NULL
          
        UNION ALL
        
        SELECT 
          'media' as source_table,
          m.id as source_id,
          m.filename as source_title,
          'posts' as target_table,
          p.id as target_id,
          p.title as target_title,
          'image' as relationship_type,
          0 as relationship_order
        FROM 
          payload.media m
        JOIN 
          payload.posts p ON p.image_id = m.id
        WHERE 
          p.image_id IS NOT NULL
      `);

      console.log(chalk.green('✓ Created unified_relationships view'));

      // 2. Create course content fallback view
      console.log(chalk.cyan('Creating course_content_fallback view...'));

      await pool.query(`
        CREATE OR REPLACE VIEW payload.course_content_fallback AS
        SELECT 
          cl.id as lesson_id,
          cl.title as lesson_title,
          cl.slug as lesson_slug,
          cl.order as lesson_order,
          c.id as course_id,
          c.title as course_title,
          cq.id as quiz_id,
          cq.title as quiz_title,
          COALESCE(
            (SELECT COUNT(*) FROM payload.course_quizzes_rels cqr 
             WHERE cqr.parent_id = cq.id AND cqr.quiz_questions_id IS NOT NULL),
            0
          ) as question_count,
          m.id as media_id,
          m.filename as media_filename,
          m.url as media_url
        FROM 
          payload.course_lessons cl
        LEFT JOIN 
          payload.courses c ON cl.course_id = c.id
        LEFT JOIN 
          payload.course_lessons_rels clr ON cl.id = clr.parent_id AND clr.course_quizzes_id IS NOT NULL
        LEFT JOIN 
          payload.course_quizzes cq ON clr.course_quizzes_id = cq.id
        LEFT JOIN 
          payload.media m ON cl.featured_image_id = m.id
        ORDER BY
          cl.order ASC
      `);

      console.log(chalk.green('✓ Created course_content_fallback view'));

      // 3. Create downloads fallback view
      console.log(chalk.cyan('Creating downloads_fallback view...'));

      await pool.query(`
        CREATE OR REPLACE VIEW payload.downloads_fallback AS
        WITH lesson_downloads AS (
          SELECT 
            cl.id as lesson_id,
            cl.title as lesson_title,
            dl.id as download_id,
            dl.title as download_title,
            dl.filename as download_filename,
            dl.path as download_path,
            dl.filesize as download_filesize,
            dl.mimetype as download_mimetype,
            dl.url as download_url
          FROM 
            payload.course_lessons cl
          LEFT JOIN 
            payload.course_lessons_rels clr ON cl.id = clr.parent_id
          LEFT JOIN 
            payload.downloads dl ON clr.downloads_id = dl.id
          WHERE 
            clr.downloads_id IS NOT NULL
        )
        SELECT * FROM lesson_downloads
        
        UNION ALL
        
        SELECT 
          NULL as lesson_id,
          NULL as lesson_title,
          dl.id as download_id,
          dl.title as download_title,
          dl.filename as download_filename,
          dl.path as download_path,
          dl.filesize as download_filesize,
          dl.mimetype as download_mimetype,
          dl.url as download_url
        FROM 
          payload.downloads dl
        WHERE 
          dl.id NOT IN (SELECT download_id FROM lesson_downloads WHERE download_id IS NOT NULL)
      `);

      console.log(chalk.green('✓ Created downloads_fallback view'));

      // 4. Create relationship diagnostics view
      console.log(chalk.cyan('Creating relationship_diagnostics view...'));

      await pool.query(`
        CREATE OR REPLACE VIEW payload.relationship_diagnostics AS
        WITH relationship_stats AS (
          SELECT 
            'course_lessons_rels' as table_name,
            COUNT(*) as total_relationships,
            COUNT(NULLIF(course_quizzes_id IS NULL, true)) as quiz_relationships,
            COUNT(NULLIF(downloads_id IS NULL, true)) as download_relationships,
            COUNT(NULLIF(media_id IS NULL, true)) as media_relationships
          FROM 
            payload.course_lessons_rels
            
          UNION ALL
          
          SELECT 
            'course_quizzes_rels' as table_name,
            COUNT(*) as total_relationships,
            COUNT(NULLIF(quiz_questions_id IS NULL, true)) as question_relationships,
            COUNT(NULLIF(course_lessons_id IS NULL, true)) as lesson_relationships,
            0 as unused
          FROM 
            payload.course_quizzes_rels
            
          UNION ALL
          
          SELECT 
            'surveys_rels' as table_name,
            COUNT(*) as total_relationships,
            COUNT(NULLIF(survey_questions_id IS NULL, true)) as question_relationships,
            0 as unused1,
            0 as unused2
          FROM 
            payload.surveys_rels
        )
        SELECT * FROM relationship_stats
      `);

      console.log(chalk.green('✓ Created relationship_diagnostics view'));

      // Commit the transaction
      await pool.query('COMMIT');
      console.log(chalk.green('\n✓ Successfully created all fallback views'));

      return { success: true };
    } catch (error) {
      // Rollback the transaction on error
      await pool.query('ROLLBACK');
      console.error(chalk.red('Error creating fallback views:'), error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error(chalk.red('Database connection error:'), error);
    return { success: false, error: error.message };
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createFallbackViews()
    .then((result) => {
      if (result.success) {
        console.log(
          chalk.green('Fallback views creation completed successfully'),
        );
        process.exit(0);
      } else {
        console.error(
          chalk.red('Fallback views creation failed:'),
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

export { createFallbackViews };
