# Quiz Relationship Migration Errors Fix Plan - 2025-04-23

## Problem Analysis

After analyzing database schemas, migration logs, and code files, I've identified a significant issue causing migration errors in the quiz-question relationship system. The core problem revolves around conflicts between:

1. **The current database schema**: Using a unidirectional relationship model (quizzes point to questions)
2. **Repair scripts**: Some scripts still assume a bidirectional relationship model

This conflict is causing SQL errors when scripts try to reference columns that no longer exist.

## Identified Errors

1. **Error**: `column qr.question_id does not exist`

   - Occurs in scripts that incorrectly reference a column in the relationships table
   - `qr` is an alias for a relationship table that doesn't have this column name

2. **Error**: `Script failed: error: column qr.question_id does not exist`

   - Occurs in `fix-question-quiz-relationships-comprehensive.ts`
   - Trying to use a bidirectional relationship structure when the schema now uses unidirectional

3. **Error**: `ALTER action ADD COLUMN cannot be performed on relation "downloads_diagnostic"`
   - This error is likely related to permission issues or the table being locked

## Database Schema Reality

Based on queries to the PostgreSQL database, I've confirmed the actual schema:

### Quiz Questions (`payload.quiz_questions`)

```sql
id: uuid
question: text
options: jsonb
correct_answer: text
type: text
explanation: text
order: integer
_order: integer
media_id: uuid
created_at: timestamp with time zone
updated_at: timestamp with time zone
path: text
parent_id: text
downloads_id: uuid
private_id: uuid
```

**Key Finding**: No `quiz_id` or `quiz_id_id` column exists here.

### Quiz Questions Relationships (`payload.quiz_questions_rels`)

```sql
id: uuid
_parent_id: uuid
field: character varying
value: uuid
order: integer
_order: integer
path: character varying
created_at: timestamp with time zone
updated_at: timestamp with time zone
parent_id: uuid
...
quiz_id_id: uuid
```

**Key Finding**: Has a `quiz_id_id` column but no `question_id` column.

### Course Quizzes Relationships (`payload.course_quizzes_rels`)

```sql
id: uuid
_parent_id: uuid
field: character varying
value: uuid
...
quiz_questions_id: uuid
...
quiz_id_id: uuid
```

**Key Finding**: This is where quiz-to-question relationships are stored.

## Root Causes

1. **Migration Conflict**: The `remove-quiz-id-from-questions.ts` migration intentionally removed bidirectional references:

   ```typescript
   // Migration code snippet
   await db.execute(sql`
     ALTER TABLE payload.quiz_questions 
     DROP COLUMN IF EXISTS quiz_id,
     DROP COLUMN IF EXISTS quiz_id_id;
   `);
   ```

2. **Script Conflict**: However, scripts like `fix-question-quiz-relationships-comprehensive.ts` still try to use or create these removed columns:

   ```typescript
   // Still trying to add a quiz_id column that the migration removed
   await client.query(`
     ALTER TABLE payload.quiz_questions 
     ADD COLUMN quiz_id UUID;
   `);
   ```

3. **Incorrect SQL Queries**: Scripts are using incorrect column references:

   ```typescript
   // This query is problematic because qr.question_id doesn't exist
   const questionsResult = await client.query(`
     SELECT id, quiz_id 
     FROM payload.quiz_questions 
     WHERE quiz_id IS NOT NULL;
   `);
   ```

## Comprehensive Fix Plan

### 1. Fix Quiz/Question Relationship Repair Scripts

#### a. Update `fix-question-quiz-relationships-comprehensive.ts`

```typescript
// BEFORE
const questionsResult = await client.query(`
  SELECT id, quiz_id
  FROM payload.quiz_questions
  WHERE quiz_id IS NOT NULL;
`);

// AFTER - Use the correct unidirectional relationship structure
const questionsResult = await client.query(`
  SELECT
    qq.id AS question_id,
    cqr._parent_id AS quiz_id
  FROM
    payload.quiz_questions qq
  JOIN
    payload.course_quizzes_rels cqr ON cqr.value = qq.id
  WHERE
    cqr.field = 'questions';
`);
```

#### b. Remove or update attempts to add a quiz_id column

```typescript
// BEFORE - Tries to add a removed column
const quizIdColumnResult = await client.query(`
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'payload' 
    AND table_name = 'quiz_questions' 
    AND column_name = 'quiz_id'
  );
`);

if (!quizIdColumnResult.rows[0].exists) {
  await client.query(`
    ALTER TABLE payload.quiz_questions 
    ADD COLUMN quiz_id UUID;
  `);
}

// AFTER - Check for the correct relationship structure
const relationshipTableResult = await client.query(`
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'payload' 
    AND table_name = 'course_quizzes_rels'
  );
`);

// Ensure relationship table exists, but don't try to modify quiz_questions
if (!relationshipTableResult.rows[0].exists) {
  console.error('course_quizzes_rels table is missing - critical error');
  throw new Error('Missing required relationship table');
}
```

#### c. Update relationship verification queries

