import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."surveys" DROP COLUMN "status";
  ALTER TABLE "payload"."_surveys_v" DROP COLUMN "version_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."surveys" ADD COLUMN "status" "payload"."enum_surveys_status" DEFAULT 'draft';
  ALTER TABLE "payload"."_surveys_v" ADD COLUMN "version_status" "payload"."enum__surveys_v_version_status" DEFAULT 'draft';`)
}
