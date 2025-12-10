import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."course_lessons" ADD COLUMN "lesson_image_id" uuid;
  ALTER TABLE "payload"."_course_lessons_v" ADD COLUMN "version_lesson_image_id" uuid;
  ALTER TABLE "payload"."course_lessons" ADD CONSTRAINT "course_lessons_lesson_image_id_media_id_fk" FOREIGN KEY ("lesson_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_course_lessons_v" ADD CONSTRAINT "_course_lessons_v_version_lesson_image_id_media_id_fk" FOREIGN KEY ("version_lesson_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "course_lessons_lesson_image_idx" ON "payload"."course_lessons" USING btree ("lesson_image_id");
  CREATE INDEX "_course_lessons_v_version_version_lesson_image_idx" ON "payload"."_course_lessons_v" USING btree ("version_lesson_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."course_lessons" DROP CONSTRAINT "course_lessons_lesson_image_id_media_id_fk";
  
  ALTER TABLE "payload"."_course_lessons_v" DROP CONSTRAINT "_course_lessons_v_version_lesson_image_id_media_id_fk";
  
  DROP INDEX "payload"."course_lessons_lesson_image_idx";
  DROP INDEX "payload"."_course_lessons_v_version_version_lesson_image_idx";
  ALTER TABLE "payload"."course_lessons" DROP COLUMN "lesson_image_id";
  ALTER TABLE "payload"."_course_lessons_v" DROP COLUMN "version_lesson_image_id";`)
}
