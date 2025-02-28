/**
 * Utility functions for interacting with the Payload CMS API
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on the NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

// Define the Payload client interface
export interface PayloadClient {
  create: (params: { collection: string; data: any }) => Promise<any>;
  find: (params: {
    collection: string;
    limit?: number;
    query?: Record<string, any>; // Add query parameter for filtering
  }) => Promise<{ docs: any[]; totalDocs: number }>;
  update: (params: {
    collection: string;
    id: string | number;
    data: any;
  }) => Promise<any>;
}

// Cache the Payload client instances for different environments
const cachedPayloadClients: Record<string, PayloadClient> = {};

/**
 * Gets a Payload CMS client instance that uses the REST API
 * @param env - The environment to use ('development' for local, 'production' for remote)
 * @returns A Payload CMS client instance
 */
export async function getPayloadClient(
  env?: 'development' | 'production',
): Promise<PayloadClient> {
  // Set environment based on parameter or NODE_ENV
  const environment = env || process.env.NODE_ENV || 'development';

  // Return cached client if available for this environment
  if (cachedPayloadClients[environment]) {
    return cachedPayloadClients[environment];
  }

  // Set NODE_ENV to ensure correct environment variables are loaded
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = environment;

  // Load environment variables for the specified environment
  const envFile =
    environment === 'production' ? '.env.production' : '.env.development';
  console.log(
    `Loading environment variables from ${envFile} for ${environment} environment`,
  );
  dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

  // Get the Payload server URL from environment variables
  const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL;
  if (!serverUrl) {
    throw new Error(
      'PAYLOAD_PUBLIC_SERVER_URL environment variable is not set',
    );
  }

  // Create a client that uses the Payload REST API
  const client: PayloadClient = {
    update: async ({ collection, id, data }) => {
      console.log(`Updating document in ${collection} with ID ${id}:`, data);

      try {
        // First, try to authenticate with Payload CMS
        console.log(
          `Authenticating with email: ${process.env.PAYLOAD_ADMIN_EMAIL}`,
        );

        const authResponse = await fetch(`${serverUrl}/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: process.env.PAYLOAD_ADMIN_EMAIL,
            password: process.env.PAYLOAD_ADMIN_PASSWORD,
          }),
        });

        if (!authResponse.ok) {
          const authError = await authResponse.json();
          console.error('Authentication failed:', authError);
          throw new Error(
            `Authentication failed: ${JSON.stringify(authError)}`,
          );
        }

        console.log('Authentication successful');

        // Get the authentication response data
        const authData = await authResponse.json();
        const token = authData.token;

        // Update the document
        const response = await fetch(`${serverUrl}/api/${collection}/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to update document: ${JSON.stringify(errorData)}`,
          );
        }

        return await response.json();
      } catch (error) {
        console.error(`Error updating document in ${collection}:`, error);
        throw error;
      }
    },

    create: async ({ collection, data }) => {
      console.log(`Creating document in ${collection}:`, data);

      try {
        // First, try to authenticate with Payload CMS
        console.log(
          `Authenticating with email: ${process.env.PAYLOAD_ADMIN_EMAIL}`,
        );

        const authResponse = await fetch(`${serverUrl}/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: process.env.PAYLOAD_ADMIN_EMAIL,
            password: process.env.PAYLOAD_ADMIN_PASSWORD,
          }),
        });

        if (!authResponse.ok) {
          const authError = await authResponse.json();
          console.error('Authentication failed:', authError);
          throw new Error(
            `Authentication failed: ${JSON.stringify(authError)}`,
          );
        }

        console.log('Authentication successful');

        // Get the authentication response data
        const authData = await authResponse.json();
        const token = authData.token;

        // Create the document
        const response = await fetch(`${serverUrl}/api/${collection}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to create document: ${JSON.stringify(errorData)}`,
          );
        }

        return await response.json();
      } catch (error) {
        console.error(`Error creating document in ${collection}:`, error);
        throw error;
      }
    },

    find: async ({ collection, limit = 100, query = {} }) => {
      try {
        // First, try to authenticate with Payload CMS
        console.log(
          `Authenticating with email: ${process.env.PAYLOAD_ADMIN_EMAIL}`,
        );

        const authResponse = await fetch(`${serverUrl}/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: process.env.PAYLOAD_ADMIN_EMAIL,
            password: process.env.PAYLOAD_ADMIN_PASSWORD,
          }),
        });

        if (!authResponse.ok) {
          const authError = await authResponse.json();
          console.error('Authentication failed:', authError);
          throw new Error(
            `Authentication failed: ${JSON.stringify(authError)}`,
          );
        }

        console.log('Authentication successful');

        // Get the authentication response data
        const authData = await authResponse.json();
        const token = authData.token;

        // Build query string with limit and query parameters
        const queryParams = new URLSearchParams();

        // Add limit parameter
        if (limit) {
          queryParams.append('limit', limit.toString());
        }

        // Add query parameters for filtering
        if (Object.keys(query).length > 0) {
          // Payload expects query parameters in the format where={"field":"value"}
          queryParams.append('where', JSON.stringify(query));
        }

        const queryString = queryParams.toString()
          ? `?${queryParams.toString()}`
          : '';

        // Find documents with query parameters
        const response = await fetch(
          `${serverUrl}/api/${collection}${queryString}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `JWT ${token}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to find documents: ${JSON.stringify(errorData)}`,
          );
        }

        return await response.json();
      } catch (error) {
        console.error(`Error finding documents in ${collection}:`, error);
        return { docs: [], totalDocs: 0 };
      }
    },
  };

  // Cache the client for this environment
  cachedPayloadClients[environment] = client;

  // Restore original NODE_ENV
  process.env.NODE_ENV = originalEnv;

  return client;
}
