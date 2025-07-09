import * as migration_20250709_134949 from "./20250709_134949";

export const migrations = [
	{
		up: migration_20250709_134949.up,
		down: migration_20250709_134949.down,
		name: "20250709_134949",
	},
];
