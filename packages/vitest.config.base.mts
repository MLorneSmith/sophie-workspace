/**
 * Base Vitest configuration for packages
 * Shared configuration that can be extended by individual packages
 */

import { resolve } from "node:path";
import { defineProject } from "vitest/config";

export const createPackageConfig = (packageDir: string) => {
	return defineProject({
		test: {
			// Node.js environment for most packages
			environment: "node",
			globals: true,

			// Test discovery
			include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
			exclude: [
				"**/node_modules/**",
				"**/dist/**",
				"**/coverage/**",
				"**/build/**",
			],

			// Performance settings
			testTimeout: 10000,
			hookTimeout: 10000,

			// Coverage configuration
			coverage: {
				provider: "v8",
				reporter: ["text", "json"],
				exclude: [
					"coverage/**",
					"dist/**",
					"**/[.]**",
					"**/*.d.ts",
					"**/types/**",
					"**/schema/**", // Zod schemas typically don't need testing
					"**/index.ts", // Re-export files
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

			// Better error reporting
			reporters: ["verbose"],
		},

		// Path resolution
		resolve: {
			alias: {
				"@": resolve(packageDir, "./src"),
				"@/lib": resolve(packageDir, "./src/lib"),
				"@/utils": resolve(packageDir, "./src/utils"),
				"@/types": resolve(packageDir, "./src/types"),
				// Common kit packages
				"@kit/shared": resolve(packageDir, "../shared/src"),
				"@kit/ui": resolve(packageDir, "../ui/src"),
				// @kit/shared subpath exports - resolve to source files
				// This avoids requiring packages to be built before running tests in CI
				"@kit/shared/registry": resolve(
					packageDir,
					"../shared/src/registry/index.ts",
				),
				"@kit/shared/logger": resolve(
					packageDir,
					"../shared/src/logger/index.ts",
				),
				"@kit/shared/utils": resolve(packageDir, "../shared/src/utils.ts"),
				"@kit/shared/hooks": resolve(
					packageDir,
					"../shared/src/hooks/index.ts",
				),
				"@kit/shared/events": resolve(
					packageDir,
					"../shared/src/events/index.tsx",
				),
			},
		},

		// Environment setup
		define: {
			"process.env.NODE_ENV": JSON.stringify("test"),
		},
	});
};

// Default configuration for packages
export default createPackageConfig(process.cwd());
