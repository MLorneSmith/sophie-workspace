import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { CourseLessons } from './collections/CourseLessons'
import { CourseQuizzes } from './collections/CourseQuizzes'
import { Courses } from './collections/Courses'
import { Documentation } from './collections/Documentation'
import { Downloads } from './collections/Downloads'
import { Posts } from './collections/Posts'
import { Private } from './collections/Private'
import { QuizQuestions } from './collections/QuizQuestions'
import { SurveyQuestions } from './collections/SurveyQuestions'
import { Surveys } from './collections/Surveys'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || ''
const payloadSecret = process.env.PAYLOAD_SECRET || ''

export default buildConfig({
  secret: payloadSecret,
  serverURL: serverURL,
  collections: [
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
  editor: lexicalEditor({}),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    push: false,
    schemaName: 'payload',
    idType: 'uuid',
  }),
  sharp: sharp as any,
  plugins: [
    s3Storage({
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
    // Conditionally add nestedDocsPlugin if not disabled
    ...(process.env.DISABLE_NESTED_DOCS_PLUGIN !== 'true'
      ? [
          nestedDocsPlugin({
            collections: ['documentation'],
            parentFieldSlug: 'parent', // Specify the slug of the manual parent field
            generateLabel: ((_: any, doc: any) => doc?.title || '') as any,
            generateURL: ((docs: any) =>
              docs.reduce((url: string, doc: any) => `${url}/${doc.slug}`, '')) as any,
          }),
        ]
      : []), // Include an empty array if plugin is disabled
  ],
  bin: [
    {
      scriptPath: path.resolve(
        dirname,
        './seed-static-collections.mjs', // Updated path
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
    // Add entries for Stage 3 and Stage 4 scripts later
  ],
})
