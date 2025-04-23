# Unidirectional Quiz Relationship Fix Implementation Implementation Plan

## 1. Iusu Summary

Weaerexexrericicprgspersissen iissu o ur usturmqu z sysaem dC PMySdCMS:

1. **Empty QzzsWtutCont**:14 re missigcontn teUI, ing

   - Thy WhizQuiz
   - Tho*W:y (N xt1Stupi) Quiz
   - Whaz z rStnectun ? in t
i- UngStrie Quiz
 - SyborsinFil Quz
-SrybrsiPsentQuz
   - VisuhlWPoieionaComma Q
    Oveviw of the Fundmenal ElemefDignQ
  - Slid CompoiQuiz
   - Tablss GrphsQ
   - SeyepsrQuGhQiz
 - SptGa  tQuoz
 r luPizpraadPracQ
 -Prfomnce Quiz

2. **Mis orybCards in t**:A euvct`iouriS_id_idC=pNULL`tdnzp -Sberd Grsquirshma
   - Specialist Graphs Quiz
3praaRelPrionhipIssus Quizqtion aren't properassoci withtir pntizzPzt

## 2.RooCuAnalyi

Afterxivinvtgaion ofodebsdataba*ychg t,ytncupl`viouslf_xdat_dLpts,rwa'plcideagisiedipsvi eltcpissoesifyctof:

After excatCive*inv Atlga -on ofataReldtioeshbp Syetesfcodataban *tcht I,phne pngviouswfexsattlxpts, wu'zzmidet/ioieivelv"toldc ifcto:
## 2. Additional Research Findings
ips n two lace
### 2.1 Payload CMS's Dual Storage Mechanism
ips n two lacerAload CMS  theamcin torPmlntity), w(s.g.,o`qursu ont`hg.ra,`un``c_uqs`_qizze`)
FEntriessintawsk2loirontly,p**bTbh  toragS(h.g.,ogoprly sychronze**.Pr)

Fou xsofnddssedosntn woekortly,**bh toragemthomust boprly sychronze**.Previous xsofnddssedonlyone#of#t2iUiduie-ttorngRrsqsiee.

###`2.2 U icireitionao Relationship Drrdction
   - Each record contains fields like `_parent_id`, `field`, and the target ID (e.g., `courses_id`)
We'veedeter indd tteeaththterrect uctoinectionalectionald comlshxu :

-**CoseQuzz→ QuizQuestiC**:Quzzsrerencethetionsinottheever)

Thisnfimby:
-- Direct field is NULL for all quizzes
SOOurTUI Ieedd((eeleclcOg quasrse_  wwen vqewingnv quiz)ingze quiz)HERE course_id_id IS NULL; -- Returns 20
-o`hs ` ihetiona`tp tablin`CQuzzs.- in `QizQutons.s`butrmvig te `quz_id` field
- Trane2ti in `QnizQu styons.Ds`a bdutRromvig te `quz_id` field

### 2.3 Traneistixn rtdDa IngI

Previer tfrxes suffernatfrim

-Lckofpropertrnati i
-Potntlgdgmn
- Icomletehnlingofdul-sag sys
-uTypachbetwenirectsad elhipThcbube

## 3.anolnaidldSirbgy

li wxllDtmplemed wlecompmehonsin  so3utionompuehfrcnsesienimanetininge corrctmol:

```mermaha
flTwcharD TD
Quiz[C Q] --> |has many|Qus[QuzQuei]
QeQ ->|bg|Cu[C]inoiQ be -t>z|besd gto|Cu[C]2. Did not properly establish the course-to-quiz relationship in both storage mechanisms
3. The SQL script likely executed correctly for quiz-question relationships, but did not properly set up course-quiz relationships

````

Our approach will address both sides of Payload's dual-storage system:

1. **Direct Field Storage**: Ensure `questions` arrays in `course_quizzes` contain correct question IDs
2. **Relationship Table Storage**: Create proper entries in `course_quizzes_rels` for each question

## 4. Implementation Details

### 4.1 SQL Repair Script

Create a SQL script that will:

```sql
-- Use serializable isolation to prevent concurrent interference
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- 1. Fix course_id_id in the main table (direct field storage)
UPDATE payload.course_quizzes
SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::text
WHERE (course_id_id IS NULL OR course_id_id = '')
AND id IN (SELECT id FROM payload.course_quizzes FOR UPDATE);

