# Payload Migration Implementation Plan

This document outlines the implementation plan for the Payload CMS migration rationalization, building on the previous plans:

- [Payload Migration Rationalization Plan](./payload-migration-rationalization-plan.md)
- [Payload Migration Rationalization Update](./payload-migration-rationalization-update.md)
- [SQL Seed Migration Strategy](./sql-seed-migration-strategy.md)

## Current State Assessment

Based on our analysis of the current state, we've identified the following:

1. **Consolidated Migrations**: The team has already created consolidated migrations following the recommended structure:

   - `20250402_100000_schema_creation.ts` - Creates the payload schema
   - `20250402_300000_base_schema.ts` - Creates the base tables
   - `20250402_310000_relationship_structure.ts` - Creates the relationship tables
   - `20250402_320000_field_naming.ts` - Fixes field naming issues
   - `20250402_330000_bidirectional_relationships.ts` - Establishes bidirectional relationships

2. **Verification Scripts**: There are verification scripts in place:

   - `verify-database-schema.ts` - Verifies the schema and tables exist
   - `verify-all-relationships.ts` - Verifies bidirectional relationships

3. **Repair Scripts**: There's a repair script to fix edge cases:

   - `repair-edge-cases.ts` - Fixes issues that might not be fixed by the migrations

4. **Reset Script Issues**: The `reset-and-migrate.ps1` script is failing because `psql` is not recognized.

## Key Issues to Address

1. **Schema Creation Issue**: The `payload` schema is being created, but there may be timing issues with verification.
2. **Migration Order**: The migrations are properly ordered in the index.ts file, but we need to ensure dependencies are respected.
3. **psql Verification**: The reset script is failing because psql is not recognized - we need to replace this with Node.js utilities.
4. **SQL Seed Strategy**: We need to implement the SQL seed migration strategy for content.

## Implementation Plan

### 1. Create Node.js Utilities for Database Operations

#### 1.1 Schema Verification Utility

Create a new Node.js utility for schema verification:

```javascript
// packages/content-migrations/src/scripts/verification/verify-schema.js
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.development') });

async function verifySchema(schemaName) {
  // Get database connection string
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    console.error('DATABASE_URI environment variable is not set');
    process.exit(1);
  }

  // Connect to database
  const pool = new pg.Pool({
    connectionString: databaseUri,
  });

  try {
    const client = await pool.connect();
    try {
      // Check if schema exists
      const result = await client.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        [schemaName],
      );

      if (result.rows.length > 0) {
        console.log(`Schema '${schemaName}' exists`);
        process.exit(0);
      } else {
        console.error(`Schema '${schemaName}' does not exist`);
        process.exit(1);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get schema name from command line argument
const schemaName = process.argv[2];
if (!schemaName) {
  console.error('Schema name is required');
  process.exit(1);
}

verifySchema(schemaName);
```

#### 1.2 Table Verification Utility

Create a utility to verify tables exist:

```javascript
// packages/content-migrations/src/scripts/verification/verify-table.js
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.development') });

async function verifyTable(schemaName, tableName) {
  // Get database connection string
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    console.error('DATABASE_URI environment variable is not set');
    process.exit(1);
  }

  // Connect to database
  const pool = new pg.Pool({
    connectionString: databaseUri,
  });

  try {
    const client = await pool.connect();
    try {
      // Check if table exists
      const result = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
        [schemaName, tableName],
      );

      if (result.rows.length > 0) {
        console.log(`Table '${schemaName}.${tableName}' exists`);
        process.exit(0);
      } else {
        console.error(`Table '${schemaName}.${tableName}' does not exist`);
        process.exit(1);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying table:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get schema and table names from command line arguments
const schemaName = process.argv[2];
const tableName = process.argv[3];
if (!schemaName || !tableName) {
  console.error('Schema name and table name are required');
  process.exit(1);
}

verifyTable(schemaName, tableName);
```

#### 1.3 SQL File Execution Utility

Create a utility to execute SQL files:

```javascript
// packages/content-migrations/src/utils/execute-sql-file.js
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

export async function executeSqlFile(filePath) {
  // Get database connection string
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Executing SQL file: ${filePath}`);

  // Read SQL file
  const sql = fs.readFileSync(filePath, 'utf8');

  // Connect to database
  const client = new pg.Client({ connectionString: databaseUri });
  await client.connect();

  try {
    // Execute SQL
    await client.query(sql);
    console.log(`Successfully executed SQL file: ${filePath}`);
  } catch (error) {
    console.error(`Error executing SQL file: ${filePath}`, error);
    throw error;
  } finally {
    await client.end();
  }
}

