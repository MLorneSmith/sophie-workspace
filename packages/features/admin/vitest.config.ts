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
		}),
		// Synchronize TypeScript paths with Vitest/Vite module resolution
		tsconfigPaths(),
	],
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
		// Server-side module handling for SSR components
		server: {
			deps: {
				external: ["server-only"],
			},
		},
	},
});
