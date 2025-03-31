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

  // For each table, check if it has an order column
  for (const table of tables) {
    const columnResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = ${table} 
      AND column_name = 'order'
    `)

    // If the table has an order column, add an _order column that maps to it
    if (columnResult.rows.length > 0) {
      await db.execute(sql`
        ALTER TABLE "payload".${sql.identifier(table)}
        ADD COLUMN IF NOT EXISTS "_order" integer GENERATED ALWAYS AS ("order") STORED
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

  // For each table, check if it has an _order column
  for (const table of tables) {
    const columnResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = ${table} 
      AND column_name = '_order'
    `)

    // If the table has an _order column, drop it
    if (columnResult.rows.length > 0) {
      await db.execute(sql`
        ALTER TABLE "payload".${sql.identifier(table)}
        DROP COLUMN IF EXISTS "_order"
      `)
    }
  }
}
