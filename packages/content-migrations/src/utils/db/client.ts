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
  if (!pool) {
    try {
      // Dynamically import pg to get the Pool constructor
      const pg = await getPgModule();
      const { Pool } = pg;

      if (!Pool) {
        throw new Error('pg.Pool is not available');
      }

      // Initialize the connection pool
      pool = new Pool({
        connectionString:
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:54322/postgres',
      });

      // Log pool creation
      logger.info('Database connection pool created');

      // Handle pool errors
      pool.on('error', (err: Error) => {
        logger.error('Unexpected database pool error', { error: err });
      });
    } catch (error) {
      logger.error('Failed to initialize database pool', { error });
      throw error;
    }
  }

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
