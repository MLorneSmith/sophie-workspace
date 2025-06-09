/**
 * Vitest configuration for the web application
 * Configures testing environment, path resolution, and mocking for Next.js
 */

import { resolve } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		// Synchronize TypeScript paths with Vitest/Vite module resolution
		tsconfigPaths(),
	],
	test: {
		// Environment setup
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

		// Performance and reliability
		testTimeout: 10000, // 10 seconds max per test
		hookTimeout: 10000,
		teardownTimeout: 5000,

		// Coverage configuration
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"coverage/**",
				"dist/**",
				"**/[.]**",
				"packages/*/test{,s}/**",
				"**/*.d.ts",
				"**/virtual:*",
				"**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
				"**/.{eslint,mocha,prettier}rc.{js,cjs,yml}",
				// Next.js specific exclusions
				"**/next.config.*",
				"**/middleware.*",
				"**/app/**/layout.*",
				"**/app/**/loading.*",
				"**/app/**/not-found.*",
				"**/app/**/error.*",
				"**/app/**/global-error.*",
				// Type-only files
				"**/types/**",
				"**/lib/database.types.ts",
			],
			thresholds: {
				global: {
					branches: 70,
					functions: 70,
					lines: 70,
					statements: 70,
				},
			},
		},

		// Concurrency for faster test runs
		pool: "threads",
		poolOptions: {
			threads: {
				singleThread: false,
				minThreads: 1,
				maxThreads: 4,
			},
		},

		// Better error reporting
		reporters: ["verbose"],
		outputFile: {
			json: "./coverage/test-results.json",
		},
	},

	// Path resolution handled by vite-tsconfig-paths plugin

	// Define global constants for testing
	define: {
		"process.env.NODE_ENV": JSON.stringify("test"),
	},

	// Server-side module mocking for testing
	server: {
		deps: {
			inline: ["server-only"],
		},
	},
});
