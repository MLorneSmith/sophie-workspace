import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Test environment - needs jsdom for React components
		environment: "jsdom",

		// Include test files
		include: ["__tests__/**/*.spec.ts", "__tests__/**/*.test.ts"],

		// Exclude patterns
		exclude: ["node_modules"],

		// Global test settings
		globals: false,

		// Timeout for individual tests (in ms)
		testTimeout: 10000,

		// Hook timeout (in ms)
		hookTimeout: 10000,

		// Setup files for ink-testing-library
		setupFiles: ["__tests__/setup.ts"],
	},
});
