import * as migration_20250528_170746 from './20250528_170746';

export const migrations = [
  {
    up: migration_20250528_170746.up,
    down: migration_20250528_170746.down,
    name: '20250528_170746'
  },
];
