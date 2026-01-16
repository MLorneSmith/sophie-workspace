import path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

/**
 * Vitest configuration for auth package
 * Extends base configuration for authentication testing
 */
export default defineProject({
	plugins: [
		// Synchronize TypeScript paths with Vitest/Vite module resolution
		tsconfigPaths() as any,
	],
	resolve: {
		alias: {
			// Mock server-only imports for testing
			"server-only": path.resolve(
				__dirname,
				"src/test/__mocks__/server-only.ts",
			),
		},
	},
	test: {
		name: "auth",
		// Node environment for non-React tests
		environment: "node",
		globals: true,
		// Setup files for testing utilities
		setupFiles: ["./src/test/setup.ts"],
		// Include TS files for auth schemas and utilities
		include: ["**/*.{test,spec}.ts"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/coverage/**",
			"**/build/**",
		],
		// Performance settings
		testTimeout: 10000,
		hookTimeout: 10000,
	},
});