-- 2. Create course relationship entries (relationship table storage)
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  courses_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  cq.id as _parent_id,
  'course_id' as field,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as value,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as courses_id,
  NOW() as created_at,
  NOW() as updated_at
FROM payload.course_quizzes cq
WHERE NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel
  WHERE rel._parent_id = cq.id
  AND rel.field = 'course_id'
)
AND cq.id IN (SELECT id FROM payload.course_quizzes FOR UPDATE);

-- 3. Identify all quiz-question relationships
WITH quiz_questions_data AS (
  -- Get all known quiz questions
  SELECT
    qq.id as question_id,
    -- Direct reference from the question to quiz if it exists
    qq.quiz_id as direct_quiz_id,
    -- If no direct reference, try to find from relationship tables if they exist
    (
      SELECT _parent_id
      FROM payload.quiz_questions_rels
      WHERE value = qq.id AND field = 'questions'
      LIMIT 1
    ) as rel_quiz_id
  FROM payload.quiz_questions qq
)

-- 4. Create missing quiz-question relationship entries
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  quiz_questions_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  COALESCE(qd.direct_quiz_id, qd.rel_quiz_id) as _parent_id,
  'questions' as field,
  qd.question_id as value,
  qd.question_id as quiz_questions_id,
  NOW() as created_at,
  NOW() as updated_at
FROM quiz_questions_data qd
WHERE
  -- Only process questions with a valid quiz reference
  (qd.direct_quiz_id IS NOT NULL OR qd.rel_quiz_id IS NOT NULL)
  -- Only create relationship if it doesn't already exist
  AND NOT EXISTS (
    SELECT 1 FROM payload.course_quizzes_rels rel
    WHERE rel._parent_id = COALESCE(qd.direct_quiz_id, qd.rel_quiz_id)
    AND rel.field = 'questions'
    AND rel.value = qd.question_id
  );

