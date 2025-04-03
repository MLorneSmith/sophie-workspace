import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix Survey Questions Bidirectional Relationships
 *
 * This migration fixes the bidirectional relationships between surveys and survey questions:
 * 1. Ensures the surveys_rels table exists with field and value columns
 * 2. Creates entries in surveys_rels table for each survey question
 * 3. Ensures bidirectional relationships are properly established
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('Fixing survey-question bidirectional relationships...')

  try {
    await payload.db.drizzle.execute(sql`
      -- Step 1: Ensure the surveys_rels table exists with proper structure
      DO $$
      BEGIN
        -- Create the table if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'surveys_rels'
        ) THEN
          CREATE TABLE payload.surveys_rels (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            _parent_id uuid NOT NULL REFERENCES payload.surveys(id) ON DELETE CASCADE,
            field VARCHAR(255),
            value uuid,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END IF;
        
        -- Add field column if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'surveys_rels'
          AND column_name = 'field'
        ) THEN
          ALTER TABLE payload.surveys_rels ADD COLUMN field VARCHAR(255);
        END IF;
        
        -- Add value column if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'surveys_rels'
          AND column_name = 'value'
        ) THEN
          ALTER TABLE payload.surveys_rels ADD COLUMN value uuid;
        END IF;
      END $$;

      -- Step 2: Create bidirectional relationships between surveys and questions
      WITH questions_to_link AS (
        SELECT sq.id as question_id, sqr.surveys_id as survey_id
        FROM payload.survey_questions sq
        JOIN payload.survey_questions_rels sqr ON sq.id = sqr._parent_id
        WHERE sqr.surveys_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.surveys_rels sr
          WHERE sr._parent_id = sqr.surveys_id
          AND sr.field = 'questions'
          AND sr.value = sq.id
        )
      )
      INSERT INTO payload.surveys_rels (id, _parent_id, field, value, updated_at, created_at)
      SELECT 
        gen_random_uuid(), 
        survey_id, 
        'questions', 
        question_id,
        NOW(),
        NOW()
      FROM questions_to_link;
    `)

    // Verify the updates
    const verificationResult = await payload.db.drizzle.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM payload.survey_questions_rels WHERE surveys_id IS NOT NULL) as questions_count,
        (SELECT COUNT(*) FROM payload.surveys_rels WHERE field = 'questions') as bidirectional_count;
    `)

    const result = verificationResult.rows[0] || {}
    const questionsCount = parseInt(String(result.questions_count || '0'))
    const bidirectionalCount = parseInt(String(result.bidirectional_count || '0'))

    console.log(`Final verification:`)
    console.log(`- Survey questions with surveys_id: ${questionsCount}`)
    console.log(`- Bidirectional relationships in surveys_rels: ${bidirectionalCount}`)

    if (questionsCount === bidirectionalCount) {
      console.log('✅ All relationships are properly established')
    } else {
      console.log('❌ Some relationships are still missing')
    }

    console.log('Successfully completed fix for survey questions bidirectional relationships')
  } catch (error) {
    console.error('Error fixing survey-question relationships:', error)
    throw error
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert survey questions bidirectional relationships fix')

  try {
    await payload.db.drizzle.execute(sql`
      -- Remove bidirectional entries from surveys_rels table
      DELETE FROM payload.surveys_rels
      WHERE field = 'questions';
    `)

    console.log('Successfully reverted survey questions bidirectional relationships fix')
  } catch (error) {
    console.error('Error reverting survey questions bidirectional relationships fix:', error)
    throw error
  }
}
