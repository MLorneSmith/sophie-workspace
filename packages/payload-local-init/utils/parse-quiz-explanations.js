const fs = require('fs');
const path = require('path');

// Get current directory (using __dirname for CommonJS)

const quizDefinitionsPath = path.resolve(
  __dirname,
  '../data/quiz-definitions.ts',
);

async function parseQuizExplanations() {
  console.log(`Parsing and updating explanations in ${quizDefinitionsPath}...`);

  try {
    // Read the content of the quiz-definitions.ts file
    let fileContent = fs.readFileSync(quizDefinitionsPath, 'utf-8');

    // Extract the QUIZZES object string
    const quizzesMatch = fileContent.match(
      /export const QUIZZES: Record<string, QuizDefinition> = (\{[\s\S]*?\});/,
    );

    if (!quizzesMatch || !quizzesMatch[1]) {
      throw new Error('Could not find QUIZZES object in quiz-definitions.ts');
    }

    const quizzesString = quizzesMatch[1];

    // Parse the object string - this requires careful handling of the TypeScript syntax
    // A simple eval might work for trusted input, but a more robust approach is needed
    // For this specific structure, we can try to parse it as JSON after some cleanup
    let jsonCompatibleQuizzesString = quizzesString
      .replace(/:\s*['"]([^'"]*)['"]/g, (match, p1) => `: "${p1}"`) // Quote keys
      .replace(/'/g, '"'); // Replace single quotes with double quotes

    // Attempt to parse as JSON
    let QUIZZES;
    try {
      QUIZZES = JSON.parse(jsonCompatibleQuizzesString);
    } catch (jsonError) {
      console.error(
        'Initial JSON parse failed, attempting fallback with eval...',
      );
      // Fallback to eval if JSON.parse fails (less safe, but might work for complex structures)
      QUIZZES = eval(`(${quizzesString})`);
    }

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

    // Reconstruct the file content, preserving the original import and comments
    // Find the start and end of the original QUIZZES object definition
    const startIndex =
      quizzesMatch.index + quizzesMatch[0].indexOf(quizzesMatch[1]);
    const endIndex = startIndex + quizzesMatch[1].length;

    // Replace the original object string with the updated one
    fileContent =
      fileContent.substring(0, startIndex) +
      updatedQuizzesString +
      fileContent.substring(endIndex);

    // Write the updated content back to the file
    fs.writeFileSync(quizDefinitionsPath, fileContent, 'utf-8');

    console.log('Successfully parsed and updated explanations.');
  } catch (error) {
    console.error('Error parsing quiz explanations:', error);
    throw error;
  }
}

// Run the script
parseQuizExplanations().catch(console.error);
