import * as migration_20250606_152349 from './20250606_152349';
import * as migration_20250606_194601_lexical_editor_configuration_fixes from './20250606_194601_lexical_editor_configuration_fixes';

export const migrations = [
  {
    up: migration_20250606_152349.up,
    down: migration_20250606_152349.down,
    name: '20250606_152349',
  },
  {
    up: migration_20250606_194601_lexical_editor_configuration_fixes.up,
    down: migration_20250606_194601_lexical_editor_configuration_fixes.down,
    name: '20250606_194601_lexical_editor_configuration_fixes'
  },
];
