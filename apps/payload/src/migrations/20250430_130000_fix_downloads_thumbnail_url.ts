import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to fix missing columns in downloads table
 *
 * This migration addresses the following issues:
 * 1. Missing thumbnail_u_r_l column in downloads table
 * 2. Missing mime_type column in downloads table
 * 3. Other potentially missing columns
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix for downloads missing columns')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // 1. Fix downloads.thumbnail_u_r_l column
    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS thumbnail_u_r_l TEXT;
    `)

    // 2. Fix downloads.mime_type column
    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS mime_type TEXT;
    `)

    // 3. If mimetype already exists, copy values to mime_type
    await db.execute(sql`
      UPDATE payload.downloads 
      SET mime_type = mimetype
      WHERE mime_type IS NULL AND mimetype IS NOT NULL;
    `)

    // 4. Add other potentially missing columns
    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS filename TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS url TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS mime TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS alt_text TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS filename_original TEXT;
    `)

    // 5. Add image dimension columns
    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS width INTEGER;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS height INTEGER;
    `)

    // 6. Add focal point columns
    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS focal_x DECIMAL;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS focal_y DECIMAL;
    `)

    // 7. Add additional metadata columns
    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes JSONB;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_srcsets JSONB;
    `)

    // 8. Add specific size-related columns
    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_thumbnail_url TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_thumbnail_width INTEGER;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_thumbnail_height INTEGER;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_thumbnail_mime_type TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_thumbnail_filesize INTEGER;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_thumbnail_filename TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_card_url TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_card_width INTEGER;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_card_height INTEGER;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_card_mime_type TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_card_filesize INTEGER;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_card_filename TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_tablet_url TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_tablet_width INTEGER;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_tablet_height INTEGER;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_tablet_mime_type TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_tablet_filesize INTEGER;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS sizes_tablet_filename TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS caption TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS description TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS created_by TEXT;
    `)

    await db.execute(sql`
      ALTER TABLE payload.downloads ADD COLUMN IF NOT EXISTS updated_by TEXT;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully fixed all missing columns in downloads table')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error fixing downloads missing columns:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back downloads columns fix (not actually removing columns)')
  // We don't want to actually remove these columns as they might be required
}
