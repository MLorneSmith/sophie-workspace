import path from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

/**
 * Vitest configuration for admin package
 * Extends base configuration with React testing support
 */
export default defineProject({
	plugins: [
		// Enable React support with automatic JSX transform
		react({
			jsxImportSource: "react",
		}) as any,
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
			// Mock Next.js modules for testing
			"next/navigation": path.resolve(
				__dirname,
				"src/__mocks__/next/navigation.ts",
			),
			"next/cache": path.resolve(__dirname, "src/__mocks__/next/cache.ts"),
<<<<<<< HEAD
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
=======
>>>>>>> origin/staging
		},
	},
	esbuild: {
		// Configure JSX transformation
		jsx: "automatic",
		jsxImportSource: "react",
	},
	test: {
		name: "admin",
		// React components need jsdom environment
		environment: "jsdom",
		globals: true,
		// Setup files for testing utilities
		setupFiles: ["./src/test/setup.ts"],
		// Include both TS and TSX files for admin components
		include: ["**/*.{test,spec}.{ts,tsx}"],
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
