// Import individual seeder functions
import { seedPrivatePosts } from '../seeders/seed-private-posts.js';
import { seedSurveys } from '../seeders/seed-surveys.js';
import { seedSurveyQuestions } from '../seeders/seed-survey-questions.js';
import { seedPosts } from '../seeders/seed-posts.js';
import { seedDocumentation } from '../seeders/seed-documentation.js';
export async function runStage2_SeedCore(payload, logger, cliArgs) {
    logger.info('Starting Stage 2: Core Content Seeding...');
    if (cliArgs.skipSeedCore) {
        logger.info('Stage 2: Skipped due to --skip-seed-core flag.');
        return {};
    }
    const aggregatedIdMaps = {};
    const executionOrder = [
        // Define execution order carefully.
        // Seed collections that are prerequisites for others first, or those with no dependencies.
        // For Stage 2, order is mainly about logical grouping or if one seeder's output (e.g. default category ID) is needed by another,
        // NOT for relationship linking (that's Stage 3).
        // Example Order:
        // { name: 'Users', seeder: () => seedUsers(payload, logger, cliArgs), collectionSlug: 'users' }, // If custom users are seeded
        // { name: 'Downloads (Media)', seeder: () => seedDownloads(payload, logger, cliArgs), collectionSlug: 'downloads' }, // Or 'media'
        // { name: 'Courses', seeder: () => seedCourses(payload, logger, cliArgs), collectionSlug: 'courses' },
        // { name: 'Course Lessons', seeder: () => seedCourseLessons(payload, logger, cliArgs), collectionSlug: 'courseLessons' }, // Check exact slug
        // { name: 'Quiz Questions', seeder: () => seedQuizQuestions(payload, logger, cliArgs), collectionSlug: 'quizQuestions' }, // Check exact slug
        // { name: 'Course Quizzes', seeder: () => seedCourseQuizzes(payload, logger, cliArgs), collectionSlug: 'courseQuizzes' }, // Check exact slug
        { name: 'Surveys', seeder: () => seedSurveys(payload, logger, cliArgs), collectionSlug: 'surveys' },
        { name: 'Survey Questions', seeder: () => seedSurveyQuestions(payload, logger, cliArgs), collectionSlug: 'survey_questions' }, // Corrected slug
        { name: 'Posts', seeder: () => seedPosts(payload, logger, cliArgs), collectionSlug: 'posts' },
        { name: 'Documentation', seeder: () => seedDocumentation(payload, logger, cliArgs), collectionSlug: 'documentation' },
        { name: 'Private Posts', seeder: () => seedPrivatePosts(payload, logger, cliArgs), collectionSlug: 'private' }, // Corrected slug
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
            logger.info(`Seeding ${item.name} completed. ${Object.keys(idMap).length / (Object.values(idMap).some(id => id?.includes('-')) ? 2 : 1)} unique items processed.`); // Adjust count if mapping both slug and id
        }
        logger.info('Stage 2: Core Content Seeding completed successfully.');
        logger.debug({ aggregatedIdMaps }, 'Aggregated ID Maps from Stage 2');
        return aggregatedIdMaps;
    }
    catch (error) {
        logger.error({ err: error }, 'Error during Stage 2: Core Content Seeding.');
        // Consider if partial aggregatedIdMaps should be returned or if it's an all-or-nothing
        throw error; // Propagate to main orchestrator
    }
}
//# sourceMappingURL=stage2-seed-core-content.js.map