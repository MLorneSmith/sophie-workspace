/**
 * Quiz Relationship Integrity Diagnostic
 *
 * This script diagnoses issues between quizzes and their questions,
 * checking both SQL relationships and JSONB array structure.
 */
import chalk from 'chalk';
import { getClient } from '../../utils/db/client.js';
async function run() {
    const client = await getClient();
    try {
        console.log(chalk.cyan('\n=== Quiz Relationship Integrity Diagnostic ===\n'));
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
    `);
        console.log(`Found ${quizzes.length} quizzes to examine`);
        let issuesFound = 0;
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
      `, [quiz.id]);
            // Parse and validate JSONB questions array
            let jsonbQuestions = [];
            let properFormat = false;
            try {
                if (quiz.questions) {
                    jsonbQuestions = Array.isArray(quiz.questions)
                        ? quiz.questions
                        : JSON.parse(quiz.questions);
                    // Check format of first item
                    if (jsonbQuestions.length > 0) {
                        const firstItem = jsonbQuestions[0];
                        properFormat =
                            firstItem &&
                                firstItem.relationTo === 'quiz_questions' &&
                                firstItem.value &&
                                firstItem.value.id;
                    }
                }
            }
            catch (e) {
                console.error(`Error parsing questions for quiz ${quiz.title}:`, e);
            }
            // Compare relationship records vs JSONB array
            console.log(`\nQuiz: ${quiz.title} (${quiz.id})`);
            console.log(`  - Relationship records: ${rels.length}`);
            console.log(`  - JSONB questions array: ${jsonbQuestions.length || 0} items`);
            console.log(`  - JSONB format correct: ${properFormat ? 'Yes' : 'No'}`);
            if (jsonbQuestions.length > 0) {
                console.log(`  - Sample format: ${JSON.stringify(jsonbQuestions[0]).substring(0, 100)}...`);
            }
            // Detailed comparison
            if (rels.length > 0 && jsonbQuestions.length > 0) {
                // Question IDs from relationship records
                const relIds = rels.map((r) => r.quiz_questions_id).sort();
                // Question IDs from JSONB array
                const jsonbIds = jsonbQuestions
                    .map((j) => {
                    if (typeof j === 'string')
                        return j;
                    if (j.value && typeof j.value === 'object')
                        return j.value.id;
                    if (j.value)
                        return j.value;
                    return j.id || j;
                })
                    .filter(Boolean)
                    .sort();
                // Check for consistency
                const relIdsSet = new Set(relIds);
                const jsonbIdsSet = new Set(jsonbIds);
                const onlyInRels = relIds.filter((id) => !jsonbIdsSet.has(id));
                const onlyInJsonb = jsonbIds.filter((id) => !relIdsSet.has(id));
                if (onlyInRels.length === 0 && onlyInJsonb.length === 0) {
                    console.log('  ✅ Relationship records and JSONB array match perfectly');
                }
                else {
                    console.log('  ❌ Inconsistencies detected:');
                    if (onlyInRels.length > 0) {
                        console.log(`    - ${onlyInRels.length} questions in relationships but missing from JSONB array`);
                    }
                    if (onlyInJsonb.length > 0) {
                        console.log(`    - ${onlyInJsonb.length} questions in JSONB array but missing from relationships`);
                    }
                    issuesFound++;
                }
            }
            else if (rels.length !== jsonbQuestions.length) {
                console.log('  ❌ Count mismatch between relationships and JSONB array');
                issuesFound++;
            }
            // Check for specific problematic quizzes
            if (quiz.title.includes('Who') ||
                quiz.title.includes('Structure') ||
                quiz.title.includes('Stories') ||
                quiz.title.includes('Film') ||
                quiz.title.includes('Visual Perception') ||
                quiz.title.includes('Tables vs. Graphs') ||
                quiz.title.includes('Specialist Graphs') ||
                quiz.title.includes('Preparation and Practice')) {
                console.log(`  ⚠️ This quiz corresponds to a lesson with reported errors`);
            }
        }
        console.log(`\nDiagnostic Summary:`);
        console.log(`- Examined ${quizzes.length} quizzes`);
        console.log(`- Found ${issuesFound} quizzes with relationship inconsistencies`);
        // Return true if no issues found, false otherwise
        return issuesFound === 0;
    }
    catch (error) {
        console.error(chalk.red('Error running diagnostic:'), error);
        return false;
    }
    finally {
        await client.end();
    }
}
// Execute and return result code for script integration
if (import.meta.url === `file://${process.argv[1]}`) {
    run()
        .then((success) => process.exit(success ? 0 : 1))
        .catch((err) => {
        console.error('Unhandled error:', err);
        process.exit(1);
    });
}
export default run;
