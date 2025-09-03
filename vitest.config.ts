import { defineConfig } from 'vitest/config'

/**
 * Root-level Vitest configuration for monorepo
 * 
 * This configuration uses Vitest's projects feature to handle multiple
 * packages in the monorepo while maintaining a single Vitest installation
 * at the root level. This prevents VS Code extension errors about missing
 * Vitest installations in individual packages.
 */
export default defineConfig({
  test: {
    // Projects configuration for monorepo support
    projects: [
      'apps/web',
      'apps/payload',
      'packages/monitoring/newrelic',
      'packages/shared'
    ]
  }
})