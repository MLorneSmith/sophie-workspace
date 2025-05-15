# Implementation Plan: Task 4.5 - Develop Stage 3 (Relationship Population) Modules

**Version:** 1.0
**Date:** May 13, 2025
**Parent Task (Master Plan):** 4.5. Develop Stage 3 (Relationship Population) Modules
**Related Design Document:** `z.plan/payload-new-refactor/design/payload-refactor-design-requirements-v2.md`
**Depends On:**
*   Task 4.4: Stage 2 (Core Content Seeding) Modules are functional and produce accurate `AggregatedIdMaps`.
*   The main Node.js orchestrator (`initialize-payload-data.ts`) is capable of passing `AggregatedIdMaps` to the Stage 3 orchestrator.
*   Payload collection definitions (including relationship fields) are stable from Phase 1. The list of any simplified/commented-out fields is available.

## 1. Introduction

**Objective:** To implement the TypeScript modules for Stage 3: Relationship Population. This stage uses the live UUIDs (obtained from the `AggregatedIdMaps` generated in Stage 2) and relationship definitions from SSOT files to establish links between documents in different Payload CMS collections. All relationship updates will be performed using `payload.update()` via the Payload Local API.

## 2. Prerequisites

*   Stage 2 has successfully completed, and the `AggregatedIdMaps` object is available.
*   The main orchestrator passes the initialized Payload client, logger, CLI arguments, and `AggregatedIdMaps` to the Stage 3 orchestrator function.
*   SSOT files defining relationship intents are finalized and located in `apps/payload/src/init-scripts/data/` (e.g., in subdirectories like `relations/` or `definitions/`).

## 3. SSOT Data for Relationships

### 3.1. Review and Finalize Relationship SSOTs
*   **Action:**
    1.  Consolidate all files defining relationship *intent* into `apps/payload/src/init-scripts/data/relations/` or keep them with their primary entity definitions in `apps/payload/src/init-scripts/data/definitions/` if that's clearer (e.g., `quiz-definitions.ts` might define which questions belong to which quiz via SSOT IDs).
    2.  Ensure these files use consistent SSOT identifiers (e.g., unique string keys or slugs defined in the core SSOT data) for both parent and child entities. These SSOT identifiers will be used to look up live UUIDs from the `AggregatedIdMaps`.
    *   Example: `lesson-quiz-relations.ts` might map a lesson's SSOT ID/slug to a quiz's SSOT ID/slug.
    *   Example: `quiz-definitions.ts` might list, for each quiz (identified by its SSOT ID), an array of SSOT IDs of its questions.

### 3.2. Zod Schema Validation for Relationship SSOTs
*   **Action:** For any structured SSOT files that define relationships (e.g., a TS file exporting an array of objects where each object defines a parent-child link using SSOT IDs):
    1.  Create corresponding Zod schemas in `apps/payload/src/init-scripts/data/schemas/` (e.g., `lesson-quiz-relation.schema.ts`).
    2.  Each linker function will validate its specific relationship SSOT data before processing.

## 4. Stage 3 Orchestrator Module

**File:** `apps/payload/src/init-scripts/stages/stage3-populate-relationships.ts`

### 4.1. Function Definition
```typescript
// apps/payload/src/init-scripts/stages/stage3-populate-relationships.ts
import type { Payload } from 'payload';
import type { Logger } from 'pino';
import type { AggregatedIdMaps } from './stage2-seed-core-content'; // Ensure this type is correctly defined and exported

// Import individual linker functions
// e.g., import { linkLessonQuizzes } from '../linkers/link-lesson-quizzes';

interface Stage3Args {
  skipPopulateRelationships?: boolean;
  // Potentially other args
}

export async function runStage3_PopulateRelationships(
  payload: Payload,
  logger: Logger,
  cliArgs: Stage3Args,
  idMaps: AggregatedIdMaps, // Received from Stage 2
): Promise<void> {
  logger.info('Starting Stage 3: Populate Relationships...');

  if (cliArgs.skipPopulateRelationships) {
    logger.info('Stage 3: Skipped due to --skip-populate-relationships flag.');
    return;
  }

  if (!idMaps || Object.keys(idMaps).length === 0) {
    logger.warn('Stage 3: Received empty or undefined idMaps from Stage 2. Skipping relationship population.');
    return;
  }

  try {
    // Define execution order for linkers.
    // Consider dependencies: e.g., if Collection B links to Collection A,
    // and Collection C links to Collection B, ensure A->B links are done before B->C.
    // However, most Stage 3 links are from Parent (created in Stage 2) to Child (created in Stage 2).

    // Example Order:
    // await linkCourseLessons(payload, logger, cliArgs, idMaps); // Course -> Lessons
    // await linkLessonQuiz(payload, logger, cliArgs, idMaps);    // Lesson -> Quiz
    // await linkQuizQuestions(payload, logger, cliArgs, idMaps); // Quiz -> QuizQuestions
    // await linkLessonDownloads(payload, logger, cliArgs, idMaps); // Lesson -> Downloads
    // await linkSurveyQuestions(payload, logger, cliArgs, idMaps); // Survey -> SurveyQuestions
    // await linkPostFeaturedImage(payload, logger, cliArgs, idMaps); // Post -> Media
    // await linkDocumentationHierarchy(payload, logger, cliArgs, idMaps); // Doc -> Parent Doc

    logger.info('Stage 3: Populate Relationships completed successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Error during Stage 3: Populate Relationships.');
    throw error; // Propagate to main orchestrator
  }
}
```

