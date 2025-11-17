# Quiz Relationship 404 Error Fix Implementation Plan

## Problem Statement

We're experiencing 404 Not Found errors when accessing quiz data for certain lessons through the Payload CMS API. The affected lessons are:

- The Who
- The Why Next Steps
- What is structure
- Using Stories
- Storyboards in Film
- Storyboards in Presentations
- Visual Perception and Communication
- Overview of the Fundamental Elements of design
- Slide Composition
- Tables vs. Graphs
- Specialist Graphs
- Preparation and Practice

The errors in NextJS logs show:

```
Error: Failed to call Payload API (course_quizzes/d5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0?depth=1): 404 Not Found
```

## Root Cause Analysis

Through investigation of the database, migration scripts, and application code, we've identified that the root cause is a **mismatch between data storage formats and API access patterns**. The core issue relates to how Payload CMS handles relationships between quizzes and quiz questions:

1. **Dual storage of relationships:**
   - Direct SQL relationships in `course_quizzes_rels` table
   - JSONB array in the `questions` field of `course_quizzes` table

2. **Format inconsistency:**
   - The Payload API expects a specific JSONB format for relationship fields:

     ```json
     {
       "questions": [
         {
           "id": "unique-entry-id",
           "relationTo": "quiz_questions",
           "value": {
             "id": "related-document-id"
           }
         }
       ]
     }
     ```

   - Some quiz records have incorrectly formatted arrays

3. **Relationship model transition:**
   - Migration `20250425_150000_remove_quiz_id_from_questions` changed from bidirectional to unidirectional relationships
   - Subsequent migrations attempted to fix the JSONB format with varying success

4. **Hook failures:**
   - The `formatQuizQuestionsOnRead` hook attempts to fix malformed data at runtime
   - This hook is failing to handle specific edge cases

## Implementation Plan

### Phase 1: Create Diagnostic Tools

1. **Create Quiz Relationship Diagnostic Script**

   ```typescript
   // File: packages/content-migrations/src/scripts/diagnostic/quiz-relationship-integrity.ts
   
   /**
    * Quiz Relationship Integrity Diagnostic
    * 
    * This script diagnoses issues between quizzes and their questions,
    * checking both SQL relationships and JSONB array structure.
    */
   import { connect } from '../utils/db'
   
   async function run() {
     const client = await connect()
     
     try {
       console.log('Running Quiz Relationship Integrity Diagnostic')
       
       // Get all quizzes
       const { rows: quizzes } = await client.query(`
         SELECT 
           id, 
           title, 
           questions
         FROM 
           payload.course_quizzes
         ORDER BY 
           title
       `)
       
       console.log(`Found ${quizzes.length} quizzes to examine`)
       
       let issuesFound = 0
       
       for (const quiz of quizzes) {
         // Get relationship records
         const { rows: rels } = await client.query(`
           SELECT 
             quiz_questions_id
           FROM 
             payload.course_quizzes_rels
           WHERE 
             _parent_id = $1 
             AND field = 'questions'
         `, [quiz.id])
         
         // Parse and validate JSONB questions array
         let jsonbQuestions = []
         let properFormat = false
         
         try {
           if (quiz.questions) {
             jsonbQuestions = Array.isArray(quiz.questions) ? 
               quiz.questions : 
               JSON.parse(quiz.questions)
               
             // Check format of first item
             if (jsonbQuestions.length > 0) {
               const firstItem = jsonbQuestions[0]
               properFormat = firstItem && 
                              firstItem.relationTo === 'quiz_questions' && 
                              firstItem.value && 
                              firstItem.value.id
             }
           }
         } catch (e) {
           console.error(`Error parsing questions for quiz ${quiz.title}:`, e)
         }
         
         // Compare relationship records vs JSONB array
         console.log(`\nQuiz: ${quiz.title} (${quiz.id})`)
         console.log(`  - Relationship records: ${rels.length}`)
         console.log(`  - JSONB questions array: ${jsonbQuestions.length || 0} items`)
         console.log(`  - JSONB format correct: ${properFormat ? 'Yes' : 'No'}`)
         
         if (jsonbQuestions.length > 0) {
           console.log(`  - Sample format: ${JSON.stringify(jsonbQuestions[0]).substring(0, 100)}...`)
         }
         
         // Detailed comparison
         if (rels.length > 0 && jsonbQuestions.length > 0) {
           // Question IDs from relationship records
           const relIds = rels.map(r => r.quiz_questions_id).sort()
           
           // Question IDs from JSONB array
           const jsonbIds = jsonbQuestions
             .map(j => {
               if (typeof j === 'string') return j
               if (j.value && typeof j.value === 'object') return j.value.id
               if (j.value) return j.value
               return j.id || j
             })
             .filter(Boolean)
             .sort()
           
           // Check for consistency
           const relIdsSet = new Set(relIds)
           const jsonbIdsSet = new Set(jsonbIds)
           
           const onlyInRels = relIds.filter(id => !jsonbIdsSet.has(id))
           const onlyInJsonb = jsonbIds.filter(id => !relIdsSet.has(id))
           
           if (onlyInRels.length === 0 && onlyInJsonb.length === 0) {
             console.log('  ✅ Relationship records and JSONB array match perfectly')
           } else {
             console.log('  ❌ Inconsistencies detected:')
             if (onlyInRels.length > 0) {
               console.log(`    - ${onlyInRels.length} questions in relationships but missing from JSONB array`)
             }
             if (onlyInJsonb.length > 0) {
               console.log(`    - ${onlyInJsonb.length} questions in JSONB array but missing from relationships`)
             }
             
             issuesFound++
           }
         } else if (rels.length !== jsonbQuestions.length) {
           console.log('  ❌ Count mismatch between relationships and JSONB array')
           issuesFound++
         }
         
         // Check for specific problematic quizzes
         if (quiz.title.includes('Who') || quiz.title.includes('Structure') || 
             quiz.title.includes('Stories') || quiz.title.includes('Film') ||
             quiz.title.includes('Visual Perception')) {
           console.log(`  ⚠️ This quiz corresponds to a lesson with reported errors`)
         }
       }
       
       console.log(`\nDiagnostic Summary:`)
       console.log(`- Examined ${quizzes.length} quizzes`)
       console.log(`- Found ${issuesFound} quizzes with relationship inconsistencies`)
       
       // Return true if no issues found, false otherwise
       return issuesFound === 0
     } catch (error) {
       console.error('Error running diagnostic:', error)
       return false
     } finally {
       await client.end()
     }
   }
   
   // Execute and return result code for script integration
   run()
     .then(success => process.exit(success ? 0 : 1))
     .catch(err => {
       console.error('Unhandled error:', err)
       process.exit(1)
     })
   ```

