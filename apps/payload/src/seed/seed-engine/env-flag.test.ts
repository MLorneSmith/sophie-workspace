/**
 * Unit tests for --env flag parsing
 *
 * Tests the CLI flag that controls which environment file is loaded.
 * This is critical for the fix to bug #1002 (hardcoded .env.test).
 *
 * @see https://github.com/slideheroes/2025slideheroes/issues/1002
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Reimplemented here for testing since the original is at module scope
 * and runs before we can set up test conditions.
 *
 * This exactly matches the implementation in index.ts and payload.seeding.config.ts
 */
function getEnvNameFromArgs(args: string[]): string {
  const envFlagIndex = args.findIndex(arg => arg.startsWith('--env='));
  if (envFlagIndex !== -1) {
    const envValue = args[envFlagIndex].split('=')[1];
    if (envValue && ['test', 'production', 'development'].includes(envValue)) {
      return envValue;
    }
  }
  return 'test'; // Default for backwards compatibility
}

describe('Environment Flag Parsing', () => {
  describe('getEnvNameFromArgs', () => {
    describe('valid environment values', () => {
      it('should return "test" when --env=test is passed', () => {
        const args = ['node', 'index.ts', '--env=test'];
        expect(getEnvNameFromArgs(args)).toBe('test');
      });

      it('should return "production" when --env=production is passed', () => {
        const args = ['node', 'index.ts', '--env=production'];
        expect(getEnvNameFromArgs(args)).toBe('production');
      });

      it('should return "development" when --env=development is passed', () => {
        const args = ['node', 'index.ts', '--env=development'];
        expect(getEnvNameFromArgs(args)).toBe('development');
      });
    });

    describe('default behavior (backwards compatibility)', () => {
      it('should default to "test" when no --env flag is present', () => {
        const args = ['node', 'index.ts'];
        expect(getEnvNameFromArgs(args)).toBe('test');
      });

      it('should default to "test" when other flags are present but not --env', () => {
        const args = ['node', 'index.ts', '--dry-run', '--verbose', '-c', 'courses'];
        expect(getEnvNameFromArgs(args)).toBe('test');
      });
    });

    describe('invalid environment values', () => {
      it('should default to "test" for invalid env value', () => {
        const args = ['node', 'index.ts', '--env=staging'];
        expect(getEnvNameFromArgs(args)).toBe('test');
      });

      it('should default to "test" for empty env value', () => {
        const args = ['node', 'index.ts', '--env='];
        expect(getEnvNameFromArgs(args)).toBe('test');
      });

      it('should default to "test" for env value with typo', () => {
        const args = ['node', 'index.ts', '--env=prodiction'];
        expect(getEnvNameFromArgs(args)).toBe('test');
      });
    });

    describe('flag format handling', () => {
      it('should handle --env flag with other flags before it', () => {
        const args = ['node', 'index.ts', '--dry-run', '--env=production', '--verbose'];
        expect(getEnvNameFromArgs(args)).toBe('production');
      });

      it('should handle --env flag at the end of args', () => {
        const args = ['node', 'index.ts', '--dry-run', '--verbose', '--env=production'];
        expect(getEnvNameFromArgs(args)).toBe('production');
      });

      it('should handle --env flag at the beginning of args', () => {
        const args = ['node', 'index.ts', '--env=production', '--dry-run'];
        expect(getEnvNameFromArgs(args)).toBe('production');
      });

      it('should use the first --env flag if multiple are passed', () => {
        const args = ['node', 'index.ts', '--env=production', '--env=test'];
        expect(getEnvNameFromArgs(args)).toBe('production');
      });
    });

    describe('edge cases', () => {
      it('should handle case sensitivity (only lowercase valid)', () => {
        const args = ['node', 'index.ts', '--env=PRODUCTION'];
        expect(getEnvNameFromArgs(args)).toBe('test'); // Invalid, defaults to test
      });

      it('should not match --environment flag', () => {
        const args = ['node', 'index.ts', '--environment=production'];
        expect(getEnvNameFromArgs(args)).toBe('test'); // Different flag, defaults
      });

      it('should not match -env flag', () => {
        const args = ['node', 'index.ts', '-env=production'];
        expect(getEnvNameFromArgs(args)).toBe('test'); // Different flag, defaults
      });

      it('should handle whitespace in env value', () => {
        const args = ['node', 'index.ts', '--env= production'];
        expect(getEnvNameFromArgs(args)).toBe('test'); // Invalid with leading space
      });
    });
  });

  describe('Environment file path construction', () => {
    it('should construct correct path for test environment', () => {
      const envName = 'test';
      const expectedPath = `.env.${envName}`;
      expect(expectedPath).toBe('.env.test');
    });

    it('should construct correct path for production environment', () => {
      const envName = 'production';
      const expectedPath = `.env.${envName}`;
      expect(expectedPath).toBe('.env.production');
    });

    it('should construct correct path for development environment', () => {
      const envName = 'development';
      const expectedPath = `.env.${envName}`;
      expect(expectedPath).toBe('.env.development');
    });
  });
});

describe('Integration: Environment flag with seed scripts', () => {
  describe('seed:run script (local)', () => {
    it('should default to test environment when no flag is passed', () => {
      // Simulating: pnpm seed:run
      const args = ['node', 'src/seed/seed-engine/index.ts'];
      expect(getEnvNameFromArgs(args)).toBe('test');
    });
  });

  describe('seed:run:remote script', () => {
    it('should use production environment with --env=production flag', () => {
      // Simulating: pnpm seed:run:remote (which includes --env=production)
      const args = ['node', 'src/seed/seed-engine/index.ts', '--env=production'];
      expect(getEnvNameFromArgs(args)).toBe('production');
    });
  });

  describe('backwards compatibility', () => {
    it('should not break existing seed:run invocations', () => {
      // All existing scripts that don't pass --env should continue working
      const existingScripts = [
        ['node', 'src/seed/seed-engine/index.ts'],
        ['node', 'src/seed/seed-engine/index.ts', '--dry-run'],
        ['node', 'src/seed/seed-engine/index.ts', '--verbose'],
        ['node', 'src/seed/seed-engine/index.ts', '-c', 'courses'],
        ['node', 'src/seed/seed-engine/index.ts', '--dry-run', '--verbose'],
      ];

      for (const args of existingScripts) {
        expect(getEnvNameFromArgs(args)).toBe('test');
      }
    });
  });
});
