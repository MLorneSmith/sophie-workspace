import * as migration_20250327_152618_initial_schema from './20250327_152618_initial_schema'
import * as migration_20250328_145700_fix_column_names from './20250328_145700_fix_column_names'
import * as migration_20250328_153500_create_preferences_table from './20250328_153500_create_preferences_table'
import * as migration_20250328_153700_fix_user_relations from './20250328_153700_fix_user_relations'
import * as migration_20250328_154000_create_enum_types from './20250328_154000_create_enum_types'
import * as migration_20250328_155000_update_existing_tables_to_uuid from './20250328_155000_update_existing_tables_to_uuid'
import * as migration_20250328_160000_create_collection_tables from './20250328_160000_create_collection_tables'
import * as migration_20250328_170000_add_array_relationship_tables from './20250328_170000_add_array_relationship_tables'
import * as migration_20250328_175000_add_missing_fields from './20250328_175000_add_missing_fields'
import * as migration_20250328_180000_add_more_array_relationship_tables from './20250328_180000_add_more_array_relationship_tables'
import * as migration_20250328_185000_add_documentation_relationship_tables from './20250328_185000_add_documentation_relationship_tables'
// Removing these migrations as they're no longer needed
// import * as migration_20250328_190000_rename_parent_id_columns from './20250328_190000_rename_parent_id_columns'
// import * as migration_20250328_195000_fix_field_names from './20250328_195000_fix_field_names'
import * as migration_20250328_200000_add_column_mapping_views from './20250328_200000_add_column_mapping_views'
import * as migration_20250328_205000_add_order_columns from './20250328_205000_add_order_columns'
import * as migration_20250328_210000_add_relationship_order_columns from './20250328_210000_add_relationship_order_columns'
import * as migration_20250328_215000_add_documentation_breadcrumbs from './20250328_215000_add_documentation_breadcrumbs'
import * as migration_20250328_220000_add_missing_posts_fields from './20250328_220000_add_missing_posts_fields'
import * as migration_20250328_225000_add_survey_questions_text_column from './20250328_225000_add_survey_questions_text_column'
// Removing this migration as it's no longer needed
// import * as migration_20250328_230000_fix_users_parent_id from './20250328_230000_fix_users_parent_id'

// New migrations to fix column naming issues
import * as migration_20250331_124000_fix_documentation_categories from './20250331_124000_fix_documentation_categories'
import * as migration_20250331_124100_fix_upload_field_naming from './20250331_124100_fix_upload_field_naming'
import * as migration_20250331_124200_fix_case_conversion from './20250331_124200_fix_case_conversion'
import * as migration_20250331_124300_fix_relationship_field_naming from './20250331_124300_fix_relationship_field_naming'

// New migrations to fix remaining issues
import * as migration_20250331_130000_fix_documentation_tags from './20250331_130000_fix_documentation_tags'
import * as migration_20250331_130100_fix_case_conversion_all from './20250331_130100_fix_case_conversion_all'
import * as migration_20250331_130200_add_missing_columns from './20250331_130200_add_missing_columns'
import * as migration_20250331_140000_fix_remaining_column_issues from './20250331_140000_fix_remaining_column_issues'
import * as migration_20250331_150000_fix_column_naming_issues from './20250331_150000_fix_column_naming_issues'
import * as migration_20250331_160000_fix_missing_columns from './20250331_160000_fix_missing_columns'
import * as migration_20250331_160100_fix_documentation_parent_id from './20250331_160100_fix_documentation_parent_id'
import * as migration_20250331_170000_cleanup_redundant_columns from './20250331_170000_cleanup_redundant_columns'
import * as migration_20250331_180000_add_media_id_to_relationship_tables from './20250331_180000_add_media_id_to_relationship_tables'
import * as migration_20250331_190000_add_documentation_id_to_relationship_tables from './20250331_190000_add_documentation_id_to_relationship_tables'
import * as migration_20250331_200000_add_posts_id_to_relationship_tables from './20250331_200000_add_posts_id_to_relationship_tables'
import * as migration_20250331_210000_add_surveys_id_to_relationship_tables from './20250331_210000_add_surveys_id_to_relationship_tables'
import * as migration_20250331_220000_add_survey_questions_id_to_relationship_tables from './20250331_220000_add_survey_questions_id_to_relationship_tables'
import * as migration_20250331_230000_add_courses_id_to_relationship_tables from './20250331_230000_add_courses_id_to_relationship_tables'
import * as migration_20250331_240000_add_all_missing_relationship_columns from './20250331_240000_add_all_missing_relationship_columns'
import * as migration_20250401_104500_seed_course_data from './20250401104500_seed_course_data'

