/**
 * Vitest workspace configuration
 *
 * This file explicitly defines the workspace structure for the Vitest VS Code extension
 * to prevent it from scanning individual folders and causing "Vitest not found" errors.
 *
 * The extension will use this file instead of auto-discovering configs in individual folders.
 */
export default [
	"./apps/web/vitest.config.ts",
	"./apps/payload/vitest.config.ts",
	"./packages/monitoring/newrelic/vitest.config.ts",
	"./packages/shared/vitest.config.ts",
];
