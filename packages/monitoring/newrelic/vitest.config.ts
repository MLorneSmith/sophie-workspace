/**
 * Vitest configuration for NewRelic monitoring package
 */

import { resolve } from "node:path";
import { defineProject } from "vitest/config";

export default defineProject({
	test: {
		// Project-specific configuration only
		name: "monitoring-newrelic",
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

		// Project-specific performance settings
		testTimeout: 10000,
		hookTimeout: 5000,
	},

	// Path resolution
	resolve: {
		alias: {
			"@kit/monitoring-core": resolve(__dirname, "../core/src"),
			"@kit/shared": resolve(__dirname, "../../shared/src"),
		},
	},
});