export const migrations = [
  {
    up: migration_20250327_152618_initial_schema.up,
    down: migration_20250327_152618_initial_schema.down,
    name: '20250327_152618_initial_schema',
  },
  {
    up: migration_20250328_145700_fix_column_names.up,
    down: migration_20250328_145700_fix_column_names.down,
    name: '20250328_145700_fix_column_names',
  },
  {
    up: migration_20250328_153500_create_preferences_table.up,
    down: migration_20250328_153500_create_preferences_table.down,
    name: '20250328_153500_create_preferences_table',
  },
  {
    up: migration_20250328_153700_fix_user_relations.up,
    down: migration_20250328_153700_fix_user_relations.down,
    name: '20250328_153700_fix_user_relations',
  },
  {
    up: migration_20250328_154000_create_enum_types.up,
    down: migration_20250328_154000_create_enum_types.down,
    name: '20250328_154000_create_enum_types',
  },
  {
    up: migration_20250328_155000_update_existing_tables_to_uuid.up,
    down: migration_20250328_155000_update_existing_tables_to_uuid.down,
    name: '20250328_155000_update_existing_tables_to_uuid',
  },
  {
    up: migration_20250328_160000_create_collection_tables.up,
    down: migration_20250328_160000_create_collection_tables.down,
    name: '20250328_160000_create_collection_tables',
  },
  {
    up: migration_20250328_170000_add_array_relationship_tables.up,
    down: migration_20250328_170000_add_array_relationship_tables.down,
    name: '20250328_170000_add_array_relationship_tables',
  },
  {
    up: migration_20250328_175000_add_missing_fields.up,
    down: migration_20250328_175000_add_missing_fields.down,
    name: '20250328_175000_add_missing_fields',
  },
  {
    up: migration_20250328_180000_add_more_array_relationship_tables.up,
    down: migration_20250328_180000_add_more_array_relationship_tables.down,
    name: '20250328_180000_add_more_array_relationship_tables',
  },
  {
    up: migration_20250328_185000_add_documentation_relationship_tables.up,
    down: migration_20250328_185000_add_documentation_relationship_tables.down,
    name: '20250328_185000_add_documentation_relationship_tables',
  },
  // Removing these migrations as they're no longer needed
  // {
  //   up: migration_20250328_190000_rename_parent_id_columns.up,
  //   down: migration_20250328_190000_rename_parent_id_columns.down,
  //   name: '20250328_190000_rename_parent_id_columns',
  // },
  // {
  //   up: migration_20250328_195000_fix_field_names.up,
  //   down: migration_20250328_195000_fix_field_names.down,
  //   name: '20250328_195000_fix_field_names',
  // },
  {
    up: migration_20250328_200000_add_column_mapping_views.up,
    down: migration_20250328_200000_add_column_mapping_views.down,
    name: '20250328_200000_add_column_mapping_views',
  },
  {
    up: migration_20250328_205000_add_order_columns.up,
    down: migration_20250328_205000_add_order_columns.down,
    name: '20250328_205000_add_order_columns',
  },
  {
    up: migration_20250328_210000_add_relationship_order_columns.up,
    down: migration_20250328_210000_add_relationship_order_columns.down,
    name: '20250328_210000_add_relationship_order_columns',
  },
  {
    up: migration_20250328_215000_add_documentation_breadcrumbs.up,
    down: migration_20250328_215000_add_documentation_breadcrumbs.down,
    name: '20250328_215000_add_documentation_breadcrumbs',
  },
  {
    up: migration_20250328_220000_add_missing_posts_fields.up,
    down: migration_20250328_220000_add_missing_posts_fields.down,
    name: '20250328_220000_add_missing_posts_fields',
  },
  {
    up: migration_20250328_225000_add_survey_questions_text_column.up,
    down: migration_20250328_225000_add_survey_questions_text_column.down,
    name: '20250328_225000_add_survey_questions_text_column',
  },
  // Removing this migration as it's no longer needed
  // {
  //   up: migration_20250328_230000_fix_users_parent_id.up,
  //   down: migration_20250328_230000_fix_users_parent_id.down,
  //   name: '20250328_230000_fix_users_parent_id',
  // },

  // New migrations to fix column naming issues
  {
    up: migration_20250331_124000_fix_documentation_categories.up,
    down: migration_20250331_124000_fix_documentation_categories.down,
    name: '20250331_124000_fix_documentation_categories',
  },
  {
    up: migration_20250331_124100_fix_upload_field_naming.up,
    down: migration_20250331_124100_fix_upload_field_naming.down,
    name: '20250331_124100_fix_upload_field_naming',
  },
  {
    up: migration_20250331_124200_fix_case_conversion.up,
    down: migration_20250331_124200_fix_case_conversion.down,
    name: '20250331_124200_fix_case_conversion',
  },
  {
    up: migration_20250331_124300_fix_relationship_field_naming.up,
    down: migration_20250331_124300_fix_relationship_field_naming.down,
    name: '20250331_124300_fix_relationship_field_naming',
  },

  // New migrations to fix remaining issues
  {
    up: migration_20250331_130000_fix_documentation_tags.up,
    down: migration_20250331_130000_fix_documentation_tags.down,
    name: '20250331_130000_fix_documentation_tags',
  },
  {
    up: migration_20250331_130100_fix_case_conversion_all.up,
    down: migration_20250331_130100_fix_case_conversion_all.down,
    name: '20250331_130100_fix_case_conversion_all',
  },
  {
    up: migration_20250331_130200_add_missing_columns.up,
    down: migration_20250331_130200_add_missing_columns.down,
    name: '20250331_130200_add_missing_columns',
  },
  {
    up: migration_20250331_140000_fix_remaining_column_issues.up,
    down: migration_20250331_140000_fix_remaining_column_issues.down,
    name: '20250331_140000_fix_remaining_column_issues',
  },
  {
    up: migration_20250331_150000_fix_column_naming_issues.up,
    down: migration_20250331_150000_fix_column_naming_issues.down,
    name: '20250331_150000_fix_column_naming_issues',
  },
  {
    up: migration_20250331_160000_fix_missing_columns.up,
    down: migration_20250331_160000_fix_missing_columns.down,
    name: '20250331_160000_fix_missing_columns',
  },
  {
    up: migration_20250331_160100_fix_documentation_parent_id.up,
    down: migration_20250331_160100_fix_documentation_parent_id.down,
    name: '20250331_160100_fix_documentation_parent_id',
  },
  {
    up: migration_20250331_170000_cleanup_redundant_columns.up,
    down: migration_20250331_170000_cleanup_redundant_columns.down,
    name: '20250331_170000_cleanup_redundant_columns',
  },
  {
    up: migration_20250331_180000_add_media_id_to_relationship_tables.up,
    down: migration_20250331_180000_add_media_id_to_relationship_tables.down,
    name: '20250331_180000_add_media_id_to_relationship_tables',
  },
  {
    up: migration_20250331_190000_add_documentation_id_to_relationship_tables.up,
    down: migration_20250331_190000_add_documentation_id_to_relationship_tables.down,
    name: '20250331_190000_add_documentation_id_to_relationship_tables',
  },
  {
    up: migration_20250331_200000_add_posts_id_to_relationship_tables.up,
    down: migration_20250331_200000_add_posts_id_to_relationship_tables.down,
    name: '20250331_200000_add_posts_id_to_relationship_tables',
  },
  {
    up: migration_20250331_210000_add_surveys_id_to_relationship_tables.up,
    down: migration_20250331_210000_add_surveys_id_to_relationship_tables.down,
    name: '20250331_210000_add_surveys_id_to_relationship_tables',
  },
  {
    up: migration_20250331_220000_add_survey_questions_id_to_relationship_tables.up,
    down: migration_20250331_220000_add_survey_questions_id_to_relationship_tables.down,
    name: '20250331_220000_add_survey_questions_id_to_relationship_tables',
  },
  {
    up: migration_20250331_230000_add_courses_id_to_relationship_tables.up,
    down: migration_20250331_230000_add_courses_id_to_relationship_tables.down,
    name: '20250331_230000_add_courses_id_to_relationship_tables',
  },
  {
    up: migration_20250331_240000_add_all_missing_relationship_columns.up,
    down: migration_20250331_240000_add_all_missing_relationship_columns.down,
    name: '20250331_240000_add_all_missing_relationship_columns',
  },
  {
    up: migration_20250401_104500_seed_course_data.up,
    down: migration_20250401_104500_seed_course_data.down,
    name: '20250401104500_seed_course_data',
  },
]
