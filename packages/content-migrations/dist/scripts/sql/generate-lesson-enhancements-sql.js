const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');

// Fake UUID generation since we might not have uuid package
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Paths
const yamlPath = path.join(__dirname, '../../../src/data/definitions/lessons_structured_content.yaml');
const outputDir = path.join(__dirname, '../../../src/data/processed/sql');

function generateLessonEnhancementsSQL() {
  console.log('Generating SQL for lesson enhancements...');

  // Check if YAML file exists
  if (!fs.existsSync(yamlPath)) {
    console.error('YAML file not found: ' + yamlPath);
    process.exit(1);
  }

  // Read the YAML file
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const data = yaml.load(yamlContent);

  if (!data || !data.lessons || !Array.isArray(data.lessons)) {
    console.error('Invalid YAML file structure');
    process.exit(1);
  }

  console.log('Found ' + data.lessons.length + ' lessons with enhancements in YAML file');

  // Start generating SQL
  let sql = '-- Generated SQL for structured lesson content\n';
  sql += '-- Generated at ' + new Date().toISOString() + '\n\n';
  sql += '-- Start a transaction\n';
  sql += 'BEGIN;\n\n';

  // Process each lesson
  for (const lesson of data.lessons) {
    if (!lesson.id && !lesson.slug) {
      console.warn('Skipping lesson with no ID or slug');
      continue;
    }

    const whereClause = lesson.id 
      ? "id = '" + lesson.id + "'" 
      : "slug = '" + lesson.slug + "'";
    
    const lessonTitle = lesson.title || lesson.slug || lesson.id;
    sql += '-- Processing lesson: ' + lessonTitle + '\n';

    // Update bunny video fields
    if (lesson.bunny_video) {
      sql += '\n-- Update bunny video information for lesson ' + lessonTitle + '\n';
      sql += 'UPDATE payload.course_lessons\n';
      sql += 'SET \n';
      sql += "  bunny_video_id = '" + lesson.bunny_video.video_id + "',\n";
      sql += "  bunny_library_id = '" + (lesson.bunny_video.library_id || '264486') + "'\n";
      sql += 'WHERE ' + whereClause + ';\n';
    }

    // Update todo items
    if (lesson.todo_items) {
      const completeQuiz = lesson.todo_items.complete_quiz ? 'TRUE' : 'FALSE';
      const watchContent = lesson.todo_items.watch_content 
        ? "'" + lesson.todo_items.watch_content.replace(/'/g, "''") + "'" 
        : 'NULL';
      const readContent = lesson.todo_items.read_content 
        ? "'" + lesson.todo_items.read_content.replace(/'/g, "''") + "'" 
        : 'NULL';
      const courseProject = lesson.todo_items.course_project 
        ? "'" + lesson.todo_items.course_project.replace(/'/g, "''") + "'" 
        : 'NULL';

      sql += '\n-- Update todo items for lesson ' + lessonTitle + '\n';
      sql += 'UPDATE payload.course_lessons\n';
      sql += 'SET \n';
      sql += '  todo_complete_quiz = ' + completeQuiz + ',\n';
      sql += '  todo_watch_content = ' + watchContent + ',\n';
      sql += '  todo_read_content = ' + readContent + ',\n';
      sql += '  todo_course_project = ' + courseProject + '\n';
      sql += 'WHERE ' + whereClause + ';\n';
    }

    // Process downloads
    if (lesson.downloads && lesson.downloads.length > 0) {
      sql += '\n-- Get the lesson ID for ' + lessonTitle + '\n';
      sql += 'DO $$\n';
      sql += 'DECLARE\n';
      sql += '  lesson_id UUID;\n';
      sql += 'BEGIN\n';
      sql += '  SELECT id INTO lesson_id FROM payload.course_lessons WHERE ' + whereClause + ' LIMIT 1;\n';
      sql += '  \n';
      sql += '  IF lesson_id IS NOT NULL THEN\n';

      for (const download of lesson.downloads) {
        const downloadId = generateUUID();
        const description = download.description 
          ? "'" + download.description.replace(/'/g, "''") + "'" 
          : 'NULL';
        const safeFilename = download.filename.replace(/'/g, "''");
        const safeUrl = download.url.replace(/'/g, "''");

        sql += '\n    -- Insert download: ' + download.filename + '\n';
        sql += '    INSERT INTO payload.downloads (\n';
        sql += '      id,\n';
        sql += '      filename,\n';
        sql += '      url,\n';
        sql += '      description,\n';
        sql += '      lesson_id,\n';
        sql += '      created_at,\n';
        sql += '      updated_at\n';
        sql += '    ) VALUES (\n';
        sql += "      '" + downloadId + "',\n";
        sql += "      '" + safeFilename + "',\n";
        sql += "      '" + safeUrl + "',\n";
        sql += '      ' + description + ',\n';
        sql += '      lesson_id,\n';
        sql += '      NOW(),\n';
        sql += '      NOW()\n';
        sql += '    );\n';
        sql += '    \n';
        sql += '    -- Create relationship between lesson and download\n';
        sql += '    INSERT INTO payload.course_lessons_downloads (\n';
        sql += '      id,\n';
        sql += '      lesson_id,\n';
        sql += '      download_id,\n';
        sql += '      created_at,\n';
        sql += '      updated_at\n';
        sql += '    ) VALUES (\n';
        sql += "      '" + generateUUID() + "',\n";
        sql += '      lesson_id,\n';
        sql += "      '" + downloadId + "',\n";
        sql += '      NOW(),\n';
        sql += '      NOW()\n';
        sql += '    );\n';
      }

      sql += '\n  END IF;\n';
      sql += 'END $$;\n';
    }
  }

  sql += '\n-- Add course_lessons_rels entries for downloads (bidirectional relationship)\n';
  sql += 'INSERT INTO payload.course_lessons_rels (\n';
  sql += '  id,\n';
  sql += '  _parent_id,\n';
  sql += '  field,\n';
  sql += '  value,\n';
  sql += '  created_at,\n';
  sql += '  updated_at\n';
  sql += ')\n';
  sql += 'SELECT \n';
  sql += '  gen_random_uuid(),\n';
  sql += '  d.lesson_id,\n';
  sql += "  'downloads',\n";
  sql += '  d.id,\n';
  sql += '  NOW(),\n';
  sql += '  NOW()\n';
  sql += 'FROM payload.downloads d\n';
  sql += 'WHERE d.lesson_id IS NOT NULL\n';
  sql += 'AND NOT EXISTS (\n';
  sql += '  SELECT 1 FROM payload.course_lessons_rels r\n';
  sql += '  WHERE r._parent_id = d.lesson_id\n';
  sql += "  AND r.field = 'downloads'\n";
  sql += '  AND r.value = d.id\n';
  sql += ');\n\n';
  sql += '-- Commit the transaction\n';
  sql += 'COMMIT;\n';

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the SQL to a file
  const sqlOutputPath = path.join(outputDir, '08-lesson-enhancements.sql');
  fs.writeFileSync(sqlOutputPath, sql);
  
  console.log('SQL generated and saved to ' + sqlOutputPath);
  return sqlOutputPath;
}

try {
  const outputPath = generateLessonEnhancementsSQL();
  console.log('SQL generation completed successfully');
  console.log('Output file: ' + outputPath);
} catch (error) {
  console.error('Error generating SQL:', error);
  process.exit(1);
}
