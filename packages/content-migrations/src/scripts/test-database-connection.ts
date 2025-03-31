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

    // Test collections with expected fields
    const collectionsToTest = [
      {
        name: 'courses',
        requiredFields: [
          'title',
          'slug',
          'description',
          'showProgressBar',
          'estimatedDuration',
        ],
      },
      {
        name: 'course_lessons',
        requiredFields: [
          'title',
          'slug',
          'content',
          'lessonNumber',
          'estimatedDuration',
          'course_id',
        ],
      },
      {
        name: 'course_quizzes',
        requiredFields: ['title', 'slug', 'description', 'passingScore'],
      },
      {
        name: 'quiz_questions',
        requiredFields: [
          'question',
          'quiz_id',
          'type',
          'explanation',
          'order',
          'options',
        ],
      },
    ];

    // Test each collection
    for (const collection of collectionsToTest) {
      console.log(`Testing collection: ${collection.name}`);
      try {
        const { docs, totalDocs } = await payload.find({
          collection: collection.name,
          limit: 1,
        });

        console.log(
          `Collection ${collection.name} exists with ${totalDocs} documents`,
        );

        if (docs.length > 0) {
          const doc = docs[0];
          console.log(
            `Sample document from ${collection.name}:`,
            JSON.stringify(doc, null, 2),
          );

          // Check if required fields exist in the document
          const missingFields = collection.requiredFields.filter(
            (field) => !(field in doc),
          );

          if (missingFields.length > 0) {
            console.warn(
              `Warning: Document is missing required fields: ${missingFields.join(
                ', ',
              )}`,
            );
          } else {
            console.log(
              `Document has all required fields: ${collection.requiredFields.join(
                ', ',
              )}`,
            );
          }
        } else {
          console.log(`No documents found in ${collection.name}`);
        }
      } catch (error) {
        console.error(`Error testing collection ${collection.name}:`, error);
      }
    }

    // Test relationships
    console.log('\nTesting relationships...');

    // Test course_lessons to courses relationship
    try {
      const { docs: lessons } = await payload.find({
        collection: 'course_lessons',
        limit: 1,
      });

      if (lessons.length > 0) {
        const lesson = lessons[0];
        if (lesson.course_id) {
          console.log(`Lesson ${lesson.id} has course_id: ${lesson.course_id}`);

          // Try to find the course
          const { docs: courses } = await payload.find({
            collection: 'courses',
            query: {
              id: lesson.course_id,
            },
          });

          if (courses.length > 0) {
            console.log(`Found related course: ${courses[0].title}`);
          } else {
            console.warn(
              `Could not find related course with ID: ${lesson.course_id}`,
            );
          }
        } else {
          console.warn(`Lesson ${lesson.id} does not have a course_id`);
        }
      }
    } catch (error) {
      console.error(
        'Error testing course_lessons to courses relationship:',
        error,
      );
    }

    // Test quiz_questions to course_quizzes relationship
    try {
      const { docs: questions } = await payload.find({
        collection: 'quiz_questions',
        limit: 1,
      });

      if (questions.length > 0) {
        const question = questions[0];
        if (question.quiz_id) {
          console.log(
            `Question ${question.id} has quiz_id: ${question.quiz_id}`,
          );

          // Try to find the quiz
          const { docs: quizzes } = await payload.find({
            collection: 'course_quizzes',
            query: {
              id: question.quiz_id,
            },
          });

          if (quizzes.length > 0) {
            console.log(`Found related quiz: ${quizzes[0].title}`);
          } else {
            console.warn(
              `Could not find related quiz with ID: ${question.quiz_id}`,
            );
          }
        } else {
          console.warn(`Question ${question.id} does not have a quiz_id`);
        }
      }
    } catch (error) {
      console.error(
        'Error testing quiz_questions to course_quizzes relationship:',
        error,
      );
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
