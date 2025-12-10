import * as migration_20251208_141121 from './20251208_141121';
import * as migration_20251210_195519 from './20251210_195519';

export const migrations = [
  {
    up: migration_20251208_141121.up,
    down: migration_20251208_141121.down,
    name: '20251208_141121',
  },
  {
    up: migration_20251210_195519.up,
    down: migration_20251210_195519.down,
    name: '20251210_195519'
  },
];
