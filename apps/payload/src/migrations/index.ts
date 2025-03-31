import * as migration_20250327_152618_initial_schema from './20250327_152618_initial_schema'
import * as migration_20250328_145700_fix_column_names from './20250328_145700_fix_column_names'

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
]
