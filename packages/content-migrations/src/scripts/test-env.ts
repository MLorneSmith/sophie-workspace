/**
 * Script to test that environment variables are properly loaded
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the package's .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Tests that environment variables are properly loaded
 */
async function testEnvironmentVariables() {
  console.log('Testing environment variables...');

  // Check DATABASE_URI
  if (process.env.DATABASE_URI) {
    console.log('✅ DATABASE_URI is set:', process.env.DATABASE_URI);
  } else {
    console.error('❌ DATABASE_URI is not set');
  }

  // Check PAYLOAD_SECRET
  if (process.env.PAYLOAD_SECRET) {
    console.log('✅ PAYLOAD_SECRET is set:', '[REDACTED]');
  } else {
    console.error('❌ PAYLOAD_SECRET is not set');
  }

  // Check PAYLOAD_PUBLIC_SERVER_URL
  if (process.env.PAYLOAD_PUBLIC_SERVER_URL) {
    console.log(
      '✅ PAYLOAD_PUBLIC_SERVER_URL is set:',
      process.env.PAYLOAD_PUBLIC_SERVER_URL,
    );
  } else {
    console.error('❌ PAYLOAD_PUBLIC_SERVER_URL is not set');
  }

  console.log('Environment variables test complete!');
}

// Run the test
testEnvironmentVariables().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