2. **Add script to package.json**

   ```json
   // File: packages/content-migrations/package.json (scripts section)
   {
     "scripts": {
       // ... existing scripts
       "diagnostic:quiz-relationships": "tsx src/scripts/diagnostic/quiz-relationship-integrity.ts",
       "verify:quiz-integrity": "tsx src/scripts/verification/verify-quiz-relationship-integrity.ts"
     }
   }
   ```

### Phase 2: Create Relationship Repair Script

1. **Create Quiz Relationship Repair Script**

   ```typescript
   // File: packages/content-migrations/src/scripts/verification/verify-quiz-relationship-integrity.ts
   
   /**
    * Quiz Relationship Integrity Verification and Repair
    * 
    * This script verifies and repairs inconsistencies between quiz relationship 
    * records and JSONB arrays, ensuring they match exactly.
    */
   import { connect } from '../utils/db'
   
   async function run() {
     const client = await connect()
     
     try {
       console.log('Running Quiz Relationship Integrity Verification and Repair')
       
       // Create a diagnostic view for monitoring
       await client.query(`
         CREATE OR REPLACE VIEW payload.quiz_relationship_diagnostic AS
         SELECT 
           q.id as quiz_id,
           q.title as quiz_title,
           jsonb_array_length(COALESCE(q.questions, '[]'::jsonb)) as questions_jsonb_count,
           COUNT(qr.id) FILTER (WHERE qr.field = 'questions') as questions_rel_count,
           CASE 
             WHEN jsonb_array_length(COALESCE(q.questions, '[]'::jsonb)) = COUNT(qr.id) FILTER (WHERE qr.field = 'questions')
             THEN true
             ELSE false
           END as counts_match
         FROM 
           payload.course_quizzes q
         LEFT JOIN 
           payload.course_quizzes_rels qr ON q.id = qr._parent_id
         GROUP BY 
           q.id, q.title, q.questions;
       `)
       
       // Identify problematic quizzes
       const { rows: problematicQuizzes } = await client.query(`
         SELECT 
           quiz_id, 
           quiz_title,
           questions_jsonb_count,
           questions_rel_count
         FROM 
           payload.quiz_relationship_diagnostic
         WHERE 
           counts_match = false
         ORDER BY 
           quiz_title
       `)
       
       console.log(`Found ${problematicQuizzes.length} quizzes with mismatched relationship counts`)
       
       let repairCount = 0
       
       // Begin transaction for the repair process
       await client.query('BEGIN')
       
       // Process each problematic quiz
       for (const quiz of problematicQuizzes) {
         console.log(`Fixing relationships for quiz: ${quiz.quiz_title} (${quiz.quiz_id})`)
         
         // Get all question IDs from relationship records
         const { rows: questionRels } = await client.query(`
           SELECT quiz_questions_id
           FROM payload.course_quizzes_rels
           WHERE _parent_id = $1
           AND field = 'questions'
           AND quiz_questions_id IS NOT NULL
         `, [quiz.quiz_id])
         
         // Get all question IDs from JSONB array
         const { rows: questionJsonb } = await client.query(`
           SELECT jsonb_array_elements(questions)->>'value' as question_id
           FROM payload.course_quizzes
           WHERE id = $1
           AND jsonb_typeof(questions) = 'array'
         `, [quiz.quiz_id])
         
         // Extract and normalize IDs from both sources
         const relIds = questionRels.map(r => r.quiz_questions_id)
         
         const jsonbIds = questionJsonb
           .map(j => {
             try {
               // Handle various formats that might be in the database
               if (!j.question_id) return null
               if (typeof j.question_id === 'object') {
                 return j.question_id?.id || null
               }
               return j.question_id
             } catch (e) {
               console.error(`Error extracting ID from JSONB:`, e)
               return null
             }
           })
           .filter(Boolean)
         
         // Use the union of all IDs to ensure we don't lose any data
         const allQuestionIds = [...new Set([...relIds, ...jsonbIds])]
         
         if (allQuestionIds.length > 0) {
           // Update the JSONB array with properly formatted entries
           await client.query(`
             UPDATE payload.course_quizzes
             SET questions = (
               SELECT jsonb_agg(
                 jsonb_build_object(
                   'id', q_id,
                   'relationTo', 'quiz_questions',
                   'value', jsonb_build_object('id', q_id)
                 )
               )
               FROM unnest($2::text[]) as q_id
             )
             WHERE id = $1
           `, [quiz.quiz_id, allQuestionIds])
           
           // Delete existing relationship records for this quiz
           await client.query(`
             DELETE FROM payload.course_quizzes_rels
             WHERE _parent_id = $1
             AND field = 'questions'
           `, [quiz.quiz_id])
           
           // Insert new relationship records
           for (const questionId of allQuestionIds) {
             await client.query(`
               INSERT INTO payload.course_quizzes_rels 
               (id, _parent_id, field, value, quiz_questions_id, created_at, updated_at)
               VALUES (
                 gen_random_uuid(), 
                 $1, 
                 'questions', 
                 $2, 
                 $2,
                 NOW(),
                 NOW()
               )
             `, [quiz.quiz_id, questionId])
           }
           
           console.log(`Fixed quiz ${quiz.quiz_title}: reconciled ${allQuestionIds.length} questions`)
           repairCount++
         } else {
           console.log(`Quiz ${quiz.quiz_title} has no questions to reconcile`)
         }
       }
       
       // Special handling for known problematic quizzes mentioned in error logs
       const errorQuizIds = [
         'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0', // The Who Quiz
         'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f', // What is Structure? Quiz
         'a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d5'  // Using Stories Quiz
       ]
       
       for (const quizId of errorQuizIds) {
         console.log(`Applying special fix for quiz with ID ${quizId}`)
         
         // Update the quiz with properly formatted questions from relationships
         await client.query(`
           UPDATE payload.course_quizzes
           SET questions = (
             SELECT jsonb_agg(
               jsonb_build_object(
                 'id', quiz_questions_id::text,
                 'relationTo', 'quiz_questions'::text,
                 'value', jsonb_build_object('id', quiz_questions_id::text)
               )
             )
             FROM payload.course_quizzes_rels
             WHERE _parent_id = $1
             AND field = 'questions'
             AND quiz_questions_id IS NOT NULL
           )
           WHERE id = $1
           AND EXISTS (
             SELECT 1 FROM payload.course_quizzes_rels
             WHERE _parent_id = $1
             AND field = 'questions'
             AND quiz_questions_id IS NOT NULL
           )
         `, [quizId])
       }
       
       // Verify the fix
       const { rows: afterFixDiagnostic } = await client.query(`
         SELECT 
           COUNT(*) as total_quizzes,
           COUNT(*) FILTER (WHERE counts_match = true) as synced_quizzes,
           COUNT(*) FILTER (WHERE counts_match = false) as remaining_problems
         FROM 
           payload.quiz_relationship_diagnostic
       `)
       
       console.log(`\nRepair Summary:`)
       console.log(`- Fixed ${repairCount} quizzes with relationship inconsistencies`)
       console.log(`- After fix: ${afterFixDiagnostic[0].synced_quizzes} of ${afterFixDiagnostic[0].total_quizzes} quizzes have synchronized relationships`)
       
       if (parseInt(afterFixDiagnostic[0].remaining_problems) > 0) {
         console.warn(`Warning: ${afterFixDiagnostic[0].remaining_problems} quizzes still have inconsistent relationships`)
         
         // List the remaining problematic quizzes
         const { rows: remainingProblems } = await client.query(`
           SELECT quiz_id, quiz_title, questions_jsonb_count, questions_rel_count
           FROM payload.quiz_relationship_diagnostic
           WHERE counts_match = false
           ORDER BY quiz_title
         `)
         
         console.log("Remaining problematic quizzes:")
         for (const quiz of remainingProblems) {
           console.log(`- ${quiz.quiz_title}: JSONB=${quiz.questions_jsonb_count}, Rels=${quiz.questions_rel_count}`)
         }
         
         // Commit the transaction - we still made improvements
         await client.query('COMMIT')
         return false
       } 
       
       // Commit the transaction
       await client.query('COMMIT')
       console.log('Quiz relationship consistency fix completed successfully')
       return true
     } catch (error) {
       // Rollback on error
       await client.query('ROLLBACK')
       console.error('Error in quiz relationship consistency fix:', error)
       return false
     } finally {
       await client.end()
     }
   }
   
   // Execute and return result code for script integration
   run()
     .then(success => process.exit(success ? 0 : 1))
     .catch(err => {
       console.error('Unhandled error:', err)
       process.exit(1)
     })
   ```

