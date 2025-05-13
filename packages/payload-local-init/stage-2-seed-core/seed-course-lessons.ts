// seed-course-lessons.ts
// Script for Stage 2: Core Content Seeding - Course Lessons
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import type { Payload } from 'payload';
// Placeholder for Markdown to Lexical conversion utility
// import { markdownToLexical } from '../utils/markdown-to-lexical';
import { fileURLToPath } from 'url';

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths relative to the project root (d:/SlideHeroes/App/repos/2025slideheroes)
const projectRoot = path.resolve(__dirname, '../../../'); // Adjust based on actual script location relative to root

// Define path for lesson metadata YAML
const lessonsMetadataPath = path.join(
  projectRoot,
  'packages/payload-local-init/data/raw/lesson-metadata.yaml',
);
const lessonsYamlPath = path.join(
  projectRoot,
  'packages/payload-local-init/data/definitions/lessons_structured_content.yaml',
);
const lessonsRawContentPath = path.join(
  projectRoot,
  'packages/payload-local-init/data/raw/courses/lessons',
);

console.log('Starting Stage 2: Seed Course Lessons...');
console.log(`Using Structure YAML from: ${lessonsYamlPath}`);
console.log(`Using Metadata YAML from: ${lessonsMetadataPath}`);
console.log(`Using raw content from: ${lessonsRawContentPath}`);

export async function seedCourseLessons(payload: Payload) {
  try {
    console.log('Executing: Seed Course Lessons (via orchestrator)...');

    // Load structured lesson definitions from YAML
    if (!fs.existsSync(lessonsYamlPath)) {
      console.error(`Error: Lessons YAML file not found at ${lessonsYamlPath}`);
      throw new Error(`Lessons YAML file not found at ${lessonsYamlPath}`);
    }
    const lessonsYamlContent = fs.readFileSync(lessonsYamlPath, 'utf-8');
    const lessonsDefinition = (yaml.load(lessonsYamlContent) as any)
      ?.lessons as any[];

    if (
      !lessonsDefinition ||
      !Array.isArray(lessonsDefinition) ||
      lessonsDefinition.length === 0
    ) {
      console.warn(
        'Warning: No lessons defined in structure YAML file or data is not an array. Skipping seeding.',
      );
      return;
    }

    // Load lesson metadata from YAML
    let lessonsMetadata: any[] = [];
    if (fs.existsSync(lessonsMetadataPath)) {
      const lessonsMetadataContent = fs.readFileSync(
        lessonsMetadataPath,
        'utf-8',
      );
      const loadedMetadata = yaml.load(lessonsMetadataContent) as any;
      lessonsMetadata = (loadedMetadata?.lessons as any[]) || [];
      console.log(`Found ${lessonsMetadata.length} lesson metadata entries.`);
    } else {
      console.warn(
        `Warning: Lessons metadata file not found at ${lessonsMetadataPath}. Proceeding without metadata.`,
      );
    }

    console.log(
      `Found ${lessonsDefinition.length} lesson definitions in structure YAML.`,
    );

    for (const lessonData of lessonsDefinition) {
      // Basic validation
      if (!lessonData.slug || !lessonData.title) {
        console.warn(
          'Skipping lesson definition due to missing slug or title:',
          lessonData,
        );
        continue;
      }

      // Find corresponding metadata
      const metadata = lessonsMetadata.find((m) => m.slug === lessonData.slug);

      console.log(`Processing lesson: ${lessonData.slug}`);
      console.log('Lesson data from structure YAML:', lessonData);
      console.log('Metadata from metadata YAML:', metadata);

      try {
        // Check if lesson already exists by slug
        const existingLesson = await payload.find({
          collection: 'course_lessons',
          where: {
            slug: {
              equals: lessonData.slug,
            },
          },
        });

        if (existingLesson.docs.length === 0) {
          // --- Load and transform raw content ---
          const rawContentPath = path.join(
            lessonsRawContentPath,
            `${lessonData.slug}.mdoc`,
          );
          let lexicalContent: any = null;

          if (fs.existsSync(rawContentPath)) {
            const markdownContent = fs.readFileSync(rawContentPath, 'utf-8');
            // Placeholder: Transform Markdown to Lexical JSON
            // lexicalContent = markdownToLexical(markdownContent);
            console.log(
              `Found raw content for ${lessonData.slug}. Transformation needed.`,
            );
            // Using placeholder content for now
            lexicalContent = {
              root: {
                children: [
                  {
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: `Raw content from ${lessonData.slug}.md needs conversion.`,
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'root',
                version: 1,
              },
            };
          } else {
            console.warn(
              `Warning: Raw content file not found for lesson ${lessonData.slug} at ${rawContentPath}`,
            );
          }
          // --- End Load and transform ---

          const lessonPayloadData: any = {
            // id: lessonData.id || uuidv4(), // Let Payload generate the UUID
            title: lessonData.title,
            slug: lessonData.slug,
            lesson_number: lessonData.lesson_number, // Use lesson_number from structure YAML
            content: lexicalContent,
            // Populate fields from metadata if available
            description: metadata?.description,
            estimated_duration: metadata?.lessonLength, // Map lessonLength to estimated_duration
            bunny_video_id: metadata?.bunnyVideo?.id,
            bunny_library_id: metadata?.bunnyVideo?.library,
            // Map external video ID if source is youtube
            youtube_video_id:
              metadata?.externalVideo?.source === 'youtube'
                ? metadata?.externalVideo?.id
                : null,
            // Only set if explicitly 'youtube' or 'vimeo'
            video_source_type:
              metadata?.externalVideo?.source === 'youtube' ||
              metadata?.externalVideo?.source === 'vimeo'
                ? metadata?.externalVideo?.source
                : null,

            // Populate todo fields, parsing JSON strings
            todo: metadata?.todoFields?.todo
              ? JSON.parse(metadata.todoFields.todo)
              : null,
            todo_watch_content: metadata?.todoFields?.watchContent
              ? JSON.parse(metadata.todoFields.watchContent)
              : null,
            todo_read_content: metadata?.todoFields?.readContent
              ? JSON.parse(metadata.todoFields.readContent)
              : null,
            todo_course_project: metadata?.todoFields?.courseProject
              ? JSON.parse(metadata.todoFields.courseProject)
              : null,
            todo_complete_quiz: metadata?.todoFields?.completeQuiz || false, // Default to false

            // Set status and publishedAt
            _status: metadata?.status || 'draft',
            published_at: metadata?.status === 'published' ? new Date() : null,

            // Relationships (course, quiz, downloads) are handled in Stage 3
          };

          console.log('Data being sent to Payload:', lessonPayloadData);

          console.log(
            `Attempting to create Course Lesson: ${lessonData.title} (${lessonData.slug})`,
          );

          await payload.create({
            collection: 'course_lessons',
            data: lessonPayloadData,
          });
          console.log(
            `Created Course Lesson: ${lessonData.title} (${lessonData.slug})`,
          );
        } else {
          console.log(
            `Course Lesson already exists, skipping creation: ${lessonData.title} (${lessonData.slug})`,
          );
          // Optionally, update the existing lesson if needed
          // This part is commented out in the original script, keeping it that way for now.
        }
      } catch (error: any) {
        console.error(
          `Error processing Course Lesson "${lessonData.title}":`,
          error.message,
        );
        // Continue with other lessons
      }
    }

    console.log('Course Lessons seeding completed.');
  } catch (error: any) {
    console.error('Error during Seed Course Lessons process:', error.message);
    throw error; // Re-throw to be caught by the orchestrator
  }
}
