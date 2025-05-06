import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to add path column to downloads table')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Check if path column already exists
    const columnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'downloads'
        AND column_name = 'path'
      ) as exists;
    `)

    if (!columnExists.rows[0].exists) {
      // Add path column to downloads table
      await db.execute(sql`
        ALTER TABLE payload.downloads 
        ADD COLUMN path TEXT;
      `)
      console.log('Added path column to downloads table')
    } else {
      console.log('Path column already exists in downloads table, skipping')
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully added path column to downloads table')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error adding path column to downloads table:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back path column addition to downloads table')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Remove path column from downloads table
    await db.execute(sql`
      ALTER TABLE payload.downloads 
      DROP COLUMN IF EXISTS path;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully removed path column from downloads table')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error removing path column from downloads table:', error)
    throw error
  }
}
