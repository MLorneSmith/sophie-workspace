import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const quizDefinitionsPath = path.resolve(
  __dirname,
  '../data/quiz-definitions.ts',
);

async function parseQuizExplanations() {
  console.log(`Parsing and updating explanations in ${quizDefinitionsPath}...`);

  try {
    // Read the content of the quiz-definitions.ts file
    const fileContent = fs.readFileSync(quizDefinitionsPath, 'utf-8');

    // Extract the QUIZZES object string
    const quizzesMatch = fileContent.match(
      /export const QUIZZES: Record<string, QuizDefinition> = (\{[\s\S]*?\});/,
    );

    if (!quizzesMatch || !quizzesMatch[1]) {
      throw new Error('Could not find QUIZZES object in quiz-definitions.ts');
    }

    const quizzesString = quizzesMatch[1];

    // Use eval to safely parse the object string (assuming trusted source)
    // A more robust parser could be used for untrusted sources
    const QUIZZES = eval(`(${quizzesString})`);

    // Iterate and parse explanations
    for (const quizSlug in QUIZZES) {
      if (QUIZZES.hasOwnProperty(quizSlug)) {
        const quiz = QUIZZES[quizSlug];
        if (quiz.questions && Array.isArray(quiz.questions)) {
          for (const question of quiz.questions) {
            if (typeof question.explanation === 'string') {
              try {
                question.explanation = JSON.parse(question.explanation);
                console.log(
                  `Parsed explanation for quiz "${quiz.title}", question "${question.text.substring(0, 30)}..."`,
                );
              } catch (e) {
                console.error(
                  `Error parsing explanation JSON for quiz "${quiz.title}", question "${question.text.substring(0, 30)}...":`,
                  e,
                );
                // Keep as string if parsing fails, or set to a default error object
                // For now, keeping as string to avoid data loss
              }
            }
          }
        }
      }
    }

    // Convert the modified QUIZZES object back to a string
    // Use a library like 'prettier' or manually format for readability if needed
    const updatedQuizzesString = JSON.stringify(QUIZZES, null, 2);

    // Reconstruct the file content
    const updatedFileContent = fileContent.replace(
      /export const QUIZZES: Record<string, QuizDefinition> = (\{[\s\S]*?\});/,
      `export const QUIZZES: Record<string, QuizDefinition> = ${updatedQuizzesString};`,
    );

    // Write the updated content back to the file
    fs.writeFileSync(quizDefinitionsPath, updatedFileContent, 'utf-8');

    console.log('Successfully parsed and updated explanations.');
  } catch (error) {
    console.error('Error parsing quiz explanations:', error);
    throw error;
  }
}

// Run the script if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  parseQuizExplanations().catch(console.error);
}
