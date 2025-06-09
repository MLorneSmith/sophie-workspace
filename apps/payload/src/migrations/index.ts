import * as migration_20250609_140753 from "./20250609_140753";

export const migrations = [
	{
		up: migration_20250609_140753.up,
		down: migration_20250609_140753.down,
		name: "20250609_140753",
	},
];
