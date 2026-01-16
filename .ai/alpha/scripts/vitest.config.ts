import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Test environment
		environment: "node",

		// Include test files
		include: ["**/__tests__/**/*.spec.ts", "**/__tests__/**/*.test.ts"],

		// Exclude patterns
		exclude: ["node_modules", "node_modules.bak", "ui"],

		// Global test settings
		globals: false,

		// TypeScript support via native ESM
		alias: {
			// Resolve .js imports to .ts files for vitest
		},

		// Coverage configuration
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["lib/**/*.ts", "cli/**/*.ts", "config/**/*.ts"],
			exclude: [
				"**/__tests__/**",
				"**/node_modules/**",
				"**/node_modules.bak/**",
				"**/ui/**",
			],
		},

		// Test isolation
		isolate: true,

		// Timeout for individual tests (in ms)
		testTimeout: 10000,

		// Hook timeout (in ms)
		hookTimeout: 10000,
	},
});
