import pkg from 'pg';
const { Client } = pkg;
import type { Logger } from 'pino'; // Assuming pino, adjust if different

interface Stage0Args {
  skipResetSchema?: boolean;
  // Add other relevant args if any, e.g., db related if not solely from env
}

export async function runStage0_ResetSchema(
  logger: Logger,
  cliArgs: Stage0Args,
): Promise<void> {
  logger.info('Starting Stage 0: Database Schema Reset...');

  if (cliArgs.skipResetSchema) {
    logger.info('Stage 0: Skipped due to --skip-reset-schema flag.');
    return;
  }

  const dbUri = process.env.DATABASE_URI;
  if (!dbUri) {
    logger.error('DATABASE_URI environment variable is not set.');
    throw new Error('DATABASE_URI is not set for Stage 0.');
  }

  const pgClient = new Client({ connectionString: dbUri });

  try {
    logger.info('Connecting to database for schema reset...');
    await pgClient.connect();
    logger.info('Connected. Dropping "payload" schema if it exists...');
    await pgClient.query('DROP SCHEMA IF EXISTS payload CASCADE;');
    logger.info('"payload" schema dropped.');
    logger.info('Creating "payload" schema...');
    await pgClient.query('CREATE SCHEMA payload;');
    logger.info('"payload" schema created.');
    // Optionally, grant permissions if necessary for your setup
    // await pgClient.query('GRANT ALL ON SCHEMA payload TO your_user;');
    // logger.info('Permissions granted on "payload" schema.');
    logger.info('Stage 0: Database Schema Reset completed successfully.');
  } catch (error) {
    logger.error({ err: error }, 'Error during Stage 0: Database Schema Reset.');
    throw error; // Propagate error to halt orchestrator
  } finally {
    if ((pgClient as any)._connected) { // Check if client was connected
      logger.info('Closing database connection for Stage 0...');
      await pgClient.end();
      logger.info('Database connection for Stage 0 closed.');
    }
  }
}
