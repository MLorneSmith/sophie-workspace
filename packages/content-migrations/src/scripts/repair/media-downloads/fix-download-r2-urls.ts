import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

import { DOWNLOAD_ID_MAP } from '../../data/mappings/download-mappings.js';

const { Client } = pg;

/**
 * Script to fix download R2 URLs in the database
 *
 * This script:
 * 1. Updates download records with proper R2 URLs
 * 2. Fixes lesson download relationships to prevent unwanted downloads
 * 3. Ensures "SlideHeroes Presentation Template" only appears in lesson 104
 */
export async function fixDownloadR2Urls(): Promise<void> {
  console.log('Fixing download R2 URLs and lesson relationships...');

  // Load environment variables
  const envPath = path.resolve(process.cwd(), '.env.development');
  dotenv.config({ path: envPath });

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    console.log('Connected to database');

    // Update URLs for known downloads
    for (const [key, id] of Object.entries(DOWNLOAD_ID_MAP)) {
      // Generate the proper filename based on the key
      let filename = key
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      // Add file extension
      if (key.includes('slides')) {
        filename += '.pdf';
      } else {
        filename += '.zip';
      }

      // Generate proper URL with encoding
      const encodedFilename = encodeURIComponent(filename);
      const url = `https://downloads.slideheroes.com/${encodedFilename}`;

      // Update the database
      await client.query(
        `
        UPDATE payload.downloads 
        SET url = $1, filename = $2
        WHERE id = $3 AND (url IS NULL OR url LIKE '%placeholder%')
        `,
        [url, filename, id],
      );

      console.log(`Updated download ${key} (${id}) with URL: ${url}`);
    }

    // Add special handling for the two hardcoded downloads
    const presentationTemplateId = '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1';

    await client.query(
      `
      UPDATE payload.downloads 
      SET url = $1, filename = $2
      WHERE id = $3 AND (url IS NULL OR url LIKE '%placeholder%')
      `,
      [
        'https://downloads.slideheroes.com/SlideHeroes%20Presentation%20Template.zip',
        'SlideHeroes Presentation Template.zip',
        presentationTemplateId,
      ],
    );

    await client.query(
      `
      UPDATE payload.downloads 
      SET url = $1, filename = $2
      WHERE id = $3 AND (url IS NULL OR url LIKE '%placeholder%')
      `,
      [
        'https://downloads.slideheroes.com/SlideHeroes%20Swipe%20File.zip',
        'SlideHeroes Swipe File.zip',
        'a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6',
      ],
    );

    // ISSUE FIX 1: Make sure lesson 104 has the presentation template
    console.log('Fixing download relationships...');

    // Get ID of lesson 104 (Presentation Tools & Course Resources)
    const lessonResult = await client.query(`
      SELECT id FROM payload.course_lessons
      WHERE slug = 'presentation-tools-and-course-resources' OR title LIKE '%Presentation Tools%'
    `);

    if (lessonResult.rows.length > 0) {
      const presentationToolsLessonId = lessonResult.rows[0].id;

      // Ensure the relationship exists between lesson 104 and presentation template
      const relationshipExists = await client.query(
        `
        SELECT 1 FROM payload.course_lessons_downloads
        WHERE lesson_id = $1 AND download_id = $2
      `,
        [presentationToolsLessonId, presentationTemplateId],
      );

      if (relationshipExists.rows.length === 0) {
        // Create the relationship if it doesn't exist
        await client.query(
          `
          INSERT INTO payload.course_lessons_downloads (id, lesson_id, download_id, created_at, updated_at, path)
          VALUES (
            uuid_generate_v4(),
            $1,
            $2,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            '/course_lessons_downloads/' || uuid_generate_v4()
          )
        `,
          [presentationToolsLessonId, presentationTemplateId],
        );

        console.log(
          `Created missing relationship between Lesson 104 and Presentation Template`,
        );
      } else {
        console.log(
          `Relationship between Lesson 104 and Presentation Template already exists`,
        );
      }

      // ISSUE FIX 2: Remove presentation template from all other lessons
      await client.query(
        `
        DELETE FROM payload.course_lessons_downloads
        WHERE download_id = $1 AND lesson_id != $2
      `,
        [presentationTemplateId, presentationToolsLessonId],
      );

      console.log(
        `Removed Presentation Template from all lessons except Lesson 104`,
      );
    } else {
      console.warn(
        `Could not find Lesson 104 - Presentation Tools & Course Resources`,
      );
    }

    // ISSUE FIX 3: Check for lessons showing downloads when they shouldn't
    // Specifically for: Lesson 101, Lesson 104, Lesson 402
    const problematicLessons = [
      { slug: 'welcome-to-ddm', lessonNumber: '101' }, // Lesson 101
      { slug: 'storyboards-in-film', lessonNumber: '402' }, // Lesson 402
    ];

    for (const lesson of problematicLessons) {
      const lessonResult = await client.query(
        `
        SELECT id FROM payload.course_lessons
        WHERE slug = $1 OR title LIKE $2
      `,
        [lesson.slug, `%${lesson.lessonNumber}%`],
      );

      if (lessonResult.rows.length > 0) {
        const lessonId = lessonResult.rows[0].id;

        // Remove all download relationships for this lesson
        const deleteResult = await client.query(
          `
          DELETE FROM payload.course_lessons_downloads
          WHERE lesson_id = $1
        `,
          [lessonId],
        );

        console.log(
          `Removed ${deleteResult.rowCount} download relationships from Lesson ${lesson.lessonNumber}`,
        );
      } else {
        console.warn(`Could not find Lesson ${lesson.lessonNumber}`);
      }
    }

    // Log counts of updated records
    const countResult = await client.query(
      "SELECT COUNT(*) FROM payload.downloads WHERE url IS NOT NULL AND url NOT LIKE '%placeholder%'",
    );

    await client.query('COMMIT');
    console.log(
      `Successfully updated download R2 URLs. ${countResult.rows[0].count} downloads now have valid URLs.`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing download R2 URLs:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
// Using import.meta.url pattern for ESM modules
const isMainModule = import.meta.url.endsWith(process.argv[1]);

if (isMainModule) {
  fixDownloadR2Urls()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
