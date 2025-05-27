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
import { getDatabaseAdapter } from './lib/database-adapter-singleton';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || '';
const payloadSecret = process.env.PAYLOAD_SECRET || '';

// Validate required environment variables
if (!payloadSecret) {
  throw new Error('PAYLOAD_SECRET environment variable is required');
}

if (!process.env.DATABASE_URI) {
  throw new Error('DATABASE_URI environment variable is required');
}

// Log configuration info (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('[PAYLOAD-CONFIG] Initializing Payload CMS with enhanced database connection management');
  console.log('[PAYLOAD-CONFIG] Environment:', process.env.NODE_ENV);
  console.log('[PAYLOAD-CONFIG] Server URL:', serverURL || 'Not set');
  console.log('[PAYLOAD-CONFIG] Database adapter: Enhanced PostgreSQL with singleton pattern');
}

// Storage configuration for different environments
const getStorageConfig = () => {
  // If S3 configuration is available, use S3 storage
  if (process.env.S3_BUCKET && process.env.S3_REGION) {
    return s3Storage({
      collections: {
        media: true,
        downloads: true,
      },
      bucket: process.env.S3_BUCKET,
      config: {
        region: process.env.S3_REGION,
        credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        } : undefined,
      },
    });
  }
  
  // Default to local storage in development
  return undefined;
};

// Plugin configuration
const getPlugins = () => {
  const plugins: any[] = [];
  
  // Add S3 storage plugin if configured
  const storageConfig = getStorageConfig();
  if (storageConfig) {
    plugins.push(storageConfig);
  }
  
  // Add nested docs plugin for hierarchical content
  plugins.push(nestedDocsPlugin({
    collections: ['documentation'],
    generateLabel: (_, doc) => doc.title as string,
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }));
  
  return plugins;
};

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
    // Add globals here as needed
  ],
  typescript: {
    outputFile: path.resolve(dirname, '../payload-types.ts'),
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => defaultFeatures,
  }),
  // Use the enhanced database adapter with singleton pattern
  db: getDatabaseAdapter(),
  plugins: getPlugins(),
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- SlideHeroes CMS',
    },
  },
  // CORS configuration
  cors: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  // Enhanced logging configuration
  debug: process.env.NODE_ENV === 'development' || process.env.PAYLOAD_DEBUG === 'true',
  // Custom scripts for seeding and maintenance
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
