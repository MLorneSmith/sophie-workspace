/**
 * Script to fix survey progress records
 *
 * This script updates the total_questions field in survey_progress records
 * to match the actual number of questions for each survey.
 */
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get the actual question count for a survey
 */
async function getActualQuestionCount(surveyId: string): Promise<number> {
  try {
    // Get the survey questions from the payload schema
    const { data, error } = await supabase
      .from('payload.survey_questions')
      .select('id')
      .eq('surveys_id', surveyId);

    if (error) {
      console.error(`Error getting questions for survey ${surveyId}:`, error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error(`Error in getActualQuestionCount for ${surveyId}:`, error);
    return 0;
  }
}

/**
 * Fix survey progress records
 */
async function fixSurveyProgressRecords() {
  try {
    console.log('Starting survey progress records fix...');

    // Get all surveys from the payload schema
    const { data: surveys, error: surveysError } = await supabase
      .from('payload.surveys')
      .select('id, title, slug');

    if (surveysError) {
      console.error('Error getting surveys:', surveysError);
      return;
    }

    console.log(`Found ${surveys.length} surveys to process`);

    // Process each survey
    for (const survey of surveys) {
      // Get the actual question count for the survey
      const actualQuestionCount = await getActualQuestionCount(survey.id);

      console.log(
        `Survey "${survey.title}" (${survey.id}) has ${actualQuestionCount} questions`,
      );

      if (actualQuestionCount === 0) {
        console.log(
          `Skipping survey "${survey.title}" (${survey.id}) - no questions found`,
        );
        continue;
      }

      // Get all progress records for this survey
      const { data: progressRecords, error: progressError } = await supabase
        .from('survey_progress')
        .select('*')
        .eq('survey_id', survey.id);

      if (progressError) {
        console.error(
          `Error getting progress records for survey ${survey.id}:`,
          progressError,
        );
        continue;
      }

      console.log(
        `Found ${progressRecords?.length || 0} progress records for survey "${survey.title}"`,
      );

      // Update each progress record
      for (const record of progressRecords || []) {
        // Skip if the total_questions is already correct
        if (record.total_questions === actualQuestionCount) {
          console.log(
            `Progress record ${record.id} already has correct question count`,
          );
          continue;
        }

        // Calculate new progress percentage
        const progressPercentage =
          ((record.current_question_index || 0) / actualQuestionCount) * 100;

        // Update the record
        const { error: updateError } = await supabase
          .from('survey_progress')
          .update({
            total_questions: actualQuestionCount,
            progress_percentage: progressPercentage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id);

        if (updateError) {
          console.error(
            `Error updating progress record ${record.id}:`,
            updateError,
          );
        } else {
          console.log(
            `Updated progress record ${record.id} from ${record.total_questions} to ${actualQuestionCount} questions`,
          );
        }
      }
    }

    console.log('Survey progress records fix completed');
  } catch (error) {
    console.error('Error in fixSurveyProgressRecords:', error);
  }
}

// Run the script
fixSurveyProgressRecords()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