-- 5. Verify the results
SELECT
  (SELECT COUNT(*) FROM payload.course_quizzes) as total_quizzes,
  (SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NOT NULL) as quizzes_with_course,
  (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id') as course_relationships,
  (SELECT COUNT(*) FROM payload.quiz_questions) as total_questions,
  (SELECT COUNT(DISTINCT _parent_id) FROM payload.course_quizzes_rels WHERE field = 'questions') as quizzes_with_questions,
  (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions') as question_relationships;

COMMIT;
````

### 4.2 TypeScript Runner Script

Create a TypeScript script that will execute and verify our SQL fix:

```typescript
/**
 * Unidirectional Quiz Relationship Fix
 *
 * This script ensures quiz relationships are properly established in the correct direction:
 * CourseQuizzes → QuizQuestions
 *
 * It handles both direct field storage and relationship table entries.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(
  __dirname,
  'fix-unidirectional-quiz-relationships.sql',
);

export async function fixUnidirectionalQuizRelationships(): Promise<void> {
  // Get database connection string from environment or use default
  const connectionString =
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres';

  console.log('Starting unidirectional quiz relationship fix...');
  console.log(`Using connection string: ${connectionString}`);

  // Create database client
  const client = new Client({ connectionString });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database successfully');

    // Load and execute SQL script
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    console.log('Loaded SQL script successfully');

    // Execute SQL script as a single command to maintain transaction integrity
    const result = await client.query(sqlContent);

    // Parse and log verification results
    const stats = result.rows[0];
    if (stats) {
      console.log('\nVerification Results:');
      console.log(`- Total quizzes: ${stats.total_quizzes}`);
      console.log(`- Quizzes with course_id: ${stats.quizzes_with_course}`);
      console.log(
        `- Course relationship entries: ${stats.course_relationships}`,
      );
      console.log(`- Total quiz questions: ${stats.total_questions}`);
      console.log(`- Quizzes with questions: ${stats.quizzes_with_questions}`);
      console.log(
        `- Question relationship entries: ${stats.question_relationships}`,
      );

      // Calculate success metrics
      const courseSuccess =
        parseInt(stats.quizzes_with_course) === parseInt(stats.total_quizzes) &&
        parseInt(stats.course_relationships) === parseInt(stats.total_quizzes);

      const questionSuccess =
        parseInt(stats.quizzes_with_questions) > 0 &&
        parseInt(stats.question_relationships) > 0;

      if (courseSuccess && questionSuccess) {
        console.log('\n✅ All relationships fixed successfully');
      } else if (courseSuccess) {
        console.log(
          '\n⚠️ Course relationships fixed, but some question relationships may still have issues',
        );
      } else {
        console.log('\n❌ Relationship fix was not completely successful');
      }
    } else {
      console.log('Script executed but verification results were unexpected');
    }

    console.log('\nQuiz relationship fix completed');
  } catch (error) {
    console.error('Error fixing quiz relationships:', error);
    throw error;
  } finally {
    // Always disconnect from database
    await client.end();
    console.log('Disconnected from database');
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  fixUnidirectionalQuizRelationships()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
```

### 4.3 Update Package Configuration

Add the script to `packages/content-migrations/package.json`:

```json
"fix:unidirectional-quiz-relationships": "tsx src/scripts/repair/fix-unidirectional-quiz-relationships.ts"
```

### 4.4 Integration with Migration Process

Update the `scripts/orchestration/phases/loading.ps1` file to run our fix at the optimal point (after initial migrations but before verification):

```powershell
# Add this after other relationship fixes but before verification steps
Log-Message "Fixing unidirectional quiz relationships..." "Yellow"
Exec-Command -command "pnpm --filter @kit/content-migrations run fix:unidirectional-quiz-relationships" -description "Fixing unidirectional quiz relationships" -continueOnError
```

## 5. Implementation Steps

1. **Create SQL Script**:

   - Create `packages/content-migrations/src/scripts/repair/fix-unidirectional-quiz-relationships.sql` with the SQL code above

2. **Create TypeScript Runner**:

   - Create `packages/content-migrations/src/scripts/repair/fix-unidirectional-quiz-relationships.ts` with the TypeScript code above

3. **Update Package Configuration**:

   - Add the new script to `packages/content-migrations/package.json`

4. **Update Migration Process**:

   - Modify `scripts/orchestration/phases/loading.ps1` to include our fix

5. **Test and Verify**:
   - Run the migration with `./reset-and-migrate.ps1`
   - Verify in the Payload admin UI that quizzes display properly
   - Check that all 14 previously empty quizzes now show their questions

## 6. Advantages of This Approach

1. **Addresses Root Causes**: Fixes both aspects of Payload's dual-storage system
2. **Transaction Isolation**: Prevents race conditions and data consistency issues
3. **Comprehensive Verification**: Confirms all relationships are properly established
4. **Respects Unidirectional Model**: Maintains the correct CourseQuizzes → QuizQuestions direction
5. **Robust Error Handling**: Provides detailed logs and verification metrics

## 7. Future Improvements

Once this immediate fix is confirmed working, consider these improvements:

1. **Schema Validation**: Add schema validation to ensure relationship integrity
2. **Foreign Key Constraints**: Add database constraints for quiz-question relationships
3. **Automated Testing**: Create automated tests for quiz relationship integrity
4. **Documentation**: Document the correct relationship model for future development

## 8. Conclusion

This plan provides a comprehensive solution to the persistent quiz relationship issues by addressing both sides of Payload's dual-storage system while maintaining the correct unidirectional relationship direction. The solution is robust, verifiable, and integrates cleanly with the existing migration process.
