/**
 * Quiz Migration Diagnostic
 *
 * This script performs a comprehensive check of quiz and question relationship
 * consistency in the database. It checks for missing relationships, incorrect
 * schema fields, NULL paths, and other issues that could cause API errors.
 *
 * Unlike standard verification scripts, this provides detailed stats and
 * troubleshooting information about the state of relationship tables.
 */
import chalk from 'chalk';
import { executeSQL } from '../../utils/db/execute-sql.js';
/**
 * Run a comprehensive diagnostic on quiz relationships
 */
async function runDiagnostic() {
    console.log(chalk.cyan('\n=== Quiz Migration Diagnostic ===\n'));
    try {
        // 1. Check base entity counts
        console.log('Checking entity counts...');
        const quizCountResult = await executeSQL(`
      SELECT COUNT(*) FROM payload.course_quizzes
    `);
        const quizCount = parseInt(quizCountResult.rows[0].count);
        const questionCountResult = await executeSQL(`
      SELECT COUNT(*) FROM payload.quiz_questions
    `);
        const questionCount = parseInt(questionCountResult.rows[0].count);
        // 2. Check relationship counts
        console.log('Checking relationship counts...');
        const courseQuizRelsResult = await executeSQL(`
      SELECT COUNT(*) FROM payload.course_quizzes_rels
      WHERE field = 'questions'
    `);
        const courseQuizRelsCount = parseInt(courseQuizRelsResult.rows[0].count);
        const quizQuestionRelsResult = await executeSQL(`
      SELECT COUNT(*) FROM payload.quiz_questions_rels
      WHERE field = 'quiz_id'
    `);
        const quizQuestionRelsCount = parseInt(quizQuestionRelsResult.rows[0].count);
        // 3. Check for NULL paths
        console.log('Checking for NULL paths...');
        const nullPathResult = await executeSQL(`
      SELECT * FROM payload.course_quizzes_rels
      WHERE field = 'questions' AND path IS NULL
    `);
        const nullPathCount = nullPathResult.rowCount;
        const nullPathRels = nullPathResult.rows;
        // 4. Check for bidirectional inconsistencies
        console.log('Checking for bidirectional inconsistencies...');
        const missingQuizQuestionRelsResult = await executeSQL(`
      SELECT 
        cqr._parent_id as quiz_id,
        cqr.quiz_questions_id as question_id
      FROM 
        payload.course_quizzes_rels cqr
      WHERE
        cqr.quiz_questions_id IS NOT NULL
        AND cqr.field = 'questions'
        AND NOT EXISTS (
          SELECT 1 FROM payload.quiz_questions_rels qr
          WHERE qr._parent_id = cqr.quiz_questions_id 
            AND qr.field = 'quiz_id'
            AND qr.value = cqr._parent_id
        )
    `);
        const bidirectionalInconsistencies = missingQuizQuestionRelsResult.rowCount;
        const missingQuizQuestionRels = missingQuizQuestionRelsResult.rows;
        // 5. Check for duplicate relationships
        console.log('Checking for duplicate relationships...');
        const duplicateRelsResult = await executeSQL(`
      SELECT 
        _parent_id, 
        quiz_questions_id, 
        COUNT(*) as count
      FROM 
        payload.course_quizzes_rels
      WHERE 
        field = 'questions'
      GROUP BY 
        _parent_id, quiz_questions_id
      HAVING 
        COUNT(*) > 1
    `);
        const duplicateRelationships = duplicateRelsResult.rowCount;
        const duplicateRels = duplicateRelsResult.rows;
        // 6. Check for wrong field names in quiz_questions_rels
        console.log('Checking for wrong field names...');
        const wrongFieldNameResult = await executeSQL(`
      SELECT * FROM payload.quiz_questions_rels
      WHERE field != 'quiz_id'
    `);
        const wrongFieldNameCount = wrongFieldNameResult.rowCount;
        const wrongFieldRels = wrongFieldNameResult.rows;
        // 7. Determine overall health
        const isHealthy = courseQuizRelsCount > 0 &&
            quizQuestionRelsCount > 0 &&
            nullPathCount === 0 &&
            bidirectionalInconsistencies === 0 &&
            duplicateRelationships === 0 &&
            wrongFieldNameCount === 0;
        // Compile and return results
        const result = {
            quizCount,
            questionCount,
            courseQuizRelsCount,
            quizQuestionRelsCount,
            nullPathCount,
            bidirectionalInconsistencies,
            duplicateRelationships,
            wrongFieldNameCount,
            isHealthy,
            detailedProblems: {
                missingQuizQuestionRels,
                duplicateRels,
                nullPathRels,
                wrongFieldRels,
            },
        };
        // Print the results
        printDiagnosticResults(result);
        return result;
    }
    catch (error) {
        console.error(chalk.red('Error running quiz migration diagnostic:'), error);
        throw error;
    }
}
/**
 * Print the diagnostic results in a formatted way
 */
