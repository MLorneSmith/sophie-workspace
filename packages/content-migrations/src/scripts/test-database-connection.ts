/**
 * Script to test the database connection and verify the schema
 */
import { getEnhancedPayloadClient } from '../utils/enhanced-payload-client.js';

/**
 * Tests the database connection and verifies the schema
 */
async function testDatabaseConnection() {
  console.log('Testing database connection and verifying schema...');

  try {
    // Get the Payload client
    console.log('Getting Payload client...');
    const payload = await getEnhancedPayloadClient();

    // Test collections
    const collections = [
      'course_quizzes',
      'quiz_questions',
      'course_lessons',
      'courses',
    ];

    // Test each collection
    for (const collection of collections) {
      console.log(`Testing collection: ${collection}`);
      try {
        const { docs, totalDocs } = await payload.find({
          collection,
          limit: 1,
        });

        console.log(
          `Collection ${collection} exists with ${totalDocs} documents`,
        );

        if (docs.length > 0) {
          console.log(
            `Sample document from ${collection}:`,
            JSON.stringify(docs[0], null, 2),
          );
        }
      } catch (error) {
        console.error(`Error testing collection ${collection}:`, error);
      }
    }

    console.log('Database connection test complete!');
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

// Run the test
testDatabaseConnection().catch((error) => {
  console.error('Database connection test failed:', error);
  process.exit(1);
});
