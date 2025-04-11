/**
 * Quiz Map Generator Utility
 * Creates a mapping of quiz IDs to quiz files for use in SQL generation
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const DATA_DIR = path.resolve(__dirname, '../../data');
const RAW_QUIZZES_DIR = path.resolve(DATA_DIR, 'raw/quizzes');
const PROCESSED_DIR = path.resolve(DATA_DIR, 'processed');

/**
 * Generate a map of quiz slugs to quiz IDs
 * @returns {Object} Map of quiz slugs to quiz IDs
 */
export function generateQuizMap() {
  try {
    // Create the processed directory if it doesn't exist
    if (!fs.existsSync(PROCESSED_DIR)) {
      fs.mkdirSync(PROCESSED_DIR, { recursive: true });
    }

    // Check if raw quizzes directory exists
    if (!fs.existsSync(RAW_QUIZZES_DIR)) {
      console.warn(`Raw quizzes directory not found: ${RAW_QUIZZES_DIR}`);
      return {};
    }

    // Get all quiz files
    const quizFiles = fs
      .readdirSync(RAW_QUIZZES_DIR)
      .filter((file) => file.endsWith('.json'));

    if (quizFiles.length === 0) {
      console.warn('No quiz files found');
      return {};
    }

    // Create a map of quiz slugs to quiz IDs
    const quizMap = {};

    // Process each quiz file
    quizFiles.forEach((file) => {
      const quizPath = path.join(RAW_QUIZZES_DIR, file);
      const quizContent = JSON.parse(fs.readFileSync(quizPath, 'utf8'));

      // Extract the slug from filename (remove .json extension)
      const slug = path.basename(file, '.json');

      // Use the quiz ID from the content or generate a new one
      const id =
        quizContent.id || `quiz_${Math.random().toString(36).substring(2, 9)}`;

      // Add to the map
      quizMap[slug] = id;
    });

    // Write the map to a file for reference
    const mapFile = path.join(PROCESSED_DIR, 'quiz-map.json');
    fs.writeFileSync(mapFile, JSON.stringify(quizMap, null, 2));

    console.log(
      `Generated quiz map with ${Object.keys(quizMap).length} quizzes`,
    );
    return quizMap;
  } catch (error) {
    console.error('Error generating quiz map:', error);
    return {};
  }
}

export default generateQuizMap;
