/**
 * Vitest configuration for NewRelic monitoring package
 */

import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Node.js environment for server-side testing
		environment: "node",
		globals: true,

		// Test discovery
		include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/.next/**",
			"**/coverage/**",
		],

		// Performance settings
		testTimeout: 10000,
		hookTimeout: 5000,
		teardownTimeout: 2000,
	},

	// Path resolution
	resolve: {
		alias: {
			"@kit/monitoring-core": resolve(__dirname, "../core/src"),
			"@kit/shared": resolve(__dirname, "../../shared/src"),
		},
	},
});
