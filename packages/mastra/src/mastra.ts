/**
 * Mastra singleton — initialized once per process.
 *
 * Uses Postgres (Supabase) for storage. Portkey gateway integration
 * will be added in #503.
 */

import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/pg";

let _mastra: Mastra | null = null;

/**
 * Returns the shared Mastra singleton. Creates it on first call.
 *
 * Database connection uses MASTRA_PG_CONNECTION_STRING or falls back
 * to DATABASE_URL (Supabase direct connection).
 */
export function getMastra(): Mastra {
	if (_mastra) return _mastra;

	const connectionString =
		process.env.MASTRA_PG_CONNECTION_STRING ?? process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error(
			"Missing MASTRA_PG_CONNECTION_STRING or DATABASE_URL for Mastra storage",
		);
	}

	const storage = new PostgresStore({
		id: "slideheroes-mastra",
		connectionString,
	});

	_mastra = new Mastra({
		storage,
		// Agents are registered dynamically as they are defined
		agents: {},
	});

	return _mastra;
}
