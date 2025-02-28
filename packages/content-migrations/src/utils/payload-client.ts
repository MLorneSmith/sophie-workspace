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
interface PayloadClient {
  create: (params: { collection: string; data: any }) => Promise<any>;
  find: (params: {
    collection: string;
  }) => Promise<{ docs: any[]; totalDocs: number }>;
}

// Cache the Payload client instance
let cachedPayloadClient: PayloadClient | null = null;

/**
 * Gets a Payload CMS client instance that uses the REST API
 * @returns A Payload CMS client instance
 */
export async function getPayloadClient(): Promise<PayloadClient> {
  if (cachedPayloadClient) {
    return cachedPayloadClient;
  }

  // Get the Payload server URL from environment variables
  const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL;
  if (!serverUrl) {
    throw new Error(
      'PAYLOAD_PUBLIC_SERVER_URL environment variable is not set',
    );
  }

  // Create a client that uses the Payload REST API
  const client: PayloadClient = {
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

    find: async ({ collection }) => {
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

        // Find documents
        const response = await fetch(`${serverUrl}/api/${collection}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${token}`,
          },
        });

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

  // Cache the client
  cachedPayloadClient = client;

  return client;
}
