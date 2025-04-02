/**
 * Script to run the seed-course-data script
 */
import { seedCourseData } from './seed-course-data.js';

// Run the seed function
seedCourseData().catch((error) => {
  console.error('Course data seeding failed:', error);
  process.exit(1);
});
