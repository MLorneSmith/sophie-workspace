#!/usr/bin/env tsx
/**
 * Fix Survey References
 *
 * Updates surveys.json to use correct survey-question _ref values
 * from the mapping file.
 */

import fs from 'fs';
import path from 'path';

const SEED_DATA_DIR = path.join(__dirname, '../seed-data');
const SURVEYS_FILE = path.join(SEED_DATA_DIR, 'surveys.json');
const MAPPING_FILE = path.join(SEED_DATA_DIR, 'survey-questions-mapping.json');

interface Survey {
  id: string;
  title: string;
  questions: string[];
  [key: string]: unknown;
}

interface Mapping {
  [surveyId: string]: string[];
}

async function fixSurveyRefs() {
  console.log('🔧 Fixing survey question references...\n');

  // Load mapping
  console.log('📖 Loading mapping file...');
  const mapping: Mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  console.log(`✅ Loaded mappings for ${Object.keys(mapping).length} surveys\n`);

  // Load surveys
  console.log('📖 Loading surveys...');
  const surveys: Survey[] = JSON.parse(fs.readFileSync(SURVEYS_FILE, 'utf8'));
  console.log(`✅ Loaded ${surveys.length} surveys\n`);

  // Fix each survey
  let fixCount = 0;
  for (const survey of surveys) {
    const surveyId = survey.id;
    const correctRefs = mapping[surveyId];

    if (!correctRefs) {
      console.log(`⚠️  No mapping found for survey: ${surveyId}`);
      continue;
    }

    // Update questions array with correct refs
    const oldQuestions = survey.questions;
    survey.questions = correctRefs.map((ref) => `{ref:survey-questions:${ref}}`);

    if (JSON.stringify(oldQuestions) !== JSON.stringify(survey.questions)) {
      fixCount++;
      console.log(`✅ Fixed ${surveyId}: ${correctRefs.length} questions`);
      console.log(`   Old: ${oldQuestions.slice(0, 2).join(', ')}...`);
      console.log(`   New: ${survey.questions.slice(0, 2).join(', ')}...`);
    }
  }

  // Save updated surveys
  if (fixCount > 0) {
    console.log(`\n💾 Saving updated surveys...`);
    fs.writeFileSync(SURVEYS_FILE, JSON.stringify(surveys, null, 2));
    console.log(`✅ Updated ${fixCount} surveys in ${SURVEYS_FILE}`);
  } else {
    console.log('\n✅ No surveys needed fixing');
  }

  console.log('\n🎉 Survey reference fix complete!\n');
}

fixSurveyRefs().catch((error) => {
  console.error('❌ Error fixing survey refs:', error);
  process.exit(1);
});
