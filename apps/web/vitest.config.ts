/**
 * Vitest configuration for the web application
 * Configures testing environment, path resolution, and mocking for Next.js
 */

import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
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

	// Path resolution to match Next.js
	resolve: {
		alias: {
			"@": resolve(__dirname, "./"),
			"@/components": resolve(__dirname, "./components"),
			"@/lib": resolve(__dirname, "./lib"),
			"@/config": resolve(__dirname, "./config"),
			"@/app": resolve(__dirname, "./app"),
			// Kit packages with specific exports
			"@kit/ui": resolve(__dirname, "../../packages/ui/src"),
			"@kit/shared": resolve(__dirname, "../../packages/shared/src"),
			"@kit/shared/logger": resolve(
				__dirname,
				"../../packages/shared/src/logger",
			),
			"@kit/supabase": resolve(__dirname, "../../packages/supabase/src"),
			"@kit/supabase/server-client": resolve(
				__dirname,
				"../../packages/supabase/src/clients/server-client.ts",
			),
			"@kit/next": resolve(__dirname, "../../packages/next/src"),
			"@kit/next/actions": resolve(
				__dirname,
				"../../packages/next/src/actions",
			),
			"@kit/auth": resolve(__dirname, "../../packages/auth/src"),
			"@kit/billing": resolve(__dirname, "../../packages/billing/src"),
		},
	},

	// Define global constants for testing
	define: {
		"process.env.NODE_ENV": JSON.stringify("test"),
	},
});
