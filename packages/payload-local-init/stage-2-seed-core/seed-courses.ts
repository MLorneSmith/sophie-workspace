import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import type { Payload } from 'payload';
import { fileURLToPath } from 'url';

// @ts-ignore
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const coursesRawPath = path.resolve(dirname, '../data/raw/courses');

export async function seedCourses(payload: Payload) {
  console.log('Starting Stage 2: Seed Courses...');

  try {
    console.log('Executing: Seed Courses (via orchestrator)...');

    // Read and parse raw course data
    const courseFiles = fs
      .readdirSync(coursesRawPath)
      .filter((file) => file.endsWith('.yaml'));
    const coursesData: any[] = [];

    for (const file of courseFiles) {
      const filePath = path.join(coursesRawPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const course = yaml.load(fileContent) as any;
      coursesData.push(course);
    }

    console.log(`Found ${coursesData.length} course files.`);

    // Seed Courses collection
    console.log('Seeding Courses...');
    for (const courseData of coursesData) {
      try {
        // Check if course already exists by slug to avoid duplicates
        const existingCourse = await payload.find({
          collection: 'courses',
          where: {
            slug: {
              equals: courseData.slug,
            },
          },
        });

        if (existingCourse.docs.length === 0) {
          const createdCourse = await payload.create({
            collection: 'courses',
            data: courseData,
          });
          console.log(
            `Created Course: ${createdCourse.title} (${createdCourse.id})`,
          );
        } else {
          console.log(
            `Course already exists, skipping creation: ${courseData.title} (${courseData.id})`,
          );
          // Optionally, update the existing course if needed
        }
      } catch (error: any) {
        console.error(
          `Error creating course ${courseData.title}:`,
          error.message,
        );
      }
    }

    console.log('Courses seeding completed.');
  } catch (error: any) {
    const errorMessage = error?.message ?? 'Unknown error';
    console.error('Error during Seed Courses process:', errorMessage);
    throw error; // Re-throw to be caught by the orchestrator
  }
}
