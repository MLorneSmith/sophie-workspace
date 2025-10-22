import * as migration_20251017_185320 from './20251017_185320';
import * as migration_20251020_153818 from './20251020_153818';

export const migrations = [
  {
    up: migration_20251017_185320.up,
    down: migration_20251017_185320.down,
    name: '20251017_185320',
  },
  {
    up: migration_20251020_153818.up,
    down: migration_20251020_153818.down,
    name: '20251020_153818'
  },
];
