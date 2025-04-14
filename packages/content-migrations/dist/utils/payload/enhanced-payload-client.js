/**
 * Enhanced utility functions for interacting with the Payload CMS API
 * with token caching and retry logic
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });
// Cache for auth tokens by environment
const tokenCacheByEnv = {};
// Default token expiration time in milliseconds (5 minutes)
const TOKEN_EXPIRATION_MS = 5 * 60 * 1000;
// Default retry options
const DEFAULT_RETRY_OPTIONS = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
};
/**
 * Sleep for a specified number of milliseconds
 * @param ms - The number of milliseconds to sleep
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Calculate the delay for a retry attempt with exponential backoff
 * @param attempt - The current retry attempt (0-based)
 * @param options - The retry options
 * @returns The delay in milliseconds
 */
const calculateBackoff = (attempt, options = DEFAULT_RETRY_OPTIONS) => {
    const { initialDelayMs, maxDelayMs } = options;
    const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
    // Add some jitter to prevent all retries from happening at the same time
    return delay + Math.random() * 1000;
};
/**
 * Tests the database connection to verify schema access
 * @param serverUrl - The Payload server URL
 * @param token - The authentication token
 * @returns True if the connection is successful, false otherwise
 */
const testDatabaseConnection = async (serverUrl, token) => {
    try {
        // Test query to verify schema access
        console.log('Testing database connection...');
        // First try the health endpoint
        const healthResponse = await fetch(`${serverUrl}/api/_health`, {
            method: 'GET',
            headers: {
                Authorization: `JWT ${token}`,
            },
        });
        if (healthResponse.ok) {
            console.log('Health check successful');
        }
        else {
            console.warn('Health check failed, but continuing...');
        }
        // Then try to fetch a single document from a collection to verify schema access
        const testResponse = await fetch(`${serverUrl}/api/documentation?limit=1`, {
            method: 'GET',
            headers: {
                Authorization: `JWT ${token}`,
            },
        });
        if (testResponse.ok) {
            const data = await testResponse.json();
            console.log(`Database connection test: Found ${data.totalDocs} documents in documentation collection`);
            return true;
        }
        else {
            const errorData = await testResponse.json();
            console.error('Database connection test failed:', errorData);
            return false;
        }
    }
    catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
};
/**
 * Gets a Payload CMS client instance that uses the REST API
 * with token caching and retry logic
 * @param env - The environment to use ('development' for local, 'production' for remote)
 * @returns A Payload CMS client instance
 */
