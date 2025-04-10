import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

// Import custom SCSS for Tailwind CSS
// This import is causing issues with ESM, so we'll comment it out
// import './app/(payload)/custom.scss'

import BunnyVideo from './blocks/BunnyVideo'
import CallToAction from './blocks/CallToAction'
import DebugBlock from './blocks/DebugBlock'
import TestBlock from './blocks/TestBlock'
import { CourseLessons } from './collections/CourseLessons'
import { CourseQuizzes } from './collections/CourseQuizzes'
import { Courses } from './collections/Courses'
import { Documentation } from './collections/Documentation'
import { Downloads } from './collections/Downloads'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { QuizQuestions } from './collections/QuizQuestions'
import { SurveyQuestions } from './collections/SurveyQuestions'
import { Surveys } from './collections/Surveys'
import { Users } from './collections/Users'

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
    QuizQuestions,
    Downloads,
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
    // Disable schema push to prevent parameter errors
    push: false,
    // Configure Postgres to use the "payload" schema
    schemaName: 'payload',
    // Use UUID for ID columns
    idType: 'uuid',
    // Add the beforeSchemaInit hook to ensure relationship columns exist
    beforeSchemaInit: [
      ({ schema, adapter }) => {
        // Create a helper function to ensure relationship columns exist
        const ensureRelationshipColumns = (tables: Record<string, any>) => {
          const updatedTables = { ...tables }

          // Add relationship columns to all relationship tables
          Object.keys(tables).forEach((tableName) => {
            if (tableName.endsWith('_rels')) {
              const tableSchema = { ...updatedTables[tableName] }

              // Add media_id if it doesn't already exist
              if (!tableSchema.media_id) {
                // Use the pgTable.uuid method from the adapter
                tableSchema.media_id = { name: 'media_id', dataType: 'uuid' }
                updatedTables[tableName] = tableSchema
              }

              // Add documentation_id if it doesn't already exist
              if (!tableSchema.documentation_id) {
                tableSchema.documentation_id = { name: 'documentation_id', dataType: 'uuid' }
                updatedTables[tableName] = tableSchema
              }

              // Add downloads_id if it doesn't already exist
              if (!tableSchema.downloads_id) {
                tableSchema.downloads_id = { name: 'downloads_id', dataType: 'uuid' }
                updatedTables[tableName] = tableSchema
              }
            }
          })

          return updatedTables
        }

        return {
          ...schema,
          tables: ensureRelationshipColumns(schema.tables),
        }
      },
    ],
  }),
  sharp: sharp as any,
  plugins: [
    payloadCloudPlugin(),
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
            `https://downloads.slideheroes.com/${filename}`,
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
    nestedDocsPlugin({
      collections: ['documentation'],
      generateLabel: ((_: any, doc: any) => doc?.title || '') as any,
      generateURL: ((docs: any) =>
        docs.reduce((url: string, doc: any) => `${url}/${doc.slug}`, '')) as any,
    }),
  ],
})
