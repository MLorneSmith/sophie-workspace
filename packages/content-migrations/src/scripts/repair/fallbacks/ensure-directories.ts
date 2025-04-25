/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

import { getLogger } from '../../../utils/logging.js';

// Create logger for directory setup
const logger = getLogger('fallbacks:setup');

/**
 * Creates all required directories for fallback components and files
 * This ensures directories exist before running component creation scripts
 */
export async function ensureDirectories() {
  logger.info('Ensuring all required directories exist...', {
    module: 'fallbacks',
  });

  const directories = [
    // Admin UI components
    'apps/payload/src/components/fallbacks',
    // API endpoints
    'apps/payload/src/routes/api/fallbacks',
    // Frontend components
    'apps/web/components/fallbacks',
    // Web API endpoints
    'apps/web/app/api/log-error',
    // Fallback assets
    'apps/web/public/assets/fallbacks',
    // Mappings directory
    'packages/content-migrations/src/data/mappings',
    // Fallbacks data
    'packages/content-migrations/src/data/fallbacks',
  ];

  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`Created directory: ${dirPath}`, { module: 'fallbacks' });
      } catch (error) {
        logger.error(`Failed to create directory: ${dirPath}`, {
          module: 'fallbacks',
          error,
        });
      }
    } else {
      logger.info(`Directory already exists: ${dirPath}`, {
        module: 'fallbacks',
      });
    }
  }

  return { success: true };
}

// If this script is run directly
if (require.main === module) {
  ensureDirectories()
    .then(() => {
      console.log('All required directories created successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error ensuring directories:', error);
      process.exit(1);
    });
}
