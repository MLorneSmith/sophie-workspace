/**
 * Script to create an admin user in Payload CMS directly in the PostgreSQL database
 * Uses bcrypt for password hashing to match Payload CMS's implementation
 */
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

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

/**
 * Creates a password hash using bcrypt to match Payload CMS's implementation
 * @param password - The password to hash
 * @returns The salt and hash
 */
function hashPassword(password: string): { salt: string; hash: string } {
  // Generate a salt with 10 rounds (Payload CMS default)
  const salt = bcrypt.genSaltSync(10);

  // Hash the password with the salt
  // Payload CMS stores the full bcrypt hash including the salt prefix
  const hash = bcrypt.hashSync(password, salt);

  return {
    salt,
    hash,
  };
}

/**
 * Creates an admin user directly in the PostgreSQL database
 */
async function createAdminUserDirect(): Promise<void> {
  // Get the database connection string from the environment variables
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Connecting to database: ${databaseUri}`);

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
      const password = 'aiesec1992';

      console.log(`Creating admin user with email: ${email}`);

      // Check if the user already exists
      const existingUserResult = await client.query(
        `SELECT id FROM payload.users WHERE email = $1`,
        [email],
      );

      if (existingUserResult.rows.length > 0) {
        // Delete the existing user to create a new one with the correct password hash
        console.log(`Deleting existing user with email ${email}`);
        await client.query(`DELETE FROM payload.users WHERE email = $1`, [
          email,
        ]);
      }

      // Generate bcrypt hash for the password
      const hashedPassword = await hashPassword(password);

      // Insert the user into the database
      const result = await client.query(
        `INSERT INTO payload.users (
          id, 
          email, 
          salt,
          hash, 
          updated_at, 
          created_at
        )
        VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
        RETURNING id`,
        [email, hashedPassword.salt, hashedPassword.hash],
      );

      console.log(
        'Admin user created successfully with ID:',
        result.rows[0].id,
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
createAdminUserDirect().catch((error: unknown) => {
  console.error('Script failed:', error);
  process.exit(1);
});