### Phase 3: Create Migration for Permanent Fix

1. **Create New Payload Migration**

   ```typescript
   // File: apps/payload/src/migrations/20250430_000000_fix_quiz_relationship_formats.ts
   
   import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
   
   /**
    * Fix Quiz Relationship Formats Migration
    * 
    * This migration addresses the issue with quiz relationship formats that
    * cause 404 errors when accessing certain quizzes through the API.
    * It ensures both the JSONB array and relationship records are consistent.
    */
   export async function up({ db }: MigrateUpArgs): Promise<void> {
     console.log('Starting Fix Quiz Relationship Formats Migration')
     
     try {
       // Start transaction
       await db.execute(sql`BEGIN;`)
       
       // Step 1: Create a diagnostic view
       await db.execute(sql`
         CREATE OR REPLACE VIEW payload.quiz_relationship_diagnostic AS
         SELECT 
           q.id as quiz_id,
           q.title as quiz_title,
           jsonb_array_length(COALESCE(q.questions, '[]'::jsonb)) as questions_jsonb_count,
           COUNT(qr.id) FILTER (WHERE qr.field = 'questions') as questions_rel_count,
           CASE 
             WHEN jsonb_array_length(COALESCE(q.questions, '[]'::jsonb)) = COUNT(qr.id) FILTER (WHERE qr.field = 'questions')
             THEN true
             ELSE false
           END as counts_match
         FROM 
           payload.course_quizzes q
         LEFT JOIN 
           payload.course_quizzes_rels qr ON q.id = qr._parent_id
         GROUP BY 
           q.id, q.title, q.questions;
       `)
       
       // Step 2: Fix all quizzes to ensure JSONB format correctness
       await db.execute(sql`
         UPDATE payload.course_quizzes
         SET questions = (
           SELECT jsonb_agg(
             jsonb_build_object(
               'id', quiz_questions_id::text,
               'relationTo', 'quiz_questions'::text,
               'value', jsonb_build_object('id', quiz_questions_id::text)
             )
           )
           FROM payload.course_quizzes_rels
           WHERE _parent_id = payload.course_quizzes.id
           AND field = 'questions'
           AND quiz_questions_id IS NOT NULL
         )
         WHERE EXISTS (
           SELECT 1 FROM payload.course_quizzes_rels
           WHERE _parent_id = payload.course_quizzes.id
           AND field = 'questions'
           AND quiz_questions_id IS NOT NULL
         )
       `)
       
       // Step 3: Special handling for empty questions arrays
       await db.execute(sql`
         UPDATE payload.course_quizzes
         SET questions = '[]'::jsonb
         WHERE questions IS NULL
         OR jsonb_typeof(questions) != 'array'
       `)
       
       // Step 4: Special handling for problematic quizzes
       const problematicIds = [
         'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0', // The Who Quiz
         'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f', // What is Structure? Quiz
         'a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d5', // Using Stories Quiz
         'f1e2d3c4-b5a6-9876-5432-1098f7e6d5c4', // Preparation & Practice Quiz
         'f9e8d7c6-b5a4-3210-f9e8-d7c6b5a43210', // Visual Perception Quiz
       ]
       
       for (const id of problematicIds) {
         await db.execute(sql`
           UPDATE payload.course_quizzes
           SET questions = (
             SELECT jsonb_agg(
               jsonb_build_object(
                 'id', quiz_questions_id::text,
                 'relationTo', 'quiz_questions'::text,
                 'value', jsonb_build_object('id', quiz_questions_id::text)
               )
             )
             FROM payload.course_quizzes_rels
             WHERE _parent_id = ${id}
             AND field = 'questions'
             AND quiz_questions_id IS NOT NULL
           )
           WHERE id = ${id}
         `)
       }
       
       // Step 5: Create a permanent verification function
       await db.execute(sql`
         CREATE OR REPLACE FUNCTION payload.verify_quiz_questions_jsonb_format()
         RETURNS TABLE(
           quiz_id text,
           quiz_title text,
           has_questions boolean,
           is_array boolean,
           is_formatted boolean,
           question_count integer
         ) AS $$
         BEGIN
           RETURN QUERY
           SELECT 
             id::text as quiz_id,
             title as quiz_title,
             questions IS NOT NULL as has_questions,
             jsonb_typeof(questions) = 'array' as is_array,
             CASE 
               WHEN jsonb_typeof(questions) != 'array' THEN false
               WHEN jsonb_array_length(questions) = 0 THEN true
               WHEN questions @> '[{"relationTo": "quiz_questions"}]' THEN true
               ELSE false
             END as is_formatted,
             CASE 
               WHEN jsonb_typeof(questions) = 'array' THEN jsonb_array_length(questions)
               ELSE 0
             END as question_count
           FROM 
             payload.course_quizzes
           WHERE
             questions IS NOT NULL
           ORDER BY
             title;
         END;
         $$ LANGUAGE plpgsql;
       `)
       
       // Commit transaction
       await db.execute(sql`COMMIT;`)
       
       console.log('Fix Quiz Relationship Formats Migration completed successfully')
     } catch (error) {
       // Rollback on error
       await db.execute(sql`ROLLBACK;`)
       console.error('Error in Fix Quiz Relationship Formats Migration:', error)
       throw error
     }
   }
   
   export async function down({ db }: MigrateDownArgs): Promise<void> {
     // No down migration needed for format fixes
     console.log('No down migration for Quiz Relationship Formats Fix')
   }
   ```

