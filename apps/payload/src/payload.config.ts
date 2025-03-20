// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

// Import custom SCSS for Tailwind CSS
import './app/(payload)/custom.scss'

import CallToAction from './blocks/CallToAction'
import TestBlock from './blocks/TestBlock'
import { Documentation } from './collections/Documentation'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { SurveyQuestions } from './collections/SurveyQuestions'
import { Surveys } from './collections/Surveys'
import { Users } from './collections/Users'
import { Courses } from './collections/Courses'
import { CourseLessons } from './collections/CourseLessons'
import { CourseQuizzes } from './collections/CourseQuizzes'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Add CORS configuration to allow requests from all web app domains
  cors: [
    'http://localhost:3000',
    'https://beta.slideheroes.com',
    'https://www.slideheroes.com',
    'https://2025slideheroes-web.vercel.app',
  ],
  collections: [
    Users,
    Media,
    Documentation,
    Posts,
    Surveys,
    SurveyQuestions,
    Courses,
    CourseLessons,
    CourseQuizzes,
  ],
  editor: lexicalEditor({
    // Global editor configuration with custom blocks
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: [CallToAction, TestBlock],
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Use a custom schema to separate Payload tables from Makerkit tables
    schemaName: 'payload',
    // Store migrations in the Supabase migrations directory
    migrationDir: path.resolve(process.cwd(), '../web/supabase/migrations/payload'),
    // Automatically push schema changes in development
    push: process.env.NODE_ENV === 'development',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
    nestedDocsPlugin({
      collections: ['documentation'],
      generateLabel: ((_: any, doc: any) => doc?.title || '') as any,
      generateURL: ((docs: any) =>
        docs.reduce((url: string, doc: any) => `${url}/${doc.slug}`, '')) as any,
    }),
  ],
})
