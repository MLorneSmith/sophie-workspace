import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import type { Logger } from 'pino';

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Stage1Args {
  skipApplyMigrations?: boolean;
  // Potentially PAYLOAD_CONFIG_PATH if needed by payload migrate explicitly
}

// Helper to determine monorepo root for correct CWD for pnpm filter
function getMonorepoRoot(): string {
  // Assuming this script (when compiled) is in apps/payload/dist/init-scripts/stages/
  return path.resolve(__dirname, '../../../../../');
}

export async function runStage1_ApplyMigrations(
  logger: Logger,
  cliArgs: Stage1Args,
): Promise<void> {
  logger.info('Starting Stage 1: Apply Payload Migrations...');

  if (cliArgs.skipApplyMigrations) {
    logger.info('Stage 1: Skipped due to --skip-apply-migrations flag.');
    return;
  }

  const monorepoRoot = getMonorepoRoot();
  const payloadAppDir = path.join(monorepoRoot, 'apps/payload');

  logger.info(`Running 'pnpm --filter payload payload migrate --yes' from ${monorepoRoot}`);
  logger.info(`Targeting Payload app in: ${payloadAppDir}`);

  // Ensure PAYLOAD_SECRET and DATABASE_URI are in the environment for the child process
  // The orchestrator should have loaded .env, so they should be inherited.

  try {
    const { stdout, stderr, exitCode } = await execa(
      'pnpm',
      ['--filter', 'payload', 'payload', 'migrate', '--yes'], // '--yes' to auto-confirm prompts
      {
        cwd: monorepoRoot, // Run pnpm filter from monorepo root
        // shell: true, // May be needed on Windows for pnpm
        env: {
          ...process.env, // Inherit current environment
          // PAYLOAD_CONFIG_PATH: 'src/payload.config.ts' // if payload migrate needs it relative to apps/payload
        }
      }
    );

    logger.info({ stdoutFromMigrate: stdout }, 'Payload migrate stdout:');
    if (stderr) {
      logger.warn({ stderrFromMigrate: stderr }, 'Payload migrate stderr:');
    }

    if (exitCode !== 0) {
      throw new Error(`Payload migrate command failed with exit code ${exitCode}.`);
    }

    logger.info('Stage 1: Apply Payload Migrations completed successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Error during Stage 1: Apply Payload Migrations.');
    throw error; // Propagate error
  }
}
