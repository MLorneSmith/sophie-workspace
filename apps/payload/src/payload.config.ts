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
    import { Downloads } from './collections/Downloads'; // Uncomment Downloads import
    import { Media } from './collections/Media';
    import { Posts } from './collections/Posts'; // Uncomment Posts import
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
  collections: [
    Users,
    Media,
    Downloads, // Uncomment Downloads to include it in the schema
    Posts, // Uncomment Posts to include it in the schema
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

  db: (() => {
    console.log('[PAYLOAD-CONFIG] About to initialize postgresAdapter.');
    
    // SSL configuration for production environments
    const sslConfig = process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false, // For hosted Postgres providers like Supabase, PlanetScale, etc.
      sslmode: 'require'
    } : false;
    
    // Serverless-optimized connection pool settings
    const poolConfig = {
      connectionString: process.env.DATABASE_URI,
      ssl: sslConfig,
      max: 2, // Reduced pool size for serverless environments like Vercel
      min: 0, // Allow pool to scale down to 0 connections
      connectionTimeoutMillis: 10000, // 10 second connection timeout
      idleTimeoutMillis: 30000, // 30 second idle timeout
      acquireTimeoutMillis: 5000, // 5 second acquire timeout
      createTimeoutMillis: 10000, // 10 second create timeout
      destroyTimeoutMillis: 5000, // 5 second destroy timeout
      reapIntervalMillis: 1000, // Check for idle connections every second
      createRetryIntervalMillis: 200, // Retry interval for failed connections
    };
    
    console.log('[PAYLOAD-CONFIG] Postgres pool config:', {
      ...poolConfig,
      connectionString: poolConfig.connectionString ? '[REDACTED]' : 'undefined',
      ssl: sslConfig ? 'enabled' : 'disabled'
    });
    
    return postgresAdapter({
      pool: poolConfig,
      schemaName: 'payload',
      idType: 'uuid', // Explicitly set ID type to UUID
      push: false, // Disable schema push in development
    });
  })(),

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
