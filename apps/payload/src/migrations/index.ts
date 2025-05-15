import * as migration_20250514_150849 from './20250514_150849';
import * as migration_20250514_151404 from './20250514_151404';
import * as migration_20250514_151527 from './20250514_151527';
import * as migration_20250514_151845 from './20250514_151845';
import * as migration_20250514_152030 from './20250514_152030';
import * as migration_20250514_152353 from './20250514_152353';
import * as migration_20250514_152512 from './20250514_152512';
import * as migration_20250514_152612 from './20250514_152612';
import * as migration_20250514_153015 from './20250514_153015';

export const migrations = [
  {
    up: migration_20250514_150849.up,
    down: migration_20250514_150849.down,
    name: '20250514_150849',
  },
  {
    up: migration_20250514_151404.up,
    down: migration_20250514_151404.down,
    name: '20250514_151404',
  },
  {
    up: migration_20250514_151527.up,
    down: migration_20250514_151527.down,
    name: '20250514_151527',
  },
  {
    up: migration_20250514_151845.up,
    down: migration_20250514_151845.down,
    name: '20250514_151845',
  },
  {
    up: migration_20250514_152030.up,
    down: migration_20250514_152030.down,
    name: '20250514_152030',
  },
  {
    up: migration_20250514_152353.up,
    down: migration_20250514_152353.down,
    name: '20250514_152353',
  },
  {
    up: migration_20250514_152512.up,
    down: migration_20250514_152512.down,
    name: '20250514_152512',
  },
  {
    up: migration_20250514_152612.up,
    down: migration_20250514_152612.down,
    name: '20250514_152612',
  },
  {
    up: migration_20250514_153015.up,
    down: migration_20250514_153015.down,
    name: '20250514_153015'
  },
];
