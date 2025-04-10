// Simple script to generate all necessary files directly
// This avoids module system issues with TypeScript/ESM/CommonJS

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function createYamlFile() {
  console.log('Creating YAML file for lesson enhancements...');

  // Mock lesson data
  const mockLessons = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'our-process',
      title: 'Our Process',
      bunny_video: {
        video_id: '70b1f616-8e55-4c58-8898-c5cefa05417b',
        library_id: '264486',
      },
      todo_items: {
        complete_quiz: true,
        watch_content: 'None',
        read_content: 'None',
        course_project: 'None',
      },
      downloads: [
        {
          url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf',
          description: 'Our Process Slides',
          filename: '201 Our Process.pdf',
        },
      ],
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174000',
      slug: 'the-who',
      title: 'The Who',
      todo_items: {
        complete_quiz: true,
        watch_content: 'Video on stakeholders',
        read_content: 'Stakeholder analysis guide',
        course_project: 'Create a stakeholder map',
      },
      downloads: [
        {
          url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf',
          description: 'The Who Slides',
          filename: '202 The Who.pdf',
        },
      ],
    },
  ];

  const yamlData = {
    lessons: mockLessons,
  };

  // Create directory structure
  const definitionsDir = path.join(__dirname, 'src/data/definitions');
  if (!fs.existsSync(definitionsDir)) {
    fs.mkdirSync(definitionsDir, { recursive: true });
  }

  // Write YAML file
  const yamlPath = path.join(definitionsDir, 'lessons_structured_content.yaml');
  fs.writeFileSync(yamlPath, yaml.dump(yamlData));
  console.log(`YAML file created at: ${yamlPath}`);

  return yamlPath;
}

function createSqlFile() {
  console.log('Creating SQL file for lesson enhancements...');

  // Generate a SQL file with our enhancement schema
  const sql = `-- Generated SQL for lesson enhancements
-- Generated at ${new Date().toISOString()}

-- Start a transaction
BEGIN;

-- Process lesson: Our Process
UPDATE payload.course_lessons
SET 
  bunny_video_id = '70b1f616-8e55-4c58-8898-c5cefa05417b',
  bunny_library_id = '264486',
  todo_complete_quiz = TRUE,
  todo_watch_content = 'None',
  todo_read_content = 'None',
  todo_course_project = 'None'
WHERE slug = 'our-process';

-- Add downloads for lesson: Our Process
DO $$
DECLARE
  lesson_id UUID;
  download_id UUID := gen_random_uuid();
BEGIN
  SELECT id INTO lesson_id FROM payload.course_lessons WHERE slug = 'our-process' LIMIT 1;
  
  IF lesson_id IS NOT NULL THEN
    -- Insert download
    INSERT INTO payload.downloads (
      id,
      filename,
      url,
      description,
      lesson_id,
      created_at,
      updated_at
    ) VALUES (
      download_id,
      '201 Our Process.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf',
      'Our Process Slides',
      lesson_id,
      NOW(),
      NOW()
    );
    
    -- Create relationship
    INSERT INTO payload.course_lessons_downloads (
      id,
      lesson_id,
      download_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      lesson_id,
      download_id,
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Process lesson: The Who
UPDATE payload.course_lessons
SET 
  todo_complete_quiz = TRUE,
  todo_watch_content = 'Video on stakeholders',
  todo_read_content = 'Stakeholder analysis guide',
  todo_course_project = 'Create a stakeholder map'
WHERE slug = 'the-who';

-- Add downloads for lesson: The Who
DO $$
DECLARE
  lesson_id UUID;
  download_id UUID := gen_random_uuid();
BEGIN
  SELECT id INTO lesson_id FROM payload.course_lessons WHERE slug = 'the-who' LIMIT 1;
  
  IF lesson_id IS NOT NULL THEN
    -- Insert download
    INSERT INTO payload.downloads (
      id,
      filename,
      url,
      description,
      lesson_id,
      created_at,
      updated_at
    ) VALUES (
      download_id,
      '202 The Who.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf',
      'The Who Slides',
      lesson_id,
      NOW(),
      NOW()
    );
    
    -- Create relationship
    INSERT INTO payload.course_lessons_downloads (
      id,
      lesson_id,
      download_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      lesson_id,
      download_id,
      NOW(),
      NOW()
    );
  END IF;
END $$;

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
COMMIT;`;

  // Create directory structure
  const sqlDir = path.join(__dirname, 'src/data/processed/sql');
  if (!fs.existsSync(sqlDir)) {
    fs.mkdirSync(sqlDir, { recursive: true });
  }

  // Write SQL file
  const sqlPath = path.join(sqlDir, '08-lesson-enhancements.sql');
  fs.writeFileSync(sqlPath, sql);
  console.log(`SQL file created at: ${sqlPath}`);

  return sqlPath;
}

/**
 * Copies the SQL file to the payload seed directory
 * @param {string} sourcePath - Path to the source SQL file
 * @returns {string} Path to the destination SQL file
 */
function copySqlFile(sourcePath) {
  console.log('Copying SQL file to payload seed directory...');

  const payloadSeedDir = path.join(
    __dirname,
    '../../apps/payload/src/seed/sql',
  );
  if (!fs.existsSync(payloadSeedDir)) {
    fs.mkdirSync(payloadSeedDir, { recursive: true });
  }

  const destPath = path.join(payloadSeedDir, '08-lesson-enhancements.sql');
  fs.copyFileSync(sourcePath, destPath);
  console.log(`SQL file copied to: ${destPath}`);

  return destPath;
}

try {
  const yamlPath = createYamlFile();
  const sqlPath = createSqlFile();
  const destPath = copySqlFile(sqlPath);

  console.log('\n✅ All files generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Run the database migration: ./reset-and-migrate.ps1');
  console.log(
    '2. Verify that the data has been imported correctly in the Payload CMS admin',
  );
  console.log('3. Check that the frontend components render correctly');
} catch (error) {
  console.error('Error generating files:', error);
  process.exit(1);
}
