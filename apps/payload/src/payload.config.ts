// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Documentation } from './collections/Documentation'
import { Media } from './collections/Media'
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
  collections: [Users, Media, Documentation],
  editor: lexicalEditor(),
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
  ],
})
