import * as migration_20250529_205110 from "./20250529_205110";

export const migrations = [
	{
		up: migration_20250529_205110.up,
		down: migration_20250529_205110.down,
		name: "20250529_205110",
	},
];
