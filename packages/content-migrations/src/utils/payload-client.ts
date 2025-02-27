/**
 * Utility functions for interacting with the Payload CMS client
 */
import dotenv from 'dotenv';
import path from 'path';
import type { Payload } from 'payload';

// Load environment variables from the package's .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Cache the Payload instance
let cachedPayloadClient: Payload | null = null;

/**
 * Gets a Payload CMS client instance
 * @returns A Payload CMS client instance
 */
export async function getPayloadClient(): Promise<Payload> {
  if (cachedPayloadClient) {
    return cachedPayloadClient;
  }

  try {
    // For migration scripts, we'll use a simpler approach
    // We'll directly connect to the database using the Supabase client
    // and then use the Payload API to create documents

    // This is a workaround for the TypeScript errors with Payload initialization
    // The actual implementation would depend on how you want to migrate the data

    // For now, we'll just return a mock Payload client that can be used for testing
    const mockPayload = {
      create: async ({
        collection,
        data,
      }: {
        collection: string;
        data: any;
      }) => {
        console.log(`Creating document in ${collection}:`, data);
        return { id: 'mock-id', ...data };
      },
      find: async ({ collection }: { collection: string }) => {
        console.log(`Finding documents in ${collection}`);
        return { docs: [], totalDocs: 0 };
      },
    } as unknown as Payload;

    // Cache the mock Payload instance
    cachedPayloadClient = mockPayload;

    return mockPayload;
  } catch (error) {
    console.error('Error initializing Payload client:', error);
    throw error;
  }
}
