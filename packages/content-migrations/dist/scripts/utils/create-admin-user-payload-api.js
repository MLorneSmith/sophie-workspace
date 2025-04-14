/**
 * Script to create an admin user in Payload CMS using the Payload API
 * This ensures proper password hashing and user initialization
 */
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
const { Pool } = pg;
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
console.log(`Loading environment variables from ${envFile}`);
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });
/**
 * Creates an admin user using Payload's API with proper config
 */
async function createAdminUserPayloadAPI() {
    try {
        // Get the database connection string from the environment variables
        const databaseUri = process.env.DATABASE_URI;
        if (!databaseUri) {
            throw new Error('DATABASE_URI environment variable is not set');
        }
        console.log('Connecting to database to check if user exists...');
        // Create a connection pool
        const pool = new Pool({
            connectionString: databaseUri,
        });
        try {
            // Test the connection
            const client = await pool.connect();
            try {
                console.log('Connected to database');
                // Admin user credentials
                const email = 'michael@slideheroes.com';
                console.log(`Checking if user with email ${email} exists...`);
                // Check if the user already exists
                const existingUserResult = await client.query(`SELECT id FROM payload.users WHERE email = $1`, [email]);
                if (existingUserResult.rows.length > 0) {
                    // Delete the existing user to create a new one with the correct password hash
                    console.log(`Deleting existing user with email ${email}`);
                    await client.query(`DELETE FROM payload.users WHERE email = $1`, [
                        email,
                    ]);
                }
            }
            finally {
                client.release();
            }
        }
        finally {
            await pool.end();
        }
        // Create a temporary script to create the user
        const tempScriptPath = path.resolve(__dirname, 'temp-create-user.js');
        // Write the temporary script
        fs.writeFileSync(tempScriptPath, `
import { getPayload } from 'payload';

// Import the actual Payload config
const importConfig = async () => {
  const { default: config } = await import('../../../../apps/payload/src/payload.config.js');
  return config;
};

async function createUser() {
  try {
    // Get the config
    const config = await importConfig();
    
    // Initialize Payload with the config
    const payload = await getPayload({ config });
    
    // Create the user
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'michael@slideheroes.com',
        password: 'aiesec1992',
      },
    });
    
    console.log('User created successfully with ID:', user.id);
  } catch (error) {
    console.error('Error creating user:', error);
  }
  
  process.exit(0);
}

createUser();
      `);
        console.log('Running Payload script to create user...');
        // Run the script using the Payload CLI with --use-swc flag
        const payloadDir = path.resolve(__dirname, '../../../../apps/payload');
        const scriptPath = path.resolve(__dirname, 'temp-create-user.js');
        console.log(`Payload directory: ${payloadDir}`);
        console.log(`Script path: ${scriptPath}`);
        const payloadProcess = spawn('pnpm', ['--prefix', payloadDir, 'payload', 'run', scriptPath, '--use-swc'], {
            shell: true,
            stdio: 'inherit',
            env: {
                ...process.env,
                DATABASE_URI: databaseUri,
                PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'payload-secret',
            },
        });
        return new Promise((resolve, reject) => {
            payloadProcess.on('close', (code) => {
                // Clean up the temporary script
                try {
                    fs.unlinkSync(tempScriptPath);
                }
                catch (error) {
                    console.error('Error deleting temporary script:', error);
                }
                if (code === 0) {
                    console.log('Admin user created successfully!');
                    resolve();
                }
                else {
                    reject(new Error(`Payload script exited with code ${code}`));
                }
            });
        });
    }
    catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}
// Run the script
createAdminUserPayloadAPI();
