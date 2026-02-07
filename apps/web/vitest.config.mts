import path from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

const reactPlugin = react({
	jsxImportSource: "react",
});
const tsconfigPlugin = tsconfigPaths();

export default defineProject({
	plugins: [
		// Enable React support with automatic JSX transform
		...(Array.isArray(reactPlugin) ? reactPlugin : [reactPlugin]),
		// Synchronize TypeScript paths with Vitest/Vite module resolution
		...(Array.isArray(tsconfigPlugin) ? tsconfigPlugin : [tsconfigPlugin]),
	],
	resolve: {
		alias: {
			// Mock Next.js modules for testing
			"next/cache": path.resolve(__dirname, "src/__mocks__/next/cache.ts"),
			// Mock server-only to allow imports in test environment
			"server-only": path.resolve(__dirname, "src/__mocks__/server-only.ts"),
		},
	},
	esbuild: {
		// Configure JSX transformation
		jsx: "automatic",
		jsxImportSource: "react",
	},
	test: {
		// Project-specific configuration only
		name: "web",
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],

		// Test discovery
		include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/.next/**",
			"**/coverage/**",
			"**/supabase/tests/**", // These are database tests, not unit tests
			"**/e2e/**",
		],

		// Project-specific performance settings
		testTimeout: 10000, // 10 seconds max per test
		hookTimeout: 10000,

		// Use threads pool for faster execution (jsdom doesn't need process isolation)
		pool: "threads" as const,

		// Server-side module handling for SSR components
		server: {
			deps: {
				inline: ["server-only"],
			},
		},
	},

	// Path resolution handled by vite-tsconfig-paths plugin

	// Define global constants for testing
	define: {
		"process.env.NODE_ENV": JSON.stringify("test"),
	},
});
