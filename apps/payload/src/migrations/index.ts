// Import archived migrations (commented out but preserved for reference)
// import * as migration_20250327_152618_initial_schema from './archived/20250327_152618_initial_schema'
// ... other archived migrations

// Import migrations from root directory
import * as migration_20250402_100000_schema_creation from './20250402_100000_schema_creation'
import * as migration_20250402_300000_base_schema from './20250402_300000_base_schema'
import * as migration_20250402_310000_relationship_structure from './20250402_310000_relationship_structure'
import * as migration_20250402_320000_field_naming from './20250402_320000_field_naming'
import * as migration_20250402_330000_bidirectional_relationships from './20250402_330000_bidirectional_relationships'

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
  // Then add relationship structure migration
  {
    up: migration_20250402_310000_relationship_structure.up,
    down: migration_20250402_310000_relationship_structure.down,
    name: '20250402_310000_relationship_structure',
  },
  // Then add field naming migration
  {
    up: migration_20250402_320000_field_naming.up,
    down: migration_20250402_320000_field_naming.down,
    name: '20250402_320000_field_naming',
  },
  // Finally add bidirectional relationships migration
  {
    up: migration_20250402_330000_bidirectional_relationships.up,
    down: migration_20250402_330000_bidirectional_relationships.down,
    name: '20250402_330000_bidirectional_relationships',
  },
]
