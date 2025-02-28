/**
 * Script to create an admin user in Payload CMS
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

/**
 * Creates an admin user in Payload CMS
 */
async function createAdminUser() {
  // Get the Payload server URL from environment variables
  const serverUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL;
  if (!serverUrl) {
    throw new Error(
      'PAYLOAD_PUBLIC_SERVER_URL environment variable is not set',
    );
  }

  const email = process.env.PAYLOAD_ADMIN_EMAIL;
  const password = process.env.PAYLOAD_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD environment variables are required',
    );
  }

  console.log(`Creating admin user with email: ${email}`);

  try {
    // Create the admin user
    const response = await fetch(`${serverUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create admin user:', errorData);
      throw new Error(
        `Failed to create admin user: ${JSON.stringify(errorData)}`,
      );
    }

    const userData = await response.json();
    console.log('Admin user created successfully:', userData);
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

// Run the script
createAdminUser().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
