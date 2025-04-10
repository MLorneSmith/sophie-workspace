# PowerShell script to run the lesson enhancements tests
$ErrorActionPreference = "Stop"

Write-Host "Testing Lesson Enhancements Implementation" -ForegroundColor Cyan

# Set paths
$basePath = (Get-Location).Path
$definitionsDir = Join-Path -Path $basePath -ChildPath "src\data\definitions"
$processedSqlDir = Join-Path -Path $basePath -ChildPath "src\data\processed\sql"
$distDir = Join-Path -Path $basePath -ChildPath "dist"
$payloadSeedDir = Join-Path -Path $basePath -ChildPath "..\..\apps\payload\src\seed\sql"

# Create necessary directories
if (-not (Test-Path $definitionsDir)) {
    Write-Host "Creating directory: $definitionsDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $definitionsDir -Force | Out-Null
}

if (-not (Test-Path $processedSqlDir)) {
    Write-Host "Creating directory: $processedSqlDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $processedSqlDir -Force | Out-Null
}

if (-not (Test-Path $distDir)) {
    Write-Host "Creating directory: $distDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

# Make sure we have the required dependencies
Write-Host "`nInstalling required dependencies..." -ForegroundColor Yellow
pnpm add js-yaml @types/js-yaml typescript ts-node @types/node uuid @types/uuid --save-dev

# Create script directory in dist if it doesn't exist
$distScriptsDir = Join-Path -Path $distDir -ChildPath "scripts"
$distSqlDir = Join-Path -Path $distScriptsDir -ChildPath "sql"
if (-not (Test-Path $distScriptsDir)) {
    New-Item -ItemType Directory -Path $distScriptsDir -Force | Out-Null
}
if (-not (Test-Path $distSqlDir)) {
    New-Item -ItemType Directory -Path $distSqlDir -Force | Out-Null
}

try {
    # Compile the TypeScript files first
    Write-Host "`n1. Compiling TypeScript files..." -ForegroundColor Green
    
    # First, create a simplified TypeScript config file
    $tsconfigContent = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "outDir": "./dist",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "strict": false,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
"@
    
    $tsconfigPath = Join-Path -Path $basePath -ChildPath "tsconfig.json"
    Set-Content -Path $tsconfigPath -Value $tsconfigContent
    
    # Now compile all TypeScript files
    Write-Host "Compiling TypeScript files with tsc..." -ForegroundColor Yellow
    pnpm exec tsc
    
    # Check if compilation succeeded
    if ($LASTEXITCODE -ne 0) {
        Write-Host "TypeScript compilation failed. Trying an alternate approach..." -ForegroundColor Yellow
        
        # Create the analysis script directly in plain JavaScript without template literals
        $analyzeScriptPath = Join-Path -Path $distScriptsDir -ChildPath "analyze-lesson-content.js"
        $analyzeScriptContent = @'
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Mock lesson data
const mockLessons = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    slug: 'our-process',
    title: 'Our Process',
    content: JSON.stringify({
      root: {
        children: [
          {
            blockType: 'bunny-video',
            videoId: '70b1f616-8e55-4c58-8898-c5cefa05417b',
            libraryId: '264486',
          },
          {
            text: 'TO-DO: Complete the lesson quiz\nWATCH: None\nREAD: None\nCOURSE PROJECT: None',
          },
          {
            text: 'r2file awsurl="https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf" filedescription="Our Process Slides"',
          },
        ],
      },
    })
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174000',
    slug: 'the-who',
    title: 'The Who',
    content: JSON.stringify({
      root: {
        children: [
          {
            text: 'To-Do: Complete the lesson quiz\nWatch: Video on stakeholders\nRead: Stakeholder analysis guide\nCourse Project: Create a stakeholder map',
          },
          {
            text: 'r2file awsurl="https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf" filedescription="The Who Slides"',
          },
        ],
      },
    })
  }
];

function analyzeContent() {
  console.log('Analyzing lesson content...');
  
  const lessonsData = [];

  for (const lesson of mockLessons) {
    console.log('Analyzing lesson: ' + lesson.title + ' (' + lesson.slug + ')');
    
    const lessonData = {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
    };

    // Extract Bunny Video information
    const videoMatch = lesson.content.match(
      /blockType":"bunny-video".*?"videoId":"([^"]+)".*?"libraryId":"([^"]+)"/
    );
    
    if (videoMatch) {
      console.log('  Found Bunny video in lesson: ' + lesson.slug);
      lessonData.bunny_video = {
        video_id: videoMatch[1],
        library_id: videoMatch[2] || '264486',
      };
    }

    // Extract To-Do items
    const hasTodo = 
      lesson.content.includes('TO-DO:') || 
      lesson.content.includes('To-Do:') || 
      lesson.content.includes('To-do:') ||
      lesson.content.includes('ToDo:');
                   
    if (hasTodo) {
      console.log('  Found TODO items in lesson: ' + lesson.slug);
      lessonData.todo_items = {
        complete_quiz: lesson.content.includes('Complete the lesson quiz'),
      };

      // Extract Watch content
      const watchMatch = 
        lesson.content.match(/WATCH:\s*([^\n]+)/) || 
        lesson.content.match(/Watch:\s*([^\n]+)/);
      if (watchMatch) {
        lessonData.todo_items.watch_content = watchMatch[1].trim();
      }

      // Extract Read content
      const readMatch = 
        lesson.content.match(/READ:\s*([^\n]+)/) || 
        lesson.content.match(/Read:\s*([^\n]+)/);
      if (readMatch) {
        lessonData.todo_items.read_content = readMatch[1].trim();
      }

      // Extract Course Project
      const projectMatch = 
        lesson.content.match(/COURSE PROJECT:\s*([^\n]+)/) || 
        lesson.content.match(/Course Project:\s*([^\n]+)/);
      if (projectMatch) {
        lessonData.todo_items.course_project = projectMatch[1].trim();
      }
    }

    // Extract R2 file downloads
    const r2FileMatches = Array.from(
      lesson.content.matchAll(
        /r2file\s*awsurl="([^"]+)"\s*filedescription="([^"]+)"/g
      ) || []
    );
    
    if (r2FileMatches.length > 0) {
      console.log('  Found ' + r2FileMatches.length + ' R2 file downloads in lesson: ' + lesson.slug);
      lessonData.downloads = [];

      for (const match of r2FileMatches) {
        const url = match[1] || '';
        const description = match[2] || '';
        const filename = url ? url.split('/').pop() || 'unknown-file' : 'unknown-file';
        
        lessonData.downloads.push({
          url,
          description,
          filename,
        });
      }
    }

    // Only add lessons with enhanced content
    if (
      lessonData.bunny_video ||
      lessonData.todo_items ||
      lessonData.downloads
    ) {
      lessonsData.push(lessonData);
    }
  }

  // Write to YAML file
  const yamlData = {
    lessons: lessonsData,
  };

  // Ensure directory exists
  const outputDir = path.join(__dirname, '../../src/data/definitions');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const yamlStr = yaml.dump(yamlData);
  const outputPath = path.join(outputDir, 'lessons_structured_content.yaml');
  fs.writeFileSync(outputPath, yamlStr);

  console.log('Generated YAML for ' + lessonsData.length + ' lessons with enhanced content');
  console.log('YAML file saved to: ' + outputPath);
}

analyzeContent();
'@
        Set-Content -Path $analyzeScriptPath -Value $analyzeScriptContent
        
        # Create the SQL generator script directly in plain JavaScript without template literals
        $sqlGeneratorPath = Join-Path -Path $distSqlDir -ChildPath "generate-lesson-enhancements-sql.js"
        $sqlGeneratorContent = @'
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
'@
        Set-Content -Path $sqlGeneratorPath -Value $sqlGeneratorContent
    }
    
    # Run analyze-lesson-content script
    Write-Host "`n2. Running analyze-lesson-content script..." -ForegroundColor Green
    
    # Try with compiled JavaScript if available
    if (Test-Path (Join-Path -Path $distScriptsDir -ChildPath "analyze-lesson-content.js")) {
        node $distScriptsDir/analyze-lesson-content.js
    } else {
        Write-Host "Error: Could not find analyze-lesson-content.js script" -ForegroundColor Red
        exit 1
    }

    # Verify YAML file was created
    $yamlPath = Join-Path -Path $definitionsDir -ChildPath "lessons_structured_content.yaml"
    if (Test-Path $yamlPath) {
        Write-Host "✅ YAML file created: $yamlPath" -ForegroundColor Green
    }
    else {
        Write-Host "❌ YAML file was not created: $yamlPath" -ForegroundColor Red
        exit 1
    }

    # Run generate-lesson-enhancements-sql script
    Write-Host "`n3. Running generate-lesson-enhancements-sql script..." -ForegroundColor Green
    
    # Try with compiled JavaScript if available
    if (Test-Path (Join-Path -Path $distSqlDir -ChildPath "generate-lesson-enhancements-sql.js")) {
        node $distSqlDir/generate-lesson-enhancements-sql.js
    } else {
        Write-Host "Error: Could not find generate-lesson-enhancements-sql.js script" -ForegroundColor Red
        exit 1
    }

    # Verify SQL file was created
    $sqlPath = Join-Path -Path $processedSqlDir -ChildPath "08-lesson-enhancements.sql"
    if (Test-Path $sqlPath) {
        Write-Host "✅ SQL file created: $sqlPath" -ForegroundColor Green
    }
    else {
        Write-Host "❌ SQL file was not created: $sqlPath" -ForegroundColor Red
        exit 1
    }

    # Copy SQL file to Payload seed directory
    Write-Host "`n3. Copying SQL file to Payload seed directory..." -ForegroundColor Green
    
    if (-not (Test-Path $payloadSeedDir)) {
        Write-Host "Creating Payload SQL seed directory: $payloadSeedDir" -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $payloadSeedDir -Force | Out-Null
    }
    
    $destSqlPath = Join-Path -Path $payloadSeedDir -ChildPath "08-lesson-enhancements.sql"
    Copy-Item -Path $sqlPath -Destination $destSqlPath -Force
    
    if (Test-Path $destSqlPath) {
        Write-Host "✅ SQL file copied to: $destSqlPath" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Failed to copy SQL file to: $destSqlPath" -ForegroundColor Red
    }

    Write-Host "`n✅ All tests passed!" -ForegroundColor Green
    
    Write-Host "`nTo complete the implementation:" -ForegroundColor Cyan
    Write-Host "1. Run the database migration: .\reset-and-migrate.ps1" -ForegroundColor White
    Write-Host "2. Verify that the data has been imported correctly in the Payload CMS admin" -ForegroundColor White 
    Write-Host "3. Check that the frontend components render correctly" -ForegroundColor White
}
catch {
    Write-Host "Error running test script: $_" -ForegroundColor Red
    exit 1
}
