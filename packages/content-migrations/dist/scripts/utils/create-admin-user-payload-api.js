"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Script to create an admin user in Payload CMS using the Payload API
 * This ensures proper password hashing and user initialization
 */
const child_process_1 = require("child_process");
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = __importDefault(require("pg"));
const url_1 = require("url");
const { Pool } = pg_1.default;
// Get the current file's directory
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
console.log(`Loading environment variables from ${envFile}`);
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, `../../${envFile}`) });
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
        const tempScriptPath = path_1.default.resolve(__dirname, 'temp-create-user.js');
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
        const payloadDir = path_1.default.resolve(__dirname, '../../../../apps/payload');
        const scriptPath = path_1.default.resolve(__dirname, 'temp-create-user.js');
        console.log(`Payload directory: ${payloadDir}`);
        console.log(`Script path: ${scriptPath}`);
        const payloadProcess = (0, child_process_1.spawn)('pnpm', ['--prefix', payloadDir, 'payload', 'run', scriptPath, '--use-swc'], {
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
