# Payload Refactor: Stage 3 Plan - Populate Relationships

**Version:** 1.0
**Date:** May 8, 2025

## 1. Objective

Programmatically establish all necessary relationships between documents in the Payload CMS database using the defined Single Sources of Truth (SSOT) files and Payload's Local API. This stage follows the successful completion of Stage 1 (Payload App Setup) and Stage 2 (Core Content Seeding).

## 2. Relationships to Populate

Based on SSOT files and likely collection structures, the following key relationships need to be populated:

- **Course <-> CourseLessons:** Linking lessons to their parent course.
  - _SSOT:_ Likely derived implicitly from `lessons_structured_content.yaml` or requires a dedicated mapping. (Needs verification during implementation).
  - _Collections:_ `courses`, `course-lessons`.
- **CourseLesson <-> CourseQuiz:** Linking lessons to their optional quiz.
  - _SSOT:_ `packages/content-migrations/src/data/definitions/lesson-quiz-relations.ts`.
  - _Collections:_ `course-lessons`, `course-quizzes`.
- **CourseQuiz <-> QuizQuestions:** Linking quizzes to their constituent questions.
  - _SSOT:_ `packages/content-migrations/src/data/quizzes-quiz-questions-truth.ts`.
  - _Collections:_ `course-quizzes`, `quiz-questions`.
- **CourseLesson <-> Downloads:** Linking lessons to associated downloadable files.
  - _SSOT:_ `packages/content-migrations/src/data/mappings/lesson-downloads-mappings.ts`.
  - _Collections:_ `course-lessons`, `downloads`.
- **Survey <-> SurveyQuestions:** Linking surveys to their questions.
  - _SSOT:_ Derived from survey YAML files in `packages/payload-local-init/data/raw/surveys/`.
  - _Collections:_ `surveys`, `survey-questions`.
- **Post <-> FeaturedImage (Downloads/Media):** Linking blog posts to their featured image.
  - _SSOT:_ Derived from post Markdoc frontmatter in `packages/payload-local-init/data/raw/posts/`. Requires mapping image path/ID to `downloads` collection ID.
  - _Collections:_ `posts`, `downloads`.
- **Documentation <-> Parent (Documentation):** Establishing the hierarchy within documentation pages.
  - _SSOT:_ Derived from documentation Markdoc frontmatter (`parent` field) in `packages/payload-local-init/data/raw/documentation/`.
  - _Collections:_ `documentation` (self-referencing).
- _(Potentially others based on full review of collections like `Posts <-> Downloads`, `Courses <-> Downloads`, etc. to be confirmed during implementation)_

## 3. Execution Order

The relationship population scripts must run in a dependency-aware sequence:

1.  Course <-> CourseLessons
2.  CourseLesson <-> CourseQuiz
3.  CourseQuiz <-> QuizQuestions
4.  CourseLesson <-> Downloads
5.  Survey <-> SurveyQuestions
6.  Post <-> FeaturedImage
7.  Documentation <-> Parent

## 4. Code Pattern (Payload Local API)

All relationship population scripts will be Node.js/TypeScript files utilizing `payload.update` via the Local API.

**General Pattern:**

