import * as migration_20250527_161647 from './20250527_161647';
import * as migration_20250527_175214_add_nested_docs_breadcrumbs from './20250527_175214_add_nested_docs_breadcrumbs';

export const migrations = [
  {
    up: migration_20250527_161647.up,
    down: migration_20250527_161647.down,
    name: '20250527_161647',
  },
  {
    up: migration_20250527_175214_add_nested_docs_breadcrumbs.up,
    down: migration_20250527_175214_add_nested_docs_breadcrumbs.down,
    name: '20250527_175214_add_nested_docs_breadcrumbs'
  },
];