// If called directly from command line
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('No SQL file path provided');
    process.exit(1);
  }

  executeSqlFile(filePath)
    .then(() => {
      console.log(`Successfully executed SQL file: ${filePath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`Error executing SQL file: ${filePath}`, error);
      process.exit(1);
    });
}
```

### 2. Enhance Schema Creation Migration

Update the schema creation migration to be more robust:

```typescript
// apps/payload/src/migrations/20250402_100000_schema_creation.ts
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Schema Creation Migration
 *
 * This migration creates the payload schema only.
 * It doesn't create any tables or modify any data.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running schema creation migration');

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`);

    // Create the payload schema if it doesn't exist
    await db.execute(sql`
      CREATE SCHEMA IF NOT EXISTS payload;
    `);

    // Set search path to include payload schema
    await db.execute(sql`
      SET search_path TO payload, public;
    `);

    // Verify schema was created
    const schemaResult = await db.execute(sql`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name = 'payload';
    `);

    if (schemaResult.rows.length === 0) {
      throw new Error('Schema creation failed: payload schema not found');
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`);
    console.log('Schema creation migration completed successfully');
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`);
    console.error('Error in schema creation migration:', error);
    throw error;
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for schema creation');

  try {
    // Note: We're not dropping the schema as it might contain data from other migrations
    // that haven't been rolled back yet.
    console.log('Schema creation down migration completed successfully');
  } catch (error) {
    console.error('Error in schema creation down migration:', error);
    throw error;
  }
}
```

### 3. Create SQL Seed Directory Structure

Create the SQL seed directory structure:

```
apps/payload/src/migrations/
├── seed/
    ├── 01-courses.sql
    ├── 02-lessons.sql
    ├── 03-quizzes.sql
    ├── 04-questions.sql
```

### 4. Create SQL Seed Generator

Create a script to generate SQL seed files from existing content:

```javascript
// packages/content-migrations/src/scripts/generate-sql-seed-files.js
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

async function generateSqlSeedFiles() {
  // Get database connection string
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  // Connect to database
  const client = new pg.Client({ connectionString: databaseUri });
  await client.connect();

  try {
    // Define seed directory
    const seedDir = path.resolve('apps/payload/src/migrations/seed');

    // Create seed directory if it doesn't exist
    if (!fs.existsSync(seedDir)) {
      fs.mkdirSync(seedDir, { recursive: true });
    }

    // Generate courses SQL
    console.log('Generating courses SQL...');
    const coursesResult = await client.query(`
      SELECT * FROM payload.courses ORDER BY id;
    `);

    let coursesSql = '-- Courses seed data\n\n';
    coursesSql +=
      'INSERT INTO payload.courses (id, title, slug, description, created_at, updated_at)\nVALUES\n';

    coursesResult.rows.forEach((course, index) => {
      coursesSql += `('${course.id}', '${escapeSql(course.title)}', '${escapeSql(course.slug)}', '${escapeSql(course.description || '')}', '${course.created_at.toISOString()}', '${course.updated_at.toISOString()}')`;
      coursesSql += index < coursesResult.rows.length - 1 ? ',\n' : ';\n';
    });

    fs.writeFileSync(path.join(seedDir, '01-courses.sql'), coursesSql);
    console.log(
      `Generated 01-courses.sql with ${coursesResult.rows.length} courses`,
    );

    // Generate lessons SQL
    console.log('Generating lessons SQL...');
    const lessonsResult = await client.query(`
      SELECT * FROM payload.course_lessons ORDER BY id;
    `);

    let lessonsSql = '-- Course lessons seed data\n\n';
    lessonsSql +=
      'INSERT INTO payload.course_lessons (id, title, slug, content, lesson_number, course_id, created_at, updated_at)\nVALUES\n';

    lessonsResult.rows.forEach((lesson, index) => {
      lessonsSql += `('${lesson.id}', '${escapeSql(lesson.title)}', '${escapeSql(lesson.slug)}', '${escapeSql(lesson.content || '')}', ${lesson.lesson_number}, '${lesson.course_id}', '${lesson.created_at.toISOString()}', '${lesson.updated_at.toISOString()}')`;
      lessonsSql += index < lessonsResult.rows.length - 1 ? ',\n' : ';\n';
    });

    fs.writeFileSync(path.join(seedDir, '02-lessons.sql'), lessonsSql);
    console.log(
      `Generated 02-lessons.sql with ${lessonsResult.rows.length} lessons`,
    );

    // Generate quizzes SQL
    console.log('Generating quizzes SQL...');
    const quizzesResult = await client.query(`
      SELECT * FROM payload.course_quizzes ORDER BY id;
    `);

    let quizzesSql = '-- Course quizzes seed data\n\n';
    quizzesSql +=
      'INSERT INTO payload.course_quizzes (id, title, slug, description, passing_score, created_at, updated_at)\nVALUES\n';

    quizzesResult.rows.forEach((quiz, index) => {
      quizzesSql += `('${quiz.id}', '${escapeSql(quiz.title)}', '${escapeSql(quiz.slug)}', '${escapeSql(quiz.description || '')}', ${quiz.passing_score}, '${quiz.created_at.toISOString()}', '${quiz.updated_at.toISOString()}')`;
      quizzesSql += index < quizzesResult.rows.length - 1 ? ',\n' : ';\n';
    });

    fs.writeFileSync(path.join(seedDir, '03-quizzes.sql'), quizzesSql);
    console.log(
      `Generated 03-quizzes.sql with ${quizzesResult.rows.length} quizzes`,
    );

    // Generate questions SQL
    console.log('Generating questions SQL...');
    const questionsResult = await client.query(`
      SELECT * FROM payload.quiz_questions ORDER BY id;
    `);

    let questionsSql = '-- Quiz questions seed data\n\n';
    questionsSql +=
      'INSERT INTO payload.quiz_questions (id, question, options, quiz_id, created_at, updated_at)\nVALUES\n';

    questionsResult.rows.forEach((question, index) => {
      const optionsJson = JSON.stringify(question.options || []).replace(
        /'/g,
        "''",
      );
      questionsSql += `('${question.id}', '${escapeSql(question.question)}', '${optionsJson}'::jsonb, '${question.quiz_id}', '${question.created_at.toISOString()}', '${question.updated_at.toISOString()}')`;
      questionsSql += index < questionsResult.rows.length - 1 ? ',\n' : ';\n';
    });

    // Add relationship data
    questionsSql += '\n-- Quiz questions relationships\n';
    questionsSql +=
      'INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, created_at, updated_at)\nVALUES\n';

    const questionRelsResult = await client.query(`
      SELECT * FROM payload.quiz_questions_rels ORDER BY _parent_id;
    `);

    questionRelsResult.rows.forEach((rel, index) => {
      questionsSql += `('${rel.id}', '${rel._parent_id}', '${rel.field}', '${rel.value}', '${rel.created_at.toISOString()}', '${rel.updated_at.toISOString()}')`;
      questionsSql +=
        index < questionRelsResult.rows.length - 1 ? ',\n' : ';\n';
    });

    fs.writeFileSync(path.join(seedDir, '04-questions.sql'), questionsSql);
    console.log(
      `Generated 04-questions.sql with ${questionsResult.rows.length} questions and ${questionRelsResult.rows.length} relationships`,
    );

    console.log('SQL seed files generated successfully!');
  } catch (error) {
    console.error('Error generating SQL seed files:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Helper function to escape SQL strings
function escapeSql(str) {
  if (str === null || str === undefined) return '';
  return str.replace(/'/g, "''");
}

// Run the generator
generateSqlSeedFiles()
  .then(() => {
    console.log('SQL seed files generated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error generating SQL seed files:', error);
    process.exit(1);
  });
```

### 5. Update Reset-and-Migrate Script

Update the reset-and-migrate.ps1 script to use the new Node.js utilities:

```powershell
# Replace the psql-based verification functions with Node.js utilities

# Instead of:
function Verify-Schema {
    param (
        [string]$schema
    )

    $query = "SELECT schema_name FROM information_schema.schemata WHERE schema_name = '$schema';"
    $result = Exec-Command -command "psql -U postgres -h localhost -p 54322 -d postgres -c `"$query`" -t" -description "Verifying schema '$schema' exists" -captureOutput

    if ($result -match $schema) {
        Log-Message "✅ Schema '$schema' exists" "Green"
        return $true
    } else {
        Log-Message "❌ Schema '$schema' does not exist" "Red"
        return $false
    }
}

# Use:
function Verify-Schema {
    param (
        [string]$schema
    )

    $result = Exec-Command -command "node packages/content-migrations/src/scripts/verification/verify-schema.js $schema" -description "Verifying schema '$schema' exists" -captureOutput

    if ($LASTEXITCODE -eq 0) {
        Log-Message "✅ Schema '$schema' exists" "Green"
        return $true
    } else {
        Log-Message "❌ Schema '$schema' does not exist" "Red"
        return $false
    }
}

function Verify-Table {
    param (
        [string]$schema,
        [string]$table
    )

    $result = Exec-Command -command "node packages/content-migrations/src/scripts/verification/verify-table.js $schema $table" -description "Verifying table '$schema.$table' exists" -captureOutput

    if ($LASTEXITCODE -eq 0) {
        Log-Message "✅ Table '$schema.$table' exists" "Green"
        return $true
    } else {
        Log-Message "❌ Table '$schema.$table' does not exist" "Red"
        return $false
    }
}

# Update the SQL seed files section
#
# STEP 4: Run SQL seed files
#
Log-Message "STEP 4: Running SQL seed files..." "Cyan"
try {
    # Verify database schema before running SQL seed files
    Log-Message "  Verifying database schema..." "Yellow"
    if (-not (Verify-Schema -schema "payload")) {
        throw "Payload schema not found. Cannot run SQL seed files."
    }

    # Run SQL seed files in order
    $seedFiles = @(
        "apps/payload/src/migrations/seed/01-courses.sql",
        "apps/payload/src/migrations/seed/02-lessons.sql",
        "apps/payload/src/migrations/seed/03-quizzes.sql",
        "apps/payload/src/migrations/seed/04-questions.sql"
    )

    foreach ($file in $seedFiles) {
        if (Test-Path $file) {
            Log-Message "  Seeding from $file..." "Yellow"
            Exec-Command -command "node packages/content-migrations/src/utils/execute-sql-file.js $file" -description "Running SQL seed file $file"
        } else {
            Log-Message "  Skipping $file (not found)" "Yellow"
        }
    }
}
catch {
    Log-Message "ERROR: Failed to run SQL seed files: $_" "Red"
    $overallSuccess = $false
    throw "SQL seed files execution failed"
}
```

### 6. Update Package.json Scripts

Add new scripts to package.json:

```json
// packages/content-migrations/package.json
{
  "scripts": {
    // Existing scripts...

    // New verification scripts
    "verify:schema": "node src/scripts/verification/verify-schema.js",
    "verify:table": "node src/scripts/verification/verify-table.js",

    // New SQL seed scripts
    "generate:sql-seeds": "node src/scripts/generate-sql-seed-files.js",
    "run:sql-file": "node src/utils/execute-sql-file.js"
  }
}
```

## Implementation Steps

1. **Create Node.js Utilities**:

   - Create the schema verification utility
   - Create the table verification utility
   - Create the SQL file execution utility

2. **Enhance Schema Creation Migration**:

   - Update the schema creation migration to be more robust
   - Add search path setting
   - Improve error handling

3. **Create SQL Seed Infrastructure**:

   - Create the SQL seed directory structure
   - Create the SQL seed generator script
   - Add new scripts to package.json

4. **Update Reset Script**:

   - Replace psql verification with Node.js utilities
   - Update SQL seed execution section

5. **Generate Initial SQL Seed Files**:

   - Run the SQL seed generator to create initial seed files
   - Review and adjust the generated SQL as needed

6. **Test the Migration Process**:
   - Run the reset-and-migrate.ps1 script
   - Verify all steps complete successfully
   - Check database state with verification scripts

## Benefits of This Approach

1. **Reliability**: Eliminates dependency on psql being installed
2. **Consistency**: Uses Node.js for all database operations
3. **Maintainability**: Separates schema migrations from content seeding
4. **Traceability**: Provides clear SQL files for content seeding
5. **Portability**: Works across different environments
6. **Reproducibility**: Makes it easier to recreate the database state

## Potential Challenges and Mitigations

1. **Challenge**: Complex content processing (Markdown to Lexical)
   **Mitigation**: Use hybrid approach with pre-processing scripts

2. **Challenge**: Maintaining relationships between entities
   **Mitigation**: Use fixed UUIDs and proper ordering of SQL files

3. **Challenge**: SQL syntax differences between databases
   **Mitigation**: Stick to standard SQL features or use Postgres-specific features with clear documentation

4. **Challenge**: Large content files becoming unwieldy
   **Mitigation**: Split SQL files by entity type and use includes/imports

## Next Steps After Implementation

1. **Documentation**: Update documentation to reflect the new migration process
2. **Training**: Train team members on the new process
3. **Monitoring**: Monitor the migration process for any issues
4. **Refinement**: Refine the process based on feedback and experience
