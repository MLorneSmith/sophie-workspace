# Implementation Plan: Task 4.4 - Develop Stage 2 (Core Content Seeding) Modules

**Version:** 1.0
**Date:** May 13, 2025
**Parent Task (Master Plan):** 4.4. Develop Stage 2 (Core Content Seeding) Modules
**Related Design Document:** `z.plan/payload-new-refactor/design/payload-refactor-design-requirements-v2.md`
**Depends On:**
*   Task 4.3: Stage 0 (DB Reset) & Stage 1 (Schema Apply) Modules are functional.
*   Phase 1: Payload CMS Application Setup & Stabilization is complete. A document detailing any collection field simplifications (`phase-1-collection-simplifications.md`) is available.

## 1. Introduction

**Objective:** To implement the TypeScript modules for Stage 2: Core Content Seeding. This stage is responsible for creating documents in Payload CMS collections based on Single Source of Truth (SSOT) files. It populates the primary attributes of these documents but does *not* establish relationships between them (that's for Stage 3). A key output of this stage is an aggregated map of SSOT identifiers to their live, database-generated UUIDs, which will be crucial for Stage 3.

## 2. Prerequisites

*   The main Node.js orchestrator (`initialize-payload-data.ts`) is capable of calling stage-specific modules.
*   The build process for `init-scripts` (Task 4.2) is operational.
*   Payload collections are defined and stable from Phase 1. The list of any temporarily simplified fields is available.
*   An initialized Payload client instance and a logger instance are passed from the main orchestrator to the Stage 2 orchestrator function.

## 3. SSOT Data Organization and Validation

### 3.1. Directory Structure for SSOTs
*   **Location:** All SSOT files will reside under `apps/payload/src/init-scripts/data/`.
*   **Subdirectories:**
    *   `definitions/`: For structured data definitions (e.g., `course-definitions.yaml`, `quiz-definitions.ts`).
    *   `raw/`: For raw content files (e.g., Markdown/Markdoc files for posts, documentation, lesson content if not in YAML/TS).
    *   `schemas/`: For Zod schema definition files (`*.schema.ts`) used to validate the SSOTs.

### 3.2. Review and Adapt SSOT Files
*   **Action:** Review all existing SSOT files.
    *   Move them to the new `apps/payload/src/init-scripts/data/` structure.
    *   Apply any structural changes identified in `z.plan/payload-refactor/Stage 2/2-refactor-ssot-files-plan.md` (e.g., `quiz-definitions.ts` consolidation, Lexical JSON as objects).
    *   Ensure filenames are consistent and descriptive.

### 3.3. Implement Zod Schemas for SSOT Validation
*   **Action:** For each structured SSOT file (e.g., `course-definitions.yaml`, `quiz-definitions.ts`):
    1.  Create a corresponding Zod schema file in `apps/payload/src/init-scripts/data/schemas/` (e.g., `course-definition.schema.ts`, `quiz-definition.schema.ts`).
    2.  Define the Zod schema to match the expected structure of the SSOT data.
*   **Usage:** Each individual seeder function will import its relevant Zod schema and use `schema.parse(data)` or `schema.safeParse(data)` to validate the SSOT data it loads *before* attempting to process and seed it. Validation failures should throw an error and halt that seeder, propagating to the main orchestrator.

## 4. Utility Functions

**Location:** `apps/payload/src/init-scripts/utils/`

### 4.1. `slugify.ts`
*   **Action:** Create or refine a utility function `generateSlug(text: string): string`.
*   **Requirements:** Produces URL-friendly slugs. Should be consistent with how Payload might generate slugs if its built-in slug generation is used, or follow project-specific rules.
*   **Testing:** Unit test with various inputs.

### 4.2. `lexical-converter.ts`
*   **Action:** Create a module for converting Markdown/Markdoc to Payload's Lexical JSON format.
*   **Function:** `markdownToLexical(markdown: string): Promise<LexicalRootNode>` (or similar signature).
*   **Implementation:**
    *   Investigate and use appropriate libraries (e.g., `unified` with `remark-parse`, and a remark-to-Lexical transformer, or a dedicated Markdown-to-Lexical library if one exists and is robust).
    *   Handle common elements: paragraphs, headings, lists, bold, italic, links, code blocks.
    *   Ensure output is a valid Lexical RootNode structure.
*   **Testing:** Unit test with various Markdown inputs and verify Lexical output structure.

### 4.3. `id-map-aggregator.ts` (Optional)
*   **Action:** If managing many ID maps becomes complex, create utilities to merge them safely.
*   **Function:** `mergeIdMaps(targetMap, sourceMap, collectionNameForLogging)`
*   **Consideration:** For now, simple object spread or `Object.assign` in the Stage 2 orchestrator might suffice.

## 5. Stage 2 Orchestrator Module

**File:** `apps/payload/src/init-scripts/stages/stage2-seed-core-content.ts`

### 5.1. Function Definition
```typescript
// apps/payload/src/init-scripts/stages/stage2-seed-core-content.ts
import type { Payload } from 'payload';
import type { Logger } from 'pino'; // Or your chosen logger type
// Import individual seeder functions
// e.g., import { seedCourses } from '../seeders/seed-courses';

// Define a clear type for the aggregated ID maps
export interface AggregatedIdMaps {
  [collectionSlug: string]: Record<string, string>; // e.g., courses: { 'ssot-course-1': 'live-uuid-course-1' }
}

interface Stage2Args {
  skipSeedCore?: boolean;
  // Potentially other args like --force-seed-collection <slug>
}

export async function runStage2_SeedCore(
  payload: Payload,
  logger: Logger,
  cliArgs: Stage2Args,
): Promise<AggregatedIdMaps> {
  logger.info('Starting Stage 2: Core Content Seeding...');

  if (cliArgs.skipSeedCore) {
    logger.info('Stage 2: Skipped due to --skip-seed-core flag.');
    return {}; // Return empty map if skipped
  }

  const aggregatedIdMaps: AggregatedIdMaps = {};

  try {
    // Define execution order for seeders carefully
    // Seed independent collections or those with fewer dependencies first.
    
    logger.info('Seeding Users (if applicable)...');
    // aggregatedIdMaps.users = await seedUsers(payload, logger, cliArgs);

    logger.info('Seeding Media/Downloads...');
    // aggregatedIdMaps.downloads = await seedDownloads(payload, logger, cliArgs);
    
    logger.info('Seeding Courses...');
    // aggregatedIdMaps.courses = await seedCourses(payload, logger, cliArgs);

    logger.info('Seeding Course Lessons...');
    // aggregatedIdMaps.courseLessons = await seedCourseLessons(payload, logger, cliArgs);
    
    // ... Add calls for all other seeders in logical order ...
    // e.g., QuizQuestions before CourseQuizzes if Quizzes reference Questions by ID during its own seeding (though relationships are Stage 3)
    // For Stage 2, the order is less critical for relationships, but might matter if one seeder's output (like a default category ID) is needed by another.

    logger.info('Seeding Quiz Questions...');
    // aggregatedIdMaps.quizQuestions = await seedQuizQuestions(payload, logger, cliArgs);

    logger.info('Seeding Course Quizzes...');
    // aggregatedIdMaps.courseQuizzes = await seedCourseQuizzes(payload, logger, cliArgs);
    
    // ... Posts, Documentation, Surveys, SurveyQuestions etc.

    logger.info('Stage 2: Core Content Seeding completed successfully.');
    return aggregatedIdMaps;
  } catch (error) {
    logger.error({ err: error }, 'Error during Stage 2: Core Content Seeding.');
    throw error; // Propagate to main orchestrator
  }
}
```

## 6. Individual Seeder Functions

**Location:** `apps/payload/src/init-scripts/seeders/` (e.g., `seed-courses.ts`, `seed-lessons.ts`)

### 6.1. General Pattern for an Individual Seeder (e.g., `seed-courses.ts`)
```typescript
// apps/payload/src/init-scripts/seeders/seed-courses.ts
import type { Payload } from 'payload';
import type { Logger } from 'pino';
// Example: Assuming SSOT data and Zod schema are defined
// import { ALL_COURSE_DEFINITIONS } from '../../data/definitions/course-definitions';
// import { CourseDefinitionSchema } from '../../data/schemas/course-definition.schema';
// import { generateSlug } from '../../utils/slugify'; // Example utility

interface SeederArgs { /* Potentially specific args for this seeder */ }

// Each seeder returns a map of its SSOT IDs to live DB IDs
export async function seedCourses(
  payload: Payload,
  logger: Logger,
  cliArgs: SeederArgs, // Or use the general Stage2Args
): Promise<Record<string, string>> {
  const collectionSlug = 'courses';
  logger.info(`Starting seeder for collection: ${collectionSlug}...`);
  const idMap: Record<string, string> = {};

  // 1. Load and Validate SSOT Data
  // const ssotCourses = ALL_COURSE_DEFINITIONS; // Load your SSOT data
  // try {
  //   CourseDefinitionSchema.array().parse(ssotCourses); // Validate the entire array
  //   logger.info(`SSOT data for ${collectionSlug} validated successfully.`);
  // } catch (error) {
  //   logger.error({ err: error, collectionSlug }, `Invalid SSOT data structure for ${collectionSlug}.`);
  //   throw error;
  // }

  // for (const courseData of ssotCourses) {
  //   const ssotId = courseData.id; // Assuming SSOT items have a unique 'id' or key
  //   const itemTitle = courseData.title; // For logging
  //   logger.debug({ ssotId, itemTitle }, `Processing ${collectionSlug} item...`);

  //   try {
  //     const slug = courseData.slug || generateSlug(itemTitle); // Use provided slug or generate
        
  //     // 2. Prepare data for Payload, respecting simplified schema from Phase 1
  //     const dataToCreate: Partial<CoursePayloadType> = { // Use Partial from generated types
  //       title: itemTitle,
  //       slug: slug,
  //       description: courseData.description, // Example field
  //       // ... other core fields ...
  //       // IMPORTANT: Only include fields that are currently active in the
  //       // collection definition (apps/payload/src/collections/Courses.ts)
  //       // as per phase-1-collection-simplifications.md.
  //       // If a field was commented out in Phase 1, do not try to seed it here.
  //     };

  //     // 3. "Create if not exists" logic (by slug or another unique business key)
  //     let liveDocId: string;
  //     const existing = await payload.find({
  //       collection: collectionSlug,
  //       where: { slug: { equals: slug } },
  //       limit: 1,
  //       depth: 0, // No need to populate relationships here
  //     });

  //     if (existing.docs.length > 0) {
  //       liveDocId = existing.docs[0].id;
  //       logger.info({ slug, liveDocId }, `Found existing ${collectionSlug} document.`);
  //       // Optionally, update existing document if needed, but Stage 2 is primarily for creation
  //       // await payload.update({ collection: collectionSlug, id: liveDocId, data: dataToUpdate });
  //     } else {
  //       const newDoc = await payload.create({
  //         collection: collectionSlug,
  //         data: dataToCreate,
  //       });
  //       liveDocId = newDoc.id;
  //       logger.info({ slug, liveDocId }, `Created new ${collectionSlug} document.`);
  //     }
        
  //     idMap[ssotId] = liveDocId;

  //   } catch (itemError) {
  //     logger.error({ err: itemError, ssotId, itemTitle, collectionSlug }, `Failed to process item for ${collectionSlug}.`);
  //     // Decide on error strategy: throw to stop all, or collect errors and continue?
  //     // For Stage 2, it might be better to throw on first critical error to avoid cascading issues.
  //     throw itemError;
  //   }
  // }

  logger.info(`Seeder for collection: ${collectionSlug} completed. ${Object.keys(idMap).length} items processed.`);
  return idMap;
}
```

### 6.2. List of Individual Seeder Modules to Create:
*   `seed-users.ts` (if custom users beyond admin are needed for seeding context)
*   `seed-media.ts` (or `seed-downloads.ts`):
    *   This is complex if files need to be uploaded to R2 first.
    *   If files are pre-uploaded, this seeder creates Payload `media`/`downloads` documents pointing to them.
    *   Requires SSOT for file metadata (filename, R2 key/URL, title, alt text).
*   `seed-courses.ts`
*   `seed-course-lessons.ts` (may need `lexical-converter` for lesson content)
*   `seed-quiz-questions.ts` (may need `lexical-converter` for explanations)
*   `seed-course-quizzes.ts`
*   `seed-surveys.ts`
*   `seed-survey-questions.ts`
*   `seed-posts.ts` (may need `lexical-converter` for post body)
*   `seed-documentation.ts` (may need `lexical-converter`)
*   `seed-private-posts.ts` (if this is a distinct collection)

## 7. Integration with Main Orchestrator

*   In `apps/payload/src/init-scripts/initialize-payload-data.ts`:
    *   Import `runStage2_SeedCore` from `../stages/stage2-seed-core-content`.
    *   Call it: `const idMaps = cliArgs.skipSeedCore ? {} : await runStage2_SeedCore(payloadClient, logger, cliArgs);`
    *   Pass the returned `idMaps` to the `runStage3_PopulateRelationships` function.

## 8. Testing Strategy

*   **Unit Tests:** For all utility functions (`slugify`, `lexical-converter`, Zod schemas).
*   **Individual Seeder Integration Tests:**
    *   Modify `initialize-payload-data.ts` to run Stage 0, Stage 1, and then *only one specific seeder function* from Stage 2.
    *   Run `pnpm --filter payload run init:data --skip-populate-relationships --skip-verification`.
    *   Verify:
        *   Correct documents are created in the database (check via Payload Admin or direct DB query).
        *   The seeder function returns the correct ID map structure.
        *   Logs indicate success or clear errors.
*   **Full Stage 2 Test:**
    *   Run `pnpm --filter payload run init:data --skip-populate-relationships --skip-verification`.
    *   Verify:
        *   All collections are populated with their core data.
        *   The `runStage2_SeedCore` function returns a comprehensive `aggregatedIdMaps` object.
        *   The main orchestrator logs this map or makes it available for inspection.

## 9. Deliverables for Task 4.4

*   The Stage 2 orchestrator module: `apps/payload/src/init-scripts/stages/stage2-seed-core-content.ts`.
*   All individual seeder modules for each relevant collection in `apps/payload/src/init-scripts/seeders/`.
*   SSOT data files correctly structured and located in `apps/payload/src/init-scripts/data/`.
*   Zod schemas for SSOT validation in `apps/payload/src/init-scripts/data/schemas/`.
*   Utility functions (slugification, Lexical conversion) in `apps/payload/src/init-scripts/utils/`.
*   Updated main orchestrator (`initialize-payload-data.ts`) to correctly invoke and handle output from the Stage 2 orchestrator.
*   Documentation/notes on the structure of `AggregatedIdMaps`.
*   Successful test runs demonstrating that core content for all collections is seeded and ID maps are generated.

This plan provides a detailed structure for implementing the core data seeding capabilities of the new initialization system.
