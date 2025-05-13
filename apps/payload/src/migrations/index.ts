import * as migration_20250509_185645_quiz_question_slug_not_unique_index from './20250509_185645_quiz_question_slug_not_unique_index';

export const migrations = [
  {
    up: migration_20250509_185645_quiz_question_slug_not_unique_index.up,
    down: migration_20250509_185645_quiz_question_slug_not_unique_index.down,
    name: '20250509_185645_quiz_question_slug_not_unique_index'
  },
];