function printDiagnosticResults(result) {
    console.log(chalk.cyan('\n=== Quiz Relationship Diagnostic Results ===\n'));
    // Database entity counts
    console.log(chalk.bold('Entity Counts:'));
    console.log(`- Course Quizzes: ${result.quizCount}`);
    console.log(`- Quiz Questions: ${result.questionCount}`);
    console.log('');
    // Relationship counts
    console.log(chalk.bold('Relationship Counts:'));
    console.log(`- Quiz → Question Relationships: ${result.courseQuizRelsCount}`);
    console.log(`- Question → Quiz Relationships: ${result.quizQuestionRelsCount}`);
    if (result.courseQuizRelsCount === result.quizQuestionRelsCount) {
        console.log(chalk.green('✓ Relationship counts match!'));
    }
    else {
        console.log(chalk.red(`✗ Relationship counts don't match! (Difference: ${Math.abs(result.courseQuizRelsCount - result.quizQuestionRelsCount)})`));
    }
    console.log('');
    // Relationship health
    console.log(chalk.bold('Relationship Health:'));
    console.log(`- NULL path fields: ${result.nullPathCount}`);
    console.log(`- Bidirectional inconsistencies: ${result.bidirectionalInconsistencies}`);
    console.log(`- Duplicate relationships: ${result.duplicateRelationships}`);
    console.log(`- Wrong field names: ${result.wrongFieldNameCount}`);
    console.log('');
    // Overall health
    console.log(chalk.bold('Overall Health:'));
    if (result.isHealthy) {
        console.log(chalk.green('✅ Quiz relationships are fully healthy!'));
    }
    else {
        console.log(chalk.red('❌ Quiz relationships have issues:'));
        if (result.courseQuizRelsCount === 0) {
            console.log(chalk.red('- No quiz→question relationships exist'));
        }
        if (result.quizQuestionRelsCount === 0) {
            console.log(chalk.red('- No question→quiz relationships exist'));
        }
        if (result.nullPathCount > 0) {
            console.log(chalk.red(`- ${result.nullPathCount} records have NULL path field`));
            if (result.detailedProblems.nullPathRels.length > 0) {
                console.log(chalk.gray('  Sample NULL path records:'));
                result.detailedProblems.nullPathRels.slice(0, 3).forEach((rec) => {
                    console.log(chalk.gray(`  - Quiz ID: ${rec._parent_id}, Question ID: ${rec.quiz_questions_id}`));
                });
                if (result.detailedProblems.nullPathRels.length > 3) {
                    console.log(chalk.gray(`  ... and ${result.detailedProblems.nullPathRels.length - 3} more`));
                }
            }
        }
        if (result.bidirectionalInconsistencies > 0) {
            console.log(chalk.red(`- ${result.bidirectionalInconsistencies} missing bidirectional relationships`));
            if (result.detailedProblems.missingQuizQuestionRels.length > 0) {
                console.log(chalk.gray('  Sample missing relationships:'));
                result.detailedProblems.missingQuizQuestionRels
                    .slice(0, 3)
                    .forEach((rel) => {
                    console.log(chalk.gray(`  - Quiz ID: ${rel.quiz_id}, Question ID: ${rel.question_id}`));
                });
                if (result.detailedProblems.missingQuizQuestionRels.length > 3) {
                    console.log(chalk.gray(`  ... and ${result.detailedProblems.missingQuizQuestionRels.length - 3} more`));
                }
            }
        }
        if (result.duplicateRelationships > 0) {
            console.log(chalk.red(`- ${result.duplicateRelationships} duplicate relationships`));
        }
        if (result.wrongFieldNameCount > 0) {
            console.log(chalk.red(`- ${result.wrongFieldNameCount} relationships with wrong field names`));
            if (result.detailedProblems.wrongFieldRels.length > 0) {
                console.log(chalk.gray('  Incorrect field names found:'));
                const fieldNames = new Set(result.detailedProblems.wrongFieldRels.map((rel) => rel.field));
                console.log(chalk.gray(`  - ${Array.from(fieldNames).join(', ')}`));
                console.log(chalk.gray(`  - Should be 'quiz_id' instead`));
            }
        }
    }
    // Recovery suggestions
    if (!result.isHealthy) {
        console.log('');
        console.log(chalk.bold('Recovery Suggestions:'));
        if (result.nullPathCount > 0) {
            console.log(chalk.yellow('- Fix NULL paths:'));
            console.log("  UPDATE payload.course_quizzes_rels SET path = 'questions' WHERE field = 'questions' AND path IS NULL;");
        }
        if (result.bidirectionalInconsistencies > 0) {
            console.log(chalk.yellow('- Create missing bidirectional relationships:'));
            console.log(`  INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, updated_at, created_at)
  SELECT 
    gen_random_uuid()::text as id, 
    cqr.quiz_questions_id as _parent_id, 
    'quiz_id', 
    cqr._parent_id,
    NOW(),
    NOW()
  FROM
    payload.course_quizzes_rels cqr
  WHERE
    cqr.quiz_questions_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM payload.quiz_questions_rels qr
      WHERE qr._parent_id = cqr.quiz_questions_id 
      AND qr.field = 'quiz_id'
      AND qr.value = cqr._parent_id
    );`);
        }
        if (result.wrongFieldNameCount > 0) {
            console.log(chalk.yellow('- Fix wrong field names:'));
            console.log("  UPDATE payload.quiz_questions_rels SET field = 'quiz_id' WHERE field != 'quiz_id';");
        }
        if (result.duplicateRelationships > 0) {
            console.log(chalk.yellow('- Remove duplicate relationships:'));
            console.log(`  DELETE FROM payload.course_quizzes_rels a
  WHERE a.ctid <> (
    SELECT min(b.ctid)
    FROM payload.course_quizzes_rels b
    WHERE a._parent_id = b._parent_id
      AND a.quiz_questions_id = b.quiz_questions_id
  );`);
        }
    }
}
// Run the diagnostic if executed directly
// This ES module compatible check replaces the CommonJS require.main === module pattern
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    runDiagnostic()
        .then((result) => {
        process.exit(result.isHealthy ? 0 : 1);
    })
        .catch((error) => {
        console.error('Unhandled error in diagnostic:', error);
        process.exit(1);
    });
}
export default runDiagnostic;
