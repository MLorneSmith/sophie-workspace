import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

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

		// Project-specific thread pool settings
		poolOptions: {
			threads: {
				isolate: true,
				singleThread: false,
			},
		},

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