```typescript
// BEFORE - Uses non-existent columns
const verificationResult = await client.query(`
  SELECT
    COUNT(qq.id) as total_questions_with_quiz_id,
    COUNT(qr.id) as total_relationships
  FROM
    payload.quiz_questions qq
  LEFT JOIN
    payload.quiz_questions_rels qr ON qq.id = qr.question_id
  WHERE
    qq.quiz_id IS NOT NULL;
`);

// AFTER - Uses correct unidirectional structure
const verificationResult = await client.query(`
  SELECT
    COUNT(DISTINCT qq.id) as total_questions,
    COUNT(DISTINCT cqr.value) as total_questions_in_relationships
  FROM
    payload.quiz_questions qq
  LEFT JOIN
    payload.course_quizzes_rels cqr ON qq.id = cqr.value AND cqr.field = 'questions'
`);
```

### 2. Fix Downloads Diagnostic Table Issue

Approach this error with better error handling:

```typescript
async function ensureColumnExists(tableName, columnName, columnType) {
  // First check if the table exists
  const tableExists = await client.query(
    `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name = $1
    ) AS exists;
  `,
    [tableName],
  );

  if (!tableExists.rows[0].exists) {
    console.log(`Table ${tableName} doesn't exist. Creating it...`);

    // Safe implementation will depend on what this table should contain
    // This is just a placeholder
    await client.query(`
      CREATE TABLE IF NOT EXISTS payload.${tableName} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        path TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    return true;
  }

  // Then check if the column exists
  const columnExists = await client.query(
    `
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = $1
      AND column_name = $2
    ) AS exists;
  `,
    [tableName, columnName],
  );

  if (!columnExists.rows[0].exists) {
    try {
      console.log(`Adding ${columnName} column to ${tableName}`);
      await client.query(`
        ALTER TABLE payload.${tableName} 
        ADD COLUMN IF NOT EXISTS ${columnName} ${columnType};
      `);
      return true;
    } catch (error) {
      console.error(`Error adding column: ${error.message}`);
      console.log('Continuing without adding column...');
      return false;
    }
  }

  return false; // Column already exists
}
```

### 3. Enhance Error Logging in reset-and-migrate.ps1

Update the PowerShell script to capture and display more detailed error information:

```powershell
function Execute-CommandWithDetailedLogging {
    param (
        [string]$Command,
        [string]$Description
    )

    Log-Message "EXECUTING: $Command" "Gray"
    Log-Message "DESCRIPTION: $Description" "Gray"

    try {
        # Capture all output including errors
        $output = Invoke-Expression "$Command 2>&1"

        # Log all output
        Log-Message "--- Command Output Start ---" "Gray"
        foreach ($line in $output) {
            # Convert to string in case it's not
            $lineStr = if ($line -is [string]) { $line } else { $line.ToString() }

            # Highlight SQL errors
            if ($lineStr -match "column .* does not exist") {
                Log-Message "SQL COLUMN ERROR: $lineStr" "Red"
            } else {
                Log-Message $lineStr "White"
            }
        }
        Log-Message "--- Command Output End ---" "Gray"

        return $true
    }
    catch {
        Log-DetailedError "Command failed: $Command" $_
        return $false
    }
}

function Log-DetailedError {
    param (
        [string]$Message,
        [System.Management.Automation.ErrorRecord]$ErrorRecord
    )

    Log-Error $Message

    if ($ErrorRecord) {
        $errorDetails = @"
ERROR DETAILS:
- Exception: $($ErrorRecord.Exception.GetType().FullName)
- Message: $($ErrorRecord.Exception.Message)
- SQL Error: $($ErrorRecord.Exception.InnerException.Message)
- Position: $($ErrorRecord.InvocationInfo.PositionMessage)
- Script: $($ErrorRecord.InvocationInfo.ScriptName):$($ErrorRecord.InvocationInfo.ScriptLineNumber)
"@
        Log-Message $errorDetails "Red"
    }
}
```

## Implementation Strategy

1. **Phase 1: Document and Understand**

   - Document current relationship model (unidirectional)
   - Map all scripts that are handling quiz/question relationships
   - Identify which specific files are causing errors

2. **Phase 2: Implement Core Fixes**

   - Fix `fix-question-quiz-relationships-comprehensive.ts` first
   - Create resilient column-adding logic for the downloads_diagnostic table
   - Update any other scripts that might be trying to use non-existent columns

3. **Phase 3: Enhance Error Logging**

   - Update the PowerShell script to better capture and display SQL errors
   - Add specific error detection for column-related errors

4. **Phase 4: Test & Verify**
   - Run specific scripts in isolation first
   - Run the full migration process
   - Verify relationships are properly maintained

## Additional Recommendations

1. **Consider Script Purging**:

   - If a script like `fix-question-quiz-relationships-comprehensive.ts` is fundamentally at odds with your relationship model, it might be better to remove it entirely rather than try to fix it.

2. **Add Schema Documentation**:

   - Document the relationship model clearly to prevent future conflicts
   - Consider adding comments to migration files explaining the relationship structure

3. **Consider a Schema Verification Step**:

   - Add a verification script that checks for structural consistency
   - Alert about potential issues before they cause errors in the migration process

4. **Future-proof Your Migrations**:
   - Add more defensive programming - check if columns exist before trying to use them
   - Add explicit transaction management to all database operations
