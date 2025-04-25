/**
 * Utility functions for interacting with Payload CMS
 * Provides access to Payload's database client with drizzle-orm integration
 */
import { sql } from 'drizzle-orm';

import { getPool } from './db/execute-sql.js';

/**
 * Simplified Payload client structure that mimics what we need for our scripts
 * This provides a compatible interface without requiring the full Payload CMS runtime
 */
export type PayloadClient = {
  db: {
    drizzle: {
      execute: (query: ReturnType<typeof sql>) => Promise<any>;
    };
  };
};

/**
 * Get a simplified Payload client for database operations
 * This creates a minimal compatible interface for drizzle-orm operations
 * without requiring the full Payload CMS runtime
 */
export async function getPayloadClient(): Promise<PayloadClient> {
  // Get PostgreSQL pool
  const pool = getPool();

  // Create a compatible drizzle interface
  const drizzle = {
    execute: async (query: ReturnType<typeof sql>) => {
      // Check if query is null or undefined
      if (!query) {
        throw new Error('Client was passed a null or undefined query');
      }

      const client = await pool.connect();
      try {
        // For drizzle-orm version 0.43.1, the query structure is very different
        let sqlText = '';
        let sqlParams: any[] = [];

        console.log('Query format:', JSON.stringify(query).substring(0, 100));

        // Handle latest drizzle-orm format for sql.raw`` template literals
        if (typeof query === 'object') {
          // Newest drizzle format (0.43.1) with queryChunks
          if ('queryChunks' in query) {
            const chunks = (query as any).queryChunks;
            if (Array.isArray(chunks)) {
              // Extract SQL from chunks
              sqlText = chunks
                .map((chunk) => {
                  if (chunk.value && Array.isArray(chunk.value)) {
                    return chunk.value.join('');
                  }
                  return '';
                })
                .join('');

              // No params in raw SQL
              sqlParams = [];
            } else {
              throw new Error(
                `Unexpected queryChunks format: ${JSON.stringify(chunks)}`,
              );
            }
          }
          // Raw SQL template literal format (older versions)
          else if ('strings' in query && 'values' in query) {
            const strings = (query as any).strings;
            const values = (query as any).values;

            // Reconstruct SQL with parameterized queries
            let paramIndex = 1;
            sqlText = strings.reduce((acc: string, str: string, i: number) => {
              if (i < values.length) {
                return acc + str + `$${paramIndex++}`;
              }
              return acc + str;
            }, '');

            sqlParams = values;
          }
          // Simple text/values format (oldest/simplest)
          else if ('text' in query && 'values' in query) {
            sqlText = (query as any).text;
            sqlParams = (query as any).values;
          } else {
            throw new Error(
              `Unsupported query format: ${JSON.stringify(query)}`,
            );
          }
        } else {
          throw new Error(`Expected object but got ${typeof query}`);
        }

        console.log(`Executing SQL: ${sqlText}`);
        const result = await client.query(sqlText, sqlParams);
        return result;
      } catch (error) {
        console.error(`Error executing drizzle query: ${error}`);
        throw error;
      } finally {
        client.release();
      }
    },
  };

  // Return simplified Payload client
  return {
    db: {
      drizzle,
    },
  };
}

// This is deliberately a simplified version that provides just enough
// compatibility for our verification script to work with the latest
// version of drizzle-orm without requiring the full Payload CMS runtime
export default getPayloadClient;
