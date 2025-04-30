/**
 * Database client utilities for content migrations
 * Provides connection and querying functionality to database
 */
import { Pool } from 'pg';

import { getLogger } from '../logging.ts';

// Corrected extension

const logger = getLogger('db:client');

// Pool of database connections
let pool = null;

/**
 * Gets or creates a client connection to the database
 * @returns {Promise<Object>} A database client with query method
 */
export async function getClient() {
  logger.info('getClient: Checking for existing pool...');
  if (!pool) {
    logger.info('getClient: Pool does not exist, initializing...');

    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:54322/postgres';
    logger.info(`getClient: Using connection string: ${connectionString}`);

    // Initialize the connection pool
    logger.info('getClient: Attempting to create new Pool...');
    pool = new Pool({
      connectionString,
    });
    logger.info('getClient: Successfully created new Pool.');

    // Log pool creation
    logger.info('getClient: Database connection pool created');

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected database pool error', { error: err });
    });
  }

  // Create a simple client with query method
  logger.info('getClient: Creating client object...');
  const client = {
    /**
     * Execute a SQL query on the database
     * @param {string} text - SQL query to execute
     * @param {Array} params - Optional parameters for the query
     * @returns {Promise<Object>} Query result
     */
    query: async (text, params = []) => {
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
    end: async () => {
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
export async function closeClient() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}
