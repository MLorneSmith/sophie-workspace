import { postgresAdapter } from '@payloadcms/db-postgres'; // UNCOMMENTED
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'; // UNCOMMENTED
import { s3Storage } from '@payloadcms/storage-s3'; // UNCOMMENTED

console.log('[PAYLOAD-CONFIG] Starting payload.config.ts loading.'); // Added log
import { lexicalEditor } from '@payloadcms/richtext-lexical'; // UNCOMMENTED
import path from 'path';
import { buildConfig } from 'payload'; // Changed from 'payload' to 'payload/config' for v3
import sharp from 'sharp'; // Keep sharp import if used by other parts or for future
import { fileURLToPath } from 'url';

import { CourseLessons } from './collections/CourseLessons';
import { CourseQuizzes } from './collections/CourseQuizzes';
import { Courses } from './collections/Courses';
import { Documentation } from './collections/Documentation';
import { Downloads } from './collections/Downloads';
import { Media } from './collections/Media';
import { Posts } from './collections/Posts';
import { Private } from './collections/Private';
import { QuizQuestions } from './collections/QuizQuestions';
import { SurveyQuestions } from './collections/SurveyQuestions';
import { Surveys } from './collections/Surveys';
import { Users } from './collections/Users';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || '';
const payloadSecret = process.env.PAYLOAD_SECRET || '';

console.log('[PAYLOAD-CONFIG] About to call buildConfig.'); // Added log

export default buildConfig({
  secret: payloadSecret,
  serverURL: serverURL,
  collections: [ // UNCOMMENTED collections array
    Users,
    Media,
    Courses,
    CourseLessons,
    CourseQuizzes,
    QuizQuestions,
    Surveys,
    SurveyQuestions,
    Documentation,
    Posts,
    Private,
    Downloads,
  ],
  globals: [
    // Add globals here
  ],
  typescript: {
    outputFile: path.resolve(dirname, '../payload-types.ts'),
  },
  editor: lexicalEditor({}), // UNCOMMENTED editor property

  // This is the active DB configuration for Step 4.B (Reintroducing postgresAdapter)
  db: (() => { // Wrap in IIFE to log before adapter call
    console.log('[PAYLOAD-CONFIG] About to initialize postgresAdapter.'); // Added log
    return postgresAdapter({
      pool: {
        connectionString: process.env.DATABASE_URI,
      },
      // push: false, // Option for postgresAdapter - Commented for Step 4.2
      schemaName: 'payload', // Option for postgresAdapter - Commented for Step 4.2
      // idType: 'uuid', // Option for postgresAdapter - Commented for Step 4.2
    });
  })(), // End IIFE

  // sharp: sharp as any, // Can remain commented or be active if needed elsewhere

  plugins: [
    s3Storage({ // UNCOMMENTED s3Storage plugin
      collections: {
        media: {
          disableLocalStorage: true,
          generateFileURL: ({ filename }: { filename: string }) =>
            `https://images.slideheroes.com/${filename}`,
        },
      downloads: {
        disableLocalStorage: true,
        generateFileURL: ({ filename }: { filename: string }) =>
          `https://downloads.slideheroes.com/${encodeURIComponent(filename)}`,
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        endpoint: process.env.R2_ENDPOINT || '',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: process.env.R2_REGION || 'auto',
        forcePathStyle: true,
      },
    }),
    nestedDocsPlugin({ // UNCOMMENTED nestedDocsPlugin
      collections: ['documentation'],
      parentFieldSlug: 'parent',
      generateLabel: ((_: any, doc: any) => doc?.title || '') as any,
      generateURL: ((docs: any) =>
        docs.reduce((url: string, doc: any) => `${url}/${doc.slug}`, '')) as any,
    }),
  ],
  bin: [ // This section seems unrelated to the hang, can be left as is
    {
      scriptPath: path.resolve(
        dirname,
        './seed-static-collections.mjs',
      ),
      key: 'seed-static-collections',
    },
    {
      scriptPath: path.resolve(
        dirname,
        '../../packages/payload-local-init/stage-2-seed-core/seed-media-downloads.mjs',
      ),
      key: 'seed-media-downloads',
    },
    {
      scriptPath: path.resolve(
        dirname,
        '../../packages/payload-local-init/stage-2-seed-core/seed-main-content-collections.mjs',
      ),
      key: 'seed-main-content-collections',
    },
    {
      scriptPath: path.resolve(
        dirname,
        '../../packages/payload-local-init/stage-2-seed-core/seed-course-structure.mjs',
      ),
      key: 'seed-course-structure',
    },
  ],
});
