import { executeSQL } from '../../utils/db/execute-sql.js';

export async function runLessonRenderingDiagnostic() {
  try {
    console.log('=== LESSON RENDERING DIAGNOSTIC ===');

    // Check content fields
    const contentQuery = `
      SELECT id, slug, 
             LEFT(content, 200) as content_preview,
             LENGTH(content) as content_length 
      FROM payload.course_lessons 
      WHERE content IS NOT NULL
      ORDER BY content_length DESC 
      LIMIT 5`;

    const contentResults = await executeSQL(contentQuery);
    console.log(
      `\nTop 5 lessons by content length (${contentResults.rowCount} total with non-NULL content):`,
    );
    if (contentResults.rowCount > 0) {
      contentResults.rows.forEach((row) => {
        console.log(
          `Lesson ${row.slug} (${row.id}): ${row.content_length} chars`,
        );
        console.log(`Preview: ${row.content_preview}...\n`);
      });
    } else {
      console.log('No lessons found with non-NULL content');
    }

    // Check total lesson count
    const lessonCountQuery = `SELECT COUNT(*) as count FROM payload.course_lessons`;
    const lessonCountResult = await executeSQL(lessonCountQuery);
    console.log(`Total lessons: ${lessonCountResult.rows[0]?.count || 0}`);

    // Check download relationships using the relationship table
    const downloadsQuery = `
      SELECT cl.id, cl.slug, cl.title, 
             COUNT(1) as download_count
      FROM payload.course_lessons cl
      LEFT JOIN payload.course_lessons__downloads cld ON cl.id::text = cld.parent_id::text
      GROUP BY cl.id, cl.slug, cl.title
      ORDER BY download_count DESC
      LIMIT 10`;

    const downloadsResults = await executeSQL(downloadsQuery);
    console.log(
      `\nTop 10 lessons by download count (${downloadsResults.rowCount} total):`,
    );
    if (downloadsResults.rowCount > 0) {
      downloadsResults.rows.forEach((row) => {
        console.log(
          `Lesson "${row.title}" (${row.slug}): ${row.download_count} downloads`,
        );
      });
    } else {
      console.log('No lessons found with downloads');
    }

    // Check the downloads table
    const downloadsTableQuery = `
      SELECT COUNT(*) as count FROM payload.downloads`;
    const downloadsTableResult = await executeSQL(downloadsTableQuery);
    console.log(
      `\nTotal downloads in downloads table: ${downloadsTableResult.rows[0]?.count || 0}`,
    );

    // Get sample downloads
    const sampleDownloadsQuery = `
      SELECT id, filename, url, description
      FROM payload.downloads
      LIMIT 5`;
    const sampleDownloadsResult = await executeSQL(sampleDownloadsQuery);
    console.log(
      `\nSample downloads (${sampleDownloadsResult.rowCount} shown):`,
    );
    if (sampleDownloadsResult.rowCount > 0) {
      sampleDownloadsResult.rows.forEach((row) => {
        console.log(`Download ID: ${row.id}`);
        console.log(`  Filename: ${row.filename}`);
        console.log(`  Description: ${row.description}`);
        console.log(`  URL: ${row.url ? 'Present' : 'Missing'}\n`);
      });
    } else {
      console.log('No downloads found in the downloads table');
    }

    // Count template tags in content
    const templateTagsQuery = `
      SELECT id, slug, 
             (LENGTH(content) - LENGTH(REPLACE(content, '{%', ''))) / 2 as template_tag_count
      FROM payload.course_lessons
      WHERE content LIKE '%{%%}%'
      ORDER BY template_tag_count DESC
      LIMIT 10`;

    const tagsResults = await executeSQL(templateTagsQuery);
    console.log(
      `\nTop 10 lessons by template tag count (${tagsResults.rowCount} total):`,
    );
    if (tagsResults.rowCount > 0) {
      tagsResults.rows.forEach((row) => {
        console.log(
          `Lesson ${row.slug} (${row.id}): ${row.template_tag_count} template tags`,
        );
      });
    } else {
      console.log('No lessons found with template tags in content');
    }

    // Count specific template tag types
    const tagTypesQuery = `
      SELECT 
        SUM(CASE WHEN content LIKE '%{%r2file%}%' THEN 1 ELSE 0 END) as r2file_count,
        SUM(CASE WHEN content LIKE '%{%bunny%}%' THEN 1 ELSE 0 END) as bunny_count,
        SUM(CASE WHEN content LIKE '%{%custombullet%}%' THEN 1 ELSE 0 END) as custombullet_count
      FROM payload.course_lessons
      WHERE content IS NOT NULL`;

    const tagTypesResult = await executeSQL(tagTypesQuery);
    if (tagTypesResult.rowCount > 0) {
      const row = tagTypesResult.rows[0];
      console.log(`\nTemplate tag type distribution:`);
      console.log(`  r2file tags: ${row.r2file_count} lessons`);
      console.log(`  bunny tags: ${row.bunny_count} lessons`);
      console.log(`  custombullet tags: ${row.custombullet_count} lessons`);
    }

    // Check downloads relationship view
    try {
      const downloadsViewQuery = `
        SELECT COUNT(*) as count FROM payload.downloads_relationships`;
      const downloadsViewResult = await executeSQL(downloadsViewQuery);
      console.log(
        `\nTotal relationships in downloads_relationships view: ${downloadsViewResult.rows[0]?.count || 0}`,
      );

      // Get sample relationships
      const sampleRelationshipsQuery = `
        SELECT collection_id, download_id, collection
        FROM payload.downloads_relationships
        WHERE collection::text = 'course_lessons'
        LIMIT 5`;
      const sampleRelationshipsResult = await executeSQL(
        sampleRelationshipsQuery,
      );
      console.log(
        `\nSample course_lessons download relationships (${sampleRelationshipsResult.rowCount} shown):`,
      );
      if (sampleRelationshipsResult.rowCount > 0) {
        sampleRelationshipsResult.rows.forEach((row) => {
          console.log(
            `Lesson ID: ${row.collection_id}, Download ID: ${row.download_id}`,
          );
        });
      } else {
        console.log('No course_lessons download relationships found');
      }
    } catch (error) {
      console.error(
        'Error querying downloads_relationships view:',
        error.message,
      );
      console.log("Note: This may be normal if the view doesn't exist yet");
    }

    return {
      success: true,
      totalLessons: lessonCountResult.rows[0]?.count || 0,
      lessonsWithContent: contentResults.rowCount,
      lessonsWithTemplates: tagsResults.rowCount,
      totalDownloads: downloadsTableResult.rows[0]?.count || 0,
    };
  } catch (error) {
    console.error('Diagnostic failed:', error);
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}

// Run the diagnostic if this script is executed directly
if (
  process.argv[1]?.endsWith('lesson-rendering-diagnostic.ts') ||
  process.argv[1]?.endsWith('lesson-rendering-diagnostic.js')
) {
  runLessonRenderingDiagnostic()
    .then((result) => {
      console.log('\nDiagnostic summary:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}
