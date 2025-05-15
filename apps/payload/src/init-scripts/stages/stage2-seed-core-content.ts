import type { Payload, SanitizedConfig } from 'payload';
import type { Logger as PinoLogger } from 'pino';

// Import individual seeder functions
import { seedPrivatePosts } from '../seeders/seed-private-posts.js';
import { seedSurveys } from '../seeders/seed-surveys.js';
import { seedSurveyQuestions } from '../seeders/seed-survey-questions.js';
import { seedPosts } from '../seeders/seed-posts.js';
import { seedDocumentation } from '../seeders/seed-documentation.js';
// Import other seeders as they are implemented
// import { seedUsers } from '../seeders/seed-users.js';
// import { seedDownloads } from '../seeders/seed-downloads.js';
// import { seedCourses } from '../seeders/seed-courses.js';
// import { seedCourseLessons } from '../seeders/seed-course-lessons.js';
// import { seedQuizQuestions } from '../seeders/seed-quiz-questions.js';
// import { seedCourseQuizzes } from '../seeders/seed-course-quizzes.js';


export interface AggregatedIdMaps {
  [collectionSlug: string]: Record<string, string | undefined>; // e.g., courses: { 'ssot-course-1-slug': 'live-uuid-course-1' }
}

export interface Stage2Args {
  skipSeedCore?: boolean;
  // Add other specific args if needed, e.g., --force-seed-collection <slug>
}

export async function runStage2_SeedCore(
  payload: Payload,
  logger: PinoLogger,
  cliArgs: Stage2Args,
  config: SanitizedConfig, // Add Payload config parameter
): Promise<AggregatedIdMaps> {
  logger.info('Starting Stage 2: Core Content Seeding...');

  if (cliArgs.skipSeedCore) {
    logger.info('Stage 2: Skipped due to --skip-seed-core flag.');
    return {};
  }

  const aggregatedIdMaps: AggregatedIdMaps = {};
  const executionOrder: Array<{ name: string; seeder: () => Promise<Record<string, string | undefined>>; collectionSlug: string }> = [
    // Define execution order carefully.
    // Seed collections that are prerequisites for others first, or those with no dependencies.
    // For Stage 2, order is mainly about logical grouping or if one seeder's output (e.g. default category ID) is needed by another,
    // NOT for relationship linking (that's Stage 3).

    // Example Order:
    // { name: 'Users', seeder: () => seedUsers(payload, logger, cliArgs), collectionSlug: 'users' }, // If custom users are seeded
    // { name: 'Downloads (Media)', seeder: () => seedDownloads(payload, logger, cliArgs), collectionSlug: 'downloads' }, // Or 'media'
    // { name: 'Courses', seeder: () => seedCourses(payload, logger, cliArgs, config), collectionSlug: 'courses' },
    // { name: 'Course Lessons', seeder: () => seedCourseLessons(payload, logger, cliArgs, config), collectionSlug: 'courseLessons' }, // Check exact slug
    // { name: 'Quiz Questions', seeder: () => seedQuizQuestions(payload, logger, cliArgs, config), collectionSlug: 'quizQuestions' }, // Check exact slug
    // { name: 'Course Quizzes', seeder: () => seedCourseQuizzes(payload, logger, cliArgs, config), collectionSlug: 'courseQuizzes' }, // Check exact slug
    { name: 'Surveys', seeder: () => seedSurveys(payload, logger, cliArgs, config), collectionSlug: 'surveys' },
    { name: 'Survey Questions', seeder: () => seedSurveyQuestions(payload, logger, cliArgs, config), collectionSlug: 'survey_questions' }, // Corrected slug
    { name: 'Posts', seeder: () => seedPosts(payload, logger, cliArgs, config), collectionSlug: 'posts' },
    { name: 'Documentation', seeder: () => seedDocumentation(payload, logger, cliArgs, config), collectionSlug: 'documentation' },
    { name: 'Private Posts', seeder: () => seedPrivatePosts(payload, logger, cliArgs, config), collectionSlug: 'private' }, // Corrected slug
  ];

  try {
    for (const item of executionOrder) {
      logger.info(`Seeding ${item.name}...`);
      const idMap = await item.seeder();
      if (Object.keys(idMap).length > 0) {
        aggregatedIdMaps[item.collectionSlug] = {
          ...(aggregatedIdMaps[item.collectionSlug] || {}),
          ...idMap,
        };
      }
      logger.info(`Seeding ${item.name} completed. ${Object.keys(idMap).length / (Object.values(idMap).some(id => id?.includes('-')) ? 2 : 1) } unique items processed.`); // Adjust count if mapping both slug and id
    }

    logger.info('Stage 2: Core Content Seeding completed successfully.');
    logger.debug({ aggregatedIdMaps }, 'Aggregated ID Maps from Stage 2');
    return aggregatedIdMaps;
  } catch (error) {
    logger.error({ err: error }, 'Error during Stage 2: Core Content Seeding.');
    // Consider if partial aggregatedIdMaps should be returned or if it's an all-or-nothing
    throw error; // Propagate to main orchestrator
  }
}
