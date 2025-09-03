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
    ],

    // Global configuration options
    // Coverage configuration (applies to all projects)
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
        // Package-specific exclusions
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

    // Global performance and reliability settings
    teardownTimeout: 5000,

    // Thread pool configuration (applies globally)
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 4,
        singleThread: false,
      },
    },

    // Global reporting
    reporters: ["verbose"],
  }
})