import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Add survey_id column to course_lessons table
    ALTER TABLE payload.course_lessons ADD COLUMN IF NOT EXISTS survey_id UUID;
    
    -- Add survey_id_id column to course_lessons table (for Payload compatibility)
    ALTER TABLE payload.course_lessons ADD COLUMN IF NOT EXISTS survey_id_id UUID;

    -- Add foreign key constraint for survey_id
    ALTER TABLE payload.course_lessons
    ADD CONSTRAINT fk_course_lessons_survey
    FOREIGN KEY (survey_id)
    REFERENCES payload.surveys(id)
    ON DELETE SET NULL;
    
    -- Add foreign key constraint for survey_id_id
    ALTER TABLE payload.course_lessons
    ADD CONSTRAINT fk_course_lessons_survey_id
    FOREIGN KEY (survey_id_id)
    REFERENCES payload.surveys(id)
    ON DELETE SET NULL;
  `)

  // Associate surveys with specific lessons
  const client = payload.db.drizzle

  // Get survey IDs
  const threeQuestionsResult = await client.execute(`
    SELECT id FROM payload.surveys WHERE slug = 'three-quick-questions'
  `)

  const feedbackResult = await client.execute(`
    SELECT id FROM payload.surveys WHERE slug = 'feedback'
  `)

  if (threeQuestionsResult.rows.length > 0 && feedbackResult.rows.length > 0) {
    const threeQuestionsId = threeQuestionsResult.rows[0].id
    const feedbackId = feedbackResult.rows[0].id

    // Associate surveys with lessons - set both survey_id and survey_id_id
    await client.execute(`
      UPDATE payload.course_lessons 
      SET survey_id = '${threeQuestionsId}', survey_id_id = '${threeQuestionsId}' 
      WHERE lesson_number = 103
    `)

    await client.execute(`
      UPDATE payload.course_lessons 
      SET survey_id = '${feedbackId}', survey_id_id = '${feedbackId}' 
      WHERE lesson_number = 802
    `)

    console.log('Successfully associated surveys with lessons')
  } else {
    console.log('Could not find one or both surveys - skipping association')
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Remove foreign key constraints
    ALTER TABLE payload.course_lessons
    DROP CONSTRAINT IF EXISTS fk_course_lessons_survey;
    
    ALTER TABLE payload.course_lessons
    DROP CONSTRAINT IF EXISTS fk_course_lessons_survey_id;

    -- Remove survey_id and survey_id_id columns
    ALTER TABLE payload.course_lessons
    DROP COLUMN IF EXISTS survey_id;
    
    ALTER TABLE payload.course_lessons
    DROP COLUMN IF EXISTS survey_id_id;
  `)
}