### Phase 4: Enhance Quiz Relationship Hook for Resilience

1. **Update Quiz Relationship Hook**

   ```typescript
   // File: apps/payload/src/collections/hooks/quiz-relationships.ts
   
   /**
    * Quiz Relationship Hooks
    *
    * These hooks ensure quiz questions are always properly formatted
    * for Payload UI display and maintain consistency when edits are made.
    *
    * This is a critical component for maintaining relationship integrity
    * between quizzes and quiz questions.
    */
   import { CollectionAfterReadHook, CollectionBeforeChangeHook } from 'payload'
   
   // Define the expected structure of quiz questions for type safety
   interface QuizQuestion {
     id: string
     relationTo: string
     value: {
       id: string
     }
   }
   
   interface QuizDocument {
     id?: string
     questions?: any[] | any
     [key: string]: any
   }
   
   /**
    * Enhanced version of formatQuizQuestionsOnRead with improved error handling
    * and support for more diverse data formats.
    */
   export const formatQuizQuestionsOnRead: CollectionAfterReadHook = async ({
     doc,
     req,
   }: {
     doc: QuizDocument
     req: any
   }) => {
     // Skip if no document or no questions field
     if (!doc || !doc.questions) {
       return doc
     }
   
     try {
       // Log detailed information about the quiz for troubleshooting
       if (req.payload?.logger) {
         req.payload.logger.info({
           message: `Processing quiz questions for quiz ${doc.id}`,
           collection: 'course_quizzes',
           title: doc.title,
           questionsType: typeof doc.questions,
           isArray: Array.isArray(doc.questions),
           questionsLength: Array.isArray(doc.questions) ? doc.questions.length : 'N/A',
         })
       }
   
       // If questions is already properly formatted (has relationTo and value), return as is
       if (
         Array.isArray(doc.questions) &&
         doc.questions.length > 0 &&
         doc.questions[0].relationTo === 'quiz_questions' &&
         doc.questions[0].value &&
         doc.questions[0].value.id
       ) {
         // Already in the correct format
         return doc
       }
   
       // Otherwise, transform the questions array into the proper format
       if (Array.isArray(doc.questions)) {
         const formattedQuestions = doc.questions.map((question: any) => {
           // Handle various possible formats
           let questionId
           
           if (typeof question === 'object') {
             // Handle nested value objects
             if (question.value && typeof question.value === 'object') {
               questionId = question.value.id || question.value
             } 
             // Handle direct id property
             else {
               questionId = question.id || question.questionId || question
             }
           } else {
             // Handle string/primitive values
             questionId = question
           }
   
           // Create properly formatted object
           return {
             id: questionId,
             relationTo: 'quiz_questions',
             value: {
               id: questionId,
             },
           }
         }).filter(Boolean) // Remove any null/undefined entries
   
         // Log the transformation for debugging purposes
         if (req.payload?.logger) {
           req.payload.logger.info({
             message: `Formatted quiz questions for quiz ${doc.id}`,
             collection: 'course_quizzes',
             count: formattedQuestions.length,
           })
         }
   
         // Return document with formatted questions
         return {
           ...doc,
           questions: formattedQuestions,
         }
       } else {
         // If questions is not an array - fallback to fetching from relationships
         try {
           if (req.payload?.logger) {
             req.payload.logger.warn({
               message: `Quiz ${doc.id} has non-array questions, trying to rebuild from relationships`,
               collection: 'course_quizzes',
             })
           }
           
           // Attempt to fetch question relationships directly from database
           const { rows } = await req.payload.db.drizzle.execute(`
             SELECT quiz_questions_id
             FROM payload.course_quizzes_rels
             WHERE _parent_id = $1
             AND field = 'questions'
             AND quiz_questions_id IS NOT NULL
           `, [doc.id])
           
           if (rows && rows.length > 0) {
             const formattedQuestions = rows.map(row => ({
               id: row.quiz_questions_id,
               relationTo: 'quiz_questions',
               value: {
                 id: row.quiz_questions_id
               }
             }))
             
             // Return document with questions from relationships
             return {
               ...doc,
               questions: formattedQuestions,
             }
           }
         } catch (relError) {
           if (req.payload?.logger) {
             req.payload.logger.error({
               message: `Failed to rebuild quiz questions from relationships for quiz ${doc.id}`,
               collection: 'course_quizzes',
               error: relError,
             })
           }
         }
   
         // If all else fails, return document with empty questions array
         return {
           ...doc,
           questions: [],
         }
       }
     } catch (error) {
       // Log detailed error info but don't crash the request
       if (req.payload?.logger) {
         req.payload.logger.error({
           message: `Error formatting quiz questions for quiz ${doc.id}`,
           collection: 'course_quizzes',
           error,
           title: doc.title,
           docInfo: {
             id: doc.id,
             questionsType: typeof doc.questions,
             isArray: Array.isArray(doc.questions),
           }
         })
       }
   
       // On error, try to rebuild from relationships as a last resort
       try {
         // Warning: This is a fallback that directly queries the database
         // It's only used when the normal formatting process fails completely
         const questions = await req.payload.db.drizzle.execute(`
           SELECT quiz_questions_id
           FROM payload.course_quizzes_rels
           WHERE _parent_id = $1
           AND field = 'questions'
           AND quiz_questions_id IS NOT NULL
         `, [doc.id])
         
         if (questions.rows && questions.rows.length > 0) {
           const formattedQuestions = questions.rows.map(row => ({
             id: row.quiz_questions_id,
             relationTo: 'quiz_questions',
             value: {
               id: row.quiz_questions_id
             }
           }))
           
           if (req.payload?.logger) {
             req.payload.logger.info({
               message: `Recovered quiz questions from relationships after error for quiz ${
