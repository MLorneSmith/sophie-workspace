/**
 * @file initialize-payload-data.ts
 * @description Main Node.js orchestrator script for initializing Payload CMS data.
 * Handles argument parsing, environment setup, Payload client initialization/shutdown,
 * and sequential execution of staged data initialization modules.
 *
 * Usage:
 * node dist/init-scripts/initialize-payload-data.js [options]
 *
 * Options:
 * --skip-reset-schema: Skip Stage 0: Database Reset
 * --skip-apply-migrations: Skip Stage 1: Apply Payload Migrations
 * --skip-seed-core: Skip Stage 2: Core Content Seeding
 * --skip-populate-relationships: Skip Stage 3: Populate Relationships
 * --skip-verification: Skip Stage 4: Data Verification
 * --env-path <path>: Path to the .env file (relative to project root, default: .env)
 * --payload-config-path <path>: Path to Payload config file (relative to project root, default: apps/payload/src/payload.config.ts)
 */
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url'; // Added pathToFileURL
import fs from 'fs';
import { getPayload } from 'payload';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv';
import * as pinoModule from 'pino'; // Changed to namespace import
import { runStage0_ResetSchema } from './stages/stage0-reset-schema.js';
import { runStage1_ApplyMigrations } from './stages/stage1-apply-migrations.js';
import { runStage2_SeedCore } from './stages/stage2-seed-core-content.js'; // Import Stage 2 orchestrator
// Import Stage 3 and 4 orchestrators when implemented
// import { runStage3_PopulateRelationships } from './stages/stage3-populate-relationships.js';
// import { runStage4_VerifyData } from './stages/stage4-verify-data.js';
(async () => {
    // Script logic will go here
    // Define __filename for ES Modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Argument parsing
    const argv = await yargs(hideBin(process.argv))
        .option('skip-reset-schema', { type: 'boolean', default: false, description: 'Skip Stage 0: Database Reset' })
        .option('skip-apply-migrations', { type: 'boolean', default: false, description: 'Skip Stage 1: Apply Payload Migrations' })
        .option('skip-seed-core', { type: 'boolean', default: false, description: 'Skip Stage 2: Core Content Seeding' })
        .option('skip-populate-relationships', { type: 'boolean', default: false, description: 'Skip Stage 3: Populate Relationships' })
        .option('skip-verification', { type: 'boolean', default: false, description: 'Skip Stage 4: Data Verification' })
        .option('env-path', { type: 'string', default: '.env', description: 'Path to the .env file (relative to project root)' })
        .option('payload-config-path', { type: 'string', default: 'apps/payload/src/payload.config.ts', description: 'Path to Payload config file (relative to project root)' })
        .help()
        .argv;
    // Environment variable loading
    const projectRoot = path.resolve(__dirname, '../../../../../'); // Corrected path to monorepo root
    const envPath = path.resolve(projectRoot, argv.envPath);
    // Structured logging setup
    const logger = pinoModule.pino({
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    });
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        logger.info(`Loaded environment variables from: ${envPath}`);
    }
    else {
        logger.warn(`Environment file not found at: ${envPath}. Using system environment variables.`);
    }
    let payloadClient = null; // Declare at a higher scope
    try {
        logger.info('Orchestrator script started.');
        logger.info('Initializing Payload client...');
        // Original path points to the .ts source file
        const sourcePayloadConfigPath = path.resolve(projectRoot, argv.payloadConfigPath);
        logger.info(`Source Payload config path: ${sourcePayloadConfigPath}`);
        // Construct path to the compiled .js version in the dist directory
        // e.g., 'apps/payload/src/payload.config.ts' -> 'apps/payload/dist/payload.config.js'
        // Construct path to the compiled .js version in the dist directory
        // e.g., 'apps/payload/src/payload.config.ts' -> 'apps/payload/dist/src/payload.config.js'
        const compiledConfigRelativePath = argv.payloadConfigPath
            .replace('apps/payload/', 'apps/payload/dist/') // Insert 'dist/' after 'apps/payload/'
            .replace('.ts', '.js'); // Change .ts to .js
        const resolvedCompiledPayloadConfigPath = path.resolve(projectRoot, compiledConfigRelativePath);
        logger.info(`Attempting to import compiled Payload config from: ${resolvedCompiledPayloadConfigPath}`);
        // Dynamically import the compiled Payload config
        const payloadConfigURL = pathToFileURL(resolvedCompiledPayloadConfigPath).href;
        const { default: payloadConfig } = await import(payloadConfigURL);
        payloadClient = await getPayload({
            config: payloadConfig, // Pass the imported config object
            // Optionally pass logger to Payload if supported, or configure Payload logging separately
        });
        logger.info('Payload client initialized successfully.');
        // Staged Execution Flow
        let idMaps = {}; // Use the imported type
        // Call Stages Sequentially:
        // Stage 0: Database Reset
        if (!argv.skipResetSchema) {
            await runStage0_ResetSchema(logger, argv);
        }
        // Stage 1: Apply Payload Migrations
        if (!argv.skipApplyMigrations) {
            await runStage1_ApplyMigrations(logger, argv);
        }
        // Stage 2: Core Content Seeding
        if (!argv.skipSeedCore) {
            idMaps = await runStage2_SeedCore(payloadClient, logger, argv);
        }
        else {
            logger.info('Stage 2: Skipped due to --skip-seed-core flag.');
        }
        // Stage 3: Populate Relationships (Call actual function when implemented)
        // if (!argv.skipPopulateRelationships) {
        //   await runStage3_PopulateRelationships(payloadClient, logger, argv as any, idMaps);
        // } else {
        //   logger.info('Stage 3: Skipped due to --skip-populate-relationships flag.');
        // }
        // Stage 4: Data Verification (Call actual function when implemented)
        // if (!argv.skipVerification) {
        //   await runStage4_VerifyData(payloadClient, logger, argv as any, idMaps);
        // } else {
        //   logger.info('Stage 4: Skipped due to --skip-verification flag.');
        // }
        logger.info('All stages completed successfully.');
        // Removed explicit process.exit(0) to allow graceful shutdown in finally block
    }
    catch (error) {
        logger.error({ err: error }, 'Fatal error in orchestrator script.');
        // Keep process.exit(1) for explicit failure exit
        process.exit(1);
    }
    finally {
        if (payloadClient) {
            logger.info('Attempting to shut down Payload client...');
            try {
                const db = payloadClient.db;
                if (db && 'drizzle' in db) {
                    const drizzleClient = db.drizzle;
                    if (drizzleClient && typeof drizzleClient.$client?.end === 'function') {
                        await drizzleClient.$client.end();
                        logger.info('Database connection (Drizzle $client) closed successfully.');
                    }
                    else if (drizzleClient && typeof drizzleClient.end === 'function') { // Fallback for direct postgres.js client on drizzle property
                        await drizzleClient.end({ timeout: 5000 });
                        logger.info('Database connection (Drizzle instance on db.drizzle) ended successfully.');
                    }
                    else {
                        logger.warn('Drizzle client or its end method not found on db.drizzle.');
                    }
                }
                else {
                    logger.warn('Could not determine how to close DB connection via Payload client (no drizzle property on db adapter).');
                }
            }
            catch (e) {
                logger.error({ err: e }, 'Error during Payload client shutdown.');
            }
        }
        else {
            logger.info('Payload client was not initialized, no shutdown needed.');
        }
        logger.info('Orchestrator script finished.');
    }
})();
//# sourceMappingURL=initialize-payload-data.js.map