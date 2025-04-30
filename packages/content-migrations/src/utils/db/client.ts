/**
 * Database client utilities for content migrations
 * Provides connection and querying functionality to database
 */
import { getLogger } from '../logging.js';

const logger = getLogger('db:client');

// Define types for pg module to be used after dynamic import
type QueryResult = any;
type PoolClient = any;

// Strongly typed pool of database connections
let pool: any = null;

/**
 * Interface for simplified database client
 */
export interface DbClient {
  query: (text: string, params?: any[]) => Promise<QueryResult>;
  end: () => Promise<void>;
}

/**
 * Dynamically imports the pg module to avoid ESM compatibility issues
 * @returns Promise resolving to the pg module
 */
async function getPgModule() {
  try {
    // Use dynamic import which works in both ESM and CommonJS
    const pg = await import('pg');
    return pg.default || pg;
  } catch (error) {
    logger.error('Error importing pg module', { error });
    throw new Error(
      `Failed to import pg module: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Gets or creates a client connection to the database
 * @returns {Promise<DbClient>} A database client with query method
 */
export async function getClient(): Promise<DbClient> {
  logger.info('getClient called.'); // Log entry
  if (!pool) {
    logger.info('Pool does not exist, attempting to initialize...');
    try {
      // Dynamically import pg to get the Pool constructor
      logger.info('Dynamically importing pg module...');
      const pg = await getPgModule();
      logger.info('pg module imported successfully.');
      const { Pool } = pg;

      if (!Pool) {
        throw new Error('pg.Pool is not available');
      }
      logger.info('pg.Pool constructor obtained.');

      const connectionString =
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:54322/postgres';
      logger.info(`Using connection string: ${connectionString}`);

      // Initialize the connection pool
      logger.info('Initializing new Pool...');
      pool = new Pool({ connectionString });
      logger.info('Pool instance created.');

      // Log pool creation
      logger.info('Database connection pool initialization complete.');

      // Handle pool errors
      pool.on('error', (err: Error) => {
        logger.error('Unexpected database pool error', { error: err });
      });
      logger.info('Pool error handler attached.');
    } catch (error) {
      logger.error('Failed to initialize database pool', { error });
      throw error;
    }
  } else {
    logger.info('Pool already exists, reusing.');
  }

  logger.info('Creating client object wrapper...');
  // Create a simple client with query method
  const client: DbClient = {
    /**
     * Execute a SQL query on the database
     * @param {string} text - SQL query to execute
     * @param {Array<any>} params - Optional parameters for the query
     * @returns {Promise<QueryResult>} Query result
     */
    query: async (text: string, params: any[] = []): Promise<QueryResult> => {
      try {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        logger.info(`Query executed in ${duration}ms`, {
          rows: res.rowCount,
          duration,
        });

        return res;
      } catch (error) {
        logger.error('Error executing query', { error, query: text });
        throw error;
      }
    },

    /**
     * Close all connections in the pool
     */
    end: async (): Promise<void> => {
      if (pool) {
        await pool.end();
        pool = null;
        logger.info('Database connection pool closed');
      }
    },
  };

  logger.info('Returning client object wrapper.');
  return client;
}

// Export a function to explicitly close the connection pool
export async function closeClient(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}
