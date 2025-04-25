import { sql } from 'drizzle-orm';

import { logger } from '@kit/shared/logger';

import { getEnhancedPayloadClient } from '../../../../utils/payload/enhanced-payload-client.js';

/**
 * Helper functions for working with the database
 * This abstracts the specific details of database access
 */

/**
 * Gets a drizzle instance for database operations
 * The enhanced payload client has a db property that's not reflected in the type definition
 */
export async function getDrizzleInstance() {
  try {
    const client = await getEnhancedPayloadClient();
    // Access db property that exists at runtime but not in the type definition
    const db = client['db'];

    if (!db || !db.drizzle) {
      throw new Error('Database client not properly initialized');
    }

    return db.drizzle;
  } catch (error) {
    logger.error(
      { function: 'getDrizzleInstance', error },
      'Failed to get drizzle instance',
    );
    throw error;
  }
}