```typescript
// Example: populate-lesson-quiz-relationships.ts
import payload from 'payload';

// Shared utility
import { lessonQuizRelations } from '../../data/definitions/lesson-quiz-relations';
import { getPayloadClient } from '../payload-client';

// SSOT

async function populateRelationships() {
  console.log('Populating Lesson <-> Quiz relationships...');
  const payloadClient = await getPayloadClient(); // Init Payload

  let successCount = 0;
  let errorCount = 0;

  for (const relation of lessonQuizRelations) {
    const { lessonSlug, quizSlug } = relation; // Identifiers from SSOT

    try {
      // 1. Find document IDs based on SSOT identifiers (slugs, etc.)
      const lesson =
        await payloadClient.find(/* ... find lesson by slug ... */);
      const quiz = await payloadClient.find(/* ... find quiz by slug ... */);

      if (!lesson.docs.length || !quiz.docs.length) {
        console.warn(
          `Skipping: Cannot find lesson ${lessonSlug} or quiz ${quizSlug}`,
        );
        errorCount++;
        continue;
      }
      const lessonId = lesson.docs[0].id;
      const quizId = quiz.docs[0].id;

      // 2. Update the parent document's relationship field
      await payloadClient.update({
        collection: 'course-lessons', // Parent collection slug
        id: lessonId,
        data: {
          // --- Use EXACT field name from Payload config ---
          quiz: quizId, // Example for hasOne relationship
          // questions: [{ relationTo: 'quiz-questions', value: questionId }], // Example for hasMany
        },
      });

      console.log(`Linked Lesson (${lessonSlug}) to Quiz (${quizSlug})`);
      successCount++;
    } catch (error: any) {
      console.error(
        `Error linking Lesson (${lessonSlug}) to Quiz (${quizSlug}):`,
        error.message,
      );
      errorCount++;
    }
  }

  console.log(
    `Population complete. Success: ${successCount}, Errors: ${errorCount}`,
  );
  // Handle errors (e.g., throw if errorCount > 0)
}

populateRelationships().catch((err) => {
  /* handle script failure */
});
```

**Key Requirements:**

- Use a shared utility (`payload-client.ts`) for Payload initialization.
- Read data directly from SSOT files.
- Reliably look up document UUIDs.
- Use the **exact** relationship field name from the Payload collection config.
- Format the `data` payload correctly for `hasOne` vs. `hasMany` relationships.
- Implement robust logging and error handling per script.

## 5. Script Structure

Create scripts within `packages/payload-local-init/stage-3-populate-relationships/`:

- `payload-client.ts` (Shared utility)
- `populate-course-lesson-relationships.ts`
- `populate-lesson-quiz-relationships.ts`
- `populate-quiz-question-relationships.ts`
- `populate-lesson-download-relationships.ts`
- `populate-survey-question-relationships.ts`
- `populate-post-image-relationships.ts`
- `populate-documentation-hierarchy.ts`
- _(Add others as needed)_

## 6. Orchestration Update (`Initialize-PayloadData.ps1`)

Modify the `Execute-Stage -Stage 3` block to call these scripts sequentially using `pnpm --filter @slideheroes/payload-local-init exec tsx ...`, including error checking after each call.

```powershell
# Stage 3: Populate Relationships
Execute-Stage -Stage 3 -Description "Populate Relationships" -ScriptBlock {
    Write-Host "Running populate-course-lesson-relationships..."
    Invoke-Expression "pnpm --filter @slideheroes/payload-local-init exec tsx ./stage-3-populate-relationships/populate-course-lesson-relationships.ts"
    # Check $LASTEXITCODE

    Write-Host "Running populate-lesson-quiz-relationships..."
    Invoke-Expression "pnpm --filter @slideheroes/payload-local-init exec tsx ./stage-3-populate-relationships/populate-lesson-quiz-relationships.ts"
    # Check $LASTEXITCODE

    # ... Add calls for all other relationship scripts in order ...

    Write-Host "Running populate-documentation-hierarchy..."
    Invoke-Expression "pnpm --filter @slideheroes/payload-local-init exec tsx ./stage-3-populate-relationships/populate-documentation-hierarchy.ts"
    # Check $LASTEXITCODE
}
```

## 7. Key Considerations for Implementation

- **Verify Field Names/Types:** The absolute first step is to check the actual Payload collection config files (`apps/payload/src/collections/*.ts`) to confirm collection slugs, relationship field names, and relationship types (`relationship` vs `array`, `hasOne` vs `hasMany`).
- **Performance:** Monitor script execution time. If `payload.update` proves too slow for bulk operations, revisit the strategy, but prioritize the API approach initially.
- **Error Handling:** Define how script failures should affect the overall orchestration (halt vs. continue with errors).
- **SSOT Data Format:** Ensure SSOT files contain easily usable identifiers (UUIDs preferred, slugs acceptable).
