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
// This import is causing issues with ESM, so we'll comment it out
// import './app/(payload)/custom.scss'

import CallToAction from './blocks/CallToAction'
import TestBlock from './blocks/TestBlock'
import DebugBlock from './blocks/DebugBlock'
import BunnyVideo from './blocks/BunnyVideo'
import { Documentation } from './collections/Documentation'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { SurveyQuestions } from './collections/SurveyQuestions'
import { Surveys } from './collections/Surveys'
import { Users } from './collections/Users'
import { Courses } from './collections/Courses'
import { CourseLessons } from './collections/CourseLessons'
import { CourseQuizzes } from './collections/CourseQuizzes'
import { QuizQuestions } from './collections/QuizQuestions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // onInit hook removed as part of the custom component importMap fix
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
    QuizQuestions,
  ],
  editor: lexicalEditor({
    // Global editor configuration with custom blocks
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: [CallToAction, TestBlock, DebugBlock, BunnyVideo],
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
    // Enable schema push in development, disable in production
    // This allows for rapid development while ensuring controlled schema changes in production
    push: process.env.NODE_ENV !== 'production',
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
