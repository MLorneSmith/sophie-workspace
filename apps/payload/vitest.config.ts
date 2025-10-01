/**
 * Vitest configuration for Payload CMS application
 * Configures testing environment for server-side logic, schemas, and utilities
 */

import { resolve } from "node:path";
import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		// Project-specific configuration only
		name: "payload",
		environment: "node",
		globals: true,

		// Setup file to load environment variables before tests
		setupFiles: ["./vitest.setup.ts"],

		// Test discovery
		include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/.next/**",
			"**/coverage/**",
		],

		// Project-specific performance settings
		testTimeout: 15000, // Longer timeout for potential DB operations
		hookTimeout: 10000,

		// Project-specific thread pool settings (safer for database operations)
		poolOptions: {
			threads: {
				singleThread: true,
				isolate: true,
			},
		},

		// Server-side dependencies that need to be externalized (ESM only)
		server: {
			deps: {
				inline: ["chalk"],
			},
		},
	},

	// Path resolution for Payload
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
			"@/collections": resolve(__dirname, "./src/collections"),
			"@/components": resolve(__dirname, "./src/components"),
			"@/lib": resolve(__dirname, "./src/lib"),
			// Kit packages
			"@kit/shared": resolve(__dirname, "../../packages/shared/src"),
		},
	},

	// Environment setup
	define: {
		"process.env.NODE_ENV": JSON.stringify("test"),
	},
});
