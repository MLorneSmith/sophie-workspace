import * as migration_20251208_141121 from './20251208_141121';

export const migrations = [
  {
    up: migration_20251208_141121.up,
    down: migration_20251208_141121.down,
    name: '20251208_141121'
  },
];
