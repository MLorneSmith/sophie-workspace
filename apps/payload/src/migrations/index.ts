// Import archived migrations (commented out but preserved for reference)
// import * as migration_20250327_152618_initial_schema from './archived/20250327_152618_initial_schema'
// ... other archived migrations
// import * as migration_20250402_320000_field_naming from './archived/20250402_320000_field_naming'
// import * as migration_20250402_360000_add_missing_tables from './archived/20250402_360000_add_missing_tables'
// import * as migration_20250402_370000_add_missing_columns from './archived/20250402_370000_add_missing_columns'

// Import migrations from root directory
import * as migration_20250402_100000_schema_creation from './20250402_100000_schema_creation'
import * as migration_20250402_300000_base_schema from './20250402_300000_base_schema'
import * as migration_20250402_305000_seed_course_data from './20250402_305000_seed_course_data'
import * as migration_20250402_310000_relationship_structure from './20250402_310000_relationship_structure'
import * as migration_20250402_330000_bidirectional_relationships from './20250402_330000_bidirectional_relationships'
import * as migration_20250402_340000_add_users_table from './20250402_340000_add_users_table'
import * as migration_20250402_350000_create_admin_user from './20250402_350000_create_admin_user'
import * as migration_20250403_200000_process_content from './20250403_200000_process_content'
import * as migration_20250403_300000_add_lesson_enhancements from './20250403_300000_add_lesson_enhancements'
import * as migration_20250404_100000_fix_lesson_quiz_relationships from './20250404_100000_fix_lesson_quiz_relationships'
import * as migration_20250407_100000_add_survey_id_to_lessons from './20250407_100000_add_survey_id_to_lessons'
import * as migration_20250407_100000_fix_missing_lesson_quiz_relationships from './20250407_100000_fix_missing_lesson_quiz_relationships'
import * as migration_20250410_120500_relationship_columns_fix from './20250410_120500_relationship_columns_fix'
import * as migration_20250420_100000_master_relationship_migration from './20250415_100000_master_relationship_migration'
import * as migration_20250420_100000_master_relationship_view from './20250415_110000_master_relationship_view'
import * as migration_20250425_100000_proactive_uuid_table_monitoring from './20250415_120000_proactive_uuid_table_monitoring'
import * as migration_20250430_100000_fix_downloads_relationships_view from './20250415_130000_fix_downloads_relationships_view'
import * as migration_20250430_110000_fix_missing_columns from './20250415_140000_fix_missing_columns'
import * as migration_20250430_120000_fix_remaining_columns from './20250415_150000_fix_remaining_columns'
import * as migration_20250430_130000_fix_downloads_thumbnail_url from './20250415_180000_fix_downloads_thumbnail_url'

export const migrations = [
  // Add schema creation migration first
  {
    up: migration_20250402_100000_schema_creation.up,
    down: migration_20250402_100000_schema_creation.down,
    name: '20250402_100000_schema_creation',
  },
  // Then add base schema migration
  {
    up: migration_20250402_300000_base_schema.up,
    down: migration_20250402_300000_base_schema.down,
    name: '20250402_300000_base_schema',
  },
  // Then add seed course data migration
  {
    up: migration_20250402_305000_seed_course_data.up,
    down: migration_20250402_305000_seed_course_data.down,
    name: '20250402_305000_seed_course_data',
  },
  // Then add relationship structure migration
  {
    up: migration_20250402_310000_relationship_structure.up,
    down: migration_20250402_310000_relationship_structure.down,
    name: '20250402_310000_relationship_structure',
  },
  // Then add bidirectional relationships migration
  {
    up: migration_20250402_330000_bidirectional_relationships.up,
    down: migration_20250402_330000_bidirectional_relationships.down,
    name: '20250402_330000_bidirectional_relationships',
  },
  // Then add users table migration
  {
    up: migration_20250402_340000_add_users_table.up,
    down: migration_20250402_340000_add_users_table.down,
    name: '20250402_340000_add_users_table',
  },
  // Finally add create admin user migration
  {
    up: migration_20250402_350000_create_admin_user.up,
    down: migration_20250402_350000_create_admin_user.down,
    name: '20250402_350000_create_admin_user',
  },
  // Add content processing migration
  {
    up: migration_20250403_200000_process_content.up,
    down: migration_20250403_200000_process_content.down,
    name: '20250403_200000_process_content',
  },
  // Add lesson enhancements migration
  {
    up: migration_20250403_300000_add_lesson_enhancements.up,
    down: migration_20250403_300000_add_lesson_enhancements.down,
    name: '20250403_300000_add_lesson_enhancements',
  },
  // Add fix lesson quiz relationships migration
  {
    up: migration_20250404_100000_fix_lesson_quiz_relationships.up,
    down: migration_20250404_100000_fix_lesson_quiz_relationships.down,
    name: '20250404_100000_fix_lesson_quiz_relationships',
  },
  // Add survey ID to lessons migration
  {
    up: migration_20250407_100000_add_survey_id_to_lessons.up,
    down: migration_20250407_100000_add_survey_id_to_lessons.down,
    name: '20250407_100000_add_survey_id_to_lessons',
  },
  // Add fix missing lesson quiz relationships migration
  {
    up: migration_20250407_100000_fix_missing_lesson_quiz_relationships.up,
    down: migration_20250407_100000_fix_missing_lesson_quiz_relationships.down,
    name: '20250407_100000_fix_missing_lesson_quiz_relationships',
  },
  // Add relationship columns fix migration
  {
    up: migration_20250410_120500_relationship_columns_fix.up,
    down: migration_20250410_120500_relationship_columns_fix.down,
    name: '20250410_120500_relationship_columns_fix',
  },
  // Add master relationship migration
  {
    up: migration_20250420_100000_master_relationship_migration.up,
    down: migration_20250420_100000_master_relationship_migration.down,
    name: '20250420_100000_master_relationship_migration',
  },
  // Add master relationship view migration
  {
    up: migration_20250420_100000_master_relationship_view.up,
    down: migration_20250420_100000_master_relationship_view.down,
    name: '20250420_100000_master_relationship_view',
  },
  // Add proactive UUID table monitoring migration
  {
    up: migration_20250425_100000_proactive_uuid_table_monitoring.up,
    down: migration_20250425_100000_proactive_uuid_table_monitoring.down,
    name: '20250425_100000_proactive_uuid_table_monitoring',
  },
  // Add fix downloads relationships view migration
  {
    up: migration_20250430_100000_fix_downloads_relationships_view.up,
    down: migration_20250430_100000_fix_downloads_relationships_view.down,
    name: '20250430_100000_fix_downloads_relationships_view',
  },
  // Fix missing columns migration
  {
    up: migration_20250430_110000_fix_missing_columns.up,
    down: migration_20250430_110000_fix_missing_columns.down,
    name: '20250430_110000_fix_missing_columns',
  },
  // Fix remaining columns migration
  {
    up: migration_20250430_120000_fix_remaining_columns.up,
    down: migration_20250430_120000_fix_remaining_columns.down,
    name: '20250430_120000_fix_remaining_columns',
  },
  // Fix downloads thumbnail URL column migration
  {
    up: migration_20250430_130000_fix_downloads_thumbnail_url.up,
    down: migration_20250430_130000_fix_downloads_thumbnail_url.down,
    name: '20250430_130000_fix_downloads_thumbnail_url',
  },
]
