import path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

/**
 * Vitest configuration for @kit/next package
 * Tests server actions and route handler utilities
 */
export default defineProject({
	plugins: [
		// Synchronize TypeScript paths with Vitest/Vite module resolution
		tsconfigPaths() as unknown,
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
		name: "next",
		// Node environment for server-side utilities
		environment: "node",
		globals: true,
		// Setup files for testing utilities
		setupFiles: ["./src/test/setup.ts"],
		// Include TS files for utilities
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
