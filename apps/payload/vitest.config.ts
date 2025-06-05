/**
 * Vitest configuration for Payload CMS application
 * Configures testing environment for server-side logic, schemas, and utilities
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Node.js environment for server-side testing
    environment: 'node',
    globals: true,
    
    // Test discovery
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
    ],
    
    // Performance settings
    testTimeout: 15000, // Longer timeout for potential DB operations
    hookTimeout: 10000,
    teardownTimeout: 5000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/[.]**',
        '**/*.d.ts',
        '**/next.config.*',
        // Payload-specific exclusions
        '**/payload-types.ts',
        '**/payload.config.ts', // Configuration files
        '**/src/init-scripts/**', // Initialization scripts
      ],
      thresholds: {
        global: {
          branches: 60, // Lower thresholds for CMS logic
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },
    
    // Sequential execution for potential DB tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Safer for database operations
      },
    },
    
    // Reporting
    reporters: ['verbose'],
  },
  
  // Path resolution for Payload
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/collections': resolve(__dirname, './src/collections'),
      '@/components': resolve(__dirname, './src/components'),
      '@/lib': resolve(__dirname, './src/lib'),
      // Kit packages
      '@kit/shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
  
  // Environment setup
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
});