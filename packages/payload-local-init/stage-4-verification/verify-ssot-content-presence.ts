// verify-ssot-content-presence.ts
import console from 'console';
import crypto from 'crypto';
import fs from 'fs/promises';
import grayMatter from 'gray-matter';
import yaml from 'js-yaml';
import path from 'path';
import type { Payload } from 'payload';

import {
  QuizDefinition,
  QuizQuestionDefinition,
  QuizQuestionOption,
} from '../data/definitions/quiz-types.js';
// Adjusted path
import {
  ALL_QUIZ_QUESTIONS,
  QUIZZES as SSOT_QUIZZES,
} from '../data/quizzes-quiz-questions-truth.js';
import { getPayloadClient } from '../stage-3-populate-relationships/payload-client';

console.log('Executing verify-ssot-content-presence.ts - TOP OF FILE');

async function readSsotFile<T>(filePath: string): Promise<T | undefined> {
  // Return T not T[] for single file
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    const fileContent = await fs.readFile(fullPath, 'utf-8');
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      return yaml.load(fileContent) as T;
    } else if (filePath.endsWith('.json')) {
      return JSON.parse(fileContent) as T;
    } else if (filePath.endsWith('.mdoc') || filePath.endsWith('.md')) {
      const { data } = grayMatter(fileContent);
      return data as T;
    }
    console.warn(`Unsupported SSOT file type for direct read: ${filePath}`);
    return undefined;
  } catch (error: any) {
    console.error(`Error reading SSOT file ${filePath}: ${error.message}`);
    return undefined;
  }
}

type SsotCourse = { id?: string; title: string; slug: string }; // id might not be in YAML for single course
type SsotLesson = {
  id: string;
  title: string;
  slug: string;
  lesson_number?: number;
};

