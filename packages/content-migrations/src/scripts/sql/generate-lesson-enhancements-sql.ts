import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Paths
const BASE_DIR = path.resolve(__dirname, '../../../');
const YAML_PATH = path.join(
  BASE_DIR,
  'src/data/definitions/lessons_structured_content.yaml',
);
const OUTPUT_DIR = path.join(BASE_DIR, 'src/data/processed/sql');

function generateLessonEnhancementsSQL() {
  console.log('Generating SQL for lesson enhancements...');

  // Check if YAML file exists
  if (!fs.existsSync(YAML_PATH)) {
    console.error(`YAML file not found: ${YAML_PATH}`);
    console.info(
      'Please run the analyze-lesson-content.ts script first to generate the YAML file.',
    );
    process.exit(1);
  }

  // Read the YAML file
  const yamlContent = fs.readFileSync(YAML_PATH, 'utf8');
  const data = yaml.load(yamlContent) as any;

  if (!data || !data.lessons || !Array.isArray(data.lessons)) {
    console.error('Invalid YAML file structure');
    process.exit(1);
  }

  console.log(
    `Found ${data.lessons.length} lessons with enhancements in YAML file`,
  );

  // Start generating SQL
  let sql = `-- Generated SQL for structured lesson content
-- Generated at ${new Date().toISOString()}

-- Start a transaction
BEGIN;

`;

  // Process each lesson
  for (const lesson of data.lessons) {
    if (!lesson.id && !lesson.slug) {
      console.warn('Skipping lesson with no ID or slug');
      continue;
    }

    const whereClause = lesson.id
      ? `id = '${lesson.id}'`
      : `slug = '${lesson.slug}'`;

    sql += `-- Processing lesson: ${lesson.title || lesson.slug || lesson.id}\n`;

    // Update bunny video fields
    if (lesson.bunny_video) {
      sql += `
-- Update bunny video information for lesson ${lesson.title || lesson.slug || lesson.id}
UPDATE payload.course_lessons
SET 
  bunny_video_id = '${lesson.bunny_video.video_id}',
  bunny_library_id = '${lesson.bunny_video.library_id || '264486'}'
WHERE ${whereClause};
`;
    }

    // Update todo items
    if (lesson.todo_items) {
      const completeQuiz = lesson.todo_items.complete_quiz ? 'TRUE' : 'FALSE';
      const watchContent = lesson.todo_items.watch_content
        ? `'${lesson.todo_items.watch_content.replace(/'/g, "''")}'`
        : 'NULL';
      const readContent = lesson.todo_items.read_content
        ? `'${lesson.todo_items.read_content.replace(/'/g, "''")}'`
        : 'NULL';
      const courseProject = lesson.todo_items.course_project
        ? `'${lesson.todo_items.course_project.replace(/'/g, "''")}'`
        : 'NULL';

      sql += `
-- Update todo items for lesson ${lesson.title || lesson.slug || lesson.id}
UPDATE payload.course_lessons
SET 
  todo_complete_quiz = ${completeQuiz},
  todo_watch_content = ${watchContent},
  todo_read_content = ${readContent},
  todo_course_project = ${courseProject}
WHERE ${whereClause};
`;
    }

    // Process downloads
    if (lesson.downloads && lesson.downloads.length > 0) {
      sql += `
-- Get the lesson ID for ${lesson.title || lesson.slug || lesson.id}
DO $$
DECLARE
  lesson_id UUID;
BEGIN
  SELECT id INTO lesson_id FROM payload.course_lessons WHERE ${whereClause} LIMIT 1;
  
  IF lesson_id IS NOT NULL THEN
`;

      for (const download of lesson.downloads) {
        const downloadId = uuidv4();
        const description = download.description
          ? `'${download.description.replace(/'/g, "''")}'`
          : 'NULL';

        sql += `
    -- Insert download: ${download.filename}
    INSERT INTO payload.downloads (
      id,
      filename,
      url,
      description,
      lesson_id,
      created_at,
      updated_at
    ) VALUES (
      '${downloadId}',
      '${download.filename.replace(/'/g, "''")}',
      '${download.url.replace(/'/g, "''")}',
      ${description},
      lesson_id,
      NOW(),
      NOW()
    );
    
    -- Create relationship between lesson and download
    INSERT INTO payload.course_lessons_downloads (
      id,
      lesson_id,
      download_id,
      created_at,
      updated_at
    ) VALUES (
      '${uuidv4()}',
      lesson_id,
      '${downloadId}',
      NOW(),
      NOW()
    );
`;
      }

      sql += `
  END IF;
END $$;
`;
    }
  }

  sql += `
-- Add course_lessons_rels entries for downloads (bidirectional relationship)
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  d.lesson_id,
  'downloads',
  d.id,
  NOW(),
  NOW()
FROM payload.downloads d
WHERE d.lesson_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM payload.course_lessons_rels r
  WHERE r._parent_id = d.lesson_id
  AND r.field = 'downloads'
  AND r.value = d.id
);

-- Commit the transaction
COMMIT;
`;

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write the SQL to a file
  const sqlOutputPath = path.join(OUTPUT_DIR, '08-lesson-enhancements.sql');
  fs.writeFileSync(sqlOutputPath, sql);

  console.log(`SQL generated and saved to ${sqlOutputPath}`);
  return sqlOutputPath;
}

try {
  const outputPath = generateLessonEnhancementsSQL();
  console.log('SQL generation completed successfully');
  console.log(`Output file: ${outputPath}`);
} catch (error) {
  console.error('Error generating SQL:', error);
  process.exit(1);
}
