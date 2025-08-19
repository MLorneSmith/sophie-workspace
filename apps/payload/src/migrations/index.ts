import * as migration_20250709_164603 from "./20250709_164603";
import * as migration_20250819_180320_users_sessions_fix from "./20250819_180320_users_sessions_fix";

export const migrations = [
	{
		up: migration_20250709_164603.up,
		down: migration_20250709_164603.down,
		name: "20250709_164603",
	},
	{
		up: migration_20250819_180320_users_sessions_fix.up,
		down: migration_20250819_180320_users_sessions_fix.down,
		name: "20250819_180320_users_sessions_fix",
	},
];
