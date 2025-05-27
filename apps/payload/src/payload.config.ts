import { postgresAdapter } from '@payloadcms/db-postgres';
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs';
import { s3Storage } from '@payloadcms/storage-s3';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import sharp from 'sharp';
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

// Cache database adapter to prevent re-initialization
let cachedDbAdapter: ReturnType<typeof postgresAdapter> | null = null;

function getDbAdapter() {
  if (cachedDbAdapter) {
    return cachedDbAdapter;
  }

  // SSL configuration for production environments
  const sslConfig = process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    sslmode: 'require'
  } : false;

  // Serverless-optimized connection pool settings
  const poolConfig = {
    connectionString: process.env.DATABASE_URI,
    ssl: sslConfig,
    max: 2, // Reduced pool size for serverless environments
    min: 0, // Allow pool to scale down to 0 connections
    connectionTimeoutMillis: 10000, // 10 second connection timeout
    idleTimeoutMillis: 30000, // 30 second idle timeout
    acquireTimeoutMillis: 5000, // 5 second acquire timeout
    createTimeoutMillis: 10000, // 10 second create timeout
    destroyTimeoutMillis: 5000, // 5 second destroy timeout
    reapIntervalMillis: 1000, // Check for idle connections every second
    createRetryIntervalMillis: 200, // Retry interval for failed connections
  };

  // Only log in development and only once
  if (process.env.NODE_ENV === 'development') {
    console.log('[PAYLOAD-CONFIG] Initializing database adapter with pool config:', {
      ...poolConfig,
      connectionString: poolConfig.connectionString ? '[REDACTED]' : 'undefined',
      ssl: sslConfig ? 'enabled' : 'disabled'
    });
  }

  cachedDbAdapter = postgresAdapter({
    pool: poolConfig,
    schemaName: 'payload',
    idType: 'uuid', // Explicitly set ID type to UUID
    push: false, // Disable schema push in development
  });

  return cachedDbAdapter;
}

export default buildConfig({
  secret: payloadSecret,
  serverURL: serverURL,
  collections: [
    Users,
    Media,
    Downloads,
    Posts,
    Documentation,
    Private,
    Courses,
    CourseLessons,
    CourseQuizzes,
    QuizQuestions,
    SurveyQuestions,
    Surveys,
  ],
  globals: [
    // Add globals here
  ],
  typescript: {
    outputFile: path.resolve(dirname, '../payload-types.ts'),
  },
  editor: lexicalEditor({}),
  db: getDbAdapter(),
  plugins: [
    // s3Storage({ ... }),
    // nestedDocsPlugin({ ... }),
  ],
  bin: [
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
