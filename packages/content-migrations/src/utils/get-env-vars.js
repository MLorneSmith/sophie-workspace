/**
 * Utility to load environment variables from .env files
 * and provide access to commonly used variables
 */
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Load environment variables from .env file
 */
function loadEnvVars() {
  // Find and load .env.development file
  const envFile = path.resolve(process.cwd(), '.env.development');
  if (fs.existsSync(envFile)) {
    console.log(`Loading environment variables from: ${envFile}`);
    dotenv.config({ path: envFile });
  } else {
    console.warn(`Environment file not found: ${envFile}`);
  }
}

/**
 * Get environment variables with fallbacks
 */
export function getEnvVars() {
  // Load environment variables if not already loaded
  loadEnvVars();

  return {
    // Database connection
    DATABASE_URI: process.env.DATABASE_URI || process.env.DATABASE_URL || null,
    POSTGRES_CONNECTION_STRING: process.env.POSTGRES_CONNECTION_STRING || null,

    // Paths
    ROOT_DIR: process.cwd(),

    // Other configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}
