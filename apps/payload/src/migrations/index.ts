import * as migration_20251031_205841 from './20251031_205841';

export const migrations = [
  {
    up: migration_20251031_205841.up,
    down: migration_20251031_205841.down,
    name: '20251031_205841'
  },
];
