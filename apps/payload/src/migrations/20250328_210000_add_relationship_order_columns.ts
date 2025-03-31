import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Get all relationship tables in the payload schema (tables with _parent_id column)
  const tablesResult = await db.execute(sql`
    SELECT DISTINCT table_name 
    FROM information_schema.columns 
    WHERE table_schema = 'payload' 
    AND column_name = '_parent_id'
  `)

  const tables = tablesResult.rows.map((row) => row.table_name as string)

  // For each relationship table, add an _order column that maps to the order column
  for (const table of tables) {
    await db.execute(sql`
      ALTER TABLE "payload".${sql.identifier(table)}
      ADD COLUMN IF NOT EXISTS "_order" integer GENERATED ALWAYS AS ("order") STORED
    `)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Get all relationship tables in the payload schema (tables with _parent_id column)
  const tablesResult = await db.execute(sql`
    SELECT DISTINCT table_name 
    FROM information_schema.columns 
    WHERE table_schema = 'payload' 
    AND column_name = '_parent_id'
  `)

  const tables = tablesResult.rows.map((row) => row.table_name as string)

  // For each relationship table, drop the _order column
  for (const table of tables) {
    await db.execute(sql`
      ALTER TABLE "payload".${sql.identifier(table)}
      DROP COLUMN IF EXISTS "_order"
    `)
  }
}
