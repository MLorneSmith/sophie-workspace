import * as migration_20250606_152349 from "./20250606_152349";

export const migrations = [
	{
		up: migration_20250606_152349.up,
		down: migration_20250606_152349.down,
		name: "20250606_152349",
	},
];
