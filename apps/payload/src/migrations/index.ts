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
]