export async function getEnhancedPayloadClient(env) {
    // Set environment based on parameter or NODE_ENV
    const environment = env || process.env.NODE_ENV || 'development';
    // Load environment variables for the specified environment
    const envFile = environment === 'production' ? '.env.production' : '.env.development';
    console.log(`Loading environment variables from ${envFile} for ${environment} environment`);
    dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });
    // Get the Payload server URL from environment variables
    const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL;
    if (!serverUrl) {
        throw new Error('PAYLOAD_PUBLIC_SERVER_URL environment variable is not set');
    }
    /**
     * Get an authentication token, either from cache or by authenticating
     * @returns The authentication token
     */
    const getAuthToken = async () => {
        // Check if we have a valid cached token
        const cachedToken = tokenCacheByEnv[environment];
        if (cachedToken && cachedToken.expiresAt > Date.now()) {
            console.log('Using cached authentication token');
            return cachedToken.token;
        }
        // No valid cached token, authenticate
        console.log(`Authenticating with email: ${process.env.PAYLOAD_ADMIN_EMAIL}`);
        // Implement retry logic for authentication
        let lastError = null;
        for (let attempt = 0; attempt < DEFAULT_RETRY_OPTIONS.maxRetries; attempt++) {
            try {
                // Add delay for retries (not for the first attempt)
                if (attempt > 0) {
                    const delayMs = calculateBackoff(attempt);
                    console.log(`Retry attempt ${attempt + 1}, waiting ${delayMs}ms...`);
                    await sleep(delayMs);
                }
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
                    lastError = new Error(`Authentication failed: ${JSON.stringify(authError)}`);
                    // Continue to next retry attempt
                    continue;
                }
                console.log('Authentication successful');
                // Get the authentication response data
                const authData = await authResponse.json();
                const token = authData.token;
                // Cache the token with expiration
                tokenCacheByEnv[environment] = {
                    token,
                    expiresAt: Date.now() + TOKEN_EXPIRATION_MS,
                };
                return token;
            }
            catch (error) {
                console.error(`Authentication error (attempt ${attempt + 1}):`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
                // Continue to next retry attempt
            }
        }
        // If we get here, all retry attempts failed
        const errorMessage = 'Authentication failed after multiple attempts. ' +
            'Please ensure an admin user exists in the Payload CMS with the email and password ' +
            'specified in the .env.development file. You may need to manually create an admin user ' +
            'by accessing the Payload CMS admin panel at ' +
            serverUrl +
            '/admin';
        throw lastError || new Error(errorMessage);
    };
    /**
     * Execute a request with retry logic
     * @param requestFn - The function to execute the request
     * @returns The response data
     */
    const executeWithRetry = async (requestFn) => {
        let lastError = null;
        for (let attempt = 0; attempt < DEFAULT_RETRY_OPTIONS.maxRetries; attempt++) {
            try {
                // Add delay for retries (not for the first attempt)
                if (attempt > 0) {
                    const delayMs = calculateBackoff(attempt);
                    console.log(`Retry attempt ${attempt + 1}, waiting ${delayMs}ms...`);
                    await sleep(delayMs);
                }
                // Get a fresh token for each attempt
                const token = await getAuthToken();
                return await requestFn(token);
            }
            catch (error) {
                console.error(`Request error (attempt ${attempt + 1}):`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
                // If the error is related to authentication, invalidate the token cache
                if (error instanceof Error &&
                    error.message.includes('Authentication failed')) {
                    delete tokenCacheByEnv[environment];
                }
                // Continue to next retry attempt
            }
        }
        // If we get here, all retry attempts failed
        throw lastError || new Error('Request failed after multiple attempts');
    };
    // Test the database connection
    const token = await getAuthToken();
    const connectionSuccessful = await testDatabaseConnection(serverUrl, token);
    if (!connectionSuccessful) {
        console.warn('Database connection test failed, but continuing with client creation...');
    }
    // Create a client that uses the Payload REST API
    const client = {
        update: async ({ collection, id, data }) => {
            console.log(`Updating document in ${collection} with ID ${id}`);
            return executeWithRetry(async (token) => {
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
                    throw new Error(`Failed to update document: ${JSON.stringify(errorData)}`);
                }
                return await response.json();
            });
        },
        create: async ({ collection, data }) => {
            console.log(`Creating document in ${collection}`);
            return executeWithRetry(async (token) => {
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
                    throw new Error(`Failed to create document: ${JSON.stringify(errorData)}`);
                }
                return await response.json();
            });
        },
        delete: async ({ collection, id }) => {
            console.log(`Deleting document in ${collection} with ID ${id}`);
            return executeWithRetry(async (token) => {
                const response = await fetch(`${serverUrl}/api/${collection}/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `JWT ${token}`,
                    },
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Failed to delete document: ${JSON.stringify(errorData)}`);
                }
                return await response.json();
            });
        },
        find: async ({ collection, limit = 100, query = {} }) => {
            console.log(`Finding documents in ${collection} with query:`, query);
            return executeWithRetry(async (token) => {
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
                const response = await fetch(`${serverUrl}/api/${collection}${queryString}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `JWT ${token}`,
                    },
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Failed to find documents: ${JSON.stringify(errorData)}`);
                }
                return await response.json();
            });
        },
        batchCreate: async ({ collection, data, batchSize = 10 }) => {
            console.log(`Batch creating ${data.length} documents in ${collection}`);
            const results = [];
            // Process in batches
            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(data.length / batchSize)}`);
                // Process each item in the batch sequentially
                for (const item of batch) {
                    try {
                        const result = await client.create({ collection, data: item });
                        results.push(result);
                    }
                    catch (error) {
                        console.error(`Error creating item in batch:`, error);
                        // Continue with the next item
                    }
                }
                // Add a small delay between batches to avoid overwhelming the server
                if (i + batchSize < data.length) {
                    console.log('Waiting between batches...');
                    await sleep(1000);
                }
            }
            return results;
        },
    };
    return client;
}
