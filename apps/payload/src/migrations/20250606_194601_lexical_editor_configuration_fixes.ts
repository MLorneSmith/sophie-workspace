import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."surveys" ADD COLUMN "title" varchar;
  ALTER TABLE "payload"."_surveys_v" ADD COLUMN "version_title" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."surveys" DROP COLUMN IF EXISTS "title";
  ALTER TABLE "payload"."_surveys_v" DROP COLUMN IF EXISTS "version_title";`)
}
