import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Get all tables in the payload schema
  const tablesResult = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'payload' 
    AND table_type = 'BASE TABLE'
  `)

  const tables = tablesResult.rows.map((row) => row.table_name as string)

  // For each table, check if it has a _parent_id column
  for (const table of tables) {
    const columnResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = ${table} 
      AND column_name = '_parent_id'
    `)

    // If the table has a _parent_id column, create a view that maps it to parent_id
    if (columnResult.rows.length > 0) {
      await db.execute(sql`
        ALTER TABLE "payload".${sql.identifier(table)}
        ADD COLUMN IF NOT EXISTS "parent_id" uuid GENERATED ALWAYS AS ("_parent_id") STORED
      `)
    }
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Get all tables in the payload schema
  const tablesResult = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'payload' 
    AND table_type = 'BASE TABLE'
  `)

  const tables = tablesResult.rows.map((row) => row.table_name as string)

  // For each table, check if it has a parent_id column
  for (const table of tables) {
    const columnResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = ${table} 
      AND column_name = 'parent_id'
    `)

    // If the table has a parent_id column, drop it
    if (columnResult.rows.length > 0) {
      await db.execute(sql`
        ALTER TABLE "payload".${sql.identifier(table)}
        DROP COLUMN IF EXISTS "parent_id"
      `)
    }
  }
}
