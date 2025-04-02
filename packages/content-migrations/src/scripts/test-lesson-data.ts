/**
 * Script to test the lesson data structure
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Test the lesson data structure
 */
async function testLessonData() {
  try {
    // Import the getLessonBySlug function
    const { getLessonBySlug } = await import('@kit/cms/payload');

    // Get a lesson with a quiz
    const lessonSlug = 'standard-graphs'; // This lesson should have a quiz
    console.log(`Fetching lesson data for slug: ${lessonSlug}`);

    const lessonData = await getLessonBySlug(lessonSlug);
    console.log('Lesson data structure:');
    console.log(JSON.stringify(lessonData, null, 2));

    // Check if the lesson has a quiz relationship
    const lesson = lessonData?.docs?.[0];
    if (lesson) {
      console.log('\nLesson quiz relationship:');
      console.log('lesson.quiz:', lesson.quiz);
      console.log('lesson.quiz_id:', lesson.quiz_id);
      console.log('lesson.quiz_id_id:', lesson.quiz_id_id);
    } else {
      console.log('Lesson not found');
    }
  } catch (error) {
    console.error('Error testing lesson data:', error);
  }
}

// Run the test
testLessonData().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
