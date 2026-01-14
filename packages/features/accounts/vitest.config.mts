import path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

/**
 * Vitest configuration for accounts package
 * Extends base configuration for account testing
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
			// @kit/shared subpath exports - resolve to source files
			// This avoids requiring packages to be built before running tests in CI
			"@kit/shared/registry": path.resolve(
				__dirname,
				"../../shared/src/registry/index.ts",
			),
			"@kit/shared/logger": path.resolve(
				__dirname,
				"../../shared/src/logger/index.ts",
			),
			"@kit/shared/utils": path.resolve(__dirname, "../../shared/src/utils.ts"),
			"@kit/shared/hooks": path.resolve(
				__dirname,
				"../../shared/src/hooks/index.ts",
			),
			"@kit/shared/events": path.resolve(
				__dirname,
				"../../shared/src/events/index.tsx",
			),
		},
	},
	test: {
		name: "accounts",
		// Node environment for server-side tests
		environment: "node",
		globals: true,
		// Setup files for testing utilities
		setupFiles: ["./src/test/setup.ts"],
		// Include TS files for accounts services
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
