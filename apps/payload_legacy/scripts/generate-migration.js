#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../../web/supabase/migrations/payload')

// Ensure migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true })
}

// Create interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Ask for migration name
rl.question('Enter migration name (e.g. add_new_collection): ', (name) => {
  // Generate timestamp in format YYYYMMDD_HHMMSS
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`
  const filename = `${timestamp}_${name}.ts`
  const filePath = path.join(MIGRATIONS_DIR, filename)

  // Create migration file template
  const template = `import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, _payload, _req }: MigrateUpArgs): Promise<void> {
  // Add your migration SQL here
  await db.execute(sql\`
  -- Example: Create a new table
  -- CREATE TABLE IF NOT EXISTS "payload"."new_collection" (
  --   "id" varchar PRIMARY KEY NOT NULL,
  --   "title" varchar NOT NULL,
  --   "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  --   "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  -- );
  \`);
}

export async function down({
  db,
  _payload,
  _req,
}: MigrateDownArgs): Promise<void> {
  // Revert your migration SQL here
  await db.execute(sql\`
  -- Example: Drop the table created in the up migration
  -- DROP TABLE IF EXISTS "payload"."new_collection" CASCADE;
  \`);
}
`

  // Write file
  fs.writeFileSync(filePath, template)
  console.log(`Migration file created: ${filePath}`)
  rl.close()
})