async function verifySsotContentPresence() {
  console.log('Starting Stage 4: Verify SSOT Content Presence...');
  const payloadClient: Payload = await getPayloadClient(true);
  let totalErrors = 0;
  let totalSuccesses = 0;

  const verifications = [
    {
      collectionSlug: 'courses',
      ssotPath: 'data/raw/courses/default-course.yaml',
      fieldsToVerify: ['title', 'slug'],
      idField: 'slug', // Use slug for courses from single YAML
      isSingleDoc: true,
    },
    {
      collectionSlug: 'course_lessons',
      ssotPath: 'data/definitions/lessons_structured_content.yaml', // This is a YAML file exporting an object with a 'lessons' array
      fieldsToVerify: ['title', 'slug', 'lesson_number'],
      idField: 'id',
      dataPath: 'lessons', // Path to the array within the YAML
    },
  ];

  for (const verification of verifications) {
    console.log(
      `\nVerifying collection (file SSOT): ${verification.collectionSlug}`,
    );
    const rawSsotData = await readSsotFile<any>(verification.ssotPath);

    if (!rawSsotData) {
      console.error(
        `ERROR: Could not load or parse SSOT data for ${verification.collectionSlug} from ${verification.ssotPath}`,
      );
      totalErrors++;
      continue;
    }

    let itemsToProcess: any[] = [];
    if (verification.isSingleDoc) {
      itemsToProcess = [rawSsotData]; // Wrap single doc in an array for consistent processing
    } else if (verification.dataPath) {
      itemsToProcess = rawSsotData[verification.dataPath] || [];
      if (!Array.isArray(itemsToProcess)) {
        console.error(
          `ERROR: Expected an array at path '${verification.dataPath}' in ${verification.ssotPath}`,
        );
        totalErrors++;
        continue;
      }
    } else if (Array.isArray(rawSsotData)) {
      itemsToProcess = rawSsotData;
    } else {
      itemsToProcess = [rawSsotData]; // Fallback for single object SSOTs not marked as such
    }

    for (const ssotItem of itemsToProcess) {
      const lookupValue = ssotItem[verification.idField];
      if (!lookupValue && !verification.isSingleDoc) {
        // For single doc, ID might not be in SSOT file itself
        console.warn(
          `WARN: SSOT item in ${verification.ssotPath} for ${verification.collectionSlug} is missing ID field '${verification.idField}'. Item:`,
          JSON.stringify(ssotItem, null, 2).substring(0, 200) + '...',
        );
        continue;
      }

      try {
        let doc: any;
        if (verification.isSingleDoc && verification.idField === 'slug') {
          const result = await payloadClient.find({
            collection: verification.collectionSlug as any,
            where: { [verification.idField]: { equals: lookupValue } },
            depth: 0,
            limit: 1,
          });
          doc = result.docs && result.docs.length > 0 ? result.docs[0] : null;
        } else {
          doc = await payloadClient.findByID({
            collection: verification.collectionSlug as any,
            id: lookupValue,
            depth: 0,
          });
        }

        if (!doc) {
          console.error(
            `ERROR: [${verification.collectionSlug}] Document with ${verification.idField} '${lookupValue}' defined in SSOT not found in database.`,
          );
          totalErrors++;
          continue;
        }

        let itemHasError = false;
        for (const field of verification.fieldsToVerify) {
          const dbValue = doc[field];
          const ssotValue = ssotItem[field];
          let isMatch = dbValue === ssotValue;

          if (
            !isMatch &&
            ((dbValue === null && typeof ssotValue === 'undefined') ||
              (typeof dbValue === 'undefined' && ssotValue === null))
          ) {
            isMatch = true;
          }
          if (
            typeof dbValue === 'number' &&
            typeof ssotValue === 'string' &&
            dbValue === parseFloat(ssotValue)
          ) {
            isMatch = true;
          }
          if (
            typeof ssotValue === 'number' &&
            typeof dbValue === 'string' &&
            ssotValue === parseFloat(dbValue)
          ) {
            isMatch = true;
          }

          if (!isMatch) {
            if (JSON.stringify(dbValue) !== JSON.stringify(ssotValue)) {
              console.error(
                `ERROR: [${verification.collectionSlug} ${verification.idField}: ${lookupValue}] Field '${field}' mismatch. DB: ${JSON.stringify(dbValue)}, SSOT: ${JSON.stringify(ssotValue)}`,
              );
              itemHasError = true;
            }
          }
        }
        if (itemHasError) totalErrors++;
        else totalSuccesses++;
      } catch (err: any) {
        console.error(
          `ERROR: [${verification.collectionSlug}] Failed to fetch/verify document with ${verification.idField} ${lookupValue}: ${err.message}`,
        );
        totalErrors++;
      }
    }
  }

  // --- Verification for Quiz Questions ---
  console.log(`\nVerifying collection: quiz_questions`);
  const allSsotQuestions = Object.values(ALL_QUIZ_QUESTIONS);
  for (const ssotQuestion of allSsotQuestions) {
    try {
      const dbQuestion = await payloadClient.findByID({
        collection: 'quiz_questions',
        id: ssotQuestion.id,
        depth: 1, // Depth 1 to fetch options
      });

      if (!dbQuestion) {
        console.error(
          `ERROR: [quiz_questions] Question with ID ${ssotQuestion.id} (Slug: ${ssotQuestion.questionSlug}) defined in SSOT not found in database.`,
        );
        totalErrors++;
        continue;
      }

      let questionHasError = false;
      if (dbQuestion.question !== ssotQuestion.text) {
        console.error(
          `ERROR: [quiz_questions ID: ${ssotQuestion.id}] Field 'question' (text) mismatch. DB: "${dbQuestion.question}", SSOT: "${ssotQuestion.text}"`,
        );
        questionHasError = true;
      }
      if (dbQuestion.questionSlug !== ssotQuestion.questionSlug) {
        console.error(
          `ERROR: [quiz_questions ID: ${ssotQuestion.id}] Field 'questionSlug' mismatch. DB: "${dbQuestion.questionSlug}", SSOT: "${ssotQuestion.questionSlug}"`,
        );
        questionHasError = true;
      }
      // Explanation check (optional field)
      const dbExplanation = dbQuestion.explanation || null; // Normalize undefined to null
      const ssotExplanation = ssotQuestion.explanation || null; // Normalize undefined to null
      if (dbExplanation !== ssotExplanation) {
        try {
          if (
            typeof dbExplanation === 'string' &&
            typeof ssotExplanation === 'string'
          ) {
            if (
              JSON.stringify(JSON.parse(dbExplanation)) !==
              JSON.stringify(JSON.parse(ssotExplanation))
            ) {
              console.error(
                `ERROR: [quiz_questions ID: ${ssotQuestion.id}] Field 'explanation' mismatch after parsing.`,
              );
              questionHasError = true;
            }
          } else if (dbExplanation !== ssotExplanation) {
            console.error(
              `ERROR: [quiz_questions ID: ${ssotQuestion.id}] Field 'explanation' mismatch. DB: ${dbExplanation}, SSOT: ${ssotExplanation}`,
            );
            questionHasError = true;
          }
        } catch (e) {
          console.error(
            `ERROR: [quiz_questions ID: ${ssotQuestion.id}] Field 'explanation' mismatch (or parse error). DB: ${dbExplanation}, SSOT: ${ssotExplanation}`,
          );
          questionHasError = true;
        }
      }

      // Verify options
      const dbOptions =
        (dbQuestion.options as Array<{
          text: string;
          isCorrect: boolean;
          id?: string; // Payload's internal ID for array items
        }>) || [];
      const ssotOptions = ssotQuestion.options;

      if (dbOptions.length !== ssotOptions.length) {
        console.error(
          `ERROR: [quiz_questions ID: ${ssotQuestion.id}] Options count mismatch. DB: ${dbOptions.length}, SSOT: ${ssotOptions.length}`,
        );
        questionHasError = true;
      } else {
        for (let i = 0; i < ssotOptions.length; i++) {
          const dbOpt = dbOptions[i];
          const ssotOpt = ssotOptions[i];
          // Add a check to ensure ssotOpt is defined before accessing its properties
          if (ssotOpt && dbOpt) {
            if (
              dbOpt.text !== ssotOpt.text ||
              dbOpt.isCorrect !== ssotOpt.isCorrect
            ) {
              console.error(
                `ERROR: [quiz_questions ID: ${ssotQuestion.id}] Option at index ${i} mismatch. DB: ${JSON.stringify(dbOpt)}, SSOT: ${JSON.stringify(ssotOpt)}`,
              );
              questionHasError = true;
              break;
            }
          } else {
            // This case should ideally not be reached if lengths are equal and arrays are well-formed.
            console.error(
              `ERROR: [quiz_questions ID: ${ssotQuestion.id}] Option at index ${i} is undefined in either DB or SSOT, despite lengths matching. DB Opt: ${JSON.stringify(dbOpt)}, SSOT Opt: ${JSON.stringify(ssotOpt)}`,
            );
            questionHasError = true;
            break;
          }
        }
      }

      if (questionHasError) totalErrors++;
      else totalSuccesses++;
    } catch (err: any) {
      console.error(
        `ERROR: [quiz_questions] Failed to fetch/verify question with ID ${ssotQuestion.id}: ${err.message}`,
      );
      totalErrors++;
    }
  }

  // --- Verification for Course Quizzes ---
  console.log(`\nVerifying collection: course_quizzes`);
  const allSsotQuizzes = Object.values(SSOT_QUIZZES);
  for (const ssotQuiz of allSsotQuizzes) {
    try {
      const dbQuiz = await payloadClient.findByID({
        collection: 'course_quizzes',
        id: ssotQuiz.id,
        depth: 0, // Relationships verified separately
      });

      if (!dbQuiz) {
        console.error(
          `ERROR: [course_quizzes] Quiz with ID ${ssotQuiz.id} (Slug: ${ssotQuiz.slug}) defined in SSOT not found in database.`,
        );
        totalErrors++;
        continue;
      }
      let quizHasError = false;
      if (dbQuiz.title !== ssotQuiz.title) {
        console.error(
          `ERROR: [course_quizzes ID: ${ssotQuiz.id}] Field 'title' mismatch. DB: "${dbQuiz.title}", SSOT: "${ssotQuiz.title}"`,
        );
        quizHasError = true;
      }
      if (dbQuiz.slug !== ssotQuiz.slug) {
        console.error(
          `ERROR: [course_quizzes ID: ${ssotQuiz.id}] Field 'slug' mismatch. DB: "${dbQuiz.slug}", SSOT: "${ssotQuiz.slug}"`,
        );
        quizHasError = true;
      }
      if (dbQuiz.description !== (ssotQuiz.description || null)) {
        console.error(
          `ERROR: [course_quizzes ID: ${ssotQuiz.id}] Field 'description' mismatch. DB: "${dbQuiz.description}", SSOT: "${ssotQuiz.description || null}"`,
        );
        quizHasError = true;
      }
      if (dbQuiz.pass_threshold !== ssotQuiz.passingScore) {
        console.error(
          `ERROR: [course_quizzes ID: ${ssotQuiz.id}] Field 'pass_threshold' mismatch. DB: ${dbQuiz.pass_threshold}, SSOT: ${ssotQuiz.passingScore}`,
        );
        quizHasError = true;
      }

      if (quizHasError) totalErrors++;
      else totalSuccesses++;
    } catch (err: any) {
      console.error(
        `ERROR: [course_quizzes] Failed to fetch/verify quiz with ID ${ssotQuiz.id}: ${err.message}`,
      );
      totalErrors++;
    }
  }

  const mdocCollections = [
    {
      slug: 'posts',
      path: 'data/raw/posts/',
      fields: ['title', 'slug', 'description', 'status'],
    },
    {
      slug: 'documentation',
      path: 'data/raw/documentation/',
      fields: ['title', 'slug', 'description', 'status', '_order'],
    },
  ];

  for (const mdocCollection of mdocCollections) {
    console.log(`\nVerifying mdoc collection: ${mdocCollection.slug}`);
    try {
      const collectionDir = path.resolve(process.cwd(), mdocCollection.path);
      const files = await fs.readdir(collectionDir);
      for (const file of files) {
        if (file.endsWith('.mdoc') || file.endsWith('.md')) {
          const filePath = path.join(collectionDir, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const { data: frontmatter, content: mdocContent } =
            grayMatter(fileContent);
          const docSlug = frontmatter.slug || path.parse(file).name;

          try {
            const result = await payloadClient.find({
              collection: mdocCollection.slug as any,
              where: { slug: { equals: docSlug } },
              depth: 0,
              limit: 1,
            });
            if (!result.docs || result.docs.length === 0) {
              console.error(
                `ERROR: [${mdocCollection.slug}] Document with slug '${docSlug}' (from ${file}) not found.`,
              );
              totalErrors++;
              continue;
            }
            const doc = result.docs[0];
            if (!doc) {
              console.error(
                `ERROR: [${mdocCollection.slug}] Document with slug '${docSlug}' (from ${file}) was undefined.`,
              );
              totalErrors++;
              continue;
            }
            let itemHasError = false;
            for (const field of mdocCollection.fields) {
              const dbValue = doc[field];
              const ssotValue = field === 'slug' ? docSlug : frontmatter[field];
              let isMatch = dbValue === ssotValue;
              if (
                !isMatch &&
                ((dbValue === null && typeof ssotValue === 'undefined') ||
                  (typeof dbValue === 'undefined' && ssotValue === null))
              ) {
                isMatch = true;
              }
              if (
                typeof dbValue === 'number' &&
                typeof ssotValue === 'string' &&
                dbValue === parseFloat(ssotValue)
              ) {
                isMatch = true;
              }
              if (
                typeof ssotValue === 'number' &&
                typeof dbValue === 'string' &&
                ssotValue === parseFloat(dbValue)
              ) {
                isMatch = true;
              }
              if (
                !isMatch &&
                JSON.stringify(dbValue) !== JSON.stringify(ssotValue)
              ) {
                console.error(
                  `ERROR: [${mdocCollection.slug} Slug: ${docSlug}] Field '${field}' mismatch. DB: ${JSON.stringify(dbValue)}, SSOT: ${JSON.stringify(ssotValue)}`,
                );
                itemHasError = true;
              }
            }
            if (
              !doc.content ||
              typeof doc.content !== 'object' ||
              !(doc.content as any).root
            ) {
              console.error(
                `ERROR: [${mdocCollection.slug} Slug: ${docSlug}] Field 'content' (Lexical) malformed/missing.`,
              );
              itemHasError = true;
            }
            if (itemHasError) totalErrors++;
            else totalSuccesses++;
          } catch (err: any) {
            console.error(
              `ERROR: [${mdocCollection.slug}] Failed for slug '${docSlug}': ${err.message}`,
            );
            totalErrors++;
          }
        }
      }
    } catch (err: any) {
      console.error(
        `ERROR: Reading dir for ${mdocCollection.slug} at ${mdocCollection.path}: ${err.message}`,
      );
      totalErrors++;
    }
  }

  const surveysPath = 'data/raw/surveys/';
  console.log(`\nVerifying survey collection from: ${surveysPath}`);
  try {
    const surveyDir = path.resolve(process.cwd(), surveysPath);
    const surveyFiles = await fs.readdir(surveyDir);
    for (const file of surveyFiles) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const filePath = path.join(surveyDir, file);
        const ssotSurvey = await readSsotFile<any>(filePath);
        if (!ssotSurvey || !ssotSurvey.slug) {
          console.warn(
            `WARN: Survey SSOT file ${file} missing slug/unparsable.`,
            ssotSurvey,
          );
          continue;
        }
        try {
          const surveyResult = await payloadClient.find({
            collection: 'surveys' as any,
            where: { slug: { equals: ssotSurvey.slug } },
            depth: 0,
            limit: 1,
          });
          if (!surveyResult.docs || surveyResult.docs.length === 0) {
            console.error(
              `ERROR: [surveys] Doc with slug ${ssotSurvey.slug} (from ${file}) not found.`,
            );
            totalErrors++;
            continue;
          }
          const doc = surveyResult.docs[0];
          if (!doc) {
            console.error(
              `ERROR: [surveys] Doc with slug ${ssotSurvey.slug} (from ${file}) undefined.`,
            );
            totalErrors++;
            continue;
          }
          let surveyHasError = false;
          const surveyFieldsToVerify = [
            'title',
            'slug',
            'description',
            'status',
          ];
          for (const field of surveyFieldsToVerify) {
            const dbValue = doc[field];
            const ssotValue = ssotSurvey[field];
            let isMatch = dbValue === ssotValue;
            if (
              !isMatch &&
              field === 'description' &&
              ((dbValue === null && typeof ssotValue === 'undefined') ||
                (typeof dbValue === 'undefined' && ssotValue === null))
            ) {
              isMatch = true;
            }
            if (
              !isMatch &&
              JSON.stringify(dbValue) !== JSON.stringify(ssotValue)
            ) {
              console.error(
                `ERROR: [surveys Slug: ${ssotSurvey.slug}] Field '${field}' mismatch. DB: ${JSON.stringify(dbValue)}, SSOT: ${JSON.stringify(ssotValue)}`,
              );
              surveyHasError = true;
            }
          }
          if (surveyHasError) totalErrors++;
          else totalSuccesses++;
        } catch (sErr: any) {
          console.error(
            `ERROR: [surveys] Failed for slug ${ssotSurvey.slug}: ${sErr.message}`,
          );
          totalErrors++;
        }
      }
    }
  } catch (err: any) {
    console.error(
      `ERROR: Reading dir for surveys at ${surveysPath}: ${err.message}`,
    );
    totalErrors++;
  }

  console.log(
    `\nSSOT Content Presence Verification Complete. Total successful checks: ${totalSuccesses}, Total errors: ${totalErrors}.`,
  );
  if (totalErrors > 0) {
    console.error(
      `${totalErrors} item(s) failed SSOT content presence verification.`,
    );
  }
}

if (require.main === module) {
  verifySsotContentPresence().catch((err) => {
    console.error('Script failed: verify-ssot-content-presence.ts', err);
    process.exit(1);
  });
}
