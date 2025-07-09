import * as migration_20250709_164603 from "./20250709_164603";

export const migrations = [
	{
		up: migration_20250709_164603.up,
		down: migration_20250709_164603.down,
		name: "20250709_164603",
	},
];
