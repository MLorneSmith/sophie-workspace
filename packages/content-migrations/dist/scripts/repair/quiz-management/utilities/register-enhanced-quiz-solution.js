/**
 * Register and integrate enhanced quiz solution
 *
 * This script:
 * 1. Registers the fix-missing-quiz-entries script in package.json
 * 2. Updates loading.ps1 to run our fix script
 * 3. Ensures the enhanced API module is properly integrated
 */
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
/**
 * Register the fix script in the content-migrations package.json
 */
export async function registerEnhancedQuizSolution() {
    console.log('Registering enhanced quiz solution...');
    // Use __dirname in ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Path to the content-migrations package.json
    const packageJsonPath = path.resolve(__dirname, '../../../../package.json');
    try {
        // Read the current package.json
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(packageJsonContent);
        // Add the new script
        if (!packageJson.scripts['fix:missing-quiz-entries']) {
            packageJson.scripts['fix:missing-quiz-entries'] =
                'tsx src/scripts/repair/quiz-management/core/fix-missing-quiz-entries.ts';
            console.log('Added fix:missing-quiz-entries script to package.json');
        }
        else {
            console.log('fix:missing-quiz-entries script already exists in package.json');
        }
        // Write back the updated package.json
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('Updated package.json successfully');
        // Now update the loading.ps1 file to include our script
        await updateLoadingPhaseScript();
        return;
    }
    catch (error) {
        console.error('Error registering enhanced quiz solution:', error);
        throw error;
    }
}
/**
 * Update the loading.ps1 file to include our fix script
 */
async function updateLoadingPhaseScript() {
    // Path to the loading.ps1 file
    const loadingPhaseScriptPath = path.resolve(__dirname, '../../../../../../scripts/orchestration/phases/loading.ps1');
    try {
        // Read the current loading.ps1 content
        const loadingPhaseContent = await fs.readFile(loadingPhaseScriptPath, 'utf8');
        // Check if our script is already included
        if (loadingPhaseContent.includes('fix:missing-quiz-entries')) {
            console.log('fix:missing-quiz-entries already included in loading.ps1');
            return;
        }
        // Find the line where we want to insert our script
        // We'll add it after the unidirectional quiz questions fix
        const insertPosition = loadingPhaseContent.indexOf('fix:unidirectional-quiz-questions');
        if (insertPosition === -1) {
            console.log('Could not find fix:unidirectional-quiz-questions in loading.ps1');
            // Try to find the quiz relationship section
            const quizFixPosition = loadingPhaseContent.indexOf('Fix quiz relationships');
            if (quizFixPosition === -1) {
                console.log('Could not find appropriate insertion point in loading.ps1');
                return;
            }
            // Find the end of that section
            const endOfQuizSection = loadingPhaseContent.indexOf('Log-Success', quizFixPosition);
            if (endOfQuizSection === -1) {
                console.log('Could not find end of quiz section in loading.ps1');
                return;
            }
            // Insert our command before the success log
            const beginningOfFile = loadingPhaseContent.substring(0, endOfQuizSection);
            const endOfFile = loadingPhaseContent.substring(endOfQuizSection);
            const newContent = beginningOfFile +
                '\n# Fix missing quiz entries created from lessons\n' +
                'Log-Message "Fixing missing quiz entries..." "Yellow"\n' +
                'Exec-Command -command "pnpm --filter @kit/content-migrations run fix:missing-quiz-entries" -description "Fixing missing quiz entries" -continueOnError\n\n' +
                endOfFile;
            await fs.writeFile(loadingPhaseScriptPath, newContent);
            console.log('Added fix:missing-quiz-entries to loading.ps1 in quiz section');
        }
        else {
            // Find the end of the line
            const endOfLine = loadingPhaseContent.indexOf('\n', insertPosition);
            if (endOfLine === -1) {
                console.log('Could not find end of line for insertion in loading.ps1');
                return;
            }
            // Insert our command after the existing line
            const beginningOfFile = loadingPhaseContent.substring(0, endOfLine + 1);
            const endOfFile = loadingPhaseContent.substring(endOfLine + 1);
            const newContent = beginningOfFile +
                '\n# Fix missing quiz entries created from lessons\n' +
                'Log-Message "Fixing missing quiz entries..." "Yellow"\n' +
                'Exec-Command -command "pnpm --filter @kit/content-migrations run fix:missing-quiz-entries" -description "Fixing missing quiz entries" -continueOnError\n' +
                endOfFile;
            await fs.writeFile(loadingPhaseScriptPath, newContent);
            console.log('Added fix:missing-quiz-entries to loading.ps1 after unidirectional fix');
        }
    }
    catch (error) {
        console.error('Error updating loading.ps1:', error);
        // Continue anyway, as this is not critical
    }
}
// Run the function if called directly
if (import.meta.url.endsWith(process.argv[1])) {
    registerEnhancedQuizSolution()
        .then(() => console.log('Enhanced quiz solution registration complete'))
        .catch((error) => {
        console.error('Failed to register enhanced quiz solution:', error);
        process.exit(1);
    });
}
