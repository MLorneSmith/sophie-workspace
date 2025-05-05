/**
 * Relationship Repair Orchestration
 *
 * This module orchestrates the entire relationship repair process,
 * coordinating the execution of different components in the correct order.
 */
import { detectAndSaveRelationships, loadRelationshipMap, } from '../scripts/repair/relationships/core/detection.js';
import { formatLogMessage, generateTimestampId, } from '../scripts/repair/relationships/core/utils.js';
import { createAllRelationshipHelpers } from '../scripts/repair/relationships/database/helpers.js';
import { createAllRelationshipViews, createInvalidRelationshipsView, } from '../scripts/repair/relationships/database/views.js';
import { fixQuizQuestionRelationships } from '../scripts/repair/relationships/fixes/quiz-question.js';
import { verifyAllRelationships } from '../scripts/verification/relationships/verify-all.js';
import { executeSQL } from '../utils/db/execute-sql.js';
/**
 * Main function to run the relationship repair process
 *
 * @param options Options to customize the repair process
 * @returns True if the process succeeded, false otherwise
 */
export async function runRelationshipRepair(options = {}) {
    const timestampId = generateTimestampId();
    console.log(formatLogMessage(`Starting relationship repair [${timestampId}]`, 'info'));
    try {
        // Step 1: Detection phase
        console.log(formatLogMessage('PHASE 1: Enhanced Relationship Detection', 'info'));
        // Detect relationships (or load existing map if available)
        let relationshipMap;
        if (options.skipVerification) {
            console.log('Using existing relationship map (if available)...');
            relationshipMap = await loadRelationshipMap();
            if (!relationshipMap) {
                console.log('No existing relationship map found, generating a new one...');
                relationshipMap = await detectAndSaveRelationships(false);
            }
        }
        else {
            console.log('Generating new relationship map...');
            relationshipMap = await detectAndSaveRelationships(true);
        }
        // Log summary of detected relationships
        const totalCollections = Object.keys(relationshipMap.collections).length;
        const totalRelationships = Object.values(relationshipMap.collections).reduce((sum, coll) => sum + coll.relationships.length, 0);
        const totalUuidTables = relationshipMap.uuidTables.length;
        console.log('Relationship detection summary:');
        console.log(`- Collections: ${totalCollections}`);
        console.log(`- Relationships: ${totalRelationships}`);
        console.log(`- UUID tables: ${totalUuidTables}`);
        // Step 2: Database infrastructure phase
        console.log(formatLogMessage('PHASE 2: Database Helpers and Views', 'info'));
        if (!options.skipFallbackSystem) {
            // Create database views
            console.log('Creating database views...');
            const viewsCreated = await createAllRelationshipViews();
            if (!viewsCreated) {
                console.log(formatLogMessage('Failed to create database views', 'error'));
                return false;
            }
            // Create helper functions
            console.log('Creating database helper functions...');
            const helpersCreated = await createAllRelationshipHelpers();
            if (!helpersCreated) {
                console.log(formatLogMessage('Failed to create helper functions', 'error'));
                return false;
            }
        }
        else {
            console.log('Skipping database helpers and views creation');
        }
        // Step 3: Fix phase - run relationship fixes
        console.log(formatLogMessage('PHASE 3: Relationship Fixes', 'info'));
        // Start a transaction for all fixes
        await executeSQL('BEGIN');
        try {
            // Fix quiz-question relationships
            if (!options.skipQuizFix) {
                console.log('Fixing quiz-question relationships...');
                const quizFixResult = await fixQuizQuestionRelationships();
                console.log('Quiz-Question fix summary:');
                console.log(`- Processed quizzes: ${quizFixResult.processedQuizzes}`);
                console.log(`- Fixed questions: ${quizFixResult.fixedQuestions}`);
                console.log(`- Reordered questions: ${quizFixResult.reorderedQuestions}`);
                console.log(`- Added to quizzes: ${quizFixResult.addedToQuizzes}`);
                console.log(`- Added to relationship tables: ${quizFixResult.addedToRelTables}`);
                console.log(`- Cleaned orphans: ${quizFixResult.cleanedOrphans}`);
                console.log(`- Errors: ${quizFixResult.errors.length}`);
                if (quizFixResult.errors.length > 0) {
                    console.log('Errors encountered during quiz fix:');
                    for (const error of quizFixResult.errors) {
                        console.log(`- Quiz ${error.quiz}: ${error.error}`);
                    }
                }
            }
            else {
                console.log('Skipping quiz-question relationship fixes');
            }
            // Create invalid relationships view for monitoring
            console.log('Creating invalid relationships view...');
            await createInvalidRelationshipsView();
            // Commit the transaction
            await executeSQL('COMMIT');
            console.log('All fixes committed successfully');
        }
        catch (error) {
            // Rollback the transaction on error
            console.error('Error applying fixes, rolling back:', error);
            await executeSQL('ROLLBACK');
            return false;
        }
        // Step 4: Verification phase
        console.log(formatLogMessage('PHASE 4: Verification', 'info'));
        if (!options.skipVerification) {
            console.log('Running comprehensive relationship verification...');
            const verificationResult = await verifyAllRelationships();
            console.log('Verification summary:');
            console.log(`- Pass rate: ${verificationResult.summary.passRate.toFixed(2)}%`);
            console.log(`- Passed: ${verificationResult.summary.passedCount} / ${verificationResult.checkedRelationships}`);
            if (verificationResult.summary.passRate < 95) {
                console.log(formatLogMessage('WARNING: Verification pass rate is below 95%', 'warn'));
            }
            if (verificationResult.inconsistentRelationships.length > 0) {
                console.log('Inconsistent relationships:');
                for (const issue of verificationResult.inconsistentRelationships) {
                    console.log(`- ${issue.collection}.${issue.field} -> ${issue.targetCollection}: ` +
                        `${issue.issueType} (count: ${issue.count})`);
                }
            }
        }
        else {
            console.log('Skipping verification phase');
        }
        console.log(formatLogMessage(`Relationship repair completed successfully [${timestampId}]`, 'info'));
        return true;
    }
    catch (error) {
        console.error('Error in relationship repair:', error);
        // Try to rollback if a transaction might be in progress
        try {
            await executeSQL('ROLLBACK');
        }
        catch (rollbackError) {
            // Ignore rollback errors
        }
        return false;
    }
}
/**
 * Execute the relationship repair process with CLI arguments
 */
async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {
        skipVerification: args.includes('--skip-verification'),
        skipQuizFix: args.includes('--skip-quiz-fix'),
        skipMultiFix: args.includes('--skip-multi-fix'),
        skipFallbackSystem: args.includes('--skip-fallback'),
        logToFile: args.includes('--log-to-file'),
    };
    console.log('Relationship repair options:');
    console.log(JSON.stringify(options, null, 2));
    const success = await runRelationshipRepair(options);
    if (success) {
        console.log(formatLogMessage('Relationship repair completed successfully', 'info'));
        process.exit(0);
    }
    else {
        console.log(formatLogMessage('Relationship repair failed', 'error'));
        process.exit(1);
    }
}
// Execute when run directly
if (process.argv[1] === import.meta.url) {
    main().catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
