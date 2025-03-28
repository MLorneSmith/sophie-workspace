/**
 * Utility functions for interacting with the Payload CMS API
 * This is a wrapper around the enhanced-payload-client.js to maintain compatibility
 */
import { getEnhancedPayloadClient } from './enhanced-payload-client.js';

/**
 * Gets a Payload CMS client instance
 * This is a wrapper around getEnhancedPayloadClient for backward compatibility
 * @param {'development' | 'production' | undefined} env - The environment to use ('development' for local, 'production' for remote)
 * @returns {Promise<object>} A Payload CMS client instance
 */
export async function getPayloadClient(env) {
  console.log('Using enhanced Payload client for better reliability...');
  return getEnhancedPayloadClient(env);
}