## 5. Individual Relationship Linker Functions

**Location:** `apps/payload/src/init-scripts/linkers/` (e.g., `link-lesson-quizzes.ts`)

### 5.1. General Pattern for a Linker (e.g., `link-lesson-quiz.ts`)
```typescript
// apps/payload/src/init-scripts/linkers/link-lesson-quiz.ts
import type { Payload } from 'payload';
import type { Logger } from 'pino';
import type { AggregatedIdMaps } from '../stages/stage2-seed-core-content';
// SSOT data for this specific relationship
// import { LESSON_QUIZ_SSOT_RELATIONS } from '../../data/relations/lesson-quiz-ssot-relations'; 
// Zod schema for this SSOT data
// import { LessonQuizRelationSSOTSchema } from '../../data/schemas/lesson-quiz-ssot-relation.schema';

interface LinkerArgs { /* Potentially specific args */ }

export async function linkLessonQuiz(
  payload: Payload,
  logger: Logger,
  cliArgs: LinkerArgs, // Or use general Stage3Args
  idMaps: AggregatedIdMaps,
): Promise<void> {
  const parentCollectionSlug = 'course-lessons';
  const childCollectionSlug = 'course-quizzes';
  const relationshipName = 'relatedQuiz'; // The field name in CourseLesson collection

  logger.info(`Linking ${parentCollectionSlug} to ${childCollectionSlug} via field '${relationshipName}'...`);

  // 1. Load and Validate SSOT Data for this relationship
  // const ssotRelations = LESSON_QUIZ_SSOT_RELATIONS;
  // try {
  //   LessonQuizRelationSSOTSchema.array().parse(ssotRelations);
  //   logger.info(`SSOT data for ${relationshipName} validated.`);
  // } catch (error) {
  //   logger.error({ err: error }, `Invalid SSOT data for ${relationshipName}.`);
  //   throw error;
  // }

  // for (const relation of ssotRelations) {
  //   const ssotParentKey = relation.lessonSsotId; // Key from SSOT for parent
  //   const ssotChildKey = relation.quizSsotId;   // Key from SSOT for child

  //   try {
  //     // 2. Lookup Live Parent UUID from idMaps
  //     const liveParentId = idMaps[parentCollectionSlug]?.[ssotParentKey];
  //     if (!liveParentId) {
  //       logger.warn({ ssotParentKey, parentCollectionSlug }, `Parent document not found in idMaps. Skipping relation.`);
  //       continue;
  //     }

  //     // 3. Lookup Live Child UUID from idMaps
  //     // For 'hasOne' relationship, child can be null/optional
  //     let liveChildId: string | undefined | null = undefined; 
  //     if (ssotChildKey) { // If a child is specified in SSOT
  //       liveChildId = idMaps[childCollectionSlug]?.[ssotChildKey];
  //       if (!liveChildId) {
  //         logger.warn({ ssotChildKey, childCollectionSlug, ssotParentKey }, `Child document not found in idMaps for parent. Setting relationship to null/empty.`);
  //         // Depending on field type, you might set to null (for hasOne) or empty array (for hasMany)
  //       }
  //     }
        
  //     // 4. Prepare data for payload.update()
  //     // IMPORTANT: Only attempt to set this relationship if the 'relationshipName' field
  //     // is active in the parentCollection's definition (from Phase 1).
  //     // This check might be complex to do dynamically here; rely on Phase 1 documentation.
  //     const updateData = {
  //       [relationshipName]: liveChildId ? liveChildId : null, // For hasOne, set to ID or null
  //     };
        
  //     // For hasMany, it would be an array of IDs:
  //     // const liveChildIds = relation.ssotChildKeys.map(key => idMaps[childCollectionSlug]?.[key]).filter(Boolean);
  //     // const updateData = { [relationshipName]: liveChildIds };

  //     // 5. Call payload.update()
  //     await payload.update({
  //       collection: parentCollectionSlug,
  //       id: liveParentId,
  //       data: updateData,
  //     });

  //     logger.debug({ liveParentId, liveChildId, relationshipName }, `Successfully linked.`);
  //   } catch (itemError) {
  //     logger.error({ err: itemError, ssotParentKey, ssotChildKey, relationshipName }, `Failed to link relationship.`);
  //     // Optionally, collect errors and report at the end, or throw to stop.
  //   }
  // }
  logger.info(`Finished linking ${parentCollectionSlug} to ${childCollectionSlug}.`);
}
```

### 5.2. List of Individual Linker Modules to Create:
*   `link-course-lessons.ts` (Course `lessons` field -> CourseLesson docs)
*   `link-lesson-quiz.ts` (CourseLesson `relatedQuiz` field -> CourseQuiz doc)
*   `link-quiz-questions.ts` (CourseQuiz `questions` field -> QuizQuestion docs)
*   `link-lesson-downloads.ts` (CourseLesson `downloads` field -> Download docs)
*   `link-survey-questions.ts` (Survey `questions` field -> SurveyQuestion docs)
*   `link-post-featured-image.ts` (Post `featuredImage` field -> Media/Download doc)
*   `link-documentation-hierarchy.ts` (Documentation `parent` field -> Documentation doc)
*   *(Add others as identified in Design V2 or SSOT review)*

### 5.3. Key Considerations for Linkers:
*   **Field Names:** Use the exact field name from the Payload collection definition.
*   **Data Format for `payload.update`:**
    *   For `hasOne` (relationship to single doc): `data: { myField: 'child_doc_uuid' }` or `data: { myField: null }`.
    *   For `hasMany` (relationship to multiple docs): `data: { myField: ['child1_uuid', 'child2_uuid'] }`.
*   **Polymorphic Relationships:** If `relationTo` can be multiple collections, the data format is `data: { myField: { relationTo: 'actual_child_collection_slug', value: 'child_doc_uuid' } }` or an array of such objects for `hasMany`. Assume non-polymorphic unless SSOTs specify otherwise.
*   **Simplified Fields:** If a relationship field was commented out during Phase 1 stabilization, the linker for that relationship should either be skipped or its `payload.update` call should be conditional/omitted, with a log message.

## 6. Integration with Main Orchestrator

*   In `apps/payload/src/init-scripts/initialize-payload-data.ts`:
    *   Import `runStage3_PopulateRelationships` from `../stages/stage3-populate-relationships`.
    *   Call it after Stage 2: `if (!cliArgs.skipPopulateRelationships) { await runStage3_PopulateRelationships(payloadClient, logger, cliArgs, idMaps); }`

## 7. Testing Strategy

*   **Individual Linker Integration Tests:**
    *   Modify `initialize-payload-data.ts` to run Stages 0, 1, 2, and then *only one specific linker function* from Stage 3.
    *   Run `pnpm --filter payload run init:data --skip-verification`.
    *   **Verify:**
        *   Relationships are correctly established. Check the parent document's JSONB field (e.g., via `payload.findByID({ collection: 'parent', id: '...', depth: 0 })`).
        *   Check the corresponding `_rels` table directly in the database.
        *   Use Payload Admin UI to visually confirm linked documents.
        *   Fetch parent with `depth: 1` via API/`payload.findByID` and check if related data is populated.
        *   Logs show success or clear errors.
*   **Full Stage 3 Test:**
    *   Run `pnpm --filter payload run init:data --skip-verification`.
    *   Perform spot checks on various relationships across different collections.

## 8. Deliverables for Task 4.5

*   The Stage 3 orchestrator module: `apps/payload/src/init-scripts/stages/stage3-populate-relationships.ts`.
*   All individual linker modules for each required relationship in `apps/payload/src/init-scripts/linkers/`.
*   Any new or refined SSOT files specifically for defining relationship intents, located in `apps/payload/src/init-scripts/data/relations/` or `definitions/`.
*   Zod schemas for these relationship SSOTs in `apps/payload/src/init-scripts/data/schemas/`.
*   Updated main orchestrator (`initialize-payload-data.ts`) to correctly invoke the Stage 3 orchestrator and pass the `AggregatedIdMaps`.
*   Successful test runs demonstrating correct population of all specified relationships.

This plan ensures that relationships are built using the correct live document IDs and leverages Payload's API for managing the underlying `_rels` tables and JSONB data.
